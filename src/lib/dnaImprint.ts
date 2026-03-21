"use client";

import { useEffect, useState } from "react";

import type { MossStrandKey } from "@/lib/moss60/strandSequences";

export type DnaImprint = {
  selectedSeed: MossStrandKey;
  resonanceClass: string;
  liveMutationSeed: string;
  dominantLattice: string;
  completedMode: string;
  updatedAt: number;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const DNA_IMPRINT_STORAGE_KEY = "metapet-dna-imprint-v1";
const DNA_IMPRINT_EVENT = "metapet:dna-imprint-updated";

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function emitDnaImprintUpdate() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(DNA_IMPRINT_EVENT));
}

export function loadDnaImprint(storage?: StorageLike): DnaImprint | null {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return null;
  }

  const raw = targetStorage.getItem(DNA_IMPRINT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DnaImprint;
    if (
      typeof parsed.selectedSeed !== "string" ||
      typeof parsed.resonanceClass !== "string" ||
      typeof parsed.liveMutationSeed !== "string" ||
      typeof parsed.dominantLattice !== "string" ||
      typeof parsed.completedMode !== "string" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveDnaImprint(
  imprint: DnaImprint,
  storage?: StorageLike,
) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(DNA_IMPRINT_STORAGE_KEY, JSON.stringify(imprint));
  emitDnaImprintUpdate();
}

export function useDnaImprint() {
  const [imprint, setImprint] = useState<DnaImprint | null>(() =>
    loadDnaImprint(),
  );

  useEffect(() => {
    const syncImprint = () => {
      setImprint(loadDnaImprint());
    };

    syncImprint();

    window.addEventListener(DNA_IMPRINT_EVENT, syncImprint);
    window.addEventListener("storage", syncImprint);

    return () => {
      window.removeEventListener(DNA_IMPRINT_EVENT, syncImprint);
      window.removeEventListener("storage", syncImprint);
    };
  }, []);

  return imprint;
}
