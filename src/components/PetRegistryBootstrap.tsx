"use client";

import { useEffect, useRef } from "react";

import {
  bootRegisteredPet,
  getPetRepository,
  usePetRegistryStore,
  type PetRecordV2,
} from "@/lib/registry";
import { useStore } from "@/lib/store";

/**
 * Mounts the Phase 1 registry boot on the canonical /pet route: ensures one
 * registered pet exists (load → migrate legacy archive → mint genesis) and
 * hydrates the runtime store from its record, so the renderers always draw a
 * real registered genome. Renders nothing.
 */
export function PetRegistryBootstrap() {
  const booted = useRef(false);
  const activeRecordRef = useRef<PetRecordV2 | null>(null);
  const setLoading = usePetRegistryStore((state) => state.setLoading);
  const setError = usePetRegistryStore((state) => state.setError);
  const activeRecord = usePetRegistryStore((state) => state.activeRecord);

  useEffect(() => {
    activeRecordRef.current = activeRecord;
  }, [activeRecord]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    setLoading();
    bootRegisteredPet().catch((error) => {
      console.error("[registry] pet boot failed", error);
      setError(
        error instanceof Error ? error.message : "Pet registration failed",
      );
    });
  }, [setError, setLoading]);

  // Vitals/evolution are mutable expression state, but the registered record
  // remains their canonical persistence home. Coalesce the runtime tick and
  // care actions so reload restores the same companion state without ever
  // rewriting its immutable genome.
  useEffect(() => {
    if (typeof useStore.subscribe !== "function") return;
    let timer = 0;
    let disposed = false;

    const flush = async () => {
      const record = activeRecordRef.current;
      if (!record || disposed) return;
      const runtime = useStore.getState();
      if (
        JSON.stringify(record.vitals) === JSON.stringify(runtime.vitals) &&
        JSON.stringify(record.evolution) === JSON.stringify(runtime.evolution)
      ) {
        return;
      }
      const next: PetRecordV2 = {
        ...record,
        vitals: structuredClone(runtime.vitals),
        evolution: structuredClone(runtime.evolution),
      };
      await getPetRepository().saveRecord(next, { activate: false });
      if (!disposed && activeRecordRef.current?.petId === next.petId) {
        activeRecordRef.current = next;
        usePetRegistryStore.getState().setActiveRecord(next);
      }
    };

    const unsubscribe = useStore.subscribe((state, previous) => {
      if (
        state.vitals === previous.vitals &&
        state.evolution === previous.evolution
      ) {
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        flush().catch((error) => {
          console.error("[registry] state persistence failed", error);
        });
      }, 750);
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      const finalWrite = flush();
      disposed = true;
      finalWrite.catch((error) => {
        console.error("[registry] final state persistence failed", error);
      });
    };
  }, []);

  return null;
}
