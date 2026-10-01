"use client";

import { useEffect } from "react";
import { bootRegisteredPet, getPetRepository, usePetRegistryStore } from "@/lib/registry";
import { createPetProgressPersistence } from "@/lib/registry/progressPersistence";
import { useStore } from "@/lib/store";

/** Consumer shell boot and persistence survive navigation between pet tools.
 * No writes occur until the canonical record has hydrated the runtime. */
export function PetRegistryBootstrap() {
  useEffect(() => {
    let disposed = false;
    let persistence: ReturnType<typeof createPetProgressPersistence> | undefined;
    const registry = usePetRegistryStore;
    const repository = getPetRepository();
    registry.getState().setLoading();
    const onError = (error: unknown) => {
      console.error("[registry] pet persistence failed", error);
      if (!disposed) registry.getState().setError(error instanceof Error ? error.message : "Pet persistence failed");
    };
    bootRegisteredPet(repository).then(() => {
      if (disposed || typeof useStore.subscribe !== "function") return;
      persistence = createPetProgressPersistence({
        repository,
        store: useStore,
        getRecord: () => registry.getState().activeRecord,
        onSaved: record => registry.getState().setActiveRecord(record),
        onError,
      });
    }).catch(onError);

    const flush = () => { void persistence?.flush(); };
    const onVisibility = () => { if (document.hidden) flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      void persistence?.dispose();
    };
  }, []);
  return null;
}
