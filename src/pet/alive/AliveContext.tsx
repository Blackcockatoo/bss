"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { PetRecordV2 } from "@/lib/registry";
import type { PetForm } from "@/lib/petForms";
import { seedFor } from "@/lib/expressions/studio";
import { getGenomeVisualFingerprint } from "@/visual-dna/bodyForgeAdapter";
import { seededUnit } from "@/pet/movement/movementScheduler";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CUE_PRIORITY, createDirector, idleExpression, type Director } from "./director";
import { weightedFrame } from "@/lib/expressions/take";

const Context = createContext<Director | null>(null);
const empty = () => null;
const off = () => false;
const noSubscription = () => () => {};
export const useAlive = () => useContext(Context);
export function useAlivePaused() {
  const director = useAlive();
  return useSyncExternalStore(director?.subscribePolicy ?? noSubscription, director?.isPaused ?? off, off);
}
export function useAliveActive() {
  const director = useAlive();
  const active = useCallback(() => Boolean(director?.getFrame()), [director]);
  return useSyncExternalStore(director?.subscribe ?? noSubscription, active, off);
}
export function useAliveFrame(priority = 0) {
  const director = useAlive();
  const sample = useSyncExternalStore(director?.subscribe ?? noSubscription, director?.getFrame ?? empty, empty);
  return sample && CUE_PRIORITY[sample.cue.source] >= priority ? sample : null;
}
export { weightedFrame };

export function AliveProvider({ record, form, editing, children }: {
  record: PetRecordV2; form: PetForm; editing: boolean; children: ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const clock = useRef({ stage: record.evolution.state, ceremonyUntil: 0, editing });
  const [director] = useState(() => createDirector({
    form, personality: record.traits.personality, seed: seedFor(getGenomeVisualFingerprint(record.genome)),
    blocked: () => {
      const state = useStore.getState();
      const now = Date.now();
      return document.hidden || clock.current.editing || state.systemState === "sealed" ||
        state.vitals.isSick || state.vitals.hunger >= 90 || state.vitals.energy <= 8 ||
        now < clock.current.ceremonyUntil || (!!state.lastAction && now - state.lastActionAt < 2700);
    },
    reduced: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  const reduced = useReducedMotion();
  useEffect(() => {
    clock.current.editing = editing;
    if (editing) director.stop();
  }, [director, editing]);
  useEffect(() => useStore.subscribe(state => {
    if (state.evolution.state !== clock.current.stage) {
      clock.current.stage = state.evolution.state;
      clock.current.ceremonyUntil = Date.now() + 5500;
      director.stop();
    }
  }), [director]);
  const welcome = useCallback(() => {
    director.play("hello", { source: "ambient", intensity: .67 });
  }, [director]);
  useEffect(() => {
    let visible = true;
    let warmed = false;
    let away = 0;
    let index = 0;
    const instance = stage.current;
    const observer = typeof IntersectionObserver === "function" && instance ? new IntersectionObserver(([entry]) => {
      const now = Date.now();
      const next = entry.isIntersecting;
      if (!next && visible) { away = now; director.stop(); }
      if (next && (!warmed || (!visible && now - away > 25_000)) && !reduced) welcome();
      warmed ||= next;
      visible = next;
    }, { threshold: .12 }) : null;
    if (observer && instance) observer.observe(instance);
    let timeout = 0;
    function schedule() {
      const delay = 8700 + seededUnit(director.seed, index, 7) * 5500;
      timeout = window.setTimeout(() => {
        const { vitals } = useStore.getState();
        if (visible && !document.hidden && !reduced) {
          director.play(idleExpression(director.seed, index, director.getMode(), vitals.energy < 33, director.personality.curiosity),
            { source: "ambient", intensity: .56 });
        }
        index++;
        schedule();
      }, delay);
    }
    function onVisibility() {
      if (document.hidden) { away = Date.now(); director.stop(); }
      else if (visible && !reduced && Date.now() - away > 25_000) welcome();
    }
    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      window.clearTimeout(timeout);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      director.stop();
    };
  }, [director, reduced, welcome]);
  return <Context.Provider value={director}><div ref={stage} className="min-w-0" data-alive-stage={form}>{children}</div></Context.Provider>;
}
