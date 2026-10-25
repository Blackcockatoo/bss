"use client";
import { create } from "zustand";
import {
  addForgeDiscovery,
  emptyForgeMemory,
  type ForgeDiscovery,
  type ForgeMemory,
} from "./learningMemory";
import {
  loadForgeMemory,
  mutateForgeMemory,
  purgeLegacyForgeMemory,
} from "./forgePersistence";
import { validProject, type Project } from "./activities";
import { getForgeTool } from "./registry";
type State = {
  petId: string | null;
  memory: ForgeMemory | null;
  status: "idle" | "loading" | "ready" | "saving" | "error";
  error: string | null;
  hydrate: (id: string) => Promise<void>;
  saveDiscovery: (d: ForgeDiscovery) => Promise<void>;
  saveProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  replaceMemory: (m: ForgeMemory) => Promise<void>;
  clearDiscoveries: () => Promise<void>;
};
let generation = 0;
export const useForgeLearningStore = create<State>((set, get) => {
  const update = async (fn: (m: ForgeMemory) => ForgeMemory) => {
    const id = get().petId;
    const token = generation;
    if (!id || get().status !== "ready")
      throw new Error("Wait for local storage to be ready.");
    set({ status: "saving", error: null });
    try {
      const memory = await mutateForgeMemory(id, fn);
      if (get().petId === id && token === generation)
        set({ memory, status: "ready" });
    } catch (e) {
      if (get().petId === id && token === generation)
        set({ status: "error", error: String(e) });
      throw e;
    }
  };
  return {
    petId: null,
    memory: null,
    status: "idle",
    error: null,
    hydrate: async (id) => {
      const token = ++generation;
      set({ petId: id, memory: null, status: "loading", error: null });
      try {
        const memory = await loadForgeMemory(id);
        if (token === generation) set({ memory, status: "ready" });
      } catch (e) {
        if (token === generation) set({ status: "error", error: String(e) });
      }
    },
    saveDiscovery: async (d) => update((m) => addForgeDiscovery(m, d)),
    saveProject: async (p) => {
      if (!validProject(p) || !getForgeTool(p.toolId))
        throw new Error("Invalid project.");
      await update((m) => {
        const projects = m.projects ?? [];
        const old = projects.find((q) => q.id === p.id);
        if (!old && p.revision !== 1)
          throw new Error(
            "This project was deleted in another tab. Save a new project instead.",
          );
        if (
          old &&
          (p.revision !== old.revision + 1 ||
            p.createdAt !== old.createdAt ||
            p.toolId !== old.toolId)
        )
          throw new Error(
            "This project changed in another tab. Reopen it before saving.",
          );
        if (!old && projects.length >= 50)
          throw new Error(
            "Export or delete a project before adding another (limit 50).",
          );
        return {
          ...m,
          projects: [...projects.filter((q) => q.id !== p.id), p],
        };
      });
    },
    deleteProject: async (id) =>
      update((m) => ({
        ...m,
        projects: (m.projects ?? []).filter((p) => p.id !== id),
      })),
    replaceMemory: async (m) => {
      if (m.petId !== get().petId) throw new Error("Wrong pet.");
      await update(() => m);
    },
    clearDiscoveries: async () => {
      const id = get().petId;
      await update((m) => ({ ...emptyForgeMemory(m.petId), projects: [] }));
      if (id) await purgeLegacyForgeMemory(id);
    },
  };
});
