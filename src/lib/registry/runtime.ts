import { create } from "zustand";

import type { PetRecordV2 } from "./record";

export type PetRegistryStatus = "idle" | "loading" | "ready" | "error";

interface PetRegistryRuntimeState {
  activeRecord: PetRecordV2 | null;
  status: PetRegistryStatus;
  error: string | null;
  setLoading: () => void;
  setActiveRecord: (record: PetRecordV2) => void;
  setError: (message: string) => void;
}

/** Client view of the canonical registry; IndexedDB remains authoritative. */
export const usePetRegistryStore = create<PetRegistryRuntimeState>((set) => ({
  activeRecord: null,
  status: "idle",
  error: null,
  setLoading: () => set({ status: "loading", error: null }),
  setActiveRecord: (activeRecord) =>
    set({ activeRecord, status: "ready", error: null }),
  setError: (error) => set({ status: "error", error }),
}));
