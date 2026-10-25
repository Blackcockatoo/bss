import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteForgeMemory,
  MAX_FORGE_BACKUP_BYTES,
  purgeLegacyForgeMemory,
  exportForge,
  loadForgeMemory,
  mutateForgeMemory,
  parseForge,
} from "./forgePersistence";
import { DEFAULT_INPUT, type Project } from "./activities";
import { initDB, getAllPets, deletePet } from "../persistence/indexeddb";
import { initDB as legacyOpen } from "../persistence/db";
import { useForgeLearningStore } from "./learningStore";
const project: Project = {
  version: 1,
  id: "p1",
  toolId: "discovery-lab",
  title: "Drop",
  createdAt: 1,
  updatedAt: 1,
  revision: 1,
  spark: { spot: "", prediction: "", reflection: "" },
  input: structuredClone(DEFAULT_INPUT),
};
function transaction(db: IDBDatabase, store: string, value: unknown) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("IDBKeyRange", IDBKeyRange);
  useForgeLearningStore.setState({
    petId: null,
    memory: null,
    status: "idle",
    error: null,
  });
});
describe("Forge ownership and committed persistence", () => {
  it("survives closed/reopened connections, preserves pet isolation, and roundtrips export", async () => {
    await mutateForgeMemory("a", (m) => ({ ...m, projects: [project] }));
    const memory = await loadForgeMemory("a");
    expect(memory.projects).toEqual([project]);
    expect((await loadForgeMemory("b")).projects).toEqual([]);
    expect(parseForge(exportForge(memory), "a")).toEqual(memory);
    expect(() => parseForge(exportForge(memory), "b")).toThrow("identity");
    await deleteForgeMemory("a");
    expect((await loadForgeMemory("a")).projects).toEqual([]);
  });
  it("serialises independent concurrent tab writes instead of losing projects", async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        mutateForgeMemory("a", (m) => ({
          ...m,
          projects: [...(m.projects ?? []), { ...project, id: String(i) }],
        })),
      ),
    );
    expect((await loadForgeMemory("a")).projects).toHaveLength(10);
  });
  it("retains data when a write callback aborts and permits recovery", async () => {
    await mutateForgeMemory("a", (m) => ({ ...m, projects: [project] }));
    await expect(
      mutateForgeMemory("a", () => {
        throw new Error("simulated failure");
      }),
    ).rejects.toThrow("simulated failure");
    expect((await loadForgeMemory("a")).projects).toEqual([project]);
    await deleteForgeMemory("a");
    expect((await loadForgeMemory("a")).projects).toEqual([]);
  });
  it("migrates v1 MetaPetDB fixtures without erasing archived records", async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open("MetaPetDB", 1);
      req.onupgradeneeded = () =>
        req.result.createObjectStore("pets", { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
    });
    await transaction(db, "pets", {
      id: "legacy-pet",
      lastSaved: 10,
      genome: {
        red60: Array(60).fill(1),
        blue60: Array(60).fill(2),
        black60: Array(60).fill(3),
      },
    });
    db.close();
    const upgraded = await initDB();
    expect(upgraded.version).toBe(3);
    upgraded.close();
    expect((await getAllPets())[0].id).toBe("legacy-pet");
    const compatibility = await legacyOpen();
    expect(compatibility.version).toBe(3);
    compatibility.close();
  });
  it("copies old separate Forge memory and deletion never resurrects it", async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open("MetaPetProjectForge", 1);
      req.onupgradeneeded = () =>
        req.result.createObjectStore("learningMemory", { keyPath: "petId" });
      req.onsuccess = () => resolve(req.result);
    });
    await transaction(db, "learningMemory", {
      version: 1,
      petId: "a",
      discoveries: [],
      projects: [project],
    });
    db.close();
    expect((await loadForgeMemory("a")).projects).toEqual([project]);
    await deleteForgeMemory("a");
    expect((await loadForgeMemory("a")).projects).toEqual([]);
  });
  it("archives pet and removes learning influence in one database transaction", async () => {
    await mutateForgeMemory("a", (m) => ({ ...m, projects: [project] }));
    await deletePet("a");
    expect((await loadForgeMemory("a")).projects).toEqual([]);
  });
  it("rejects malformed backups rather than silently reporting successful restore", async () => {
    const memory = await loadForgeMemory("a");
    expect(() =>
      parseForge(
        exportForge({
          ...memory,
          projects: [{ ...project, version: 99 } as never],
        }),
        "a",
      ),
    ).toThrow();
    expect(() =>
      parseForge(exportForge({ ...memory, projects: [project, project] }), "a"),
    ).toThrow("Duplicate");
    expect(() =>
      parseForge("x".repeat(MAX_FORGE_BACKUP_BYTES + 1), "a"),
    ).toThrow("large");
  });
  it("restores state after a cold store hydration and rejects stale revisions", async () => {
    const store = useForgeLearningStore;
    await store.getState().hydrate("a");
    await store.getState().saveProject(project);
    await store.getState().hydrate("b");
    expect(store.getState().memory?.projects).toEqual([]);
    await store.getState().hydrate("a");
    expect(store.getState().memory?.projects).toEqual([project]);
    await expect(store.getState().saveProject(project)).rejects.toThrow(
      "another tab",
    );
  });
});

describe("Damaged and future data are preserved", () => {
  it("refuses edits to an unsupported schema until explicit backup replacement", async () => {
    const db = await initDB();
    await transaction(db, "learningMemory", {
      version: 99,
      petId: "a",
      discoveries: [],
      projects: [],
    });
    db.close();
    await expect(loadForgeMemory("a")).rejects.toThrow("preserved");
    await expect(mutateForgeMemory("a", (m) => m)).rejects.toThrow("preserved");
    const { saveForgeMemory } = await import("./forgePersistence");
    await saveForgeMemory({
      version: 1,
      petId: "a",
      discoveries: [],
      projects: [project],
    });
    expect((await loadForgeMemory("a")).projects).toEqual([project]);
  });
  it("rejects corrupted project data instead of dropping it during later writes", async () => {
    const db = await initDB();
    await transaction(db, "learningMemory", {
      version: 1,
      petId: "a",
      discoveries: [],
      projects: [{ ...project, input: { ...project.input, height: Infinity } }],
    });
    db.close();
    await expect(loadForgeMemory("a")).rejects.toThrow("preserved");
  });
});

async function legacyFixture(value: unknown) {
  const db = await new Promise<IDBDatabase>((resolve) => {
    const req = indexedDB.open("MetaPetProjectForge", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("learningMemory", { keyPath: "petId" });
    req.onsuccess = () => resolve(req.result);
  });
  await transaction(db, "learningMemory", value);
  return db;
}
describe("Upgrade audit regressions", () => {
  it("does not delete a retired copy changed since migration read it", async () => {
    const original = {
      version: 1 as const,
      petId: "a",
      discoveries: [],
      projects: [project],
    };
    const newer = {
      ...original,
      projects: [project, { ...project, id: "new-work" }],
    };
    const db = await legacyFixture(newer);
    db.close();
    await purgeLegacyForgeMemory("a", original);
    expect((await loadForgeMemory("a")).projects).toEqual(newer.projects);
  });
  it("preserves corrupt retired data instead of silently migrating an empty record", async () => {
    const db = await legacyFixture({
      version: 99,
      petId: "a",
      discoveries: [],
      projects: [project],
    });
    db.close();
    await expect(loadForgeMemory("a")).rejects.toThrow("preserved");
  });
  it("does not resurrect a deleted project when an old tab saves a revision", async () => {
    const store = useForgeLearningStore;
    await store.getState().hydrate("a");
    await store.getState().saveProject(project);
    await store.getState().deleteProject(project.id);
    await expect(
      store.getState().saveProject({ ...project, revision: 2 }),
    ).rejects.toThrow("deleted");
    expect((await loadForgeMemory("a")).projects).toEqual([]);
  });
  it("roundtrips a full workspace with escaped authored text beyond the old file limit", () => {
    const long = "\u0000".repeat(2000);
    const projects = Array.from({ length: 50 }, (_, i) => ({
      ...project,
      id: String(i),
      input: { ...project.input, paragraphs: [long, long, long] },
    }));
    const memory = {
      version: 1 as const,
      petId: "a",
      discoveries: [],
      projects,
    };
    const json = exportForge(memory);
    expect(json.length).toBeGreaterThan(500000);
    expect(parseForge(json, "a")).toEqual(memory);
  });
  it("rejects bytes, rather than merely character count, above the backup limit", () => {
    expect(() =>
      parseForge("🔥".repeat(MAX_FORGE_BACKUP_BYTES / 4 + 1), "a"),
    ).toThrow("large");
  });
});
