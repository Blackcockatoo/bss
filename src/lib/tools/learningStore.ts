"use client";

import { create } from "zustand";
import { addForgeDiscovery, emptyForgeMemory, type ForgeDiscovery, type ForgeMemory } from "./learningMemory";
import { deleteForgeMemory, loadForgeMemory, saveForgeMemory } from "./forgePersistence";

type Status = "idle" | "loading" | "ready" | "saving" | "error";
type ForgeLearningState = {
  petId: string | null;
  memory: ForgeMemory | null;
  status: Status;
  error: string | null;
  hydrate: (petId: string) => Promise<void>;
  saveDiscovery: (discovery: ForgeDiscovery) => Promise<void>;
  clearDiscoveries: () => Promise<void>;
};

export const useForgeLearningStore = create<ForgeLearningState>((set, get) => ({
  petId: null,
  memory: null,
  status: "idle",
  error: null,
  hydrate: async (petId) => {
    if (get().petId === petId && get().status === "ready") return;
    set({ petId, memory: null, status: "loading", error: null });
    try {
      const memory = await loadForgeMemory(petId);
      if (get().petId === petId) set({ memory, status: "ready" });
    } catch (error) {
      if (get().petId === petId) set({ status: "error", error: String(error) });
    }
  },
  saveDiscovery: async (discovery) => {
    const { petId, memory } = get();
    if (!petId || !memory) throw new Error("Open a registered pet first.");
    const next = addForgeDiscovery(memory, discovery);
    set({ status: "saving", error: null });
    try {
      await saveForgeMemory(next);
      if (get().petId === petId) set({ memory: next, status: "ready" });
    } catch (error) {
      if (get().petId === petId) set({ status: "error", error: String(error) });
      throw error;
    }
  },
  clearDiscoveries: async () => {
    const { petId } = get();
    if (!petId) return;
    set({ status: "saving", error: null });
    try {
      await deleteForgeMemory(petId);
      if (get().petId === petId) set({ memory: emptyForgeMemory(petId), status: "ready" });
    } catch (error) {
      if (get().petId === petId) set({ status: "error", error: String(error) });
      throw error;
    }
  },
}));
