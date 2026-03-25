"use client";

import type {
  RitualHistoryEntry,
  RitualInputType,
  RitualProgress,
  RitualType,
} from "@/lib/ritual/types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HeptaYantraCanvas } from "./HeptaYantraCanvas";

type GeometryState = {
  points: number;
  rotation: number;
  thickness: number;
  symmetry: number;
  intensity: number;
};

type Stage = {
  id: "seed" | "resonant" | "aligned" | "shadow" | "myth";
  label: string;
  note: string;
};

const INPUT_OPTIONS: Record<RitualInputType, string[]> = {
  mood: ["Calm", "Curious", "Energized", "Reflective", "Grateful"],
  intention: ["Focus", "Healing", "Courage", "Joy", "Clarity"],
  element: ["Fire", "Water", "Earth", "Air", "Aether"],
};

const INPUT_ICONS: Record<RitualInputType, string> = {
  mood: "心",
  intention: "意",
  element: "素",
};

const RITUALS: Record<
  RitualType,
  {
    label: string;
    description: string;
    icon: string;
    taps?: number;
    holdMs?: number;
  }
> = {
  tap: {
    label: "Tap",
    description: "Tap 7 times with rhythm",
    icon: "◉",
    taps: 7,
  },
  hold: {
    label: "Hold",
    description: "Press & hold for 5 seconds",
    icon: "◎",
    holdMs: 5000,
  },
  breath: {
    label: "Breathe",
    description: "4s in, 4s hold, 4s out",
    icon: "◌",
    holdMs: 12000,
  },
  yantra: { label: "Draw", description: "Draw a geometric pattern", icon: "✧" },
};

const STAGE_FLOW: Stage[] = [
  { id: "seed", label: "First Steps", note: "Your journey begins" },
  { id: "resonant", label: "Building Momentum", note: "3+ sessions completed" },
  { id: "aligned", label: "Strong Streak", note: "7 sessions completed" },
  { id: "shadow", label: "Deep Focus", note: "Deep reflection" },
  { id: "myth", label: "Milestone Reached", note: "Outstanding effort" },
];

const mythFragments = [
  "Great focus — your companion responds to your attention.",
  "Consistency is building — keep it up!",
  "Your companion is growing stronger with each session.",
  "That's a milestone — seven sessions and counting.",
  "Each activity adds to your companion's wellbeing.",
  "Your drawings are becoming more confident.",
  "Steady effort leads to real progress.",
];

const RITUAL_STORAGE_PREFIX = "metapet-ritual-progress";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getRitualStorageKey(petId?: string) {
  return petId
    ? `${RITUAL_STORAGE_PREFIX}:${petId}`
    : `${RITUAL_STORAGE_PREFIX}:default`;
}

// Use a UTC day key to avoid locale-specific Date parsing.
function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000,
  );
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function isValidRitualProgress(value: unknown): value is RitualProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as RitualProgress;
  const historyValid =
    Array.isArray(progress.history) &&
    progress.history.every(isValidHistoryEntry);
  return (
    typeof progress.resonance === "number" &&
    typeof progress.nectar === "number" &&
    typeof progress.streak === "number" &&
    typeof progress.totalSessions === "number" &&
    (progress.lastDayKey === null || typeof progress.lastDayKey === "number") &&
    historyValid
  );
}

function isValidHistoryEntry(value: unknown): value is RitualHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as RitualHistoryEntry;
  const validInputType =
    entry.inputType === "mood" ||
    entry.inputType === "intention" ||
    entry.inputType === "element";
  const validRitual =
    entry.ritual === "tap" ||
    entry.ritual === "hold" ||
    entry.ritual === "breath" ||
    entry.ritual === "yantra";
  return (
    validInputType &&
    validRitual &&
    typeof entry.inputValue === "string" &&
    typeof entry.timestamp === "number"
  );
}

export interface RitualLoopProps {
  onRitualComplete?: (data: {
    resonance: number;
    nectar: number;
    energy: number;
    stage: string;
    progress: RitualProgress;
  }) => void;
  signalDigits?: { red: number[]; blue: number[]; black: number[] };
  initialProgress?: RitualProgress;
  petId?: string;
}

export function RitualLoop({
  onRitualComplete,
  signalDigits,
  initialProgress,
  petId,
}: RitualLoopProps) {
  const [inputType, setInputType] = useState<RitualInputType>("mood");
  const [inputValue, setInputValue] = useState<string>(INPUT_OPTIONS.mood[0]);
  const [ritualType, setRitualType] = useState<RitualType>("tap");

  const [tapCount, setTapCount] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [breathPhase, setBreathPhase] = useState<
    "inhale" | "hold" | "exhale" | "idle"
  >("idle");
  const [breathActive, setBreathActive] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [geometry, setGeometry] = useState<GeometryState>({
    points: 5,
    rotation: 0,
    thickness: 1.5,
    symmetry: 2,
    intensity: 0.6,
  });

  const [resonance, setResonance] = useState(initialProgress?.resonance ?? 0);
  const [nectar, setNectar] = useState(initialProgress?.nectar ?? 0);
  const [oracle, setOracle] = useState("Begin your practice when ready.");
  const [myth, setMyth] = useState("");

  const [, setStreak] = useState(initialProgress?.streak ?? 0);
  const [lastDay, setLastDay] = useState<number | null>(
    initialProgress?.lastDayKey ?? null,
  );
  const [totalSessions, setTotalSessions] = useState(
    initialProgress?.totalSessions ?? 0,
  );
  const [stage, setStage] = useState<Stage>(STAGE_FLOW[0]);
  const [history, setHistory] = useState<RitualHistoryEntry[]>(
    initialProgress?.history ?? [],
  );
  const [showYantra, setShowYantra] = useState(false);
  const storageKey = useMemo(() => getRitualStorageKey(petId), [petId]);

  const ritualReady =
    (ritualType === "tap" && tapCount >= (RITUALS.tap.taps ?? 0)) ||
    (ritualType === "hold" && holdProgress >= 100) ||
    (ritualType === "breath" && holdProgress >= 100) ||
    ritualType === "yantra";

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    if (ritualType !== "tap") return;
    setTapCount((prev) => Math.min(RITUALS.tap.taps ?? 7, prev + 1));
  }, [ritualType]);

  const holdStartRef = useRef<number>(0);
  const startHold = useCallback(() => {
    if (ritualType !== "hold" || holdTimerRef.current) return;
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const percent = clamp(elapsed / (RITUALS.hold.holdMs ?? 5000), 0, 1);
      setHoldProgress(Math.round(percent * 100));
      if (percent >= 1 && holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }, 50);
  }, [ritualType]);

  const stopHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress((prev) => (prev >= 100 ? prev : 0));
  }, []);

  const startBreath = useCallback(() => {
    if (ritualType !== "breath" || breathTimerRef.current) return;
    const cycleDuration = 12000; // 4s + 4s + 4s
    const start = Date.now();
    setBreathPhase("inhale");
    setBreathActive(true);

    breathTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = clamp(elapsed / cycleDuration, 0, 1);
      setHoldProgress(Math.round(percent * 100));

      // Determine phase
      const phaseTime = elapsed % cycleDuration;
      if (phaseTime < 4000) setBreathPhase("inhale");
      else if (phaseTime < 8000) setBreathPhase("hold");
      else setBreathPhase("exhale");

      if (percent >= 1 && breathTimerRef.current) {
        clearInterval(breathTimerRef.current);
        breathTimerRef.current = null;
        setBreathPhase("idle");
        setBreathActive(false);
      }
    }, 50);
  }, [ritualType]);

  const resetRitual = useCallback(() => {
    setTapCount(0);
    setHoldProgress(0);
    setBreathPhase("idle");
    setBreathActive(false);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (breathTimerRef.current) {
      clearInterval(breathTimerRef.current);
      breathTimerRef.current = null;
    }
  }, []);

  const deriveStage = useCallback(
    (nextHistory: RitualHistoryEntry[], nextTotalSessions: number): Stage => {
      const total = Math.max(nextHistory.length, nextTotalSessions);
      if (total >= 7) return STAGE_FLOW[2];
      if (total >= 3) return STAGE_FLOW[1];
      return STAGE_FLOW[0];
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = requestAnimationFrame(() => {
      if (initialProgress) {
        setResonance(initialProgress.resonance);
        setNectar(initialProgress.nectar);
        setStreak(0);
        setLastDay(initialProgress.lastDayKey ?? null);
        setTotalSessions(initialProgress.totalSessions);
        setHistory(initialProgress.history ?? []);
        setStage(
          deriveStage(
            initialProgress.history ?? [],
            initialProgress.totalSessions,
          ),
        );
        return;
      }

      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored);
        if (!isValidRitualProgress(parsed)) return;
        setResonance(parsed.resonance);
        setNectar(parsed.nectar);
        setStreak(0);
        setLastDay(parsed.lastDayKey ?? null);
        setTotalSessions(parsed.totalSessions);
        setHistory(parsed.history ?? []);
        setStage(deriveStage(parsed.history ?? [], parsed.totalSessions));
      } catch (error) {
        console.warn("Failed to hydrate ritual progress:", error);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [deriveStage, initialProgress, storageKey]);

  const completeRitual = useCallback(
    (yantraEnergy?: number) => {
      // For yantra, we pass energy; for other rituals, check ritualReady
      const isYantraCompletion = yantraEnergy !== undefined;
      if (!ritualReady && !isYantraCompletion) return;

      const now = Date.now();
      const key = dayKey(now);
      const nextHistory = [
        ...history.slice(-29),
        { inputType, inputValue, ritual: ritualType, timestamp: now },
      ];
      const nextTotal = totalSessions + 1;
      const stageCandidate = deriveStage(nextHistory, nextTotal);

      // Geometry mutation
      const seed = hashString(`${inputValue}-${ritualType}-${now}`);
      const points = 3 + (seed % 5);
      const symmetry = 2 + (seed % 4);
      const rotation = geometry.rotation + ((seed % 360) * Math.PI) / 180;
      const thickness = 1 + (seed % 6) * 0.2;
      const intensity = clamp(0.4 + (seed % 40) / 100, 0, 1);

      setGeometry({ points, symmetry, rotation, thickness, intensity });

      const resonanceGain = 5 + (seed % 8) + (yantraEnergy ?? 0);
      const nectarGain = 1 + (yantraEnergy ? Math.floor(yantraEnergy / 5) : 0);

      const nextResonance = resonance + resonanceGain;
      const nextNectar = nectar + nectarGain;

      setResonance(nextResonance);
      setNectar(nextNectar);

      // Oracle message
      const oracleMessages = [
        `Your ${inputValue.toLowerCase()} focus carried through the ${ritualType} activity.`,
        `Holding ${inputValue.toLowerCase()} in mind helped shape your practice.`,
        `${stageCandidate.label} — nice work with your ${inputValue.toLowerCase()} focus.`,
      ];
      setOracle(oracleMessages[seed % oracleMessages.length]);

      // Myth fragment on milestones
      if (nextTotal % 5 === 0 || stageCandidate.id !== stage.id) {
        setMyth(mythFragments[(nextTotal + seed) % mythFragments.length]);
      }

      setHistory(nextHistory);
      setTotalSessions(nextTotal);
      setStreak(0);
      setLastDay(key);
      setStage(stageCandidate);
      resetRitual();
      setShowYantra(false);

      const progress: RitualProgress = {
        resonance: nextResonance,
        nectar: nextNectar,
        streak: 0,
        totalSessions: nextTotal,
        lastDayKey: key,
        history: nextHistory,
      };

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(progress));
        } catch (error) {
          console.warn("Failed to persist ritual progress:", error);
        }
      }

      onRitualComplete?.({
        resonance: resonanceGain,
        nectar: nectarGain,
        energy: yantraEnergy ?? 0,
        stage: stageCandidate.id,
        progress,
      });
    },
    [
      deriveStage,
      geometry.rotation,
      history,
      inputType,
      inputValue,
      nectar,
      onRitualComplete,
      resetRitual,
      resonance,
      ritualReady,
      ritualType,
      stage.id,
      storageKey,
      totalSessions,
    ],
  );

  const handleYantraComplete = useCallback(
    (result: { energy: number; pattern: string }) => {
      completeRitual(result.energy);
    },
    [completeRitual],
  );

  const geometryPath = useMemo(() => {
    const radius = 45;
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < geometry.points; i++) {
      const angle = geometry.rotation + (i / geometry.points) * Math.PI * 2;
      const r =
        radius *
        (0.8 + 0.2 * Math.sin(angle * geometry.symmetry + geometry.intensity));
      pts.push({ x: 60 + Math.cos(angle) * r, y: 60 + Math.sin(angle) * r });
    }
    return pts.map((p) => `${p.x},${p.y}`).join(" ");
  }, [geometry]);

  const ritualProgress = useMemo(() => {
    if (ritualType === "tap") return (tapCount / (RITUALS.tap.taps ?? 7)) * 100;
    return holdProgress;
  }, [holdProgress, ritualType, tapCount]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-cyan-700/30">
      {/* Header - compact on mobile */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Focus Practice
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm hidden sm:block">
            Choose an activity to care for your companion
          </p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <p className="text-cyan-300 font-semibold">{stage.label}</p>
          <p>
            Sessions:{" "}
            <span className="text-cyan-300 font-mono">{totalSessions}</span>
          </p>
        </div>
      </div>

      {/* Geometry visualization - centered, compact */}
      <div className="flex justify-center mb-4">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <linearGradient
                id="ritual-stroke"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke="#0ea5e9"
              strokeOpacity="0.1"
              strokeWidth={1}
            />
            <polyline
              points={geometryPath}
              fill="none"
              stroke="url(#ritual-stroke)"
              strokeWidth={geometry.thickness}
              strokeOpacity={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray={`${ritualProgress * 3.45} 345`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              opacity={0.5}
            />
          </svg>
        </div>
      </div>

      {/* Input Selection - horizontal scrollable on mobile */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
          {(["mood", "intention", "element"] as RitualInputType[]).map(
            (type) => (
              <button
                key={type}
                onClick={() => {
                  setInputType(type);
                  setInputValue(INPUT_OPTIONS[type][0]);
                  resetRitual();
                }}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium border transition flex items-center gap-2 ${
                  inputType === type
                    ? "bg-cyan-600/30 border-cyan-500 text-white"
                    : "border-slate-700 text-zinc-400 hover:border-cyan-600/60"
                }`}
              >
                <span className="text-base">{INPUT_ICONS[type]}</span>
                <span className="capitalize">{type}</span>
              </button>
            ),
          )}
        </div>

        {/* Value chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mt-2 scrollbar-hide">
          {INPUT_OPTIONS[inputType].map((option) => (
            <button
              key={option}
              onClick={() => setInputValue(option)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm border transition ${
                inputValue === option
                  ? "bg-purple-600/30 border-purple-400 text-white"
                  : "border-slate-800 bg-slate-900/70 text-zinc-300 hover:border-purple-500/40"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Ritual Type Selection */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {(Object.keys(RITUALS) as RitualType[]).map((rt) => (
          <button
            key={rt}
            onClick={() => {
              setRitualType(rt);
              resetRitual();
              setShowYantra(rt === "yantra");
            }}
            className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border transition ${
              ritualType === rt
                ? "bg-gradient-to-br from-cyan-600/30 to-purple-600/30 border-cyan-400 text-white"
                : "border-slate-800 bg-slate-900/50 text-zinc-400 hover:border-cyan-500/40"
            }`}
          >
            <span className="text-xl sm:text-2xl mb-1">{RITUALS[rt].icon}</span>
            <span className="text-[10px] sm:text-xs font-medium">
              {RITUALS[rt].label}
            </span>
            <span className="text-[9px] sm:text-[10px] text-zinc-400 text-center leading-tight mt-1">
              {RITUALS[rt].description}
            </span>
          </button>
        ))}
      </div>

      {/* Ritual Interaction Area */}
      {!showYantra ? (
        <div className="space-y-3">
          {ritualType === "tap" && (
            <>
              <button
                onClick={handleTap}
                disabled={tapCount >= (RITUALS.tap.taps ?? 7)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-lg shadow-lg active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl">◉</span>
                <span className="ml-2">
                  {tapCount} / {RITUALS.tap.taps}
                </span>
              </button>
              {tapCount >= (RITUALS.tap.taps ?? 7) && (
                <p className="text-xs text-zinc-400 text-center">
                  Prerequisite: complete the offering to reset the tap sequence.
                </p>
              )}
            </>
          )}

          {ritualType === "hold" && (
            <button
              onMouseDown={startHold}
              onTouchStart={startHold}
              onMouseUp={stopHold}
              onTouchEnd={stopHold}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-lg shadow-lg active:scale-[0.98] transition select-none"
            >
              <span className="text-2xl">◎</span>
              <span className="ml-2">{holdProgress}%</span>
            </button>
          )}

          {ritualType === "breath" && (
            <>
              <button
                onClick={startBreath}
                disabled={breathActive}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg shadow-lg active:scale-[0.98] transition disabled:opacity-80"
              >
                <span className="text-2xl">◌</span>
                <span className="ml-2 capitalize">
                  {breathPhase === "idle" ? "Begin Breath" : breathPhase}{" "}
                  {holdProgress > 0 && `${holdProgress}%`}
                </span>
              </button>
              {breathActive && (
                <p className="text-xs text-zinc-400 text-center">
                  Prerequisite: finish the current breath cycle to begin again.
                </p>
              )}
            </>
          )}

          {ritualReady && ritualType !== "yantra" && (
            <button
              onClick={() => completeRitual()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold text-lg shadow-lg active:scale-[0.98] transition animate-pulse"
            >
              Complete Activity
            </button>
          )}
        </div>
      ) : (
        <div className="flex justify-center">
          <HeptaYantraCanvas
            size={280}
            onYantraComplete={handleYantraComplete}
            signalDigits={signalDigits}
          />
        </div>
      )}

      {/* Oracle Message */}
      {oracle && (
        <div className="mt-4 p-3 rounded-lg border border-cyan-700/30 bg-cyan-950/30">
          <p className="text-sm text-cyan-100 text-center">{oracle}</p>
        </div>
      )}

      {/* Myth Fragment */}
      {myth && (
        <div className="mt-3 p-3 rounded-lg border border-purple-700/30 bg-purple-950/30">
          <p className="text-xs text-purple-200 text-center italic">{myth}</p>
        </div>
      )}

      {/* Stats bar - compact */}
      <div className="mt-4 flex justify-between items-center text-xs text-zinc-400">
        <div className="flex gap-3">
          <span>
            Energy:{" "}
            <span className="text-cyan-300 font-mono">{resonance}</span>
          </span>
          <span>
            Nectar: <span className="text-amber-300 font-mono">{nectar}</span>
          </span>
        </div>
        <span>{totalSessions} sessions</span>
      </div>
    </div>
  );
}

export default RitualLoop;
