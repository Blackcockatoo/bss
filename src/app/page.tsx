"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { AmbientBackground } from "@/components/AmbientBackground";
import { AmbientParticles } from "@/components/AmbientParticles";
import {
  AnxietyAnchor,
  EmergencyGroundingButton,
} from "@/components/AnxietyAnchor";
import { ClassroomManager } from "@/components/ClassroomManager";
import { ClassroomModes } from "@/components/ClassroomModes";
import { CompactVitalsBar } from "@/components/CompactVitalsBar";
import { DigitalKeyPanel } from "@/components/DigitalKeyPanel";
import { EducationQueuePanel } from "@/components/EducationQueuePanel";
import { EvolutionPanel } from "@/components/EvolutionPanel";
import { FeaturesDashboard } from "@/components/FeaturesDashboard";
import { FloatingActions } from "@/components/FloatingActions";
import { HeptaTag } from "@/components/HeptaTag";
import {
  HydrationQuickButton,
  HydrationTracker,
} from "@/components/HydrationTracker";
import { PetHero } from "@/components/PetHero";
import { MetaPetLoadingScreen } from "@/components/MetaPetLoadingScreen";
import { PetResponseOverlay } from "@/components/PetResponseOverlay";
import {
  CertificateButton,
  RegistrationCertificate,
} from "@/components/RegistrationCertificate";
import RitualLoop from "@/components/RitualLoop";
import { SeedOfLifeGlyph } from "@/components/SeedOfLifeGlyph";
import { SleepStatusButton, SleepTracker } from "@/components/SleepTracker";
import { TraitPanel } from "@/components/TraitPanel";
import {
  WellnessSettings,
  WellnessSettingsButton,
} from "@/components/WellnessSettings";
import { QuickMoodButton, WellnessSync } from "@/components/WellnessSync";
import { Button } from "@/components/ui/button";
import {
  type BreedingResult,
  breedPets,
  calculateSimilarity,
  canBreed,
  predictOffspring,
} from "@/lib/breeding";
import { useEducationStore } from "@/lib/education";
import { ENABLE_CHILD_SAFE_BASELINE } from "@/lib/env/features";
import { initializeEvolution } from "@/lib/evolution";
import {
  type Genome,
  type GenomeHash,
  decodeGenome,
  encodeGenome,
  hashGenome,
} from "@/lib/genome";
import {
  LOCALE_LABELS,
  type Locale,
  SUPPORTED_LOCALES,
  useLocale,
} from "@/lib/i18n";
import {
  ROUTE_PROGRESSION_SEQUENCE,
  getRouteProgression,
} from "@/lib/routeProgression";
import { getDeviceHmacKey, mintPrimeTailId } from "@/lib/identity/crest";
import { heptaEncode42, playHepta } from "@/lib/identity/hepta";
import type {
  HeptaDigits,
  PrimeTailID,
  Rotation,
  Vault,
} from "@/lib/identity/types";
import {
  type PetSaveData,
  deletePet,
  exportPetToJSON,
  getAllPets,
  importPetFromJSON,
  isPersistenceAvailable,
  loadPet,
  savePet,
  setupAutoSave,
} from "@/lib/persistence/indexeddb";
import {
  createDefaultBattleStats,
  createDefaultMiniGameProgress,
  createDefaultVimanaState,
} from "@/lib/progression/types";
import { createDefaultRitualProgress } from "@/lib/ritual/types";
import { useStore } from "@/lib/store";
import { useWellnessStore } from "@/lib/wellness";
import { createWitnessRecord } from "@/lib/witness";
import { DEFAULT_VITALS } from "@/vitals";
import type { PetType, RewardSource } from "@metapet/core/store";
import {
  Award,
  Baby,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Database,
  Dna,
  Download,
  FlaskConical,
  GraduationCap,
  Hash,
  HeartHandshake,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import Link from "next/link";

interface PetSummary {
  id: string;
  name?: string;
  createdAt: number;
  lastSaved: number;
}

const DNA_CHARS = ["A", "C", "G", "T"] as const;

function randomDNA(length: number): string {
  const values = new Uint8Array(length);
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i++) {
      values[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(
    values,
    (value) => DNA_CHARS[value % DNA_CHARS.length],
  ).join("");
}

function randomTail(): [number, number, number, number] {
  const values = new Uint8Array(4);
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i++) {
      values[i] = Math.floor(Math.random() * 256);
    }
  }
  return [values[0] % 60, values[1] % 60, values[2] % 60, values[3] % 60];
}

function slugify(value: string | undefined, fallback: string): string {
  const base =
    value && value.trim() !== "" ? value.trim().toLowerCase() : fallback;
  return base.replace(/[^a-z0-9\-\s]/g, "").replace(/\s+/g, "-");
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function createSaveController(delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let latest: PetSaveData | null = null;
  let listeners: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
  }> = [];

  const clearTimer = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  const resolveListeners = (
    queuedListeners: Array<{
      resolve: () => void;
      reject: (error: unknown) => void;
    }>,
  ) => {
    queuedListeners.forEach((listener) => listener.resolve());
  };

  const rejectListeners = (
    queuedListeners: Array<{
      resolve: () => void;
      reject: (error: unknown) => void;
    }>,
    error: unknown,
  ) => {
    queuedListeners.forEach((listener) => listener.reject(error));
  };

  const flush = async () => {
    clearTimer();

    const snapshot = latest;
    const queuedListeners = listeners;
    listeners = [];
    latest = null;

    if (!snapshot) {
      resolveListeners(queuedListeners);
      return;
    }

    try {
      await savePet(snapshot);
      resolveListeners(queuedListeners);
    } catch (error) {
      rejectListeners(queuedListeners, error);
      throw error;
    }
  };

  return {
    schedule(data: PetSaveData) {
      latest = data;

      return new Promise<void>((resolve, reject) => {
        listeners.push({ resolve, reject });

        clearTimer();
        timeout = setTimeout(() => {
          void flush().catch(() => undefined);
        }, delay);
      });
    },

    flush,

    cancel(targetPetId?: string) {
      if (targetPetId && latest && latest.id !== targetPetId) {
        return false;
      }

      const hadPending = Boolean(timeout || latest || listeners.length > 0);
      clearTimer();

      if (!hadPending) {
        return false;
      }

      latest = null;
      const queuedListeners = listeners;
      listeners = [];
      resolveListeners(queuedListeners);
      return true;
    },
  };
}

const PET_ID = "metapet-primary";
const SESSION_ANALYTICS_KEY = "metapet-analytics";

type AlchemyBase = "vitality" | "focus" | "harmony";
type AlchemyCatalyst = "sunpetal" | "moondew" | "stardust";

interface AlchemyRecipe {
  base: AlchemyBase;
  catalyst: AlchemyCatalyst;
}

interface BrewResult {
  name: string;
  effect: string;
  potency: number;
  brewedAt: number;
}

const ALCHEMY_BASE_LABELS: Record<AlchemyBase, string> = {
  vitality: "Vitality Essence",
  focus: "Focus Infusion",
  harmony: "Harmony Tonic",
};

const ALCHEMY_CATALYST_LABELS: Record<AlchemyCatalyst, string> = {
  sunpetal: "Sunpetal",
  moondew: "Moondew",
  stardust: "Stardust",
};

const ALCHEMY_CATALYST_EFFECTS: Record<AlchemyCatalyst, string> = {
  sunpetal: "warms the core and boosts mood stability",
  moondew: "settles the aura and improves recovery",
  stardust: "sharpens attention and amplifies curiosity",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createBrewResult(
  recipe: AlchemyRecipe,
  resonanceIndex: number,
  evolutionStage: string,
): BrewResult {
  const stageBonus =
    evolutionStage === "COSMIC"
      ? 12
      : evolutionStage === "ELDER"
        ? 8
        : evolutionStage === "ADULT"
          ? 4
          : 0;
  const potency = clamp(
    Math.round(resonanceIndex * 0.65 + stageBonus + Math.random() * 12),
    20,
    100,
  );
  const catalystEffect = ALCHEMY_CATALYST_EFFECTS[recipe.catalyst];

  return {
    name: `${ALCHEMY_CATALYST_LABELS[recipe.catalyst]} ${ALCHEMY_BASE_LABELS[recipe.base]}`,
    effect: `${ALCHEMY_BASE_LABELS[recipe.base]} ${catalystEffect}.`,
    potency,
    brewedAt: Date.now(),
  };
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function CurriculumQueueSection() {
  const eduQueue = useEducationStore((s) => s.queue);
  const eduProgress = useEducationStore((s) => s.lessonProgress);
  const activateLesson = useEducationStore((s) => s.activateLesson);
  const eduXP = useEducationStore((s) => s.eduXP);
  const classEnergy = useEducationStore((s) => s.classEnergy.level);
  const promptResponseCount = useEducationStore((s) => s.promptResponseCount);
  const vibeReactionCount = useEducationStore((s) => s.vibeReactionCount);
  const eduAchievements = useEducationStore((s) => s.eduAchievements);
  const unlockedEduAchievements = useMemo(
    () => eduAchievements.filter((entry) => entry.unlockedAt !== null),
    [eduAchievements],
  );
  const rewardHistory = useStore((s) => s.rewardHistory);

  const completedCount = eduProgress.filter(
    (p) => p.status === "completed",
  ).length;
  const standards = eduQueue.flatMap((l) => l.standardsRef).filter(Boolean);
  const progressWithTime = eduProgress.filter(
    (p) => p.startedAt || p.completedAt,
  );
  const lessonsWithExplanation = eduQueue.filter(
    (lesson) =>
      lesson.prePrompt?.trim() ||
      lesson.postPrompt?.trim() ||
      lesson.description.trim().length >= 40,
  ).length;
  const explanationCoverage =
    eduQueue.length === 0 ? 0 : lessonsWithExplanation / eduQueue.length;
  const outcomeRate =
    progressWithTime.length === 0
      ? 0
      : completedCount / progressWithTime.length;
  const reflectionRate =
    progressWithTime.length === 0
      ? 0
      : eduProgress.filter(
          (entry) => entry.postResponse && entry.postResponse.trim().length > 0,
        ).length / progressWithTime.length;
  const [mountTime] = useState(() => Date.now());
  const recentRewards = rewardHistory.filter(
    (entry) => mountTime - entry.createdAt <= 7 * 24 * 60 * 60 * 1000,
  );
  const rewardMomentum = Math.min(100, recentRewards.length * 12);
  const trustScore = clamp(
    Math.round(
      explanationCoverage * 30 +
        outcomeRate * 35 +
        reflectionRate * 20 +
        (standards.length > 0 ? 15 : 0),
    ),
    0,
    100,
  );
  const fulfillmentScore = clamp(
    Math.round(
      outcomeRate * 40 +
        (classEnergy / 100) * 25 +
        (rewardMomentum / 100) * 20 +
        Math.min(15, unlockedEduAchievements.length * 3),
    ),
    0,
    100,
  );

  if (eduQueue.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <p className="text-xs font-semibold text-zinc-200">Lesson objectives</p>
        <ul className="mt-2 space-y-2 text-xs text-zinc-300">
          {[
            "Define success criteria for an iterative prototype.",
            "Collect and interpret feedback to refine a design.",
            "Communicate findings with evidence-based reflection.",
          ].map((objective) => (
            <li key={objective} className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 text-zinc-500" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-zinc-500">
          Add lessons to the queue in the Classroom Manager to see your lesson
          path here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-200">
            Queue Progress
          </p>
          <p className="text-xs text-emerald-300">
            {completedCount} of {eduQueue.length} lessons completed
          </p>
        </div>
        {standards.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] text-emerald-200/70 uppercase tracking-wide">
              Standards
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {[...new Set(standards)].map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-cyan-200">
            Trust & Fulfillment Snapshot
          </p>
          <p className="text-[11px] text-cyan-300">
            Live classroom quality signals
          </p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-slate-700/70 bg-slate-950/40 p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Explanation coverage
            </p>
            <p className="text-sm font-semibold text-white">
              {Math.round(explanationCoverage * 100)}%
            </p>
          </div>
          <div className="rounded-md border border-slate-700/70 bg-slate-950/40 p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Outcome completion
            </p>
            <p className="text-sm font-semibold text-white">
              {Math.round(outcomeRate * 100)}%
            </p>
          </div>
          <div className="rounded-md border border-slate-700/70 bg-slate-950/40 p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Reward momentum
            </p>
            <p className="text-sm font-semibold text-white">
              {rewardMomentum}/100
            </p>
          </div>
          <div className="rounded-md border border-slate-700/70 bg-slate-950/40 p-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Reflection responses
            </p>
            <p className="text-sm font-semibold text-white">
              {promptResponseCount}
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2">
          <p className="text-xs text-zinc-200">
            Trust score{" "}
            <span className="font-semibold text-emerald-200">{trustScore}</span>
            /100 â€¢ Fulfillment score{" "}
            <span className="font-semibold text-emerald-200">
              {fulfillmentScore}
            </span>
            /100
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Includes standards transparency, explanation prompts, progress
            outcomes, class energy, and reward cadence.
            {` `}XP Level {eduXP.level}, vibe reactions {vibeReactionCount}.
          </p>
        </div>
      </div>

      <EducationQueuePanel mode="student" onLessonActivate={activateLesson} />
    </div>
  );
}

export default function Home() {
  const startTick = useStore((s) => s.startTick);
  const stopTick = useStore((s) => s.stopTick);
  const setGenome = useStore((s) => s.setGenome);
  const hydrate = useStore((s) => s.hydrate);
  const petType = useStore((s) => s.petType);
  const setPetType = useStore((s) => s.setPetType);
  const genome = useStore((s) => s.genome);
  const traits = useStore((s) => s.traits);
  const feed = useStore((s) => s.feed);
  const evolution = useStore((s) => s.evolution);
  const ritualProgress = useStore((s) => s.ritualProgress);
  const addRitualRewards = useStore((s) => s.addRitualRewards);
  const recordBreeding = useStore((s) => s.recordBreeding);
  const [crest, setCrest] = useState<PrimeTailID | null>(null);
  const [heptaCode, setHeptaCode] = useState<HeptaDigits | null>(null);
  const [loading, setLoading] = useState(true);
  const [genomeHash, setGenomeHash] = useState<GenomeHash | null>(null);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [learningMode, setLearningMode] = useState<"sandbox" | "curriculum">(
    "sandbox",
  );
  const [persistenceActive, setPersistenceActive] = useState(false);
  const [persistenceSupported, setPersistenceSupported] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [petSummaries, setPetSummaries] = useState<PetSummary[]>([]);
  const [currentPetId, setCurrentPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [persistenceNotice, setPersistenceNotice] = useState<string | null>(
    null,
  );
  const [breedingMode, setBreedingMode] = useState<
    "BALANCED" | "DOMINANT" | "MUTATION"
  >("BALANCED");
  const [breedingPartnerId, setBreedingPartnerId] = useState("");
  const [breedingPreview, setBreedingPreview] = useState<{
    possibleTraits: string[];
    confidence: number;
    similarity: number;
    partnerName?: string;
    partnerStage?: string;
  } | null>(null);
  const [breedingResult, setBreedingResult] = useState<BreedingResult | null>(
    null,
  );
  const [breedingPartner, setBreedingPartner] = useState<PetSaveData | null>(
    null,
  );
  const [offspringSummary, setOffspringSummary] = useState<PetSummary | null>(
    null,
  );
  const [breedingError, setBreedingError] = useState<string | null>(null);
  const [breedingBusy, setBreedingBusy] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);

  // Wellness tracking state
  const [wellnessSyncOpen, setWellnessSyncOpen] = useState(false);
  const [hydrationOpen, setHydrationOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [anxietyOpen, setAnxietyOpen] = useState(false);
  const [wellnessSettingsOpen, setWellnessSettingsOpen] = useState(false);
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [alchemyRecipe, setAlchemyRecipe] = useState<AlchemyRecipe>({
    base: "vitality",
    catalyst: "sunpetal",
  });
  const [latestBrew, setLatestBrew] = useState<BrewResult | null>(null);
  const [brewHistory, setBrewHistory] = useState<BrewResult[]>([]);
  const [brewCooldownUntil, setBrewCooldownUntil] = useState(0);
  const { locale, setLocale, strings } = useLocale();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("metapet-low-bandwidth");
    if (stored === "true") setLowBandwidthMode(true);
  }, []);

  const handleLowBandwidthToggle = (next: boolean) => {
    setLowBandwidthMode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("metapet-low-bandwidth", String(next));
    }
  };

  const handleBrewElixir = () => {
    if (brewCooldownSeconds > 0) return;

    const result = createBrewResult(
      alchemyRecipe,
      resonanceIndex,
      evolution.state,
    );
    setLatestBrew(result);
    setBrewHistory((prev) => [result, ...prev].slice(0, 5));
    setBrewCooldownUntil(Date.now() + 8_000);

    feed();
    setLastWellnessAction("feed");
  };

  const [lastWellnessAction, setLastWellnessAction] = useState<
    "feed" | "clean" | "play" | "sleep" | null
  >(null);
  const wellnessSetupCompleted = useWellnessStore(
    (state) => state.setupCompletedAt,
  );

  const elementProfile = useMemo(() => {
    if (!traits) return "fire";
    const weighted = {
      fire: traits.elementWeb.frontierAffinity,
      water: traits.elementWeb.bridgeCount * 10,
      earth: traits.elementWeb.voidDrift * 10,
    };
    return (Object.entries(weighted).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "fire") as "fire" | "water" | "earth";
  }, [traits]);

  const resonanceIndex = useMemo(() => {
    if (!traits) return 60;
    const blend =
      (traits.personality.energy +
        traits.personality.curiosity +
        traits.personality.playfulness +
        traits.elementWeb.frontierAffinity) /
      4;
    return Math.max(0, Math.min(100, Math.round(blend)));
  }, [traits]);

  const brewCooldownSeconds = Math.max(
    0,
    Math.ceil((brewCooldownUntil - Date.now()) / 1000),
  );

  const saveController = useMemo(() => createSaveController(1_000), []);

  const crestRef = useRef<PrimeTailID | null>(null);
  const heptaRef = useRef<HeptaDigits | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const hasInitializedAppRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const recordSessionDuration = (startTime: number, endTime: number) => {
      const durationMs = Math.max(0, endTime - startTime);

      try {
        const stored = window.localStorage.getItem(SESSION_ANALYTICS_KEY);
        const parsed = stored
          ? (JSON.parse(stored) as { sessions?: Array<Record<string, number>> })
          : {};
        const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];

        sessions.push({ startTime, endTime, durationMs });

        window.localStorage.setItem(
          SESSION_ANALYTICS_KEY,
          JSON.stringify({
            ...parsed,
            lastDurationMs: durationMs,
            sessions,
          }),
        );
      } catch (error) {
        console.warn("Failed to persist session analytics:", error);
      }
    };

    const startTime = Date.now();
    sessionStartRef.current = startTime;
    console.info("session_start", { timestamp: startTime });

    const handleSessionEnd = () => {
      const endTime = Date.now();
      const sessionStart = sessionStartRef.current ?? endTime;
      console.info("session_end", {
        timestamp: endTime,
        durationMs: endTime - sessionStart,
      });
      recordSessionDuration(sessionStart, endTime);
    };

    window.addEventListener("pagehide", handleSessionEnd);

    return () => {
      window.removeEventListener("pagehide", handleSessionEnd);
      handleSessionEnd();
    };
  }, []);
  const genomeHashRef = useRef<GenomeHash | null>(null);
  const createdAtRef = useRef<number | null>(null);
  const petIdRef = useRef<string | null>(null);
  const petNameRef = useRef<string>("");
  const hmacKeyRef = useRef<CryptoKey | null>(null);
  const persistenceSupportedRef = useRef(false);
  const autoSaveCleanupRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearArchiveFeedback = useCallback(() => {
    setArchiveError(null);
    if (persistenceSupportedRef.current) {
      setPersistenceNotice(null);
    }
  }, []);

  const disablePersistenceSession = useCallback(
    (message: string) => {
      if (autoSaveCleanupRef.current) {
        autoSaveCleanupRef.current();
        autoSaveCleanupRef.current = null;
      }

      saveController.cancel();
      persistenceSupportedRef.current = false;
      setPersistenceSupported(false);
      setPersistenceActive(false);
      setPetSummaries([]);
      setBreedingPartnerId("");
      setBreedingPartner(null);
      setBreedingPreview(null);
      setPersistenceNotice(message);
    },
    [saveController],
  );

  const genomeToDna = useCallback((value: Genome): string => {
    const alphabet = ["A", "C", "G", "T"];
    const flatten = [...value.red60, ...value.blue60, ...value.black60];
    return flatten
      .map((gene) => {
        const safe = Number.isFinite(gene) ? Math.abs(Math.round(gene)) : 0;
        return alphabet[safe % alphabet.length];
      })
      .join("");
  }, []);

  const deriveTailFromLineage = useCallback(
    (seed: string): [number, number, number, number] => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash ^ seed.charCodeAt(i)) * 16777619;
        hash >>>= 0;
      }

      const next = () => {
        hash ^= hash << 13;
        hash ^= hash >>> 17;
        hash ^= hash << 5;
        hash >>>= 0;
        return hash % 60;
      };

      return [next(), next(), next(), next()];
    },
    [],
  );

  const buildOffspringName = useCallback(
    (lineageKey: string, partnerName?: string | null) => {
      const left = (petNameRef.current || "ORIGIN").slice(0, 4).toUpperCase();
      const right = (
        partnerName && partnerName.trim() !== "" ? partnerName : "ALLY"
      )
        .slice(0, 4)
        .toUpperCase();
      return `${left}-${right}-${lineageKey.slice(0, 4).toUpperCase()}`;
    },
    [],
  );

  useEffect(() => {
    crestRef.current = crest;
  }, [crest]);

  useEffect(() => {
    heptaRef.current = heptaCode;
  }, [heptaCode]);

  useEffect(() => {
    genomeHashRef.current = genomeHash;
  }, [genomeHash]);

  useEffect(() => {
    createdAtRef.current = createdAt;
  }, [createdAt]);

  useEffect(() => {
    petNameRef.current = petName.trim();
  }, [petName]);

  useEffect(() => {
    return () => {
      if (autoSaveCleanupRef.current) {
        autoSaveCleanupRef.current();
        autoSaveCleanupRef.current = null;
      }

      saveController.cancel();
    };
  }, [saveController]);

  useEffect(() => {
    let cancelled = false;

    const previewPartner = async () => {
      if (!breedingPartnerId || !persistenceSupportedRef.current) {
        setBreedingPartner(null);
        setBreedingPreview(null);
        return;
      }

      try {
        const partner = await loadPet(breedingPartnerId);
        if (cancelled) return;
        setBreedingPartner(partner);

        if (!partner || !genome) {
          setBreedingPreview(null);
          return;
        }

        const similarity = calculateSimilarity(genome, partner.genome);
        const prediction = predictOffspring(genome, partner.genome);
        setBreedingPreview({
          possibleTraits: prediction.possibleTraits,
          confidence: prediction.confidence,
          similarity,
          partnerName: partner.name,
          partnerStage: partner.evolution.state,
        });
        setBreedingError(null);
      } catch (error) {
        console.warn("Failed to load partner pet for breeding preview:", error);
        if (!cancelled) {
          setBreedingPartner(null);
          setBreedingPreview(null);
          setBreedingError("Unable to load partner data for breeding.");
        }
      }
    };

    void previewPartner();
    return () => {
      cancelled = true;
    };
  }, [breedingPartnerId, genome]);

  const buildSnapshot = useCallback((): PetSaveData => {
    const state = useStore.getState();

    if (!petIdRef.current) {
      throw new Error("No active pet id");
    }
    if (!state.genome || !state.traits) {
      throw new Error("Genome not initialized");
    }
    if (!crestRef.current || !heptaRef.current || !genomeHashRef.current) {
      throw new Error("Identity not initialized");
    }

    return {
      id: petIdRef.current,
      name: petNameRef.current || undefined,
      vitals: state.vitals,
      petType: state.petType,
      mirrorMode: state.mirrorMode,
      witness: state.witness,
      petOntology: state.petOntology,
      systemState: state.systemState,
      sealedAt: state.sealedAt,
      invariantIssues: state.invariantIssues,
      genome: state.genome,
      genomeHash: genomeHashRef.current,
      traits: state.traits,
      evolution: state.evolution,
      ritualProgress: state.ritualProgress,
      essence: state.essence,
      lastRewardSource: state.lastRewardSource,
      lastRewardAmount: state.lastRewardAmount,
      achievements: state.achievements.map((entry) => ({ ...entry })),
      battle: { ...state.battle },
      miniGames: { ...state.miniGames },
      vimana: {
        ...state.vimana,
        cells: state.vimana.cells.map((cell) => ({ ...cell })),
      },
      crest: crestRef.current,
      heptaDigits: Array.from(heptaRef.current) as HeptaDigits,
      createdAt: createdAtRef.current ?? Date.now(),
      lastSaved: Date.now(),
    };
  }, []);

  const persistSnapshotNow = useCallback(
    async (snapshot: PetSaveData) => {
      if (!persistenceSupportedRef.current) {
        return;
      }

      saveController.cancel();
      await savePet(snapshot);
    },
    [saveController],
  );

  const persistCurrentPetNow = useCallback(async () => {
    if (!persistenceSupportedRef.current || !petIdRef.current) {
      return;
    }

    await persistSnapshotNow(buildSnapshot());
  }, [buildSnapshot, persistSnapshotNow]);

  const scheduleSnapshotSave = useCallback(
    async (snapshot: PetSaveData) => {
      if (!persistenceSupportedRef.current) {
        return;
      }

      await saveController.schedule(snapshot);
    },
    [saveController],
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    if (!persistenceSupported) {
      return;
    }

    const flushOnBackground = () => {
      void persistCurrentPetNow().catch((error) => {
        console.warn("Failed to persist pet on pagehide:", error);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushOnBackground();
      }
    };

    window.addEventListener("pagehide", flushOnBackground);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushOnBackground);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [persistCurrentPetNow, persistenceSupported]);

  const refreshPetSummaries = useCallback(async () => {
    if (!persistenceSupportedRef.current) {
      setPetSummaries([]);
      return;
    }

    try {
      const pets = await getAllPets();
      const summaries = pets
        .map<PetSummary>((pet) => ({
          id: pet.id,
          name: pet.name,
          createdAt: pet.createdAt,
          lastSaved: pet.lastSaved,
        }))
        .sort((a, b) => b.lastSaved - a.lastSaved);
      setPetSummaries(summaries);
    } catch (error) {
      console.warn("Failed to load pet archive list:", error);
      setArchiveError(
        getErrorMessage(error, "Failed to refresh local archives."),
      );
      setPetSummaries([]);
    }
  }, []);

  const applyPetData = useCallback(
    (pet: PetSaveData) => {
      hydrate({
        vitals: { ...DEFAULT_VITALS, ...pet.vitals },
        genome: {
          red60: [...pet.genome.red60],
          blue60: [...pet.genome.blue60],
          black60: [...pet.genome.black60],
        },
        traits: pet.traits,
        evolution: { ...pet.evolution },
        ritualProgress: pet.ritualProgress ?? createDefaultRitualProgress(),
        essence: pet.essence ?? 0,
        lastRewardSource: (pet.lastRewardSource as RewardSource) ?? null,
        lastRewardAmount: pet.lastRewardAmount ?? 0,
        achievements: pet.achievements?.map((entry) => ({ ...entry })) ?? [],
        battle: pet.battle ? { ...pet.battle } : createDefaultBattleStats(),
        miniGames: pet.miniGames
          ? { ...pet.miniGames }
          : createDefaultMiniGameProgress(),
        vimana: pet.vimana
          ? {
              ...pet.vimana,
              cells: pet.vimana.cells.map((cell) => ({ ...cell })),
            }
          : createDefaultVimanaState(),
        petType: pet.petType,
        mirrorMode: pet.mirrorMode,
        witness: pet.witness,
        petOntology: pet.petOntology,
        systemState: pet.systemState,
        sealedAt: pet.sealedAt,
        invariantIssues: pet.invariantIssues,
      });

      const digits = Object.freeze([...pet.heptaDigits]) as HeptaDigits;

      setCrest(pet.crest);
      setHeptaCode(digits);
      setGenomeHash(pet.genomeHash);
      setCreatedAt(pet.createdAt);
      setPetName(pet.name ?? "");
      setCurrentPetId(pet.id);

      crestRef.current = pet.crest;
      heptaRef.current = digits;
      genomeHashRef.current = pet.genomeHash;
      createdAtRef.current = pet.createdAt;
      petIdRef.current = pet.id;
      petNameRef.current = pet.name?.trim() ?? "";
    },
    [hydrate],
  );

  const activateAutoSave = useCallback(() => {
    if (!persistenceSupportedRef.current) {
      setPersistenceActive(false);
      return;
    }

    if (autoSaveCleanupRef.current) {
      autoSaveCleanupRef.current();
      autoSaveCleanupRef.current = null;
    }

    try {
      const cleanup = setupAutoSave(
        () => buildSnapshot(),
        60_000,
        scheduleSnapshotSave,
        {
          onSuccess: () => {
            clearArchiveFeedback();
            setPersistenceActive(true);
          },
          onError: (error) => {
            const message =
              "Autosave is paused until local archive access recovers.";
            setPersistenceActive(false);
            setPersistenceNotice(message);
            setArchiveError(getErrorMessage(error, message));
          },
        },
      );
      autoSaveCleanupRef.current = cleanup;
      setPersistenceActive(true);
      clearArchiveFeedback();
    } catch (error) {
      console.warn("Failed to start autosave:", error);
      setPersistenceActive(false);
      setPersistenceNotice("Autosave could not be started for local archives.");
      setArchiveError(
        getErrorMessage(
          error,
          "Autosave could not be started for local archives.",
        ),
      );
    }
  }, [buildSnapshot, clearArchiveFeedback, scheduleSnapshotSave]);

  const createFreshPet = useCallback(async (): Promise<PetSaveData> => {
    const ensureKey = async () => {
      if (hmacKeyRef.current) return hmacKeyRef.current;
      const key = await getDeviceHmacKey();
      hmacKeyRef.current = key;
      return key;
    };

    const hmacKey = await ensureKey();
    const primeDNA = randomDNA(64);
    const tailDNA = randomDNA(64);
    const tail = randomTail();
    const rotation = Math.random() > 0.5 ? "CW" : "CCW";

    const genome = await encodeGenome(primeDNA, tailDNA);
    const traits = decodeGenome(genome);
    const genomeHashValue = await hashGenome(genome);

    const crestValue = await mintPrimeTailId({
      dna: primeDNA,
      vault: "blue",
      rotation,
      tail,
      hmacKey,
    });

    const minutes = Math.floor(Date.now() / 60000) % 8192;
    const heptaDigits = await heptaEncode42(
      {
        version: 1,
        preset: "standard",
        vault: crestValue.vault,
        rotation: crestValue.rotation,
        tail,
        epoch13: minutes,
        nonce14: Math.floor(Math.random() * 16384),
      },
      hmacKey,
    );

    const created = Date.now();
    const petId = `pet-${crestValue.signature.slice(0, 12)}`;
    const witness = createWitnessRecord(petId, created);

    return {
      id: petId,
      name: undefined,
      vitals: {
        ...DEFAULT_VITALS,
      },
      petType: "geometric",
      mirrorMode: {
        phase: "idle",
        startedAt: null,
        consentExpiresAt: null,
        preset: null,
        presenceToken: null,
        lastReflection: null,
      },
      witness,
      petOntology: "living",
      systemState: "active",
      sealedAt: null,
      invariantIssues: [],
      genome,
      genomeHash: genomeHashValue,
      traits,
      evolution: initializeEvolution(),
      ritualProgress: createDefaultRitualProgress(),
      essence: 0,
      lastRewardSource: null,
      lastRewardAmount: 0,
      achievements: [],
      battle: createDefaultBattleStats(),
      miniGames: createDefaultMiniGameProgress(),
      vimana: createDefaultVimanaState(),
      crest: crestValue,
      heptaDigits: Object.freeze([...heptaDigits]) as HeptaDigits,
      createdAt: created,
      lastSaved: created,
    };
  }, []);

  const createOffspringFromResult = useCallback(
    async (
      result: BreedingResult,
      partnerName?: string | null,
    ): Promise<PetSaveData> => {
      if (!result.offspring) {
        throw new Error("Missing offspring genome");
      }

      const hmacKey = await getDeviceHmacKey();
      const tail = deriveTailFromLineage(result.lineageKey);
      const rotation: Rotation =
        result.lineageKey.charCodeAt(0) % 2 === 0 ? "CW" : "CCW";
      const vault: Vault = crestRef.current?.vault ?? "blue";
      const dna = genomeToDna(result.offspring);
      const crestValue = await mintPrimeTailId({
        dna,
        vault,
        rotation,
        tail,
        hmacKey,
      });

      const minutes = Math.floor(Date.now() / 60000) % 8192;
      const heptaDigits = await heptaEncode42(
        {
          version: 1,
          preset: "standard",
          vault: crestValue.vault,
          rotation: crestValue.rotation,
          tail,
          epoch13: minutes,
          nonce14: Math.floor(Math.random() * 16384),
        },
        hmacKey,
      );

      const now = Date.now();
      const genomeHashValue = await hashGenome(result.offspring);
      const petId = `pet-${crestValue.signature.slice(0, 12)}`;
      const witness = createWitnessRecord(petId, now);

      return {
        id: petId,
        name: buildOffspringName(result.lineageKey, partnerName),
        vitals: {
          ...DEFAULT_VITALS,
        },
        petType: "geometric",
        mirrorMode: {
          phase: "idle",
          startedAt: null,
          consentExpiresAt: null,
          preset: null,
          presenceToken: null,
          lastReflection: null,
        },
        witness,
        petOntology: "living",
        systemState: "active",
        sealedAt: null,
        invariantIssues: [],
        genome: result.offspring,
        genomeHash: genomeHashValue,
        traits: result.traits,
        evolution: initializeEvolution(),
        ritualProgress: createDefaultRitualProgress(),
        essence: 0,
        lastRewardSource: null,
        lastRewardAmount: 0,
        achievements: [],
        battle: createDefaultBattleStats(),
        miniGames: createDefaultMiniGameProgress(),
        vimana: createDefaultVimanaState(),
        crest: crestValue,
        heptaDigits: Object.freeze([...heptaDigits]) as HeptaDigits,
        createdAt: now,
        lastSaved: now,
      };
    },
    [buildOffspringName, deriveTailFromLineage, genomeToDna],
  );

  const handleBreedWithPartner = useCallback(async () => {
    setBreedingError(null);
    setBreedingResult(null);
    setOffspringSummary(null);

    if (!persistenceSupportedRef.current) {
      setBreedingError(
        "Breeding requires offline archives so offspring can be saved.",
      );
      return;
    }

    if (!genome || !traits || !evolution) {
      setBreedingError(
        "Active companion is not initialized. Try loading or creating a pet first.",
      );
      return;
    }

    if (!breedingPartner || !breedingPartnerId) {
      setBreedingError(
        "Select a partner from your saved companions to begin breeding.",
      );
      return;
    }

    if (!canBreed(evolution.state, breedingPartner.evolution.state)) {
      setBreedingError(
        "Both companions must reach SPECIATION before they can breed.",
      );
      return;
    }

    setBreedingBusy(true);

    try {
      const result = breedPets(genome, breedingPartner.genome, breedingMode);
      const offspring = await createOffspringFromResult(
        result,
        breedingPartner.name,
      );
      await savePet(offspring);
      await refreshPetSummaries();

      setBreedingResult(result);
      setOffspringSummary({
        id: offspring.id,
        name: offspring.name,
        createdAt: offspring.createdAt,
        lastSaved: offspring.lastSaved,
      });
      recordBreeding();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Breeding attempt failed. Please try again.";
      setBreedingError(message);
    } finally {
      setBreedingBusy(false);
    }
  }, [
    breedingMode,
    breedingPartner,
    breedingPartnerId,
    createOffspringFromResult,
    evolution,
    genome,
    recordBreeding,
    refreshPetSummaries,
    traits,
  ]);

  const downloadPetArchive = useCallback((pet: PetSaveData) => {
    const json = exportPetToJSON(pet);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const nameSlug = slugify(pet.name, "meta-pet");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nameSlug}-${pet.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const initializeIdentity = useCallback(async () => {
    try {
      const hmacKey = await getDeviceHmacKey();
      hmacKeyRef.current = hmacKey;

      const supported = await isPersistenceAvailable();
      persistenceSupportedRef.current = supported;
      setPersistenceSupported(supported);

      if (supported) {
        setPersistenceNotice(null);
      } else {
        disablePersistenceSession(
          "IndexedDB is unavailable. This session is temporary, but you can still export the active companion.",
        );
      }

      let activePet: PetSaveData | null = null;

      if (persistenceSupportedRef.current) {
        try {
          const pets = await getAllPets();
          const sorted = [...pets].sort((a, b) => b.lastSaved - a.lastSaved);
          if (sorted.length > 0) {
            activePet = sorted[0];
          }
          const summaries = sorted.map<PetSummary>((pet) => ({
            id: pet.id,
            name: pet.name,
            createdAt: pet.createdAt,
            lastSaved: pet.lastSaved,
          }));
          setPetSummaries(summaries);
          clearArchiveFeedback();
        } catch (error) {
          console.warn("Failed to load existing pet save:", error);
          disablePersistenceSession(
            "Local archives could not be opened. Continuing in session-only mode.",
          );
        }
      }

      if (!activePet) {
        const freshPet = await createFreshPet();
        activePet = freshPet;
        if (persistenceSupportedRef.current) {
          try {
            await savePet(freshPet);
            clearArchiveFeedback();
          } catch (error) {
            console.warn("Failed to persist initial pet snapshot:", error);
            disablePersistenceSession(
              "Local archives could not store the initial companion. Continuing in session-only mode.",
            );
          }
        }
      }

      if (activePet) {
        applyPetData(activePet);
      }

      if (persistenceSupportedRef.current) {
        await refreshPetSummaries();
        activateAutoSave();
      } else {
        setPersistenceActive(false);
      }
    } catch (error) {
      console.error("Identity init failed:", error);
      disablePersistenceSession(
        "Local persistence could not be initialized. Continuing in session-only mode.",
      );
      setArchiveError(
        getErrorMessage(error, "Failed to initialize the active companion."),
      );

      try {
        const freshPet = await createFreshPet();
        applyPetData(freshPet);
      } catch (fallbackError) {
        console.error("Fallback pet creation failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [
    activateAutoSave,
    applyPetData,
    clearArchiveFeedback,
    createFreshPet,
    disablePersistenceSession,
    refreshPetSummaries,
  ]);

  const handlePlayHepta = useCallback(async () => {
    if (!heptaCode) return;

    try {
      setAudioError(null);
      await playHepta(heptaCode);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Audio unavailable - click to enable";
      setAudioError(message);
      console.warn("Audio playback failed:", error);
    }
  }, [heptaCode]);

  const handleNameBlur = useCallback(async () => {
    if (!persistenceSupportedRef.current || !currentPetId) return;

    try {
      const snapshot = buildSnapshot();
      snapshot.name = petName.trim() ? petName.trim() : undefined;
      await persistSnapshotNow(snapshot);
      await refreshPetSummaries();
      clearArchiveFeedback();
    } catch (error) {
      console.warn("Failed to save pet name:", error);
      setPersistenceNotice(
        "Local archive sync failed while saving the pet name.",
      );
      setArchiveError(getErrorMessage(error, "Failed to save the pet name."));
    }
  }, [
    buildSnapshot,
    clearArchiveFeedback,
    currentPetId,
    persistSnapshotNow,
    petName,
    refreshPetSummaries,
  ]);

  const handleCreateNewPet = useCallback(async () => {
    if (!persistenceSupportedRef.current) {
      setArchiveError(
        "Session-only mode is active. Export the current companion before minting a new one.",
      );
      return;
    }

    try {
      await persistCurrentPetNow();

      const newPet = await createFreshPet();
      let petToApply: PetSaveData = newPet;

      await savePet(newPet);
      const stored = await loadPet(newPet.id);
      if (stored) {
        petToApply = stored;
      }

      applyPetData(petToApply);
      activateAutoSave();
      await refreshPetSummaries();
      clearArchiveFeedback();
    } catch (error) {
      console.error("Failed to create new pet:", error);
      setArchiveError(
        getErrorMessage(error, "Failed to mint a new companion."),
      );
    }
  }, [
    activateAutoSave,
    applyPetData,
    clearArchiveFeedback,
    createFreshPet,
    persistCurrentPetNow,
    refreshPetSummaries,
  ]);

  const handleSelectPet = useCallback(
    async (id: string) => {
      if (id === currentPetId) return;

      if (!persistenceSupportedRef.current) {
        setArchiveError(
          "Session-only mode is active. Archived companions are unavailable right now.",
        );
        return;
      }

      try {
        await persistCurrentPetNow();

        const pet = await loadPet(id);
        if (!pet) {
          setArchiveError("That archived companion is no longer available.");
          await refreshPetSummaries();
          return;
        }

        applyPetData(pet);
        activateAutoSave();
        await refreshPetSummaries();
        clearArchiveFeedback();
      } catch (error) {
        console.error("Failed to load pet:", error);
        setArchiveError(
          getErrorMessage(error, "Failed to load the selected companion."),
        );
      }
    },
    [
      activateAutoSave,
      applyPetData,
      clearArchiveFeedback,
      currentPetId,
      persistCurrentPetNow,
      refreshPetSummaries,
    ],
  );

  const handleExportCurrentPet = useCallback(async () => {
    try {
      downloadPetArchive(buildSnapshot());
      clearArchiveFeedback();
    } catch (error) {
      console.error("Failed to export current pet:", error);
      setArchiveError(
        getErrorMessage(error, "Failed to export the active companion."),
      );
    }
  }, [buildSnapshot, clearArchiveFeedback, downloadPetArchive]);

  const handleExportPet = useCallback(
    async (id: string) => {
      try {
        if (id === currentPetId) {
          downloadPetArchive(buildSnapshot());
          clearArchiveFeedback();
          return;
        }

        if (!persistenceSupportedRef.current) {
          setArchiveError(
            "Session-only mode is active. Only the active companion can be exported.",
          );
          return;
        }

        const pet = await loadPet(id);
        if (!pet) {
          setArchiveError("That archived companion is no longer available.");
          await refreshPetSummaries();
          return;
        }

        downloadPetArchive(pet);
        clearArchiveFeedback();
      } catch (error) {
        console.error("Failed to export pet archive:", error);
        setArchiveError(
          getErrorMessage(error, "Failed to export the selected companion."),
        );
      }
    },
    [
      buildSnapshot,
      clearArchiveFeedback,
      currentPetId,
      downloadPetArchive,
      refreshPetSummaries,
    ],
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      if (!persistenceSupportedRef.current) {
        setArchiveError(
          "Session-only mode is active. Import requires local archives to be available.",
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      try {
        await persistCurrentPetNow();

        const text = await file.text();
        const imported = importPetFromJSON(text);
        await savePet(imported);
        const stored = await loadPet(imported.id);
        const petToApply = stored ?? imported;
        applyPetData(petToApply);
        activateAutoSave();
        await refreshPetSummaries();
        clearArchiveFeedback();
      } catch (error) {
        console.error("Failed to import pet archive:", error);
        setArchiveError(getErrorMessage(error, "Import failed."));
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      activateAutoSave,
      applyPetData,
      clearArchiveFeedback,
      persistCurrentPetNow,
      refreshPetSummaries,
    ],
  );

  const handleDeletePet = useCallback(
    async (id: string) => {
      if (!persistenceSupportedRef.current) {
        setArchiveError(
          "Session-only mode is active. Archived companions are unavailable right now.",
        );
        return;
      }

      if (
        !window.confirm(
          "Archive this companion from local archives? A trace will remain.",
        )
      )
        return;

      try {
        if (id === currentPetId) {
          saveController.cancel(id);
          if (autoSaveCleanupRef.current) {
            autoSaveCleanupRef.current();
            autoSaveCleanupRef.current = null;
          }
        }

        await deletePet(id);
        await refreshPetSummaries();

        if (breedingPartnerId === id) {
          setBreedingPartnerId("");
          setBreedingPartner(null);
          setBreedingPreview(null);
        }

        if (id === currentPetId) {
          const pets = await getAllPets();
          const sorted = pets.sort((a, b) => b.lastSaved - a.lastSaved);
          if (sorted.length > 0) {
            applyPetData(sorted[0]);
            activateAutoSave();
          } else {
            const newPet = await createFreshPet();
            let petToApply: PetSaveData = newPet;
            try {
              await savePet(newPet);
              const stored = await loadPet(newPet.id);
              if (stored) {
                petToApply = stored;
              }
            } catch (error) {
              console.warn("Failed to persist replacement pet:", error);
              setArchiveError(
                getErrorMessage(
                  error,
                  "Failed to persist the replacement companion.",
                ),
              );
            }
            applyPetData(petToApply);
            activateAutoSave();
          }
          await refreshPetSummaries();
        }
        clearArchiveFeedback();
      } catch (error) {
        console.error("Failed to archive pet:", error);
        setArchiveError(
          getErrorMessage(error, "Failed to archive the selected companion."),
        );
      }
    },
    [
      activateAutoSave,
      applyPetData,
      breedingPartnerId,
      clearArchiveFeedback,
      createFreshPet,
      currentPetId,
      refreshPetSummaries,
      saveController,
    ],
  );

  useEffect(() => {
    if (hasInitializedAppRef.current) {
      return;
    }

    hasInitializedAppRef.current = true;
    startTick();
    void initializeIdentity();

    return () => {
      stopTick();
    };
  }, [initializeIdentity, startTick, stopTick]);

  if (loading) {
    return (
      <MetaPetLoadingScreen statusMessage="Generating genome sequence" />
    );
  }

  const handleImportInput = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (file) {
      void handleImportFile(file);
    }
  };

  const canBreedNow = Boolean(
    genome &&
      breedingPartner &&
      evolution &&
      canBreed(evolution.state, breedingPartner.evolution.state),
  );
  const isBreedingDisabled = !canBreedNow || breedingBusy;
  const breedingHint = (() => {
    if (!isBreedingDisabled) return null;
    if (breedingBusy)
      return "Prerequisite: wait for the current breeding cycle to finish.";
    if (!breedingPartner)
      return "Prerequisite: select a companion from the archives to breed.";
    if (!evolution)
      return "Prerequisite: load your active companion to continue.";
    if (evolution.state !== "SPECIATION") {
      return "Prerequisite: reach SPECIATION stage with your active companion.";
    }
    if (breedingPartner.evolution.state !== "SPECIATION") {
      return "Prerequisite: your partner must reach SPECIATION stage.";
    }
    return "Prerequisite: meet all breeding requirements to unlock this.";
  })();
  const mintDisabled = !persistenceSupported;
  const mintHint = mintDisabled
    ? "Session-only mode keeps one temporary companion at a time. Export the active companion before leaving this page."
    : null;
  const importDisabled = !persistenceSupported;
  const importHint = importDisabled
    ? "Importing archived companions requires IndexedDB local archives."
    : null;
  const exportCurrentDisabled = !currentPetId || !crest || !heptaCode;
  const journeySteps = ROUTE_PROGRESSION_SEQUENCE.map((routeKey) =>
    getRouteProgression(routeKey),
  );
  const launchStep = journeySteps[0];
  const classroomStep = journeySteps[1];

  return (
    <AmbientBackground>
      {/* Ambient Particles */}
      <AmbientParticles enabled={!lowBandwidthMode} />

      {/* Real-time Response Overlay */}
      <PetResponseOverlay enableAudio={true} enableAnticipation={true} />

      <div className="min-h-screen pb-24 sm:pb-24">
        <div className="px-4 pt-4 sm:pt-6">
          <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-cyan-500/20 bg-slate-950/75 p-4 shadow-[0_20px_80px_rgba(8,47,73,0.28)] sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs uppercase tracking-[0.34em] text-cyan-300/80">
                  Meta-Pet Launch Surface
                </p>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  Start with the companion, then climb into school, identity,
                  and DNA.
                </h1>
                <p className="text-sm leading-7 text-slate-300 sm:text-base">
                  This home route is now the plain-language launch point. Care
                  builds the bond, school turns that bond into pattern learning,
                  identity keeps ownership local, and DNA reveals the hidden
                  engine underneath all three.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                    <Link href={launchStep.entryCta.href}>
                      {launchStep.entryCta.label}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
                  >
                    <Link href={classroomStep.entryCta.href}>
                      {classroomStep.entryCta.label}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
                {journeySteps.map((step) => (
                  <Link
                    key={step.key}
                    href={step.href}
                    className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-cyan-400/35 hover:bg-slate-900"
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      Step {step.step}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {step.shortLabel}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {step.entryCta.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== HERO SECTION: PET AT TOP ===== */}
        <div className="pt-6 pb-2">
          {/* Pet Name & Type Toggle */}
          <div className="mb-4 px-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <label htmlFor="pet-name" className="sr-only">
                {strings.core.nameLabel}
              </label>
              <input
                id="pet-name"
                type="text"
                value={petName}
                onChange={(event) => setPetName(event.target.value)}
                onBlur={() => void handleNameBlur()}
                placeholder={strings.core.namePlaceholder}
                className="w-full max-w-[280px] text-2xl font-bold text-center bg-transparent border-none text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:max-w-[360px] md:max-w-[420px]"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant={petType === "geometric" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPetType("geometric")}
                className="text-xs h-7 touch-manipulation"
                aria-pressed={petType === "geometric"}
              >
                {strings.core.petType.geometric}
              </Button>
              <Button
                variant={petType === "auralia" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPetType("auralia")}
                className="text-xs h-7 touch-manipulation"
                aria-pressed={petType === "auralia"}
              >
                {strings.core.petType.auralia}
              </Button>
            </div>
          </div>

          {/* Pet Hero with Progress Rings */}
          <PetHero className="py-4" staticMode={lowBandwidthMode} />

          {/* Quick Actions */}
          <FloatingActions />

          {/* Certificate Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => setCertificateOpen(true)}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 touch-manipulation"
            >
              <Award className="w-4 h-4 mr-2" />
              {strings.core.viewCertificate}
            </Button>
          </div>

          {/* Wellness Quick Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 px-4 pt-4">
            <QuickMoodButton onClick={() => setWellnessSyncOpen(true)} />
            <HydrationQuickButton onClick={() => setHydrationOpen(true)} />
            <SleepStatusButton onClick={() => setSleepOpen(true)} />
            <EmergencyGroundingButton onClick={() => setAnxietyOpen(true)} />
            <WellnessSettingsButton
              onClick={() => setWellnessSettingsOpen(true)}
            />
          </div>
        </div>

        {/* ===== VITALS BAR ===== */}
        <CompactVitalsBar />

        {/* ===== CONTENT SECTIONS ===== */}
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:py-6">
          {/* Ritual Loop - Important, keep expanded */}
          <div id="ritual">
            <RitualLoop
              petId={currentPetId ?? PET_ID}
              initialProgress={ritualProgress}
              onRitualComplete={(data) => {
                addRitualRewards({
                  resonanceDelta: data.resonance,
                  reward: {
                    essenceDelta: data.nectar,
                    source: "ritual",
                  },
                  progress: data.progress,
                });
              }}
              signalDigits={
                genome
                  ? {
                      red: genome.red60,
                      blue: genome.blue60,
                      black: genome.black60,
                    }
                  : undefined
              }
            />
          </div>

          {/* Evolution Progress */}
          <CollapsibleSection
            title={strings.sections.evolution}
            icon={<Sparkles className="w-5 h-5 text-cyan-300" />}
            defaultOpen
          >
            <p className="text-xs text-zinc-500 mb-3">
              Your companion grows through four stages â€” each one mirrors a
              real branch of science, from genetics to quantum biology. Care
              drives change.
            </p>
            <EvolutionPanel />
          </CollapsibleSection>

          {/* Mini Games */}
          <div id="mini-games">
            <CollapsibleSection
              title={strings.sections.miniGames}
              icon={<Sparkles className="w-5 h-5 text-pink-400" />}
              defaultOpen
            >
              <p className="text-xs text-zinc-500 mb-3">
                Every game here trains a real skill â€” pattern recognition,
                rhythm, memory. Your companion earns rewards, and you build
                sharper instincts.
              </p>
              <FeaturesDashboard />
            </CollapsibleSection>
          </div>

          {/* Learning Modes */}
          <CollapsibleSection
            title="Learning Modes"
            icon={<GraduationCap className="w-5 h-5 text-emerald-300" />}
            defaultOpen
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Teacher toggle
                  </p>
                  <p className="text-xs text-zinc-400">
                    Switch between free-form sandbox exploration and guided
                    curriculum delivery.
                  </p>
                </div>
                <label className="flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
                  <span>
                    {learningMode === "curriculum" ? "Curriculum" : "Sandbox"}
                  </span>
                  <input
                    type="checkbox"
                    checked={learningMode === "curriculum"}
                    onChange={() =>
                      setLearningMode((prevMode) =>
                        prevMode === "sandbox" ? "curriculum" : "sandbox",
                      )
                    }
                    className="relative h-6 w-11 appearance-none rounded-full border border-slate-700 bg-slate-900/70 transition before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white/80 before:transition checked:border-emerald-400 checked:bg-emerald-500/80 checked:before:translate-x-5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className={`space-y-3 rounded-xl border p-4 transition ${
                    learningMode === "sandbox"
                      ? "border-cyan-400/60 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span className="text-sm font-semibold text-white">
                      Free-form sandbox mode
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Open exploration with flexible tools, creative prompts, and
                    student-led discovery.
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li>â€¢ Rapid prototyping and experimentation</li>
                    <li>â€¢ Optional scaffolds and hints on demand</li>
                    <li>â€¢ Peer collaboration and reflection notes</li>
                  </ul>
                </div>

                <div
                  className={`space-y-3 rounded-xl border p-4 transition ${
                    learningMode === "curriculum"
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-semibold text-white">
                      Guided curriculum mode
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Standards-aligned sequence with checkpoints, pacing
                    guidance, and teacher visibility.
                  </p>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-xs font-semibold text-emerald-200">
                      Standards mapping
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                      <li>â€¢ NGSS: MS-ETS1-1, MS-ETS1-4</li>
                      <li>
                        â€¢ ISTE: 1.1 Empowered Learner, 1.4 Innovative Designer
                      </li>
                    </ul>
                  </div>
                  <CurriculumQueueSection />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Breeding Lab */}
          <CollapsibleSection
            title={strings.sections.breedingLab}
            icon={<FlaskConical className="w-5 h-5 text-pink-400" />}
          >
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Breeding follows real genetic principles â€” dominant and
                recessive traits, mutation chance, and lineage tracking. Two
                companions at the Speciation stage can produce offspring that
                inherits from both parents.
              </p>
              {/* Breeding Mode Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                  Breeding Mode
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["BALANCED", "DOMINANT", "MUTATION"] as const).map(
                    (mode) => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={breedingMode === mode ? "default" : "outline"}
                        onClick={() => setBreedingMode(mode)}
                        className={`touch-manipulation ${breedingMode === mode ? "bg-pink-600 hover:bg-pink-700" : "border-slate-700"}`}
                      >
                        {mode}
                      </Button>
                    ),
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  {breedingMode === "BALANCED" &&
                    "Equal mix of both parents' traits"}
                  {breedingMode === "DOMINANT" &&
                    "Stronger traits take priority"}
                  {breedingMode === "MUTATION" &&
                    "Higher chance of unique mutations"}
                </p>
              </div>

              {/* Partner Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                  Select Partner
                </label>
                <select
                  value={breedingPartnerId}
                  onChange={(event) => setBreedingPartnerId(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500 touch-manipulation"
                >
                  <option value="">Choose a companion...</option>
                  {petSummaries
                    .filter((s) => s.id !== currentPetId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name && s.name.trim() !== ""
                          ? s.name
                          : `Companion ${s.id.slice(0, 8)}`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Breeding Preview */}
              {breedingPreview && (
                <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-pink-400" />
                    <span className="text-sm font-semibold text-pink-200">
                      Compatibility Preview
                    </span>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-zinc-400">Partner:</span>
                      <span className="ml-2 text-white">
                        {breedingPreview.partnerName || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Stage:</span>
                      <span className="ml-2 text-cyan-400">
                        {breedingPreview.partnerStage}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Genetic Similarity:</span>
                      <span className="ml-2 text-purple-400">
                        {(breedingPreview.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Confidence:</span>
                      <span className="ml-2 text-green-400">
                        {(breedingPreview.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">
                      Possible Traits:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {breedingPreview.possibleTraits
                        .slice(0, 6)
                        .map((trait) => (
                          <span
                            key={trait}
                            className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-zinc-300"
                          >
                            {trait}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Breed Button */}
              <Button
                onClick={() => void handleBreedWithPartner()}
                disabled={isBreedingDisabled}
                className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 touch-manipulation"
              >
                <Baby className="w-4 h-4 mr-2" />
                {breedingBusy ? "Breeding..." : "Breed Companions"}
              </Button>
              {breedingHint && (
                <p className="text-xs text-zinc-400">{breedingHint}</p>
              )}

              {breedingError && (
                <p className="text-xs text-rose-400">{breedingError}</p>
              )}

              {/* Breeding Result */}
              {breedingResult && offspringSummary && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-green-200">
                      New Offspring!
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-zinc-400">Name:</span>
                      <span className="ml-2 text-white">
                        {offspringSummary.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Lineage Key:</span>
                      <span className="ml-2 text-purple-400 font-mono text-xs">
                        {breedingResult.lineageKey.slice(0, 16)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Inherited Traits:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(breedingResult.traits)
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-zinc-300"
                            >
                              {key}:{" "}
                              {typeof value === "number"
                                ? value.toFixed(2)
                                : String(value)}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-500/10 touch-manipulation"
                    onClick={() => void handleSelectPet(offspringSummary.id)}
                  >
                    Switch to Offspring
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={strings.sections.alchemistStation}
            icon={<FlaskConical className="w-5 h-5 text-amber-300" />}
          >
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Combine base essences with catalysts to brew a quick support
                elixir for your companion.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Base Essence
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ALCHEMY_BASE_LABELS) as AlchemyBase[]).map(
                      (base) => (
                        <Button
                          key={base}
                          size="sm"
                          variant={
                            alchemyRecipe.base === base ? "default" : "outline"
                          }
                          onClick={() =>
                            setAlchemyRecipe((prev) => ({ ...prev, base }))
                          }
                          className={
                            alchemyRecipe.base === base
                              ? "bg-amber-600 hover:bg-amber-700"
                              : "border-slate-700"
                          }
                        >
                          {ALCHEMY_BASE_LABELS[base]}
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Catalyst
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Object.keys(ALCHEMY_CATALYST_LABELS) as AlchemyCatalyst[]
                    ).map((catalyst) => (
                      <Button
                        key={catalyst}
                        size="sm"
                        variant={
                          alchemyRecipe.catalyst === catalyst
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setAlchemyRecipe((prev) => ({ ...prev, catalyst }))
                        }
                        className={
                          alchemyRecipe.catalyst === catalyst
                            ? "bg-violet-600 hover:bg-violet-700"
                            : "border-slate-700"
                        }
                      >
                        {ALCHEMY_CATALYST_LABELS[catalyst]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">
                <p className="font-semibold">Current Formula</p>
                <p className="mt-1">
                  {ALCHEMY_CATALYST_LABELS[alchemyRecipe.catalyst]} +{" "}
                  {ALCHEMY_BASE_LABELS[alchemyRecipe.base]}.
                </p>
                <p className="mt-1 text-amber-200/80">
                  Resonance Index: {resonanceIndex} â€¢ Evolution Stage:{" "}
                  {evolution.state}
                </p>
              </div>

              <Button
                onClick={handleBrewElixir}
                disabled={brewCooldownSeconds > 0}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                {brewCooldownSeconds > 0
                  ? `Cooling retort (${brewCooldownSeconds}s)`
                  : "Brew Elixir"}
              </Button>

              {latestBrew && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm space-y-1">
                  <p className="font-semibold text-emerald-200">
                    Latest Brew: {latestBrew.name}
                  </p>
                  <p className="text-zinc-300">{latestBrew.effect}</p>
                  <p className="text-xs text-emerald-300">
                    Potency {latestBrew.potency}% â€¢ Companion nourished
                  </p>
                </div>
              )}

              {brewHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Recent Brews
                  </p>
                  <div className="space-y-2">
                    {brewHistory.map((brew) => (
                      <div
                        key={brew.brewedAt}
                        className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs"
                      >
                        <p className="text-zinc-200">{brew.name}</p>
                        <p className="text-zinc-400">Potency {brew.potency}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={strings.sections.classroomTools}
            icon={<Shield className="w-5 h-5 text-emerald-300" />}
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  {strings.classroom.languageLabel}
                </p>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  {SUPPORTED_LOCALES.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      onClick={() => setLocale(option as Locale)}
                      className={`h-auto whitespace-normal px-3 py-2 text-xs sm:text-sm ${
                        locale === option
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          : "border border-slate-700 bg-slate-900/80 text-zinc-100 hover:bg-slate-800"
                      }`}
                    >
                      {LOCALE_LABELS[option]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">
                      {strings.classroom.lowBandwidthTitle}
                    </p>
                    <p className="text-xs text-emerald-200/70">
                      {strings.classroom.lowBandwidthDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLowBandwidthToggle(!lowBandwidthMode)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
                      lowBandwidthMode
                        ? "bg-emerald-400/20 text-emerald-100 border-emerald-400/40"
                        : "bg-slate-900 text-emerald-200 border-emerald-500/20"
                    }`}
                    aria-pressed={lowBandwidthMode}
                  >
                    {lowBandwidthMode
                      ? strings.classroom.lowBandwidthOn
                      : strings.classroom.lowBandwidthOff}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {strings.classroom.teacherPromptsTitle}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {strings.classroom.teacherPromptsDescription}
                  </p>
                </div>
                <ul className="space-y-2">
                  {strings.classroom.teacherPrompts.map((prompt) => (
                    <li
                      key={prompt.title}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <p className="text-sm font-semibold text-cyan-200">
                        {prompt.title}
                      </p>
                      <p className="text-xs text-zinc-300 mt-1">
                        {prompt.prompt}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Classroom Manager */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <p className="text-sm font-semibold text-zinc-100">
                  Classroom Manager
                </p>
                <p className="text-xs text-zinc-400">
                  Manage learner roster, assign activities, track progress, and
                  build lesson queues.
                </p>
                <ClassroomManager />
              </div>
            </div>
          </CollapsibleSection>

          {!ENABLE_CHILD_SAFE_BASELINE && (
            <>
              {/* Steering Wheel â€” Central Navigator */}
              <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <Compass className="w-6 h-6 text-cyan-400" />
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Compass Wheel
                      </h2>
                      <p className="text-xs text-zinc-400">
                        The navigator now lives inside the dashboard so you can
                        jump between tools, games, and core learning spaces
                        from one place
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/monkey-invaders"
                      className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm font-medium hover:bg-amber-500/30 hover:border-amber-300 transition-colors touch-manipulation"
                    >
                      Launch Monkey Invaders
                    </Link>
                    <Link
                      href="/app/activities"
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-sm font-medium hover:bg-cyan-500/30 hover:border-cyan-400 transition-colors touch-manipulation"
                    >
                      Open Dashboard Compass
                    </Link>
                    <Link
                      href="/app/moss60"
                      className="px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-200 text-sm font-medium hover:bg-violet-500/30 hover:border-violet-400 transition-colors touch-manipulation"
                    >
                      Open MOSS60 Studio
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Genome Traits */}
          <CollapsibleSection
            title="Genome Traits"
            icon={<Dna className="w-5 h-5 text-purple-400" />}
          >
            <p className="text-xs text-zinc-500 mb-3">
              Three genome layers â€” Red60 for physical traits, Blue60 for
              personality, Black60 for latent potential. The same DNA always
              produces the same companion, just like nature.
            </p>
            <TraitPanel />
          </CollapsibleSection>

          {/* PrimeTail ID */}
          {crest && (
            <CollapsibleSection
              title="PrimeTail ID"
              icon={<Shield className="w-5 h-5 text-amber-400" />}
            >
              <div className="space-y-4">
                <p className="text-xs text-zinc-500">
                  Your companion&apos;s cryptographic identity â€” signed on
                  this device, never shared. The vault, rotation, and tail
                  digits form a tamper-proof fingerprint that proves
                  authenticity without revealing the underlying DNA.
                </p>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Vault:</span>
                    <span className="text-blue-400 font-mono font-bold uppercase">
                      {crest.vault}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Rotation:</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {crest.rotation}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Tail:</span>
                    <span className="text-purple-400 font-mono text-xs">
                      [{crest.tail.join(", ")}]
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Coronated:</span>
                    <span className="text-amber-200 text-xs">
                      {new Date(crest.coronatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg">
                  <p className="text-xs text-zinc-500 font-mono break-all">
                    Sig: {crest.signature.slice(0, 32)}...
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* HeptaCode Visuals */}
          {heptaCode && (
            <CollapsibleSection
              title="HeptaCode"
              icon={<Hash className="w-5 h-5 text-purple-400" />}
            >
              <div className="space-y-4">
                <p className="text-xs text-zinc-500">
                  42 base-7 digits encode your companion&apos;s identity into
                  geometry, colour, and sound. One source, three experiences â€”
                  the same data rendered as a seven-sided tag, a Seed of Life
                  glyph, and an audible chime.
                </p>
                <div className="flex justify-center gap-4">
                  <HeptaTag digits={heptaCode} size={120} />
                  <SeedOfLifeGlyph digits={heptaCode} size={120} />
                </div>
                <Button
                  variant="outline"
                  className="w-full border-slate-700 bg-slate-950/60 text-cyan-200 hover:text-cyan-50 touch-manipulation"
                  onClick={handlePlayHepta}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Play Hepta Tone
                </Button>
                {audioError && (
                  <p className="text-xs text-rose-400 text-center">
                    {audioError}
                  </p>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Offline Archives */}
          <CollapsibleSection
            title="Offline Archives"
            icon={<Database className="w-5 h-5 text-emerald-400" />}
          >
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Everything lives on your device. No accounts, no cloud â€” your
                companions are saved locally with cryptographic signatures so
                nothing can be tampered with. Export anytime to carry them
                between devices.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleCreateNewPet()}
                  disabled={mintDisabled}
                  className="flex-1 h-12 touch-manipulation"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Mint New
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleExportCurrentPet()}
                  disabled={exportCurrentDisabled}
                  className="flex-1 h-12 border-slate-700 touch-manipulation"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Current
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importDisabled}
                  className="flex-1 h-12 border-slate-700 touch-manipulation"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={handleImportInput}
                />
              </div>
              {(mintHint || importHint) && (
                <div className="space-y-1">
                  {mintHint && (
                    <p className="text-xs text-zinc-500">{mintHint}</p>
                  )}
                  {importHint && (
                    <p className="text-xs text-zinc-500">{importHint}</p>
                  )}
                </div>
              )}

              {persistenceNotice && (
                <p className="text-xs text-amber-300">{persistenceNotice}</p>
              )}

              {archiveError && (
                <p className="text-xs text-rose-400">{archiveError}</p>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {petSummaries.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-zinc-500">
                    {persistenceSupported
                      ? "No archived companions yet."
                      : "Session-only mode is active. Export the current companion before closing this tab."}
                  </div>
                ) : (
                  petSummaries.map((summary) => {
                    const isActive = summary.id === currentPetId;
                    return (
                      <div
                        key={summary.id}
                        className={`rounded-lg border p-3 transition ${
                          isActive
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-slate-800 bg-slate-950/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {summary.name && summary.name.trim() !== ""
                                ? summary.name
                                : "Unnamed"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {new Date(summary.lastSaved).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleSelectPet(summary.id)}
                              disabled={isActive}
                              className="h-8 w-8 p-0 touch-manipulation"
                              aria-label="Load"
                            >
                              <Sparkles className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleExportPet(summary.id)}
                              className="h-8 w-8 p-0 touch-manipulation"
                              aria-label="Export"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 touch-manipulation"
                              onClick={() => void handleDeletePet(summary.id)}
                              aria-label="Archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Digital Keys */}
          <CollapsibleSection
            title="Digital Keys"
            icon={<Shield className="w-5 h-5 text-cyan-400" />}
          >
            <p className="text-xs text-zinc-500 mb-3">
              Your device holds the keys. These cryptographic pairs let you sign
              addons, verify exports, and prove ownership â€” all without a
              central server. This is how digital trust works without
              intermediaries.
            </p>
            <DigitalKeyPanel />
          </CollapsibleSection>

          {/* Classroom Modes */}
          <CollapsibleSection
            title="Classroom Modes"
            icon={<Award className="w-5 h-5 text-cyan-300" />}
          >
            <p className="text-xs text-zinc-500 mb-3">
              Designed alongside educators. Sandbox lets students explore
              freely; Curriculum aligns to real standards (NGSS, ISTE). We
              believe learning sticks when it feels like play.
            </p>
            <ClassroomModes />
          </CollapsibleSection>
        </div>

        {/* Footer Info */}
        <div className="text-center text-zinc-600 text-xs px-4 pb-4 space-y-3">
          <p className="flex items-center justify-center gap-2">
            <Database
              className={`w-3 h-3 ${persistenceActive ? "text-green-400" : "text-yellow-400"}`}
            />
            {persistenceSupported
              ? persistenceActive
                ? "Autosave active"
                : "Autosave paused"
              : "Session-only mode"}
          </p>
          <div className="max-w-sm mx-auto space-y-1 pt-2 border-t border-slate-800/60">
            <p className="text-zinc-700 leading-relaxed">
              Built with care by Blue Snake Studios. Privacy-first,
              offline-first, kid-safe â€” always. No ads, no tracking, no data
              harvesting.
            </p>
            <p className="text-zinc-800 leading-relaxed">
              We&apos;re building toward a world where digital companions teach
              real science, honour real privacy, and grow with the people who
              care for them.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Certificate Modal */}
      <RegistrationCertificate
        petId={currentPetId ?? PET_ID}
        petName={petName || "Unnamed Companion"}
        crest={crest}
        heptaCode={heptaCode}
        createdAt={createdAt ?? undefined}
        evolutionState={evolution?.state}
        isOpen={certificateOpen}
        onClose={() => setCertificateOpen(false)}
      />

      {/* Wellness Modals */}
      <WellnessSync
        isOpen={wellnessSyncOpen}
        onClose={() => setWellnessSyncOpen(false)}
        lastAction={lastWellnessAction}
      />
      <HydrationTracker
        isOpen={hydrationOpen}
        onClose={() => setHydrationOpen(false)}
      />
      <SleepTracker isOpen={sleepOpen} onClose={() => setSleepOpen(false)} />
      <AnxietyAnchor
        isOpen={anxietyOpen}
        onClose={() => setAnxietyOpen(false)}
      />
      <WellnessSettings
        isOpen={wellnessSettingsOpen}
        onClose={() => setWellnessSettingsOpen(false)}
      />
    </AmbientBackground>
  );
}
