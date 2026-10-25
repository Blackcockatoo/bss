"use client";

import { useEffect, useState } from "react";
import {
  HERALDRY_EVENT,
  heraldryKey,
  loadPetHeraldry,
} from "@/lib/lineage/storage";

export function usePetHeraldry(petId: string, generation = 0, enabled = true) {
  const [loaded, setLoaded] = useState<
    (ReturnType<typeof loadPetHeraldry> & { petId: string }) | null
  >(null);
  useEffect(() => {
    if (!enabled || !petId) return;
    const load = () =>
      setLoaded({ ...loadPetHeraldry(petId, generation), petId });
    const frame = requestAnimationFrame(load);
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === heraldryKey(petId)) load();
    };
    const onLocal = (event: Event) => {
      if ((event as CustomEvent<string>).detail === petId) load();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(HERALDRY_EVENT, onLocal);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(HERALDRY_EVENT, onLocal);
    };
  }, [petId, generation, enabled]);
  return loaded?.petId === petId ? loaded : { coat: null, notice: null };
}
