import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportForgePetBundle, importForgePetBundle } from "./petBundle";
import { buildPetRecord } from "../registry/registration";
import {
  createPetRepository,
  createMemoryStorage,
} from "../registry/repository";
import { loadForgeMemory, mutateForgeMemory } from "./forgePersistence";
import { DEFAULT_INPUT, type Project } from "./activities";
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("IDBKeyRange", IDBKeyRange);
});
describe("Explicit full pet + Forge bundle", () => {
  it("restores original verified identity, genome and projects after a browser data reset", async () => {
    const hmacKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    const record = await buildPetRecord({ hmacKey, random: () => 0.42 });
    const project: Project = {
      version: 1,
      id: "work",
      toolId: "story-workshop",
      title: "My own words",
      createdAt: 1,
      updatedAt: 1,
      revision: 1,
      spark: { spot: "", prediction: "", reflection: "" },
      input: structuredClone(DEFAULT_INPUT),
    };
    await mutateForgeMemory(record.petId, (m) => ({
      ...m,
      projects: [project],
    }));
    const backup = await exportForgePetBundle(record);
    vi.stubGlobal("indexedDB", new IDBFactory());
    const repository = createPetRepository(createMemoryStorage());
    const restored = await importForgePetBundle(backup, repository);
    expect(restored).toEqual(record);
    expect(await repository.getRecord(record.petId)).toEqual(record);
    expect((await loadForgeMemory(record.petId)).projects).toEqual([project]);
    expect(await repository.loadActiveRecord()).toBeNull();
  });
  it("validates the whole bundle before writing pet identity", async () => {
    const repository = createPetRepository(createMemoryStorage());
    await expect(
      importForgePetBundle('{"protocol":"untrusted"}', repository),
    ).rejects.toThrow();
    expect(await repository.listRecords()).toEqual([]);
  });
});
