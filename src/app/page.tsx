'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { ChangeEvent } from 'react';

import { useStore } from '@/lib/store';
import type { PetType, RewardSource } from '@metapet/core/store';
import { PetHero } from '@/components/PetHero';
import { CompactVitalsBar } from '@/components/CompactVitalsBar';
import { FloatingActions } from '@/components/FloatingActions';
import { AmbientBackground } from '@/components/AmbientBackground';
import { AmbientParticles } from '@/components/AmbientParticles';
import { TraitPanel } from '@/components/TraitPanel';
import { Button } from '@/components/ui/button';
import { mintPrimeTailId, getDeviceHmacKey } from '@/lib/identity/crest';
import { heptaEncode42, playHepta } from '@/lib/identity/hepta';
import { encodeGenome, decodeGenome, hashGenome, type Genome, type GenomeHash } from '@/lib/genome';
import type { PrimeTailID, HeptaDigits, Rotation, Vault } from '@/lib/identity/types';
import {
  savePet,
  loadPet,
  getAllPets,
  deletePet,
  setupAutoSave,
  exportPetToJSON,
  importPetFromJSON,
  type PetSaveData,
} from '@/lib/persistence/indexeddb';
import {
  breedPets,
  predictOffspring,
  calculateSimilarity,
  canBreed,
  type BreedingResult,
} from '@/lib/breeding';
import { EvolutionPanel } from '@/components/EvolutionPanel';
import { FeaturesDashboard } from '@/components/FeaturesDashboard';
import { initializeEvolution } from '@/lib/evolution';
import {
  createDefaultBattleStats,
  createDefaultMiniGameProgress,
  createDefaultVimanaState,
} from '@/lib/progression/types';
import { createDefaultRitualProgress } from '@/lib/ritual/types';
import { DEFAULT_VITALS } from '@/vitals';
import { createWitnessRecord } from '@/lib/witness';
import {
  Sparkles,
  Shield,
  Hash,
  Dna,
  Database,
  Volume2,
  Download,
  Upload,
  Plus,
  Trash2,
  Baby,
  FlaskConical,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  GraduationCap,
  Lock,
  Orbit,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PetResponseOverlay } from '@/components/PetResponseOverlay';
import { DigitalKeyPanel } from '@/components/DigitalKeyPanel';
import RitualLoop from '@/components/RitualLoop';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { HeptaTag } from '@/components/HeptaTag';
import { SeedOfLifeGlyph } from '@/components/SeedOfLifeGlyph';
import { AchievementShelf } from '@/components/AchievementShelf';
import { QRQuickPanel } from '@/components/QRMessaging';
import { RegistrationCertificate, CertificateButton } from '@/components/RegistrationCertificate';
import { WellnessSync, QuickMoodButton } from '@/components/WellnessSync';
import { HydrationTracker, HydrationQuickButton } from '@/components/HydrationTracker';
import { SleepTracker, SleepStatusButton } from '@/components/SleepTracker';
import { AnxietyAnchor, EmergencyGroundingButton } from '@/components/AnxietyAnchor';
import { WellnessSettings, WellnessSettingsButton } from '@/components/WellnessSettings';
import { ClassroomModes } from '@/components/ClassroomModes';
import { ClassroomManager } from '@/components/ClassroomManager';
import { EducationQueuePanel } from '@/components/EducationQueuePanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useWellnessStore } from '@/lib/wellness';
import { useEducationStore } from '@/lib/education';
import { useLocale, LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';

interface PetSummary {
  id: string;
  name?: string;
  createdAt: number;
  lastSaved: number;
}

const DNA_CHARS = ['A', 'C', 'G', 'T'] as const;

function randomDNA(length: number): string {
  const values = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i++) {
      values[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(values, value => DNA_CHARS[value % DNA_CHARS.length]).join('');
}

function randomTail(): [number, number, number, number] {
  const values = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i++) {
      values[i] = Math.floor(Math.random() * 256);
    }
  }
  return [values[0] % 60, values[1] % 60, values[2] % 60, values[3] % 60];
}

function slugify(value: string | undefined, fallback: string): string {
  const base = value && value.trim() !== '' ? value.trim().toLowerCase() : fallback;
  return base
    .replace(/[^a-z0-9\-\s]/g, '')
    .replace(/\s+/g, '-');
}

function createDebouncedSave(delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let latest: PetSaveData | null = null;
  let pending: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];

  const flush = async () => {
    const snapshot = latest;
    const listeners = pending;
    pending = [];
    latest = null;

    if (!snapshot) {
      listeners.forEach(listener => listener.resolve());
      return;
    }

    try {
      await savePet(snapshot);
      listeners.forEach(listener => listener.resolve());
    } catch (error) {
      listeners.forEach(listener => listener.reject(error));
      throw error;
    }
  };

  return (data: PetSaveData) =>
    new Promise<void>((resolve, reject) => {
      latest = data;
      pending.push({ resolve, reject });

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        timeout = null;
        flush().catch(err => {
          console.warn('Debounced save flush failed:', err);
        });
      }, delay);
    });
}

const PET_ID = 'metapet-primary';
const SESSION_ANALYTICS_KEY = 'metapet-analytics';

type SessionGoal = 'Calm' | 'Focus' | 'Recovery' | 'Creative';
type AlchemyBase = 'vitality' | 'focus' | 'harmony';
type AlchemyCatalyst = 'sunpetal' | 'moondew' | 'stardust';

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
  vitality: 'Vitality Essence',
  focus: 'Focus Infusion',
  harmony: 'Harmony Tonic',
};

const ALCHEMY_CATALYST_LABELS: Record<AlchemyCatalyst, string> = {
  sunpetal: 'Sunpetal',
  moondew: 'Moondew',
  stardust: 'Stardust',
};

const ALCHEMY_CATALYST_EFFECTS: Record<AlchemyCatalyst, string> = {
  sunpetal: 'warms the core and boosts mood stability',
  moondew: 'settles the aura and improves recovery',
  stardust: 'sharpens attention and amplifies curiosity',
};

interface GeometrySessionProfile {
  goal: SessionGoal;
  intensity: number | null;
  dna: 'fire' | 'water' | 'earth';
  harmony: number;
  awareness: number;
  tempo: number;
  mode: 'helix' | 'mandala' | 'particles' | 'temple';
  lockFirstRun: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function encodeSessionProfile(profile: GeometrySessionProfile): string {
  const json = JSON.stringify(profile);
  if (typeof window === 'undefined') return '';
  return window.btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createBrewResult(recipe: AlchemyRecipe, resonanceIndex: number, evolutionStage: string): BrewResult {
  const stageBonus = evolutionStage === 'COSMIC' ? 12 : evolutionStage === 'ELDER' ? 8 : evolutionStage === 'ADULT' ? 4 : 0;
  const potency = clamp(Math.round(resonanceIndex * 0.65 + stageBonus + Math.random() * 12), 20, 100);
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

  const completedCount = eduProgress.filter((p) => p.status === 'completed').length;
  const standards = eduQueue.flatMap((l) => l.standardsRef).filter(Boolean);

  if (eduQueue.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
        <p className="text-xs font-semibold text-zinc-200">Lesson objectives</p>
        <ul className="mt-2 space-y-2 text-xs text-zinc-300">
          {[
            'Define success criteria for an iterative prototype.',
            'Collect and interpret feedback to refine a design.',
            'Communicate findings with evidence-based reflection.',
          ].map(objective => (
            <li key={objective} className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 text-zinc-500" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-zinc-500">
          Add lessons to the queue in the Classroom Manager to see your lesson path here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-200">Queue Progress</p>
          <p className="text-xs text-emerald-300">
            {completedCount} of {eduQueue.length} lessons completed
          </p>
        </div>
        {standards.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] text-emerald-200/70 uppercase tracking-wide">Standards</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {[...new Set(standards)].map((s) => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <EducationQueuePanel mode="student" onLessonActivate={activateLesson} />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const startTick = useStore(s => s.startTick);
  const stopTick = useStore(s => s.stopTick);
  const setGenome = useStore(s => s.setGenome);
  const hydrate = useStore(s => s.hydrate);
  const petType = useStore(s => s.petType);
  const setPetType = useStore(s => s.setPetType);
  const genome = useStore(s => s.genome);
  const traits = useStore(s => s.traits);
  const feed = useStore(s => s.feed);
  const evolution = useStore(s => s.evolution);
  const ritualProgress = useStore(s => s.ritualProgress);
  const addRitualRewards = useStore(s => s.addRitualRewards);
  const [crest, setCrest] = useState<PrimeTailID | null>(null);
  const [heptaCode, setHeptaCode] = useState<HeptaDigits | null>(null);
  const [loading, setLoading] = useState(true);
  const [genomeHash, setGenomeHash] = useState<GenomeHash | null>(null);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [learningMode, setLearningMode] = useState<'sandbox' | 'curriculum'>('sandbox');
  const [persistenceActive, setPersistenceActive] = useState(false);
  const [persistenceSupported, setPersistenceSupported] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [petSummaries, setPetSummaries] = useState<PetSummary[]>([]);
  const [currentPetId, setCurrentPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [breedingMode, setBreedingMode] = useState<'BALANCED' | 'DOMINANT' | 'MUTATION'>('BALANCED');
  const [breedingPartnerId, setBreedingPartnerId] = useState('');
  const [breedingPreview, setBreedingPreview] = useState<{
    possibleTraits: string[];
    confidence: number;
    similarity: number;
    partnerName?: string;
    partnerStage?: string;
  } | null>(null);
  const [breedingResult, setBreedingResult] = useState<BreedingResult | null>(null);
  const [breedingPartner, setBreedingPartner] = useState<PetSaveData | null>(null);
  const [offspringSummary, setOffspringSummary] = useState<PetSummary | null>(null);
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
  const [sessionSheetOpen, setSessionSheetOpen] = useState(false);
  const [sessionGoal, setSessionGoal] = useState<SessionGoal>('Calm');
  const [sessionIntensityEnabled, setSessionIntensityEnabled] = useState(false);
  const [sessionIntensity, setSessionIntensity] = useState(55);
  const [alchemyRecipe, setAlchemyRecipe] = useState<AlchemyRecipe>({ base: 'vitality', catalyst: 'sunpetal' });
  const [latestBrew, setLatestBrew] = useState<BrewResult | null>(null);
  const [brewHistory, setBrewHistory] = useState<BrewResult[]>([]);
  const [brewCooldownUntil, setBrewCooldownUntil] = useState(0);
  const { locale, setLocale, strings } = useLocale();

  const deriveGeometrySessionProfile = useCallback((): GeometrySessionProfile | null => {
    if (!traits) {
      return null;
    }

    const personalityFire = traits.personality.energy + traits.personality.playfulness + traits.personality.curiosity;
    const personalityWater = traits.personality.social + traits.personality.affection + traits.personality.loyalty;
    const personalityEarth = traits.personality.discipline + traits.latent.potential.physical;
    const dnaScores = { fire: personalityFire, water: personalityWater, earth: personalityEarth };
    const dna = (Object.entries(dnaScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'fire') as
      | 'fire'
      | 'water'
      | 'earth';

    const goalBias: Record<SessionGoal, { awareness: number; tempo: number; harmony: number; mode: GeometrySessionProfile['mode'] }> = {
      Calm: { awareness: 20, tempo: -24, harmony: 2, mode: 'mandala' },
      Focus: { awareness: 8, tempo: -8, harmony: 0, mode: 'helix' },
      Recovery: { awareness: 14, tempo: -18, harmony: 3, mode: 'particles' },
      Creative: { awareness: -4, tempo: 14, harmony: -1, mode: 'temple' },
    };

    const intensity = sessionIntensityEnabled ? sessionIntensity : null;
    const intensityFactor = intensity === null ? 0 : (intensity - 50) / 50;
    const bias = goalBias[sessionGoal];
    const baseHarmony = 5 + Math.round((traits.elementWeb.bridgeCount / 10) * 4);
    const harmony = clamp(baseHarmony + bias.harmony + Math.round(intensityFactor * 2), 3, 12);
    const awareness = clamp(
      Math.round((traits.personality.curiosity + traits.personality.affection) / 2 + bias.awareness + intensityFactor * 20),
      0,
      100,
    );
    const tempo = clamp(
      Math.round((traits.personality.energy * 0.9 + traits.personality.playfulness * 0.6) + 65 + bias.tempo + intensityFactor * 22),
      60,
      180,
    );

    return {
      goal: sessionGoal,
      intensity,
      dna,
      harmony,
      awareness,
      tempo,
      mode: bias.mode,
      lockFirstRun: true,
    };
  }, [sessionGoal, sessionIntensity, sessionIntensityEnabled, traits]);

  const launchGeometrySession = useCallback(() => {
    const profile = deriveGeometrySessionProfile();
    if (!profile) {
      router.push('/geometry-sound');
      return;
    }
    const encoded = encodeSessionProfile(profile);
    setSessionSheetOpen(false);
    router.push(`/geometry-sound?session=${encodeURIComponent(encoded)}`);
  }, [deriveGeometrySessionProfile, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('metapet-low-bandwidth');
    if (stored === 'true') setLowBandwidthMode(true);
  }, []);

  const handleLowBandwidthToggle = (next: boolean) => {
    setLowBandwidthMode(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metapet-low-bandwidth', String(next));
    }
  };

  const handleBrewElixir = () => {
    if (brewCooldownSeconds > 0) return;

    const result = createBrewResult(alchemyRecipe, resonanceIndex, evolution.state);
    setLatestBrew(result);
    setBrewHistory(prev => [result, ...prev].slice(0, 5));
    setBrewCooldownUntil(Date.now() + 8_000);

    feed();
    setLastWellnessAction('feed');
  };

  const [lastWellnessAction, setLastWellnessAction] = useState<'feed' | 'clean' | 'play' | 'sleep' | null>(null);
  const wellnessSetupCompleted = useWellnessStore(state => state.setupCompletedAt);
  const checkStreaks = useWellnessStore(state => state.checkStreaks);

  const elementProfile = useMemo(() => {
    if (!traits) return 'fire';
    const weighted = {
      fire: traits.elementWeb.frontierAffinity,
      water: traits.elementWeb.bridgeCount * 10,
      earth: traits.elementWeb.voidDrift * 10,
    };
    return (Object.entries(weighted).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'fire') as 'fire' | 'water' | 'earth';
  }, [traits]);

  const resonanceIndex = useMemo(() => {
    if (!traits) return 60;
    const blend = (
      traits.personality.energy +
      traits.personality.curiosity +
      traits.personality.playfulness +
      traits.elementWeb.frontierAffinity
    ) / 4;
    return Math.max(0, Math.min(100, Math.round(blend)));
  }, [traits]);

  const geometrySoundHref = useMemo(() => {
    const params = new URLSearchParams({
      petId: currentPetId ?? PET_ID,
      petName: petName.trim() || 'Meta Pet',
      petType,
      seed: genomeHash?.redHash?.slice(0, 24) ?? 'origin-seed',
      elementProfile,
      resonanceIndex: String(resonanceIndex),
    });
    return `/geometry-sound?${params.toString()}`;
  }, [currentPetId, petName, petType, genomeHash, elementProfile, resonanceIndex]);

  const brewCooldownSeconds = Math.max(0, Math.ceil((brewCooldownUntil - Date.now()) / 1000));

  const debouncedSave = useMemo(() => createDebouncedSave(1_000), []);

  const crestRef = useRef<PrimeTailID | null>(null);
  const heptaRef = useRef<HeptaDigits | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  // Check wellness streaks on mount
  useEffect(() => {
    checkStreaks();
  }, [checkStreaks]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const recordSessionDuration = (startTime: number, endTime: number) => {
      const durationMs = Math.max(0, endTime - startTime);

      try {
        const stored = window.localStorage.getItem(SESSION_ANALYTICS_KEY);
        const parsed = stored ? (JSON.parse(stored) as { sessions?: Array<Record<string, number>> }) : {};
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
        console.warn('Failed to persist session analytics:', error);
      }
    };

    const startTime = Date.now();
    sessionStartRef.current = startTime;
    console.info('session_start', { timestamp: startTime });

    const handleSessionEnd = () => {
      const endTime = Date.now();
      const sessionStart = sessionStartRef.current ?? endTime;
      console.info('session_end', { timestamp: endTime, durationMs: endTime - sessionStart });
      recordSessionDuration(sessionStart, endTime);
    };

    window.addEventListener('pagehide', handleSessionEnd);

    return () => {
      window.removeEventListener('pagehide', handleSessionEnd);
      handleSessionEnd();
    };
  }, []);
  const genomeHashRef = useRef<GenomeHash | null>(null);
  const createdAtRef = useRef<number | null>(null);
  const petIdRef = useRef<string | null>(null);
  const petNameRef = useRef<string>('');
  const hmacKeyRef = useRef<CryptoKey | null>(null);
  const persistenceSupportedRef = useRef(false);
  const autoSaveCleanupRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const genomeToDna = useCallback((value: Genome): string => {
    const alphabet = ['A', 'C', 'G', 'T'];
    const flatten = [...value.red60, ...value.blue60, ...value.black60];
    return flatten
      .map(gene => {
        const safe = Number.isFinite(gene) ? Math.abs(Math.round(gene)) : 0;
        return alphabet[safe % alphabet.length];
      })
      .join('');
  }, []);

  const deriveTailFromLineage = useCallback((seed: string): [number, number, number, number] => {
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
  }, []);

  const buildOffspringName = useCallback(
    (lineageKey: string, partnerName?: string | null) => {
      const left = (petNameRef.current || 'ORIGIN').slice(0, 4).toUpperCase();
      const right = (partnerName && partnerName.trim() !== '' ? partnerName : 'ALLY')
        .slice(0, 4)
        .toUpperCase();
      return `${left}-${right}-${lineageKey.slice(0, 4).toUpperCase()}`;
    },
    []
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
    };
  }, []);

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
        console.warn('Failed to load partner pet for breeding preview:', error);
        if (!cancelled) {
          setBreedingPartner(null);
          setBreedingPreview(null);
          setBreedingError('Unable to load partner data for breeding.');
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
      throw new Error('No active pet id');
    }
    if (!state.genome || !state.traits) {
      throw new Error('Genome not initialized');
    }
    if (!crestRef.current || !heptaRef.current || !genomeHashRef.current) {
      throw new Error('Identity not initialized');
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
      achievements: state.achievements.map(entry => ({ ...entry })),
      battle: { ...state.battle },
      miniGames: { ...state.miniGames },
      vimana: {
        ...state.vimana,
        cells: state.vimana.cells.map(cell => ({ ...cell })),
      },
      crest: crestRef.current,
      heptaDigits: Array.from(heptaRef.current) as HeptaDigits,
      createdAt: createdAtRef.current ?? Date.now(),
      lastSaved: Date.now(),
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof indexedDB === 'undefined') return;

    const handleBeforeUnload = () => {
      try {
        const state = useStore.getState();
        if (!state.genome || !state.traits) return;
        if (!crestRef.current || !heptaRef.current || !genomeHashRef.current) return;

        const snapshot: PetSaveData = {
          id: PET_ID,
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
          achievements: state.achievements.map(entry => ({ ...entry })),
          battle: { ...state.battle },
          miniGames: { ...state.miniGames },
          vimana: {
            ...state.vimana,
            cells: state.vimana.cells.map(cell => ({ ...cell })),
          },
          crest: crestRef.current,
          heptaDigits: Array.from(heptaRef.current) as HeptaDigits,
          lastSaved: Date.now(),
          createdAt: createdAtRef.current ?? Date.now(),
        };

        void savePet(snapshot);
      } catch (error) {
        console.warn('Failed to persist pet on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [buildSnapshot]);

  const refreshPetSummaries = useCallback(async () => {
    if (!persistenceSupportedRef.current) {
      setPetSummaries([]);
      return;
    }

    try {
      const pets = await getAllPets();
      const summaries = pets
        .map<PetSummary>(pet => ({
          id: pet.id,
          name: pet.name,
          createdAt: pet.createdAt,
          lastSaved: pet.lastSaved,
        }))
        .sort((a, b) => b.lastSaved - a.lastSaved);
      setPetSummaries(summaries);
    } catch (error) {
      console.warn('Failed to load pet archive list:', error);
      setPetSummaries([]);
    }
  }, []);

  const applyPetData = useCallback((pet: PetSaveData) => {
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
      achievements: pet.achievements?.map(entry => ({ ...entry })) ?? [],
      battle: pet.battle ? { ...pet.battle } : createDefaultBattleStats(),
      miniGames: pet.miniGames ? { ...pet.miniGames } : createDefaultMiniGameProgress(),
      vimana: pet.vimana
        ? {
            ...pet.vimana,
            cells: pet.vimana.cells.map(cell => ({ ...cell })),
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
    setPetName(pet.name ?? '');
    setCurrentPetId(pet.id);

    crestRef.current = pet.crest;
    heptaRef.current = digits;
    genomeHashRef.current = pet.genomeHash;
    createdAtRef.current = pet.createdAt;
    petIdRef.current = pet.id;
    petNameRef.current = pet.name?.trim() ?? '';
  }, [hydrate]);

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
      const cleanup = setupAutoSave(() => buildSnapshot(), 60_000, debouncedSave);
      autoSaveCleanupRef.current = cleanup;
      setPersistenceActive(true);
    } catch (error) {
      console.warn('Failed to start autosave:', error);
      setPersistenceActive(false);
    }
  }, [buildSnapshot, debouncedSave]);

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
    const rotation = Math.random() > 0.5 ? 'CW' : 'CCW';

    const genome = await encodeGenome(primeDNA, tailDNA);
    const traits = decodeGenome(genome);
    const genomeHashValue = await hashGenome(genome);

    const crestValue = await mintPrimeTailId({
      dna: primeDNA,
      vault: 'blue',
      rotation,
      tail,
      hmacKey,
    });

    const minutes = Math.floor(Date.now() / 60000) % 8192;
    const heptaDigits = await heptaEncode42(
      {
        version: 1,
        preset: 'standard',
        vault: crestValue.vault,
        rotation: crestValue.rotation,
        tail,
        epoch13: minutes,
        nonce14: Math.floor(Math.random() * 16384),
      },
      hmacKey
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
      petType: 'geometric',
      mirrorMode: {
        phase: 'idle',
        startedAt: null,
        consentExpiresAt: null,
        preset: null,
        presenceToken: null,
        lastReflection: null,
      },
      witness,
      petOntology: 'living',
      systemState: 'active',
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
    async (result: BreedingResult, partnerName?: string | null): Promise<PetSaveData> => {
      if (!result.offspring) {
        throw new Error('Missing offspring genome');
      }

      const hmacKey = await getDeviceHmacKey();
      const tail = deriveTailFromLineage(result.lineageKey);
      const rotation: Rotation = result.lineageKey.charCodeAt(0) % 2 === 0 ? 'CW' : 'CCW';
      const vault: Vault = crestRef.current?.vault ?? 'blue';
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
          preset: 'standard',
          vault: crestValue.vault,
          rotation: crestValue.rotation,
          tail,
          epoch13: minutes,
          nonce14: Math.floor(Math.random() * 16384),
        },
        hmacKey
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
          hunger: 40,
          hygiene: 70,
          mood: 70,
          energy: 75,
        },
        petType: 'geometric',
        mirrorMode: {
          phase: 'idle',
          startedAt: null,
          consentExpiresAt: null,
          preset: null,
          presenceToken: null,
          lastReflection: null,
        },
        witness,
        petOntology: 'living',
        systemState: 'active',
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
    [buildOffspringName, deriveTailFromLineage, genomeToDna]
  );

  const handleBreedWithPartner = useCallback(async () => {
    setBreedingError(null);
    setBreedingResult(null);
    setOffspringSummary(null);

    if (!persistenceSupportedRef.current) {
      setBreedingError('Breeding requires offline archives so offspring can be saved.');
      return;
    }

    if (!genome || !traits || !evolution) {
      setBreedingError('Active companion is not initialized. Try loading or creating a pet first.');
      return;
    }

    if (!breedingPartner || !breedingPartnerId) {
      setBreedingError('Select a partner from your saved companions to begin breeding.');
      return;
    }

    if (!canBreed(evolution.state, breedingPartner.evolution.state)) {
      setBreedingError('Both companions must reach SPECIATION before they can breed.');
      return;
    }

    setBreedingBusy(true);

    try {
      const result = breedPets(genome, breedingPartner.genome, breedingMode);
      const offspring = await createOffspringFromResult(result, breedingPartner.name);
      await savePet(offspring);
      await refreshPetSummaries();

      setBreedingResult(result);
      setOffspringSummary({
        id: offspring.id,
        name: offspring.name,
        createdAt: offspring.createdAt,
        lastSaved: offspring.lastSaved,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Breeding attempt failed. Please try again.';
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
    refreshPetSummaries,
    traits,
  ]);

  const initializeIdentity = useCallback(async () => {
    try {
      const hmacKey = await getDeviceHmacKey();
      hmacKeyRef.current = hmacKey;

      const supported = typeof indexedDB !== 'undefined';
      persistenceSupportedRef.current = supported;
      setPersistenceSupported(supported);

      let activePet: PetSaveData | null = null;

      if (supported) {
        try {
          const pets = await getAllPets();
          const sorted = [...pets].sort((a, b) => b.lastSaved - a.lastSaved);
          if (sorted.length > 0) {
            activePet = sorted[0];
          }
          const summaries = sorted.map<PetSummary>(pet => ({
            id: pet.id,
            name: pet.name,
            createdAt: pet.createdAt,
            lastSaved: pet.lastSaved,
          }));
          setPetSummaries(summaries);
        } catch (error) {
          console.warn('Failed to load existing pet save:', error);
          setPetSummaries([]);
        }
      }

      if (!activePet) {
        const freshPet = await createFreshPet();
        activePet = freshPet;
        if (supported) {
          try {
            await savePet(freshPet);
          } catch (error) {
            console.warn('Failed to persist initial pet snapshot:', error);
          }
        }
      }

      if (activePet) {
        applyPetData(activePet);
      }

      if (supported) {
        await refreshPetSummaries();
        activateAutoSave();
      } else {
        setPersistenceActive(false);
      }
    } catch (error) {
      console.error('Identity init failed:', error);
      setPersistenceActive(false);
      setPetSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [activateAutoSave, applyPetData, createFreshPet, refreshPetSummaries]);

  const handlePlayHepta = useCallback(async () => {
    if (!heptaCode) return;

    try {
      setAudioError(null);
      await playHepta(heptaCode);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Audio unavailable - click to enable';
      setAudioError(message);
      console.warn('Audio playback failed:', error);
    }
  }, [heptaCode]);

  const handleNameBlur = useCallback(async () => {
    if (!persistenceSupportedRef.current || !currentPetId) return;

    try {
      const snapshot = buildSnapshot();
      snapshot.name = petName.trim() ? petName.trim() : undefined;
      await savePet(snapshot);
      await refreshPetSummaries();
    } catch (error) {
      console.warn('Failed to save pet name:', error);
    }
  }, [buildSnapshot, currentPetId, petName, refreshPetSummaries]);

  const handleCreateNewPet = useCallback(async () => {
    try {
      const newPet = await createFreshPet();
      let petToApply: PetSaveData = newPet;

      if (persistenceSupportedRef.current) {
        try {
          await savePet(newPet);
          const stored = await loadPet(newPet.id);
          if (stored) {
            petToApply = stored;
          }
          await refreshPetSummaries();
        } catch (error) {
          console.warn('Failed to store new pet:', error);
        }
        activateAutoSave();
      } else {
        setPersistenceActive(false);
      }

      applyPetData(petToApply);
      setImportError(null);
    } catch (error) {
      console.error('Failed to create new pet:', error);
    }
  }, [activateAutoSave, applyPetData, createFreshPet, refreshPetSummaries]);

  const handleSelectPet = useCallback(async (id: string) => {
    if (id === currentPetId) return;
    try {
      const pet = await loadPet(id);
      if (!pet) return;
      applyPetData(pet);
      if (persistenceSupportedRef.current) {
        activateAutoSave();
      }
      setImportError(null);
    } catch (error) {
      console.error('Failed to load pet:', error);
    }
  }, [activateAutoSave, applyPetData, currentPetId]);

  const handleExportPet = useCallback(async (id: string) => {
    try {
      const pet = await loadPet(id);
      if (!pet) return;

      const json = exportPetToJSON(pet);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const nameSlug = slugify(pet.name, 'meta-pet');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${nameSlug}-${id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export pet archive:', error);
    }
  }, []);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const imported = importPetFromJSON(text);
      await savePet(imported);
      const stored = await loadPet(imported.id);
      const petToApply = stored ?? imported;
      applyPetData(petToApply);
      await refreshPetSummaries();
      if (persistenceSupportedRef.current) {
        activateAutoSave();
      }
      setImportError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      setImportError(message);
      console.error('Failed to import pet archive:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [activateAutoSave, applyPetData, refreshPetSummaries]);

  const handleDeletePet = useCallback(async (id: string) => {
    if (!persistenceSupportedRef.current) return;
    if (!window.confirm('Archive this companion from local archives? A trace will remain.')) return;

    try {
      await deletePet(id);
      await refreshPetSummaries();
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
            await refreshPetSummaries();
          } catch (error) {
            console.warn('Failed to persist replacement pet:', error);
          }
          applyPetData(petToApply);
          activateAutoSave();
        }
      }
      setImportError(null);
    } catch (error) {
      console.error('Failed to archive pet:', error);
    }
  }, [activateAutoSave, applyPetData, createFreshPet, currentPetId, refreshPetSummaries]);

  useEffect(() => {
    startTick();
    void initializeIdentity();

    return () => {
      stopTick();
    };
  }, [initializeIdentity, startTick, stopTick]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce" aria-hidden>
            <Sparkles className="w-12 h-12 text-cyan-400 mx-auto" />
          </div>
          <div className="space-y-1">
            <p className="text-white font-semibold">Initializing Meta-Pet...</p>
            <p className="text-zinc-400 text-sm">Generating genome sequence</p>
          </div>
        </div>
      </div>
    );
  }

  const handleImportInput = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (file) {
      void handleImportFile(file);
    }
  };

  const canBreedNow = Boolean(
    genome && breedingPartner && evolution && canBreed(evolution.state, breedingPartner.evolution.state)
  );
  const isBreedingDisabled = !canBreedNow || breedingBusy;
  const breedingHint = (() => {
    if (!isBreedingDisabled) return null;
    if (breedingBusy) return 'Prerequisite: wait for the current breeding cycle to finish.';
    if (!breedingPartner) return 'Prerequisite: select a companion from the archives to breed.';
    if (!evolution) return 'Prerequisite: load your active companion to continue.';
    if (evolution.state !== 'SPECIATION') {
      return 'Prerequisite: reach SPECIATION stage with your active companion.';
    }
    if (breedingPartner.evolution.state !== 'SPECIATION') {
      return 'Prerequisite: your partner must reach SPECIATION stage.';
    }
    return 'Prerequisite: meet all breeding requirements to unlock this.';
  })();
  const mintDisabled = !persistenceSupported && petSummaries.length > 0;
  const mintHint = mintDisabled
    ? 'Prerequisite: enable IndexedDB persistence to mint additional companions.'
    : null;
  const importDisabled = !persistenceSupported;
  const importHint = importDisabled
    ? 'Prerequisite: enable IndexedDB persistence to import archived companions.'
    : null;

  return (
    <AmbientBackground>
      {/* Ambient Particles */}
      <AmbientParticles enabled={!lowBandwidthMode} />

      {/* Onboarding Tutorial for new users */}
      <OnboardingTutorial />

      {/* Real-time Response Overlay */}
      <PetResponseOverlay enableAudio={true} enableAnticipation={true} />

      <div className="min-h-screen pb-24">
        {/* ===== HERO SECTION: PET AT TOP ===== */}
        <div className="pt-6 pb-2">
          {/* Pet Name & Type Toggle */}
          <div className="text-center px-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <label htmlFor="pet-name" className="sr-only">
                {strings.core.nameLabel}
              </label>
              <input
                id="pet-name"
                type="text"
                value={petName}
                onChange={event => setPetName(event.target.value)}
                onBlur={() => void handleNameBlur()}
                placeholder={strings.core.namePlaceholder}
                className="w-full max-w-[280px] text-2xl font-bold text-center bg-transparent border-none text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:max-w-[360px] md:max-w-[420px]"
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={petType === 'geometric' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPetType('geometric')}
                className="text-xs h-7 touch-manipulation"
                aria-pressed={petType === 'geometric'}
              >
                {strings.core.petType.geometric}
              </Button>
              <Button
                variant={petType === 'auralia' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPetType('auralia')}
                className="text-xs h-7 touch-manipulation"
                aria-pressed={petType === 'auralia'}
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
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4 px-4">
            <QuickMoodButton onClick={() => setWellnessSyncOpen(true)} />
            <HydrationQuickButton onClick={() => setHydrationOpen(true)} />
            <SleepStatusButton onClick={() => setSleepOpen(true)} />
            <EmergencyGroundingButton onClick={() => setAnxietyOpen(true)} />
            <WellnessSettingsButton onClick={() => setWellnessSettingsOpen(true)} />
          </div>
        </div>

        {/* ===== VITALS BAR ===== */}
        <CompactVitalsBar />

        {/* ===== CONTENT SECTIONS ===== */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* Ritual Loop - Important, keep expanded */}
          <div id="ritual">
            <RitualLoop
              petId={currentPetId ?? PET_ID}
              initialProgress={ritualProgress}
              onRitualComplete={data => {
                addRitualRewards({
                  resonanceDelta: data.resonance,
                  reward: {
                    essenceDelta: data.nectar,
                    source: 'ritual',
                  },
                  progress: data.progress,
                });
              }}
              jewbleDigits={
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
            <EvolutionPanel />
          </CollapsibleSection>

          {/* Mini Games */}
          <div id="mini-games">
            <CollapsibleSection
              title={strings.sections.miniGames}
              icon={<Sparkles className="w-5 h-5 text-pink-400" />}
              defaultOpen
            >
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
                  <p className="text-sm font-semibold text-white">Teacher toggle</p>
                  <p className="text-xs text-zinc-400">
                    Switch between free-form sandbox exploration and guided curriculum delivery.
                  </p>
                </div>
                <label className="flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
                  <span>{learningMode === 'curriculum' ? 'Curriculum' : 'Sandbox'}</span>
                  <input
                    type="checkbox"
                    checked={learningMode === 'curriculum'}
                    onChange={() =>
                      setLearningMode(prevMode => (prevMode === 'sandbox' ? 'curriculum' : 'sandbox'))
                    }
                    className="relative h-6 w-11 appearance-none rounded-full border border-slate-700 bg-slate-900/70 transition before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white/80 before:transition checked:border-emerald-400 checked:bg-emerald-500/80 checked:before:translate-x-5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className={`space-y-3 rounded-xl border p-4 transition ${
                    learningMode === 'sandbox'
                      ? 'border-cyan-400/60 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span className="text-sm font-semibold text-white">Free-form sandbox mode</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Open exploration with flexible tools, creative prompts, and student-led discovery.
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li>• Rapid prototyping and experimentation</li>
                    <li>• Optional scaffolds and hints on demand</li>
                    <li>• Peer collaboration and reflection notes</li>
                  </ul>
                </div>

                <div
                  className={`space-y-3 rounded-xl border p-4 transition ${
                    learningMode === 'curriculum'
                      ? 'border-emerald-400/60 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-semibold text-white">Guided curriculum mode</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Standards-aligned sequence with checkpoints, pacing guidance, and teacher visibility.
                  </p>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-xs font-semibold text-emerald-200">Standards mapping</p>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                      <li>• NGSS: MS-ETS1-1, MS-ETS1-4</li>
                      <li>• ISTE: 1.1 Empowered Learner, 1.4 Innovative Designer</li>
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
              {/* Breeding Mode Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wide text-zinc-500">Breeding Mode</label>
                <div className="flex flex-wrap gap-2">
                  {(['BALANCED', 'DOMINANT', 'MUTATION'] as const).map(mode => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={breedingMode === mode ? 'default' : 'outline'}
                      onClick={() => setBreedingMode(mode)}
                      className={`touch-manipulation ${breedingMode === mode ? 'bg-pink-600 hover:bg-pink-700' : 'border-slate-700'}`}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  {breedingMode === 'BALANCED' && 'Equal mix of both parents\' traits'}
                  {breedingMode === 'DOMINANT' && 'Stronger traits take priority'}
                  {breedingMode === 'MUTATION' && 'Higher chance of unique mutations'}
                </p>
              </div>

              {/* Partner Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wide text-zinc-500">Select Partner</label>
                <select
                  value={breedingPartnerId}
                  onChange={event => setBreedingPartnerId(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500 touch-manipulation"
                >
                  <option value="">Choose a companion...</option>
                  {petSummaries
                    .filter(s => s.id !== currentPetId)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name && s.name.trim() !== '' ? s.name : `Companion ${s.id.slice(0, 8)}`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Breeding Preview */}
              {breedingPreview && (
                <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-pink-400" />
                    <span className="text-sm font-semibold text-pink-200">Compatibility Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-400">Partner:</span>
                      <span className="ml-2 text-white">{breedingPreview.partnerName || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Stage:</span>
                      <span className="ml-2 text-cyan-400">{breedingPreview.partnerStage}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Genetic Similarity:</span>
                      <span className="ml-2 text-purple-400">{(breedingPreview.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Confidence:</span>
                      <span className="ml-2 text-green-400">{(breedingPreview.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Possible Traits:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {breedingPreview.possibleTraits.slice(0, 6).map(trait => (
                        <span key={trait} className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-zinc-300">
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
                {breedingBusy ? 'Breeding...' : 'Breed Companions'}
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
                    <span className="text-sm font-semibold text-green-200">New Offspring!</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-zinc-400">Name:</span>
                      <span className="ml-2 text-white">{offspringSummary.name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Lineage Key:</span>
                      <span className="ml-2 text-purple-400 font-mono text-xs">{breedingResult.lineageKey.slice(0, 16)}...</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Inherited Traits:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(breedingResult.traits).slice(0, 4).map(([key, value]) => (
                          <span key={key} className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-zinc-300">
                            {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
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
                Combine base essences with catalysts to brew a quick support elixir for your companion.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Base Essence</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ALCHEMY_BASE_LABELS) as AlchemyBase[]).map(base => (
                      <Button
                        key={base}
                        size="sm"
                        variant={alchemyRecipe.base === base ? 'default' : 'outline'}
                        onClick={() => setAlchemyRecipe(prev => ({ ...prev, base }))}
                        className={alchemyRecipe.base === base ? 'bg-amber-600 hover:bg-amber-700' : 'border-slate-700'}
                      >
                        {ALCHEMY_BASE_LABELS[base]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Catalyst</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ALCHEMY_CATALYST_LABELS) as AlchemyCatalyst[]).map(catalyst => (
                      <Button
                        key={catalyst}
                        size="sm"
                        variant={alchemyRecipe.catalyst === catalyst ? 'default' : 'outline'}
                        onClick={() => setAlchemyRecipe(prev => ({ ...prev, catalyst }))}
                        className={alchemyRecipe.catalyst === catalyst ? 'bg-violet-600 hover:bg-violet-700' : 'border-slate-700'}
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
                  {ALCHEMY_CATALYST_LABELS[alchemyRecipe.catalyst]} + {ALCHEMY_BASE_LABELS[alchemyRecipe.base]}.
                </p>
                <p className="mt-1 text-amber-200/80">
                  Resonance Index: {resonanceIndex} • Evolution Stage: {evolution.state}
                </p>
              </div>

              <Button
                onClick={handleBrewElixir}
                disabled={brewCooldownSeconds > 0}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                {brewCooldownSeconds > 0 ? `Cooling retort (${brewCooldownSeconds}s)` : 'Brew Elixir'}
              </Button>

              {latestBrew && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm space-y-1">
                  <p className="font-semibold text-emerald-200">Latest Brew: {latestBrew.name}</p>
                  <p className="text-zinc-300">{latestBrew.effect}</p>
                  <p className="text-xs text-emerald-300">Potency {latestBrew.potency}% • Companion nourished</p>
                </div>
              )}

              {brewHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Recent Brews</p>
                  <div className="space-y-2">
                    {brewHistory.map((brew) => (
                      <div key={brew.brewedAt} className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs">
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
                <label htmlFor="locale-select" className="text-xs uppercase tracking-wide text-zinc-400">
                  {strings.classroom.languageLabel}
                </label>
                <select
                  id="locale-select"
                  value={locale}
                  onChange={event => setLocale(event.target.value as Locale)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 touch-manipulation"
                >
                  {SUPPORTED_LOCALES.map(option => (
                    <option key={option} value={option}>
                      {LOCALE_LABELS[option]}
                    </option>
                  ))}
                </select>
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
                        ? 'bg-emerald-400/20 text-emerald-100 border-emerald-400/40'
                        : 'bg-slate-900 text-emerald-200 border-emerald-500/20'
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
                  {strings.classroom.teacherPrompts.map(prompt => (
                    <li key={prompt.title} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-sm font-semibold text-cyan-200">{prompt.title}</p>
                      <p className="text-xs text-zinc-300 mt-1">{prompt.prompt}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Classroom Manager */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <p className="text-sm font-semibold text-zinc-100">Classroom Manager</p>
                <p className="text-xs text-zinc-400">
                  Manage learner roster, assign activities, track progress, and build lesson queues.
                </p>
                <ClassroomManager />
              </div>
            </div>
          </CollapsibleSection>

          {/* Sacred Geometry & Sound */}
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 rounded-2xl border border-amber-500/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Orbit className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Sacred Geometry &amp; Sound</h2>
                  <p className="text-xs text-zinc-400">Experience DNA as living geometry, music, and light</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/geometry-sound"
                  className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm font-medium hover:bg-amber-500/30 hover:border-amber-400 transition-colors touch-manipulation"
                >
                  Generate My Pet Resonance
                </Link>
              </div>
            </div>
          </div>

          <Dialog open={sessionSheetOpen} onOpenChange={setSessionSheetOpen}>
            <DialogContent className="bg-zinc-900/95 border-amber-500/30 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-amber-300">Prepare your geometry session</DialogTitle>
              </DialogHeader>
              <DialogClose onClick={() => setSessionSheetOpen(false)} />
              <div className="px-6 pb-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Session goal</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Calm', 'Focus', 'Recovery', 'Creative'] as const).map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setSessionGoal(goal)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          sessionGoal === goal
                            ? 'border-amber-400 bg-amber-400/20 text-amber-100'
                            : 'border-slate-700 bg-slate-900/80 text-zinc-300 hover:border-amber-500/50'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm text-zinc-200">
                    <span>Include intensity</span>
                    <input
                      type="checkbox"
                      checked={sessionIntensityEnabled}
                      onChange={event => setSessionIntensityEnabled(event.target.checked)}
                      className="h-4 w-4 accent-amber-400"
                    />
                  </label>
                  {sessionIntensityEnabled && (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                        <span>Intensity</span>
                        <span className="font-semibold text-amber-300">{sessionIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        step={5}
                        value={sessionIntensity}
                        onChange={event => setSessionIntensity(Number(event.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="secondary" className="flex-1" onClick={() => setSessionSheetOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950" onClick={launchGeometrySession}>
                    Start Session
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Genome Traits */}
          <CollapsibleSection
            title="Genome Traits"
            icon={<Dna className="w-5 h-5 text-purple-400" />}
          >
            <TraitPanel />
          </CollapsibleSection>

          {/* PrimeTail ID */}
          {crest && (
            <CollapsibleSection
              title="PrimeTail ID"
              icon={<Shield className="w-5 h-5 text-amber-400" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Vault:</span>
                    <span className="text-blue-400 font-mono font-bold uppercase">{crest.vault}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Rotation:</span>
                    <span className="text-cyan-400 font-mono font-bold">{crest.rotation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Tail:</span>
                    <span className="text-purple-400 font-mono text-xs">[{crest.tail.join(', ')}]</span>
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
                  <p className="text-xs text-rose-400 text-center">{audioError}</p>
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
                  {mintHint && <p className="text-xs text-zinc-500">{mintHint}</p>}
                  {importHint && <p className="text-xs text-zinc-500">{importHint}</p>}
                </div>
              )}

              {importError && (
                <p className="text-xs text-rose-400">{importError}</p>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {petSummaries.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-zinc-500">
                    {persistenceSupported
                      ? 'No archived companions yet.'
                      : 'IndexedDB is unavailable.'}
                  </div>
                ) : (
                  petSummaries.map(summary => {
                    const isActive = summary.id === currentPetId;
                    return (
                      <div
                        key={summary.id}
                        className={`rounded-lg border p-3 transition ${
                          isActive
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-800 bg-slate-950/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {summary.name && summary.name.trim() !== '' ? summary.name : 'Unnamed'}
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
            <DigitalKeyPanel />
          </CollapsibleSection>

          {/* QR Messaging */}
          <QRQuickPanel />

          {/* Achievements */}
          <CollapsibleSection
            title="Achievements"
            icon={<Sparkles className="w-5 h-5 text-amber-400" />}
          >
            <AchievementShelf />
          </CollapsibleSection>

          {/* Classroom Modes */}
          <CollapsibleSection
            title="Classroom Modes"
            icon={<Award className="w-5 h-5 text-cyan-300" />}
          >
            <ClassroomModes />
          </CollapsibleSection>
        </div>

        {/* Footer Info */}
        <div className="text-center text-zinc-600 text-xs px-4 pb-4 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <Database className={`w-3 h-3 ${persistenceActive ? 'text-green-400' : 'text-yellow-400'}`} />
            {persistenceSupported
              ? persistenceActive
                ? 'Autosave active'
                : 'Autosave paused'
              : 'Offline unavailable'}
          </p>
        </div>
      </div>

      {/* Registration Certificate Modal */}
      <RegistrationCertificate
        petId={currentPetId ?? PET_ID}
        petName={petName || 'Unnamed Companion'}
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
      <SleepTracker
        isOpen={sleepOpen}
        onClose={() => setSleepOpen(false)}
      />
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
