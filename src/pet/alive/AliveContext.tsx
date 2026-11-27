"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFigureEight } from "./useFigureEight";
import { MoonlitGarden } from "./MoonlitGarden";
import { OLD_VIC_MANTLE_ID } from "@/lib/addons/oldVicMantle";
import { useWardrobeStore } from "@/lib/addons/wardrobeStore";
import { useStore } from "@/lib/store";
import type { PetRecordV2 } from "@/lib/registry";
import type { PetForm } from "@/lib/petForms";
import { seedFor } from "@/lib/expressions/studio";
import { getGenomeVisualFingerprint } from "@/visual-dna/bodyForgeAdapter";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CUE_PRIORITY, createDirector, idleDelayMs, idleExpression, type Director } from "./director";
import { readGreetingHabit, rememberedGreetingSide, updateGreetingHabit, writeGreetingHabit } from "./greetingHabit";
import { weightedFrame } from "@/lib/expressions/take";
import { loadGuardianState } from "@/auralia/persistence";

const Context = createContext<Director | null>(null);
const SceneContext = createContext<{ garden: boolean; toggleGarden: () => void; setRhythmStatus: (status: string) => void } | null>(null);
export const useAliveScene = () => useContext(SceneContext);

const HabitContext = createContext<{ enabled: boolean; setEnabled: (value: boolean) => boolean; reset: () => boolean } | null>(null);
export const useGreetingHabit = () => useContext(HabitContext);
const empty = () => null;
const off = () => false;
const noSubscription = () => () => {};
const MotionContext = createContext<{ guardianReduced: boolean; setGuardianReduced: (reduced: boolean) => void } | null>(null);
/** Lets MetaPet's own Reduce Motion switch (the guardian setting) govern the living performance. */
export const useAliveMotionPreference = () => useContext(MotionContext)?.setGuardianReduced ?? null;
/** True when either the device or MetaPet's in-app Reduce Motion switch asks for stillness. */
export function useAliveReducedMotion() {
  const device = useReducedMotion();
  const guardian = useContext(MotionContext)?.guardianReduced ?? false;
  return device || guardian;
}
/** The saved in-app switch, so it also applies to forms that have no switch of their own. */
export function savedGuardianReduceMotion() {
  return loadGuardianState()?.accessibility?.reduceMotion === true;
}
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

export function AliveProvider({ record, form, editing, children, controls }: {
  record: PetRecordV2; form: PetForm; editing: boolean; children: ReactNode; controls: ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const habit = useRef<number | null>(null);
  const [habitEnabled, setHabitEnabled] = useState(false);
  const [garden, setGarden] = useState(false);
  const [stageVisible, setStageVisible] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [stageStatus, setStageStatus] = useState("");
  const visible = useRef(true);
  const [guardianReduced, setGuardianReduced] = useState(savedGuardianReduceMotion);
  const guardian = useRef(guardianReduced);
  useEffect(() => { guardian.current = guardianReduced; }, [guardianReduced]);
  useEffect(() => {
    habit.current = readGreetingHabit(record.petId);
    setHabitEnabled(habit.current !== null);
  }, [record.petId]);

  function setHabit(enabled: boolean, score = 0) {
    habit.current = enabled ? score : null;
    setHabitEnabled(enabled);
    return writeGreetingHabit(record.petId, habit.current);
  }
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
    reduced: () => guardian.current || matchMedia("(prefers-reduced-motion: reduce)").matches,
    onGreeting: side => {
      const score = habit.current;
      if (score === null) return;
      const next = updateGreetingHabit(score, side);
      if (next !== score) {
        habit.current = next;
        writeGreetingHabit(record.petId, next);
      }
    },
  }));
  const trace = useFigureEight(matched => {
    if (!matched) {
      setStageStatus("Draw two sideways eights in one stroke, starting near the centre.");
      return;
    }
    const played = director.play("mirror-eight", { source: "touch", intensity: .68 });
    setStageStatus(played ? "Your companion echoed the figure eight." : "Figure eight recognised. Your companion is resting.");
    setDrawing(false);
  }, drawing && !editing);
  const reduced = useReducedMotion() || guardianReduced;
  useEffect(() => useWardrobeStore.subscribe((state, previous) => {
    if (state.previewForm !== form && previous.previewForm !== form) return;
    if (state.previewAddon === previous.previewAddon &&
      state.committedPreviewId === previous.committedPreviewId) return;
    const id = state.previewAddon?.id ?? state.committedPreviewId;
    if (id === OLD_VIC_MANTLE_ID) director.play("mantle-bow", { source: "directed", intensity: .76, record: false });
    else if ((previous.previewAddon?.id ?? previous.committedPreviewId) === OLD_VIC_MANTLE_ID) director.stopCue("mantle-bow");
  }), [director, form]);
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
    const direction = rememberedGreetingSide(habit.current);
    const playful = director.personality.playfulness >= 60;
    director.play(direction ? "curious" : playful ? "hello" : "peace", {
      source: "ambient", intensity: playful ? .77 : .57,
      duration: direction ? 910 : playful ? 1350 : 1700,
      direction: direction || undefined,
    });
  }, [director]);
  useEffect(() => {
    let warmed = false;
    let away = 0;
    let index = 0;
    let timeout = 0;
    const instance = stage.current;
    visible.current = !instance || typeof IntersectionObserver !== "function";
    if (visible.current) setStageVisible(true);

    function schedule() {
      window.clearTimeout(timeout);
      if (!visible.current || document.hidden || reduced || director.isPaused()) return;
      timeout = window.setTimeout(() => {
        const { vitals } = useStore.getState();
        const id = idleExpression(director.seed, index, director.getMode(), vitals.energy < 33, director.personality.curiosity);
        if (director.play(id, { source: "ambient", intensity: .65 + director.personality.energy / 380 })) index++;
        schedule();
      }, idleDelayMs(director.seed, index, director.getMode()));
    }

    const observer = typeof IntersectionObserver === "function" && instance ? new IntersectionObserver(([entry]) => {
      const next = entry.isIntersecting && entry.intersectionRatio >= .12;
      const wasVisible = visible.current;
      visible.current = next;
      setStageVisible(next);
      if (!next && wasVisible) {
        away = Date.now();
        director.stop();
      }
      if (next && (!warmed || (!wasVisible && Date.now() - away > 12_000)) && !reduced) welcome();
      warmed ||= next;
      schedule();
    }, { threshold: .12 }) : null;
    if (observer && instance) observer.observe(instance);
    function onVisibility() {
      if (document.hidden) { away = Date.now(); director.stop(); }
      else if (visible.current && !reduced && Date.now() - away > 12_000) welcome();
      schedule();
    }
    const unsubscribe = director.subscribePolicy(schedule);
    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      director.stop();
    };
  }, [director, reduced, welcome]);
  return <Context.Provider value={director}>
    <MotionContext.Provider value={{ guardianReduced, setGuardianReduced }}>
    <SceneContext.Provider value={{ garden, toggleGarden: () => setGarden(open => !open), setRhythmStatus: setStageStatus }}>
      <HabitContext.Provider value={{
        enabled: habitEnabled,
        setEnabled: enabled => setHabit(enabled),
        reset: () => setHabit(habitEnabled),
      }}>
        <div className="min-w-0" data-alive-stage={form}>
          <div className="flex flex-wrap items-center gap-x-3 px-3 text-sm text-slate-200">
            <span>{drawing ? "Draw two sideways eights on the pet." : "Tap your pet three times for a rhythm reply."}</span>
            <button type="button" aria-pressed={drawing} disabled={editing}
              className="min-h-11 rounded-lg px-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-2"
              onClick={() => {
                director.clearStageTaps();
                setStageStatus("");
                setDrawing(!drawing);
              }}>{drawing ? "Cancel drawing" : "Draw on pet"}</button>
            <span role="status" data-stage-gesture-status>{stageStatus}</span>
          </div>
          <div ref={stage} className="relative" style={drawing && !editing ? { touchAction: "none" } : undefined}
            onPointerDownCapture={event => {
              if (!drawing || editing || !(event.target instanceof Element)) return;
              const surface = event.target.closest("[data-alive-touch]");
              if (!surface || event.target.closest("button, a, input, select, [data-alive-interactive]")) return;
              event.stopPropagation();
              trace.start(event, surface);
            }}
            onPointerMoveCapture={trace.move}
            onPointerUpCapture={trace.end}
            onPointerCancel={trace.cancel}
            onLostPointerCapture={trace.cancel}>
            {children}
            {garden && stageVisible && <MoonlitGarden director={director} />}
          </div>
          {controls}
        </div>
      </HabitContext.Provider>
    </SceneContext.Provider>
    </MotionContext.Provider>
  </Context.Provider>;
}
