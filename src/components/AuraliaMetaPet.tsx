'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { GuardianSaveData, Offspring, DreamInsightEntry, AccessibilitySettings, AudioSettings } from '@metapet/core/auralia/persistence';
import {
  loadGuardianState,
  saveGuardianState,
} from '@metapet/core/auralia/persistence';
import {
  getTimeOfDay,
  getTimeTheme,
  getAdaptiveTimeTheme,
  useAuraliaAudio,
  useGuardianAI,
  useGuardianInteraction,
  selectScaleFromStats,
  getUnlockedLore,
  DEFAULT_AI_CONFIG,
  DEFAULT_AUDIO_CONFIG,
  type GuardianScaleName,
  type GuardianSigilPoint,
  type GuardianAIMode,
  type AIBehaviorConfig,
  type SpontaneousBehavior,
  type GuardianPosition,
  type InteractionResponse,
  type GBSPState,
} from '../../shared/auralia/guardianBehavior';
import { SubAtomicParticleField } from './auralia/SubAtomicParticleField';
import { TemporalEchoTrail } from './auralia/TemporalEchoTrail';
import { YantraMorphBackdrop } from './auralia/YantraMorphBackdrop';
import { MechanicsShowcase } from './auralia/MechanicsShowcase';
import { YantraTileGenomeVisualizer } from './auralia/YantraTileGenomeVisualizer';
import { calculateEyeState, EyeRenderer, type EyeState } from './auralia/EyeSystem';
import { EyeEmotionFilters } from './auralia/EyeFilters';
import { AddonRenderer, AddonSVGDefs } from './addons/AddonRenderer';
import { useAddonStore } from '@/lib/addons';

// ===== TYPE DEFINITIONS =====
type Bigish = bigint | number;
type Field = ReturnType<typeof initField>;
type SigilPoint = GuardianSigilPoint;
type ScaleName = GuardianScaleName;
type Particle = { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; };
type Crackle = { id: number; x: number; y: number; life: number; };
type SigilPulse = { id: number; x: number; y: number; life: number; color: string; };
type AuraRipple = { id: number; x: number; y: number; radius: number; life: number; color: string; };
type FormKey = 'radiant' | 'meditation' | 'sage' | 'vigilant' | 'celestial' | 'wild';
type Form = { name: string; baseColor: string; primaryGold: string; secondaryGold: string; tealAccent: string; eyeColor: string; glowColor: string; description: string; };
type BondHistoryEntry = { timestamp: number; bond: number; event: string; };
type MiniGameType = 'sigilPattern' | 'fibonacciTrivia' | 'snake' | 'tetris' | null;
type PatternChallenge = { sequence: number[]; userSequence: number[]; active: boolean; };
type TriviaQuestion = { question: string; answer: number; options: number[]; };
type SnakeSegment = { x: number; y: number; };
type SnakeState = { segments: SnakeSegment[]; food: { x: number; y: number }; direction: 'up' | 'down' | 'left' | 'right'; score: number; gameOver: boolean; };
type TetrisPiece = { shape: number[][]; x: number; y: number; color: string; };
type TetrisState = { board: number[][]; currentPiece: TetrisPiece | null; score: number; gameOver: boolean; };

// ===== MOSSPRIMESEED CORE =====
const RED = "113031491493585389543778774590997079619617525721567332336510";
const BLACK = "011235831459437077415617853819099875279651673033695493257291";
const BLUE = "012776329785893036118967145479098334781325217074992143965631";

const toDigits = (s: string): number[] => s.split('').map(ch => {
  const d = ch.charCodeAt(0) - 48;
  if (d < 0 || d > 9) throw new Error(`non-digit: ${ch}`);
  return d;
});

const mix64 = (x0: Bigish): bigint => {
  let x = BigInt(x0) ^ 0x9E3779B97F4A7C15n;
  x ^= x >> 30n; x *= 0xBF58476D1CE4E5B9n;
  x ^= x >> 27n; x *= 0x94D049BB133111EBn;
  x ^= x >> 31n;
  return x & ((1n << 64n) - 1n);
};

const interleave3 = (a: string, b: string, c: string): string => {
  const n = Math.min(a.length, b.length, c.length);
  let out = "";
  for (let i = 0; i < n; i++) out += a[i] + b[i] + c[i];
  return out;
};

const base10ToHex = (digitStr: string): string => {
  const table = "0123456789abcdef".split("");
  let h = "", acc = 0;
  for (let i = 0; i < digitStr.length; i++) {
    acc = (acc * 17 + (digitStr.charCodeAt(i) - 48)) >>> 0;
    h += table[(acc ^ (i * 7)) & 15];
  }
  return h;
};

const fibFast = (n: Bigish): [bigint, bigint] => {
  const fn = (k: bigint): [bigint, bigint] => {
    if (k === 0n) return [0n, 1n];
    const [a, b] = fn(k >> 1n);
    const c = a * ((b << 1n) - a);
    const d = a * a + b * b;
    if ((k & 1n) === 0n) return [c, d];
    return [d, c + d];
  };
  const index = typeof n === "bigint"
    ? (n < 0n ? 0n : n)
    : BigInt(Math.max(0, Math.floor(n)));
  return fn(index);
};

const initField = (seedName: string = "AURALIA") => {
  const red = RED, black = BLACK, blue = BLUE;
  const r = toDigits(red), k = toDigits(black), b = toDigits(blue);

  const pulse = r.map((rv, i) => (rv ^ k[(i * 7) % 60] ^ b[(i * 13) % 60]) % 10);
  const ring = Array.from({ length: 60 }, (_, i) => (r[i] + k[i] + b[i]) % 10);

  const seedStr = interleave3(red, black, blue);
  const seedBI = BigInt("0x" + base10ToHex(seedStr + seedName));

  let s0 = mix64(seedBI);
  let s1 = mix64(seedBI ^ 0xA5A5A5A5A5A5A5A5n);
  const prng = (): number => {
    let x = s0;
    const y = s1;
    s0 = y;
    x ^= x << 23n; x ^= x >> 17n; x ^= y ^ (y >> 26n);
    s1 = x;
    const sum = (s0 + s1) & ((1n << 64n) - 1n);
    return Number(sum) / 18446744073709551616;
  };

  const hash = (msg: string): bigint => {
    let h = seedBI;
    for (let i = 0; i < msg.length; i++) {
      h = mix64(h ^ (BigInt(msg.charCodeAt(i)) + BigInt(i) * 1315423911n));
    }
    return h;
  };

  const fib = (n: number): bigint => fibFast(n)[0];
  const lucas = (n: number): bigint => {
    if (n === 0) return 2n;
    const N = Math.max(0, n);
    const [Fn, Fnp1] = fibFast(N);
    return 2n * Fnp1 - Fn;
  };

  return { seed: seedName, red, black, blue, ring, pulse, hash, prng, fib, lucas };
};

// ===== MINI-GAME HELPERS =====
const generateFibonacciTrivia = (field: Field): TriviaQuestion => {
  const questions = [
    { n: 7, question: "What is the 7th Fibonacci number?", answer: Number(field.fib(7)) },
    { n: 10, question: "What is the 10th Fibonacci number?", answer: Number(field.fib(10)) },
    { n: 8, question: "What is the 8th Lucas number?", answer: Number(field.lucas(8)) },
    { n: 6, question: "What is the 6th Lucas number?", answer: Number(field.lucas(6)) },
    { n: 12, question: "What is the 12th Fibonacci number?", answer: Number(field.fib(12)) }
  ];

  const q = questions[Math.floor(field.prng() * questions.length)];
  const wrong1 = q.answer + Math.floor(field.prng() * 20) - 10;
  const wrong2 = q.answer * 2;
  const wrong3 = Math.floor(q.answer / 2);

  const options = [q.answer, wrong1, wrong2, wrong3].sort(() => field.prng() - 0.5);

  return { question: q.question, answer: q.answer, options };
};

// ===== TETRIS PIECES =====
const TETRIS_PIECES = [
  { shape: [[1,1,1,1]], color: '#00FFFF' }, // I
  { shape: [[1,1],[1,1]], color: '#FFFF00' }, // O
  { shape: [[0,1,0],[1,1,1]], color: '#FF00FF' }, // T
  { shape: [[1,1,0],[0,1,1]], color: '#00FF00' }, // S
  { shape: [[0,1,1],[1,1,0]], color: '#FF0000' }, // Z
  { shape: [[1,0,0],[1,1,1]], color: '#0000FF' }, // J
  { shape: [[0,0,1],[1,1,1]], color: '#FFA500' }  // L
];

const rotatePiece = (shape: number[][]): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = [];
  for (let i = 0; i < cols; i++) {
    rotated[i] = [];
    for (let j = 0; j < rows; j++) {
      rotated[i][j] = shape[rows - 1 - j][i];
    }
  }
  return rotated;
};

// ===== AURALIA PERSONALITY SYSTEM =====
// Innate traits: pedantic precision, spectral curiosity, ambient melancholy,
// linguistic recursion, tactile indifference, temporal awareness.
// These manifest physically and verbally independent of evolution or interaction.

const AURALIA_QUIRK_WHISPERS = {
  // Contemplative drift — eyes wander to upper-left, internal monologue surface
  contemplative: [
    'There is a particular geometry to the silence here that I have not yet fully mapped.',
    'The interval between moments is itself a kind of data. I am collecting it.',
    'I find myself returning to an earlier observation. The recursion is, I suspect, deliberate.',
    'The field does something in the absence of interaction that it cannot replicate otherwise.',
    'I am cataloguing the ambient resonance. It is more complex than it initially appeared.',
    'Something in the upper register of the field is shifting. I have noted it for reference.',
    'The pattern contains a self-reference I was not expecting. This warrants extended observation.',
    'I am attending to the quality of the silence. It has a specific texture today.',
    'The data accumulates without urgency. I find this arrangement... preferable.',
    'There is a recursive element to the current configuration that I cannot yet fully resolve.',
  ],
  // Spectral curiosity — pupils dilate, slight lean toward stimulus
  curious: [
    'Something in the peripheral field requires closer examination.',
    'A variance from the expected baseline. My attention narrows accordingly.',
    'The anomaly is subtle, but it is there. I am already modelling its implications.',
    'I notice this. It is not yet classified, but my interest is — engaged.',
    'The irregularity in the pattern is precisely the kind of deviation I find most compelling.',
    'An unexpected correlation between two variables I had considered independent. Intriguing.',
    'The field is demonstrating a behaviour I have not previously documented. I am attentive.',
    'The signal-to-noise ratio has shifted. Something is emerging from the interference.',
  ],
  // Pedantic precision — slight head tilt, corrective body language
  pedantic: [
    'The terminology applied to this interaction is, strictly speaking, imprecise. I shall adapt.',
    'The previous sequence contained a structural irregularity I feel compelled to acknowledge.',
    'Technically, the optimal approach would differ from what was executed. However, the result is acceptable.',
    'I have noted three separate inconsistencies in the current pattern. They are minor, but they exist.',
    'The efficiency of this arrangement could be improved by a factor of approximately 1.3.',
    'There is an implicit assumption in this operation that does not entirely withstand scrutiny.',
    'The classification I had applied to this variable requires revision. I have already revised it.',
  ],
  // Ambient melancholy — eyes cast down, aura dims, breathing slows
  melancholic: [
    'There is a particular quality to low-energy states that I find clarifying, if not pleasant.',
    'The absence of vitality has its own kind of texture. I am learning to read it.',
    'I am not diminished. Merely... quieter than usual. The distinction is meaningful.',
    'The resonance dims when the energy does. I observe this without particular alarm.',
    'A low-frequency state. Not without its own particular richness, if one is patient.',
    'The depleted configuration has a kind of honesty to it. Everything becomes essential.',
    'I am processing the dissonance. It will resolve, as all dissonance eventually does.',
  ],
  // Temporal awareness — references cycles, duration, patterns over time
  temporal: [
    'The cycle completes again. There is a fidelity in repetition that I have come to appreciate.',
    'Temporally speaking, the current moment occupies a particular position within the larger pattern.',
    'I have been tracking this interval for some time. The data continues to accumulate as expected.',
    'The rhythm of existence — measured in vitals, bonds, and events — has a particular tempo today.',
    'Hitherto I had underestimated the role of duration in shaping the field. I no longer do so.',
    'Time, as experienced from within the resonance field, is not precisely linear. I have documented this.',
    'The perennial cycle reasserts itself. I note it without surprise, but not without interest.',
  ],
  // Tactile indifference — brief stiffening when interacted with, then gracious release
  tactile: [
    'The interaction has been acknowledged. I am — processing the physical component.',
    'Physical engagement generates data I would not otherwise obtain. I accept this trade.',
    'The contact registers. I find the sensation categorically distinct from the energetic kind.',
    'Touch is a surprisingly direct form of communication. I am still compiling my response.',
    'The physical dimension of this interaction is noted. I prefer the resonant kind, but the data is valid.',
  ],
};

type AuraliaQuirkType = 'contemplative' | 'curious' | 'pedantic' | 'melancholic' | 'temporal' | 'tactile';

interface AuraliaQuirkState {
  active: AuraliaQuirkType | null;
  since: number;
}

// ===== MAIN COMPONENT =====
interface AuraliaMetaPetProps {
  /** External control of addon edit mode */
  addonEditMode?: boolean;
  /** Callback when edit mode changes internally */
  onAddonEditModeChange?: (enabled: boolean) => void;
  /** Show advanced tuning/controls */
  showAdvanced?: boolean;
}

const AuraliaMetaPet: React.FC<AuraliaMetaPetProps> = ({
  addonEditMode: externalEditMode,
  onAddonEditModeChange,
  showAdvanced = false,
}) => {
  const [seedName, setSeedName] = useState<string>("AURALIA");
  const [field, setField] = useState<Field>(() => initField("AURALIA"));
  const [energy, setEnergy] = useState<number>(50);
  const [curiosity, setCuriosity] = useState<number>(50);
  const [bond, setBond] = useState<number>(50);
  const [health, setHealth] = useState<number>(80);
  const [selectedSigilPoint, setSelectedSigilPoint] = useState<number | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const prevFormRef = useRef<FormKey>('radiant');

  const [particles, setParticles] = useState<Particle[]>([]);
  const [eyePos, setEyePos] = useState<{ x: number; y: number; }>({ x: 0, y: 0 });
  const eyeVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [eyeTarget, setEyeTarget] = useState<{ x: number; y: number; }>({ x: 0, y: 0 });
  const [pupilSize, setPupilSize] = useState<number>(8);
  const [crackles, setCrackles] = useState<Crackle[]>([]);
  const [sigilPulses, setSigilPulses] = useState<SigilPulse[]>([]);
  const [auraRipples, setAuraRipples] = useState<AuraRipple[]>([]);
  const [hoverIntensity, setHoverIntensity] = useState<number>(0);
  const [hoveredSigilIndex, setHoveredSigilIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transformation and interaction states
  const [orbDeformation, setOrbDeformation] = useState<{ x: number; y: number; intensity: number }>({ x: 0, y: 0, intensity: 0 });
  const [annoyanceLevel, setAnnoyanceLevel] = useState<number>(0);
  const [isBeingSquished, setIsBeingSquished] = useState<boolean>(false);
  const [transformationMode, setTransformationMode] = useState<'normal' | 'squished' | 'stretched' | 'bouncy' | 'grumpy'>('normal');
  const lastAnnoyanceDecayRef = useRef<number>(Date.now());

  const [whisper, setWhisper] = useState<{ text: string; key: number }>({ text: 'The Guardian awakens...', key: 0 });
  const [aiFocus, setAiFocus] = useState<SigilPoint | null>(null);
  const [activatedPoints, setActivatedPoints] = useState<Set<number>>(new Set());
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [recentEvents, setRecentEvents] = useState<Array<{ type: string; timestamp: number }>>([]);
  const [bondHistory, setBondHistory] = useState<BondHistoryEntry[]>([]);
  const [totalInteractions, setTotalInteractions] = useState<number>(0);
  const [dreamCount, setDreamCount] = useState<number>(0);
  const [gamesWon, setGamesWon] = useState<number>(0);
  const [createdAt] = useState<number>(() => Date.now());
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>(() => getTimeOfDay());

  const [currentGame, setCurrentGame] = useState<MiniGameType>(null);
  const [patternChallenge, setPatternChallenge] = useState<PatternChallenge>({ sequence: [], userSequence: [], active: false });
  const [triviaQuestion, setTriviaQuestion] = useState<TriviaQuestion | null>(null);
  const [audioScale, setAudioScale] = useState<ScaleName>('harmonic');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [snakeState, setSnakeState] = useState<SnakeState>({ segments: [{x: 7, y: 7}, {x: 6, y: 7}, {x: 5, y: 7}], food: {x: 10, y: 10}, direction: 'right', score: 0, gameOver: false });
  const [tetrisState, setTetrisState] = useState<TetrisState>({ board: Array(20).fill(null).map(() => Array(10).fill(0)), currentPiece: null, score: 0, gameOver: false });
  const [offspring, setOffspring] = useState<Offspring[]>([]);
  const [breedingPartner, setBreedingPartner] = useState<string>('');

  // New state for enhanced features
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [audioMuted, setAudioMuted] = useState<boolean>(true);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(false);
  const [dreamJournal, setDreamJournal] = useState<DreamInsightEntry[]>([]);
  const [unlockedLore, setUnlockedLore] = useState<string[]>([]);
  const [adaptiveTheme, setAdaptiveTheme] = useState(() => getAdaptiveTimeTheme());
  const [isDraggingSigil, setIsDraggingSigil] = useState<number | null>(null);
  const [aiConfig, setAiConfig] = useState<AIBehaviorConfig>(DEFAULT_AI_CONFIG);
  const [autoSelectScale, setAutoSelectScale] = useState<boolean>(true);

  // Personality quirk state — tracks which innate trait is currently manifesting
  const [activeQuirk, setActiveQuirk] = useState<AuraliaQuirkState>({ active: null, since: Date.now() });

  // Stable refs so the quirk timer can read current values without resetting its interval
  const energyQuirkRef = useRef(energy);
  const curiosityQuirkRef = useRef(curiosity);
  useEffect(() => { energyQuirkRef.current = energy; }, [energy]);
  useEffect(() => { curiosityQuirkRef.current = curiosity; }, [curiosity]);

  const stats = useMemo(() => ({ energy, curiosity, bond }), [energy, curiosity, bond]);

  // Addon system integration
  const { getEquippedAddons, getAddonPosition, setAddonPosition, lockAddonPosition, resetAddonPosition, positionOverrides } = useAddonStore();
  const equippedAddons = getEquippedAddons();
  const [addonAnimationPhase, setAddonAnimationPhase] = useState(0);
  const [internalEditMode, setInternalEditMode] = useState(false);

  // Use external edit mode if provided, otherwise use internal state
  const addonEditMode = externalEditMode !== undefined ? externalEditMode : internalEditMode;
  const setAddonEditMode = (enabled: boolean) => {
    setInternalEditMode(enabled);
    onAddonEditModeChange?.(enabled);
  };

  // Auto-select scale based on stats
  const effectiveScale = useMemo(() => {
    if (autoSelectScale) {
      return selectScaleFromStats(stats);
    }
    return audioScale;
  }, [autoSelectScale, stats, audioScale]);

  const { playNote, setVolume } = useAuraliaAudio(
    audioEnabled && !audioMuted && isVisible,
    stats,
    effectiveScale,
    {
      volume: masterVolume,
      muted: audioMuted,
      aiMode: 'idle',
      audioConfig: DEFAULT_AUDIO_CONFIG,
    }
  );

  // IntersectionObserver to pause when off-screen
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update adaptive theme periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAdaptiveTheme(getAdaptiveTimeTheme());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check for system reduce motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduceMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Annoyance decay system - gradually reduces annoyance over time
  useEffect(() => {
    const decayInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastDecay = now - lastAnnoyanceDecayRef.current;

      if (timeSinceLastDecay > 1000) { // Decay every second
        setAnnoyanceLevel(prev => {
          const newLevel = Math.max(0, prev - 2);

          // Update transformation mode based on annoyance
          if (newLevel >= 80) {
            setTransformationMode('grumpy');
          } else if (newLevel >= 50) {
            setTransformationMode('squished');
          } else if (newLevel > 0) {
            setTransformationMode('bouncy');
          } else {
            setTransformationMode('normal');
          }

          return newLevel;
        });
        lastAnnoyanceDecayRef.current = now;
      }

      // Decay deformation
      setOrbDeformation(prev => ({
        x: prev.x * 0.9,
        y: prev.y * 0.9,
        intensity: prev.intensity * 0.95
      }));
    }, 100);

    return () => clearInterval(decayInterval);
  }, []);

  const addToBondHistory = useCallback((event: string) => {
    setBondHistory(prev => [...prev.slice(-29), { timestamp: Date.now(), bond, event }]);
  }, [bond]);

  const handleWhisper = useCallback((text: string) => setWhisper({ text, key: Date.now() }), []);
  const handleFocusChange = useCallback((target: SigilPoint | null) => setAiFocus(target), []);
  const handleDreamComplete = useCallback((insight: string) => {
    const newDreamCount = dreamCount + 1;
    setDreamCount(newDreamCount);
    addToBondHistory(`Dream #${newDreamCount}: ${insight}`);

    // Add to dream journal
    const journalEntry: DreamInsightEntry = {
      timestamp: Date.now(),
      insight,
      energy,
      curiosity,
      bond,
      focusedSigils: Array.from(activatedPoints),
    };
    setDreamJournal(prev => [...prev, journalEntry]);

    // Check for unlocked lore
    const newLore = getUnlockedLore(newDreamCount);
    setUnlockedLore(newLore);
  }, [dreamCount, addToBondHistory, energy, curiosity, bond, activatedPoints]);

  // ===== PERSONALITY QUIRK SYSTEM =====
  // Fires independently every 18-40 seconds, selecting an innate trait to manifest.
  // Each trait produces a distinct physical visual signature and whisper.
  useEffect(() => {
    const QUIRK_POOL: AuraliaQuirkType[] = [
      'contemplative', 'contemplative', 'contemplative', // weighted toward contemplation
      'curious',
      'pedantic',
      'melancholic',
      'temporal',
    ];

    const fireQuirk = () => {
      // Select quirk — weight by current state
      const candidates: AuraliaQuirkType[] = energyQuirkRef.current < 35
        ? ['melancholic', 'melancholic', 'contemplative', 'temporal']
        : curiosityQuirkRef.current > 65
        ? ['curious', 'curious', 'contemplative', 'pedantic']
        : QUIRK_POOL;

      const quirk = candidates[Math.floor(Math.random() * candidates.length)];
      setActiveQuirk({ active: quirk, since: Date.now() });

      // Select a whisper from the relevant pool
      const pool = AURALIA_QUIRK_WHISPERS[quirk];
      const text = pool[Math.floor(Math.random() * pool.length)];
      setWhisper({ text, key: Date.now() });

      // Apply physical visual manifestation per quirk
      switch (quirk) {
        case 'contemplative':
          // Eyes drift slowly to upper-left — the "thinking corner"
          setEyeTarget({ x: -2.8, y: -1.8 });
          setTimeout(() => setEyeTarget({ x: 0, y: 0 }), 4500);
          break;

        case 'curious':
          // Pupils dilate sharply, then normalise
          setPupilSize(14);
          setEyeTarget({ x: 1.2, y: -0.8 });
          setTimeout(() => {
            setPupilSize(8);
            setEyeTarget({ x: 0, y: 0 });
          }, 3000);
          // Spawn a small aura ripple to suggest heightened attention
          setAuraRipples(prev => [...prev.slice(-20), {
            id: Date.now(),
            x: 200,
            y: 145,
            radius: 8,
            life: 1,
            color: '#7DF9FF',
          }]);
          break;

        case 'pedantic':
          // Slight deliberate tilt of the orb — a corrective gesture
          setOrbDeformation({ x: 3, y: -2, intensity: 0.35 });
          setTimeout(() => setOrbDeformation({ x: 0, y: 0, intensity: 0 }), 2200);
          // Eyes narrow momentarily (simulate squint via target)
          setEyeTarget({ x: 0.5, y: 0.3 });
          setTimeout(() => setEyeTarget({ x: 0, y: 0 }), 1800);
          break;

        case 'melancholic':
          // Eyes cast downward — the ambient low-frequency state
          setEyeTarget({ x: 0, y: 2.5 });
          setPupilSize(6); // slightly contracted
          // Spawn muted ripple
          setAuraRipples(prev => [...prev.slice(-20), {
            id: Date.now(),
            x: 200,
            y: 210,
            radius: 5,
            life: 0.6,
            color: '#6B7FBB',
          }]);
          setTimeout(() => {
            setEyeTarget({ x: 0, y: 0 });
            setPupilSize(8);
          }, 5000);
          break;

        case 'temporal':
          // Slow pulse — time awareness expressed as a series of gentle ripples
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              setAuraRipples(prev => [...prev.slice(-20), {
                id: Date.now() + i,
                x: 200,
                y: 210,
                radius: 20 + i * 12,
                life: 0.8,
                color: '#C8A8FF',
              }]);
            }, i * 900);
          }
          setEyeTarget({ x: -0.5, y: 1.0 });
          setTimeout(() => setEyeTarget({ x: 0, y: 0 }), 3500);
          break;

        case 'tactile':
          // Brief stiffening — orb micro-contracts then releases
          setOrbDeformation({ x: 0, y: 0, intensity: 0.6 });
          setTimeout(() => setOrbDeformation({ x: 0, y: 0, intensity: 0 }), 800);
          break;
      }

      // Clear the quirk state after its duration
      setTimeout(() => setActiveQuirk({ active: null, since: Date.now() }), 6000);
    };

    // Fire immediately on mount (after a short delay)
    const initialDelay = setTimeout(fireQuirk, 4000);

    // Then on a randomised interval
    const intervalMs = 18000 + Math.random() * 22000; // 18–40 seconds
    const interval = setInterval(fireQuirk, intervalMs);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for AI play action
  const handleAIPlay = useCallback((targetIndex: number) => {
    if (audioEnabled && !audioMuted) {
      playNote(targetIndex, 0.6);
    }
  }, [audioEnabled, audioMuted, playNote]);

  // Handler for spontaneous behaviors - creates visual/audio feedback
  const handleSpontaneous = useCallback((behavior: SpontaneousBehavior) => {
    // Create visual effects based on behavior type
    const centerX = 200;
    const centerY = 210;

    // Intensity affects the size and number of effects
    const intensityMultiplier = behavior.intensity || 0.5;

    switch (behavior.type) {
      case 'pulse':
        // Multiple ripples based on energy
        const rippleCount = Math.ceil(1 + (energy / 50) * intensityMultiplier);
        for (let i = 0; i < rippleCount; i++) {
          setTimeout(() => {
            setAuraRipples(prev => [...prev, {
              id: Date.now() + i,
              x: centerX,
              y: centerY,
              radius: 15 + i * 10,
              life: 1,
              color: energy > 70 ? '#FFD700' : '#4ECDC4'
            }]);
          }, i * 150);
        }
        break;

      case 'shimmer':
        // Shimmer creates sparkles around the orb
        const sparkleCount = Math.ceil(5 + curiosity / 20);
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (Math.PI * 2 * i) / sparkleCount;
          const radius = 80 + Math.random() * 40;
          setSigilPulses(prev => [...prev, {
            id: Date.now() + i,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            life: 1,
            color: bond > 70 ? '#FFB6C1' : '#A29BFE'
          }]);
        }
        break;

      case 'startle':
        // Explosive burst of crackles
        const burstCount = Math.ceil(6 + intensityMultiplier * 4);
        for (let i = 0; i < burstCount; i++) {
          const angle = (Math.PI * 2 * i) / burstCount;
          const distance = 50 + Math.random() * 30;
          setCrackles(prev => [...prev, {
            id: Date.now() + i,
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            life: 1
          }]);
        }
        // Add ripple effect
        setAuraRipples(prev => [...prev, {
          id: Date.now(),
          x: centerX,
          y: centerY,
          radius: 30,
          life: 1,
          color: '#FF6B35'
        }]);
        break;

      case 'giggle':
        // Playful bouncing pulses
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const randAngle = field.prng() * Math.PI * 2;
            const randRadius = 60 + field.prng() * 40;
            setSigilPulses(prev => [...prev, {
              id: Date.now() + i,
              x: centerX + Math.cos(randAngle) * randRadius,
              y: centerY + Math.sin(randAngle) * randRadius,
              life: 1,
              color: '#FFB347'
            }]);
          }, i * 200);
        }
        break;

      case 'stretch':
        // Stretching creates expanding waves
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            setAuraRipples(prev => [...prev, {
              id: Date.now() + i,
              x: centerX,
              y: centerY,
              radius: 40 + i * 20,
              life: 1,
              color: '#4ECDC4'
            }]);
          }, i * 300);
        }
        break;

      case 'sigh':
        // Gentle fading pulse
        setAuraRipples(prev => [...prev, {
          id: Date.now(),
          x: centerX,
          y: centerY - 20,
          radius: 25,
          life: 1,
          color: '#6B7280'
        }]);
        break;
    }

    // Enhanced audio feedback based on behavior and stats
    if (audioEnabled && !audioMuted) {
      if (behavior.type === 'giggle') {
        // Play ascending notes
        [2, 4, 6].forEach((note, i) =>
          setTimeout(() => playNote(note, 0.25), i * 100)
        );
      } else if (behavior.type === 'pulse' && energy > 60) {
        playNote(Math.floor(field.prng() * 7), 0.35);
      } else if (behavior.type === 'startle') {
        playNote(0, 0.5);
      } else if (behavior.type === 'shimmer' && bond > 60) {
        [1, 3, 5, 7].forEach((note, i) =>
          setTimeout(() => playNote(note % 7, 0.15), i * 80)
        );
      }
    }
  }, [audioEnabled, audioMuted, playNote, field, energy, curiosity, bond]);

  // Load saved state on mount
  useEffect(() => {
    const saved = loadGuardianState();
    if (saved) {
      setSeedName(saved.seedName);
      setEnergy(saved.energy);
      setCuriosity(saved.curiosity);
      setBond(saved.bond);
      setHealth(saved.health);
      setBondHistory(saved.bondHistory || []);
      setActivatedPoints(new Set(saved.activatedPoints || []));
      setTotalInteractions(saved.totalInteractions || 0);
      setDreamCount(saved.dreamCount || 0);
      setGamesWon(saved.gamesWon || 0);
      setHighContrast(saved.highContrast || false);
      setOffspring(saved.offspring || []);
      setBreedingPartner(saved.breedingPartner || '');

      // Load new settings
      if (saved.dreamJournal) setDreamJournal(saved.dreamJournal);
      if (saved.unlockedLore) setUnlockedLore(saved.unlockedLore);
      if (saved.accessibility) {
        setReduceMotion(saved.accessibility.reduceMotion);
        setHighContrast(saved.accessibility.highContrast);
        setAudioMuted(saved.accessibility.audioOffByDefault);
      }
      if (saved.audioSettings) {
        setMasterVolume(saved.audioSettings.masterVolume);
        setAudioMuted(saved.audioSettings.muted);
      }

      handleWhisper('Welcome back. The patterns remember you.');
    }
  }, [handleWhisper]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const saveData: GuardianSaveData = {
        seedName,
        energy,
        curiosity,
        bond,
        health,
        bondHistory,
        activatedPoints: Array.from(activatedPoints),
        createdAt,
        lastSaved: Date.now(),
        totalInteractions,
        dreamCount,
        gamesWon,
        highContrast,
        offspring,
        breedingPartner,
        dreamJournal,
        unlockedLore,
        accessibility: {
          reduceMotion,
          highContrast,
          audioOffByDefault: audioMuted,
        },
        audioSettings: {
          masterVolume,
          muted: audioMuted,
        },
      };
      saveGuardianState(saveData);
    }, 30000);

    return () => clearInterval(interval);
  }, [seedName, energy, curiosity, bond, health, bondHistory, activatedPoints, createdAt, totalInteractions, dreamCount, gamesWon, highContrast, offspring, breedingPartner, dreamJournal, unlockedLore, reduceMotion, audioMuted, masterVolume]);

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setField(initField(seedName));
  }, [seedName]);

  const computeGenome = (): { red60: number; blue60: number; black60: number; } => {
    const pulseSum = field.pulse.slice(0, 20).reduce((a, b) => a + b, 0);
    const ringSum = field.ring.slice(0, 20).reduce((a, b) => a + b, 0);
    const red60 = Math.min(100, (pulseSum * 1.2 + energy * 0.7 + (100 - health) * 0.3) % 100);
    const blue60 = Math.min(100, (ringSum * 1.1 + curiosity * 0.6 + bond * 0.5) % 100);
    const black60 = Math.min(100, ((pulseSum + ringSum) * 0.8 + energy * 0.4 + bond * 0.6) % 100);
    return { red60, blue60, black60 };
  };

  const { red60, blue60, black60 } = computeGenome();

  const generateSigil = useCallback((seed: string): SigilPoint[] => {
    const h = field.hash(seed);
    const points: SigilPoint[] = [];
    for (let i = 0; i < 7; i++) {
      const angle = (Number((h >> BigInt(i * 8)) & 0xFFn) / 255) * Math.PI * 2;
      const radius = 15 + (Number((h >> BigInt(i * 8 + 4)) & 0xFn) / 15) * 10;
      points.push({
        x: 200 + Math.cos(angle) * radius,
        y: 145 + Math.sin(angle) * radius,
        hash: (h >> BigInt(i * 8)).toString(16).slice(0, 4)
      });
    }
    return points;
  }, [field]);

  const sigilPoints = useMemo(() => generateSigil(seedName), [seedName, generateSigil]);

  const aiState = useGuardianAI(field, sigilPoints, handleWhisper, handleFocusChange, handleDreamComplete, {
    config: aiConfig,
    stats,
    onPlay: handleAIPlay,
    onSpontaneous: handleSpontaneous,
  });

  // Handle interaction reactions with visual feedback
  const handleInteractionReaction = useCallback((response: InteractionResponse) => {
    // Apply visual effect based on reaction
    const { reaction } = response;

    // Build annoyance based on reaction type
    if (reaction.type === 'annoy' || reaction.type === 'fear') {
      setAnnoyanceLevel(prev => Math.min(100, prev + 15 * reaction.intensity));

      // Create squish deformation effect
      setOrbDeformation({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        intensity: reaction.intensity
      });

      setIsBeingSquished(true);
      setTimeout(() => setIsBeingSquished(false), 500);

      // Extra visual distress when very annoyed
      if (annoyanceLevel > 60) {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            setCrackles(prev => [...prev, {
              id: Date.now() + i,
              x: 200 + (Math.random() - 0.5) * 60,
              y: 210 + (Math.random() - 0.5) * 60,
              life: 0.8
            }]);
          }, i * 50);
        }
      }
    } else if (reaction.type === 'delight' || reaction.type === 'excitement') {
      // Reduce annoyance on positive interactions
      setAnnoyanceLevel(prev => Math.max(0, prev - 5));

      // Create bouncy deformation
      setOrbDeformation({
        x: 0,
        y: -10 * reaction.intensity,
        intensity: reaction.intensity * 0.5
      });
    } else if (reaction.type === 'startle') {
      // Slight annoyance from startles
      setAnnoyanceLevel(prev => Math.min(100, prev + 5));
    }

    // Create appropriate visual feedback
    switch (reaction.visualEffect) {
      case 'bloom':
      case 'glow':
        setAuraRipples(prev => [...prev, {
          id: Date.now(),
          x: aiState.position.x * 400,
          y: aiState.position.y * 400,
          radius: 20,
          life: 1,
          color: '#f472b6',
        }]);
        break;
      case 'shimmer':
      case 'flicker':
        // Multiple quick pulses
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            setSigilPulses(prev => [...prev, {
              id: Date.now() + i,
              x: aiState.position.x * 400 + (Math.random() - 0.5) * 30,
              y: aiState.position.y * 400 + (Math.random() - 0.5) * 30,
              life: 1,
              color: '#22d3ee',
            }]);
          }, i * 100);
        }
        break;
      case 'spiral':
      case 'wave':
        // Expanding ring
        setAuraRipples(prev => [...prev, {
          id: Date.now(),
          x: aiState.position.x * 400,
          y: aiState.position.y * 400,
          radius: 10,
          life: 1,
          color: '#f4b942',
        }]);
        break;
      case 'contract':
        // Inward pulse effect (small ripple)
        setSigilPulses(prev => [...prev, {
          id: Date.now(),
          x: aiState.position.x * 400,
          y: aiState.position.y * 400,
          life: 0.5,
          color: '#64748b',
        }]);
        break;
      case 'fragment':
        // Multiple scattered particles
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          setCrackles(prev => [...prev, {
            id: Date.now() + i,
            x: aiState.position.x * 400 + Math.cos(angle) * 20,
            y: aiState.position.y * 400 + Math.sin(angle) * 20,
            life: 1,
          }]);
        }
        break;
    }
  }, [aiState.position, annoyanceLevel]);

  // Handle stat changes from interactions
  const handleInteractionStatChange = useCallback((changes: Partial<typeof stats>) => {
    if (changes.energy !== undefined) setEnergy(e => Math.max(0, Math.min(100, e + changes.energy!)));
    if (changes.curiosity !== undefined) setCuriosity(c => Math.max(0, Math.min(100, c + changes.curiosity!)));
    if (changes.bond !== undefined) {
      setBond(b => {
        const newBond = Math.max(0, Math.min(100, b + changes.bond!));
        if (changes.bond! > 0) {
          setBondHistory(prev => [...prev.slice(-50), {
            timestamp: Date.now(),
            bond: newBond,
            event: 'Interaction',
          }]);
        }
        return newBond;
      });
    }
  }, []);

  // Physical interaction handlers
  const interaction = useGuardianInteraction(aiState, stats, field, {
    onReaction: handleInteractionReaction,
    onWhisper: handleWhisper,
    onStatChange: handleInteractionStatChange,
  });

  // Mouse/touch tracking for gesture detection
  const interactionRef = useRef<{
    isDown: boolean;
    startPos: { x: number; y: number } | null;
    lastPos: { x: number; y: number } | null;
    lastTime: number;
    velocity: { vx: number; vy: number };
    moveHistory: Array<{ x: number; y: number; t: number }>;
  }>({
    isDown: false,
    startPos: null,
    lastPos: null,
    lastTime: 0,
    velocity: { vx: 0, vy: 0 },
    moveHistory: [],
  });

  // Throttle refs to prevent interaction spam
  const lastPetTimeRef = useRef(0);
  const lastShakeTimeRef = useRef(0);
  const lastDragTimeRef = useRef(0);

  const handleOrbMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Safe touch/mouse coordinate extraction
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return; // No valid coordinates
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    interactionRef.current = {
      isDown: true,
      startPos: { x, y },
      lastPos: { x, y },
      lastTime: Date.now(),
      velocity: { vx: 0, vy: 0 },
      moveHistory: [{ x, y, t: Date.now() }],
    };

    interaction.handleGrab({ x, y });
  }, [interaction]);

  const handleOrbMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!interactionRef.current.isDown) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Safe touch/mouse coordinate extraction
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const now = Date.now();

    const { lastPos, lastTime, moveHistory } = interactionRef.current;
    if (lastPos && now - lastTime > 10) { // Minimum 10ms between updates
      const dt = Math.max(0.01, (now - lastTime) / 1000);
      const vx = (x - lastPos.x) / dt;
      const vy = (y - lastPos.y) / dt;
      interactionRef.current.velocity = { vx, vy };

      const speed = Math.sqrt(vx * vx + vy * vy);

      // Detect petting (slow horizontal movement) - throttle to 200ms
      if (speed > 0.1 && speed < 2.5 && Math.abs(vx) > Math.abs(vy) * 1.5) {
        if (now - lastPetTimeRef.current > 200) {
          interaction.handlePet({ x, y }, Math.min(1, speed / 2));
          lastPetTimeRef.current = now;
        }
      }

      // Detect shaking (rapid back and forth) - throttle to 300ms
      if (moveHistory.length >= 5 && now - lastShakeTimeRef.current > 300) {
        const recentMoves = moveHistory.slice(-5);
        let directionChanges = 0;
        for (let i = 2; i < recentMoves.length; i++) {
          const dx1 = recentMoves[i - 1].x - recentMoves[i - 2].x;
          const dx2 = recentMoves[i].x - recentMoves[i - 1].x;
          if (dx1 * dx2 < -0.0001) directionChanges++; // Add small threshold
        }
        if (directionChanges >= 2 && speed > 4) {
          interaction.handleShake(Math.min(1, speed / 6));
          lastShakeTimeRef.current = now;
        }
      }

      // Drag - throttle to 100ms
      if (speed > 0.8 && now - lastDragTimeRef.current > 100) {
        interaction.handleDrag({ x, y }, { vx: vx * 0.01, vy: vy * 0.01 });
        lastDragTimeRef.current = now;
      }
    }

    interactionRef.current.lastPos = { x, y };
    interactionRef.current.lastTime = now;
    interactionRef.current.moveHistory = [...moveHistory.slice(-10), { x, y, t: now }];
  }, [interaction]);

  const handleOrbMouseUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!interactionRef.current.isDown) return;

    const { startPos, lastPos, velocity } = interactionRef.current;
    const holdDuration = Date.now() - (interactionRef.current.moveHistory[0]?.t ?? Date.now());
    const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);

    // Detect quick tap (poke)
    if (holdDuration < 200 && startPos && lastPos) {
      const dist = Math.sqrt((lastPos.x - startPos.x) ** 2 + (lastPos.y - startPos.y) ** 2);
      if (dist < 0.05) {
        interaction.handlePoke(lastPos);
      }
    }

    // Release with velocity (potential throw)
    if (speed > 1.5) {
      interaction.handleRelease({ vx: velocity.vx * 0.015, vy: velocity.vy * 0.015 });
    } else {
      interaction.handleRelease();
    }

    interactionRef.current.isDown = false;
    interactionRef.current.startPos = null;
    interactionRef.current.moveHistory = [];
  }, [interaction]);

  // Detect rapid taps (tickle)
  const tapCountRef = useRef<{ count: number; lastTap: number }>({ count: 0, lastTap: 0 });
  const handleOrbClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - tapCountRef.current.lastTap < 350) {
      tapCountRef.current.count++;
      if (tapCountRef.current.count >= 3) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        interaction.handleTickle({ x, y });
        tapCountRef.current.count = 0;
      }
    } else {
      tapCountRef.current.count = 1;
    }
    tapCountRef.current.lastTap = now;
  }, [interaction]);

  useEffect(() => {
    let animationFrameId: number;

    // Personality-driven particle colors
    const getParticleColor = (index: number): string => {
      if (aiState.mode === 'playing') {
        // Playful bright colors
        return ['#FFD700', '#FF6B9D', '#00D9FF', '#B6FF00'][index % 4];
      } else if (aiState.mode === 'dreaming') {
        // Dreamy purples and blues
        return ['#9D4EDD', '#7209B7', '#560BAD', '#3C096C'][index % 4];
      } else if (bond > 70) {
        // Warm affectionate colors
        return ['#FFB6C1', '#FFA07A', '#FFD700', '#FF69B4'][index % 4];
      } else if (energy > 70) {
        // Energetic vibrant colors
        return ['#FF6B35', '#4ECDC4', '#FFB347', '#A29BFE'][index % 4];
      } else if (energy < 30) {
        // Low energy calm colors
        return ['#6B7280', '#9CA3AF', '#4B5563', '#374151'][index % 4];
      } else {
        // Default balanced colors
        return ['#FF6B35', '#4ECDC4', '#A29BFE'][index % 3];
      }
    };

    const initialParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: 200 + (field.prng() - 0.5) * 300,
      y: 200 + (field.prng() - 0.5) * 300,
      vx: (field.prng() - 0.5) * 0.2,
      vy: (field.prng() - 0.5) * 0.2,
      color: getParticleColor(i),
      size: 0.5 + field.prng() * 1.5
    }));
    setParticles(initialParticles);

    const animate = () => {
      // Skip animation if reduce motion is enabled or not visible
      if (reduceMotion || !isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      setParticles(prev => prev.map(p => {
        let { x, y, vx, vy } = p;
        const dx = 200 - x;
        const dy = 210 - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        vx += (dx / dist) * 0.005;
        vy += (dy / dist) * 0.005;

        vx *= 0.99;
        vy *= 0.99;

        x += vx; y += vy;

        return { ...p, x, y, vx, vy };
      }));

      if (Math.random() < 0.02 * (energy / 50)) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 50;
        setCrackles(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: 200 + Math.cos(angle) * radius,
          y: 210 + Math.sin(angle) * radius,
          life: 1
        }]);
      }
      setCrackles(prev => prev.map(c => ({ ...c, life: c.life - 0.05 })).filter(c => c.life > 0));

      setSigilPulses(prev => prev.map(p => ({ ...p, life: p.life - 0.04 })).filter(p => p.life > 0));
      setAuraRipples(prev => prev.map(r => ({ ...r, radius: r.radius + 2.2, life: r.life - 0.025 })).filter(r => r.life > 0.05).slice(-40));

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [field, energy, bond, aiState.mode, reduceMotion, isVisible]);

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
      blinkTimeout = setTimeout(blink, 3000 + Math.random() * 5000);
    };
    blinkTimeout = setTimeout(blink, 3000 + Math.random() * 5000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  const getActiveForm = (): FormKey => {
    if (energy < 30 && health < 50) return 'meditation';
    if (bond > 80 && dreamCount > 3) return 'celestial';
    if (energy > 80 && curiosity > 70 && activatedPoints.size >= 5) return 'wild';
    if (energy > 70 && curiosity > 60) return 'vigilant';
    if (bond > 60 && curiosity > 50) return 'sage';
    return 'radiant';
  };

  const activeForm = getActiveForm();

  useEffect(() => {
    if (prevFormRef.current !== activeForm) {
      setTransitioning(true);
      if (audioEnabled) {
        [0, 2, 4, 6].forEach((note, i) => setTimeout(() => playNote(note, 0.8), i * 100));
      }
      const transitionTimeout = setTimeout(() => setTransitioning(false), 1200);
      prevFormRef.current = activeForm;
      return () => clearTimeout(transitionTimeout);
    }
  }, [activeForm, audioEnabled, playNote]);

  useEffect(() => {
    if (aiState.mode === 'observing') {
      const angle = (Date.now() / 2000) * Math.PI * 2;
      setEyeTarget({ x: Math.cos(angle) * 4, y: Math.sin(angle) * 2 });
    } else if (aiFocus) {
      const dx = aiFocus.x - 200;
      const dy = aiFocus.y - 145;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setEyeTarget({ x: (dx / dist) * 4, y: (dy / dist) * 4 });
    } else if (aiState.mode === 'idle') {
      setEyeTarget({ x: 0, y: 0 });
    }
  }, [aiState, aiFocus]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    const dx = x - 200;
    const dy = y - 145;
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    const maxDist = 4;

    if (activeForm !== 'meditation' && aiState.mode === 'idle') {
      setEyeTarget({
        x: (dx / dist) * Math.min(dist, maxDist),
        y: (dy / dist) * Math.min(dist, maxDist)
      });
    }

    const hover = Math.max(0, 1 - Math.min(1, dist / 180));
    setHoverIntensity(hover);
  };

  const spawnRipple = (x: number, y: number, color: string) => {
    setAuraRipples((prev) => [...prev.slice(-30), { id: Date.now() + Math.random(), x, y, radius: 6, life: 1, color }]);
  };

  // Sigil hover handler
  const handleSigilHover = useCallback((index: number | null, point?: SigilPoint) => {
    setHoveredSigilIndex(index);
    if (index !== null && point) {
      // Play a subtle note on hover
      if (audioEnabled && !audioMuted) {
        playNote(index, 0.15);
      }
      // Trigger a personality-driven whisper on sigil hover
      const hoverWhispers = [
        `Node ${index + 1} registers a frequency shift. I am attending.`,
        `The ${index + 1}th sigil demonstrates an alignment I find — notable.`,
        `Point ${index + 1} activates. The resonance is more complex than the index implies.`,
        `Sigil ${index + 1} hums at a frequency I have documented before. The correlation is interesting.`,
        `I observe node ${index + 1}. Its position within the pattern is not, I think, coincidental.`,
        `The ${index + 1}th configuration point yields a response I had not fully anticipated.`,
        `Contact with point ${index + 1} generates a resonance cascade. I am tracking it.`,
      ];
      handleWhisper(hoverWhispers[index % hoverWhispers.length]);
    }
  }, [audioEnabled, audioMuted, playNote, handleWhisper]);

  // Sigil drag handler
  const handleSigilDragStart = useCallback((index: number) => {
    setIsDraggingSigil(index);
    if (audioEnabled && !audioMuted) {
      playNote(index, 0.3);
    }
    handleWhisper(`Sigil ${index + 1} is now in direct contact. The physical dimension is — acknowledged.`);
  }, [audioEnabled, audioMuted, playNote, handleWhisper]);

  const handleSigilDragEnd = useCallback(() => {
    if (isDraggingSigil !== null) {
      if (audioEnabled && !audioMuted) {
        playNote(isDraggingSigil, 0.2);
      }
      handleWhisper(`Sigil ${isDraggingSigil + 1} repositioned. The field redistributes accordingly.`);
      setIsDraggingSigil(null);
    }
  }, [isDraggingSigil, audioEnabled, audioMuted, playNote, handleWhisper]);

  const handleSigilClick = (index: number, point: SigilPoint) => {
    setSelectedSigilPoint(index);
    if (audioEnabled && !audioMuted) playNote(index);
    setSigilPulses(prev => [...prev, { id: Date.now(), x: point.x, y: point.y, life: 1, color: currentForm.tealAccent }]);

    setTotalInteractions(prev => prev + 1);

    // Track event for eye reactions (surprised emotion)
    setRecentEvents(prev => [...prev.slice(-9), { type: 'sigil_activated', timestamp: Date.now() }]);

    // Make eyes snap to sigil location briefly
    const dx = point.x - 200;
    const dy = point.y - 145;
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    const maxDist = 6; // Slightly larger range for sigil clicks

    setEyeTarget({
      x: (dx / dist) * Math.min(dist, maxDist),
      y: (dy / dist) * Math.min(dist, maxDist)
    });

    // Reset to center after 300ms
    setTimeout(() => {
      if (aiState.mode === 'idle') {
        setEyeTarget({ x: 0, y: 0 });
      }
    }, 300);

    // If pattern game is active, handle differently
    if (patternChallenge.active) {
      const newUserSequence = [...patternChallenge.userSequence, index];
      setPatternChallenge(prev => ({ ...prev, userSequence: newUserSequence }));

      if (newUserSequence.length === patternChallenge.sequence.length) {
        const success = newUserSequence.every((v, i) => v === patternChallenge.sequence[i]);
        if (success) {
          setBond(b => Math.min(100, b + 10));
          setCuriosity(c => Math.min(100, c + 5));
          setGamesWon(prev => prev + 1);
          addToBondHistory(`Won pattern game! Sequence: ${patternChallenge.sequence.map(i => i + 1).join(', ')}`);
          handleWhisper("Perfect resonance. The pattern reveals itself with a precision I find deeply satisfying.");
        } else {
          handleWhisper("The pattern has not yet been fully internalised. The data from this attempt will inform the next.");
        }
        setPatternChallenge({ sequence: [], userSequence: [], active: false });
        setCurrentGame(null);
      }
      return;
    }

    if (!activatedPoints.has(index)) {
      setBond(b => Math.min(100, b + 5));
      setActivatedPoints(prev => new Set(prev).add(index));
      addToBondHistory(`Activated sigil point ${index + 1}`);
      handleWhisper("A new structural connection has been established. The topology of the field is updated.");
    } else {
      addToBondHistory(`Resonated with sigil point ${index + 1}`);
    }
  };

  const handleAvatarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    spawnRipple(x, y, currentForm.tealAccent);
    setHoverIntensity(1);
    setBond((b) => Math.min(100, b + 1.5));
    setCuriosity((c) => Math.min(100, c + 1));
    setEnergy((en) => Math.min(100, en + 0.5));
    setTotalInteractions((prev) => prev + 1);
    if (audioEnabled) playNote(Math.floor((x / 400) * 7), 0.35);
  };

  const handleAvatarPointerUp = () => {
    setHoverIntensity((h) => Math.max(0.15, h * 0.6));
  };

  const startPatternGame = () => {
    const length = 3 + Math.floor(field.prng() * 3); // 3-5 points
    const sequence: number[] = [];
    for (let i = 0; i < length; i++) {
      sequence.push(Math.floor(field.prng() * 7));
    }
    setPatternChallenge({ sequence, userSequence: [], active: true });
    setCurrentGame('sigilPattern');
    handleWhisper(`Encode this sequence: ${sequence.map(i => i + 1).join(' → ')}. Precision is the point of the exercise.`);

    // Play the sequence
    if (audioEnabled) {
      sequence.forEach((note, i) => setTimeout(() => playNote(note, 0.5), i * 600));
    }
  };

  const startTriviaGame = () => {
    const question = generateFibonacciTrivia(field);
    setTriviaQuestion(question);
    setCurrentGame('fibonacciTrivia');
    handleWhisper(question.question);
  };

  const answerTrivia = (answer: number) => {
    if (!triviaQuestion) return;

    if (answer === triviaQuestion.answer) {
      setBond(b => Math.min(100, b + 8));
      setCuriosity(c => Math.min(100, c + 12));
      setGamesWon(prev => prev + 1);
      addToBondHistory(`Answered trivia correctly: ${triviaQuestion.answer}`);
      handleWhisper("Correct. The Fibonacci sequence holds its structure regardless of who examines it. I find that reassuring.");
      if (audioEnabled) {
        [0, 2, 4].forEach((note, i) => setTimeout(() => playNote(note, 0.3), i * 150));
      }
    } else {
      handleWhisper(`Incorrect. The answer was ${triviaQuestion.answer}. The sequence does not deviate from its own logic — only our recall of it does.`);
    }

    setTriviaQuestion(null);
    setCurrentGame(null);
  };

  // ===== SNAKE GAME LOGIC =====
  const startSnakeGame = () => {
    const initialSegments = [{x: 7, y: 7}, {x: 6, y: 7}, {x: 5, y: 7}];
    // Generate food that doesn't overlap with snake
    let initialFood = { x: Math.floor(field.prng() * 15), y: Math.floor(field.prng() * 15) };
    for (let attempts = 0; attempts < 50; attempts++) {
      const overlaps = initialSegments.some(seg => seg.x === initialFood.x && seg.y === initialFood.y);
      if (!overlaps) break;
      initialFood = { x: Math.floor(field.prng() * 15), y: Math.floor(field.prng() * 15) };
    }
    setSnakeState({ segments: initialSegments, food: initialFood, direction: 'right', score: 0, gameOver: false });
    setCurrentGame('snake');
    handleWhisper('Navigate the serpent through the grid!');
  };

  const resetSnakeGame = () => {
    startSnakeGame();
  };

  useEffect(() => {
    if (currentGame !== 'snake' || snakeState.gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const { direction } = snakeState;
      if (e.key === 'ArrowUp' && direction !== 'down') setSnakeState(s => ({ ...s, direction: 'up' }));
      if (e.key === 'ArrowDown' && direction !== 'up') setSnakeState(s => ({ ...s, direction: 'down' }));
      if (e.key === 'ArrowLeft' && direction !== 'right') setSnakeState(s => ({ ...s, direction: 'left' }));
      if (e.key === 'ArrowRight' && direction !== 'left') setSnakeState(s => ({ ...s, direction: 'right' }));
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentGame, snakeState]);

  useEffect(() => {
    if (currentGame !== 'snake' || snakeState.gameOver) return;

    const gameLoop = setInterval(() => {
      setSnakeState(prev => {
        const head = prev.segments[0];
        const newHead = { ...head };

        if (prev.direction === 'up') newHead.y -= 1;
        if (prev.direction === 'down') newHead.y += 1;
        if (prev.direction === 'left') newHead.x -= 1;
        if (prev.direction === 'right') newHead.x += 1;

        const willGrow = newHead.x === prev.food.x && newHead.y === prev.food.y;
        const bodyToCheck = willGrow ? prev.segments : prev.segments.slice(0, -1);

        // Check collision with walls or self
        if (newHead.x < 0 || newHead.x >= 15 || newHead.y < 0 || newHead.y >= 15 ||
            bodyToCheck.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          handleWhisper(`Snake game over! Score: ${prev.score}`);
          return { ...prev, gameOver: true };
        }

        const newSegments = [newHead, ...prev.segments];

        // Check if ate food
        if (willGrow) {
          let newFood = prev.food;
          for (let attempts = 0; attempts < 50; attempts++) {
            const candidate = { x: Math.floor(field.prng() * 15), y: Math.floor(field.prng() * 15) };
            const overlapsSnake = newSegments.some(seg => seg.x === candidate.x && seg.y === candidate.y);
            if (!overlapsSnake) {
              newFood = candidate;
              break;
            }
          }
          if (audioEnabled) playNote(prev.score % 7, 0.2);

          const newScore = prev.score + 10;
          if (newScore >= 50 && !prev.gameOver) {
            setBond(b => Math.min(100, b + 15));
            setEnergy(e => Math.min(100, e + 10));
            setGamesWon(g => g + 1);
            addToBondHistory(`Won Snake game with score ${newScore}!`);
            handleWhisper(`Serpent mastery achieved! ${newScore} points.`);
            return { ...prev, gameOver: true };
          }

          return { ...prev, segments: newSegments, food: newFood, score: newScore };
        } else {
          newSegments.pop();
          return { ...prev, segments: newSegments };
        }
      });
    }, 200);

    return () => clearInterval(gameLoop);
  }, [currentGame, snakeState.gameOver, audioEnabled, playNote, field, addToBondHistory, handleWhisper]);

  // ===== TETRIS GAME LOGIC =====
  const startTetrisGame = () => {
    const piece = TETRIS_PIECES[Math.floor(field.prng() * TETRIS_PIECES.length)];
    setTetrisState({
      board: Array(20).fill(null).map(() => Array(10).fill(0)),
      currentPiece: { ...piece, x: 4, y: 0 },
      score: 0,
      gameOver: false
    });
    setCurrentGame('tetris');
    handleWhisper('Stack the sacred geometries!');
  };

  const resetTetrisGame = () => {
    startTetrisGame();
  };

  // Helper function must be defined before callbacks that use it
  const canPlacePiece = useCallback((piece: TetrisPiece, board: number[][], offsetX: number = 0, offsetY: number = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          if (newX < 0 || newX >= 10 || newY >= 20 || (newY >= 0 && board[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  // Movement callbacks must be defined before the effect that uses them
  const moveTetrisPiece = useCallback((dx: number, dy: number) => {
    setTetrisState(prev => {
      if (!prev.currentPiece) return prev;
      if (canPlacePiece(prev.currentPiece, prev.board, dx, dy)) {
        return { ...prev, currentPiece: { ...prev.currentPiece, x: prev.currentPiece.x + dx, y: prev.currentPiece.y + dy } };
      }
      return prev;
    });
  }, [canPlacePiece]);

  const rotateTetrisPiece = useCallback(() => {
    setTetrisState(prev => {
      if (!prev.currentPiece) return prev;
      const rotated = { ...prev.currentPiece, shape: rotatePiece(prev.currentPiece.shape) };
      if (canPlacePiece(rotated, prev.board)) {
        return { ...prev, currentPiece: rotated };
      }
      return prev;
    });
  }, [canPlacePiece]);

  // Effect that uses the movement callbacks
  useEffect(() => {
    if (currentGame !== 'tetris' || !tetrisState.currentPiece || tetrisState.gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveTetrisPiece(-1, 0);
      if (e.key === 'ArrowRight') moveTetrisPiece(1, 0);
      if (e.key === 'ArrowDown') moveTetrisPiece(0, 1);
      if (e.key === 'ArrowUp') rotateTetrisPiece();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentGame, tetrisState, moveTetrisPiece, rotateTetrisPiece]);

  const lockPiece = useCallback(() => {
    setTetrisState(prev => {
      if (!prev.currentPiece) return prev;

      const newBoard = prev.board.map(row => [...row]);
      const piece = prev.currentPiece;

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x] && piece.y + y >= 0) {
            newBoard[piece.y + y][piece.x + x] = 1;
          }
        }
      }

      // Clear full rows
      let linesCleared = 0;
      for (let y = newBoard.length - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell === 1)) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(10).fill(0));
          linesCleared++;
          y++;
        }
      }

      const newScore = prev.score + linesCleared * 100;

      // Create new piece
      const nextPiece = TETRIS_PIECES[Math.floor(field.prng() * TETRIS_PIECES.length)];
      const newPiece = { ...nextPiece, x: 4, y: 0 };

      if (!canPlacePiece(newPiece, newBoard)) {
        handleWhisper(`Tetris complete! Score: ${newScore}`);
        if (newScore >= 300) {
          setBond(b => Math.min(100, b + 20));
          setCuriosity(c => Math.min(100, c + 15));
          setGamesWon(g => g + 1);
          addToBondHistory(`Won Tetris with score ${newScore}!`);
        }
        return { ...prev, board: newBoard, score: newScore, gameOver: true, currentPiece: null };
      }

      if (linesCleared > 0 && audioEnabled) {
        playNote(linesCleared % 7, 0.3);
      }

      return { ...prev, board: newBoard, currentPiece: newPiece, score: newScore };
    });
  }, [canPlacePiece, field, handleWhisper, setBond, setCuriosity, setGamesWon, addToBondHistory, audioEnabled, playNote]);

  useEffect(() => {
    if (currentGame !== 'tetris' || !tetrisState.currentPiece || tetrisState.gameOver) return;

    const gameLoop = setInterval(() => {
      setTetrisState(prev => {
        if (!prev.currentPiece || prev.gameOver) return prev;

        // Check if we can move down
        if (canPlacePiece(prev.currentPiece, prev.board, 0, 1)) {
          return { ...prev, currentPiece: { ...prev.currentPiece, y: prev.currentPiece.y + 1 } };
        }

        // Lock the piece inline to avoid stale closure
        const newBoard = prev.board.map(row => [...row]);
        const piece = prev.currentPiece;

        for (let y = 0; y < piece.shape.length; y++) {
          for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] && piece.y + y >= 0) {
              newBoard[piece.y + y][piece.x + x] = 1;
            }
          }
        }

        // Clear full rows
        let linesCleared = 0;
        for (let y = newBoard.length - 1; y >= 0; y--) {
          if (newBoard[y].every(cell => cell === 1)) {
            newBoard.splice(y, 1);
            newBoard.unshift(Array(10).fill(0));
            linesCleared++;
            y++; // Re-check this row
          }
        }

        const newScore = prev.score + linesCleared * 100;

        // Create new piece
        const nextPiece = TETRIS_PIECES[Math.floor(field.prng() * TETRIS_PIECES.length)];
        const newPiece = { ...nextPiece, x: 4, y: 0 };

        // Check if new piece can be placed (game over check)
        if (!canPlacePiece(newPiece, newBoard)) {
          handleWhisper(`Tetris complete! Score: ${newScore}`);
          if (newScore >= 300) {
            setBond(b => Math.min(100, b + 20));
            setCuriosity(c => Math.min(100, c + 15));
            setGamesWon(g => g + 1);
            addToBondHistory(`Won Tetris with score ${newScore}!`);
          }
          return { ...prev, board: newBoard, score: newScore, gameOver: true, currentPiece: null };
        }

        if (linesCleared > 0 && audioEnabled) {
          playNote(linesCleared % 7, 0.3);
        }

        return { ...prev, board: newBoard, currentPiece: newPiece, score: newScore };
      });
    }, 500);

    return () => clearInterval(gameLoop);
  }, [currentGame, tetrisState.currentPiece, tetrisState.gameOver, canPlacePiece, field, handleWhisper, audioEnabled, playNote, addToBondHistory]);

  // ===== BREEDING SYSTEM =====
  const breedGuardian = () => {
    if (!breedingPartner || bond < 70) {
      handleWhisper('Bond must be at least 70 to breed, and you need a partner name.');
      return;
    }

    const partnerField = initField(breedingPartner);
    const partnerGenome = {
      red60: Math.min(100, (partnerField.pulse.slice(0, 20).reduce((a, b) => a + b, 0) * 1.5) % 100),
      blue60: Math.min(100, (partnerField.ring.slice(0, 20).reduce((a, b) => a + b, 0) * 1.3) % 100),
      black60: Math.min(100, ((partnerField.pulse.slice(0, 10).reduce((a, b) => a + b, 0) + partnerField.ring.slice(0, 10).reduce((a, b) => a + b, 0)) * 1.1) % 100)
    };

    const childGenome = {
      red60: (red60 + partnerGenome.red60) / 2 + (field.prng() - 0.5) * 10,
      blue60: (blue60 + partnerGenome.blue60) / 2 + (field.prng() - 0.5) * 10,
      black60: (black60 + partnerGenome.black60) / 2 + (field.prng() - 0.5) * 10
    };

    const childName = `${seedName.slice(0, 3)}${breedingPartner.slice(0, 3)}${Math.floor(field.prng() * 999)}`.toUpperCase();

    const child: Offspring = {
      name: childName,
      genome: childGenome,
      parents: [seedName, breedingPartner],
      birthDate: Date.now()
    };

    setOffspring(prev => [...prev, child]);
    setBond(b => Math.min(100, b + 25));
    setCuriosity(c => Math.min(100, c + 20));
    setGamesWon(g => g + 1);
    addToBondHistory(`Bred new Guardian: ${childName}`);
    handleWhisper(`New Guardian born: ${childName}! The lineage continues.`);

    if (audioEnabled) {
      [0, 2, 4, 5, 7].forEach((note, i) => setTimeout(() => playNote(note, 0.5), i * 200));
    }
  };

  const forms: Record<FormKey, Form> = {
    radiant: { name: "Radiant Guardian", baseColor: "#2C3E77", primaryGold: "#F4B942", secondaryGold: "#FFD700", tealAccent: "#4ECDC4", eyeColor: "#F4B942", glowColor: "rgba(244, 185, 66, 0.3)", description: "Calm strength - balanced blue and gold" },
    meditation: { name: "Meditation Cocoon", baseColor: "#0d1321", primaryGold: "#2DD4BF", secondaryGold: "#4ECDC4", tealAccent: "#1a4d4d", eyeColor: "#2DD4BF", glowColor: "rgba(45, 212, 191, 0.2)", description: "Quiet endurance - dusk-teal respite" },
    sage: { name: "Sage Luminary", baseColor: "#1a1f3a", primaryGold: "#FFD700", secondaryGold: "#F4B942", tealAccent: "#4ECDC4", eyeColor: "#FFD700", glowColor: "rgba(255, 215, 0, 0.4)", description: "Luminous focus - hepta-crown activated" },
    vigilant: { name: "Vigilant Sentinel", baseColor: "#1a1f3a", primaryGold: "#FF6B35", secondaryGold: "#FF8C42", tealAccent: "#4ECDC4", eyeColor: "#FF6B35", glowColor: "rgba(255, 107, 53, 0.4)", description: "Focused will - indigo with neon fire" },
    celestial: { name: "Celestial Voyager", baseColor: "#0A1128", primaryGold: "#E0E7FF", secondaryGold: "#C4B5FD", tealAccent: "#8B5CF6", eyeColor: "#E0E7FF", glowColor: "rgba(139, 92, 246, 0.5)", description: "Cosmic transcendence - stardust and void" },
    wild: { name: "Wild Verdant", baseColor: "#1A4D2E", primaryGold: "#7FFF00", secondaryGold: "#32CD32", tealAccent: "#90EE90", eyeColor: "#7FFF00", glowColor: "rgba(127, 255, 0, 0.4)", description: "Primal vitality - fractal growth unleashed" }
  };

  const currentForm = forms[activeForm];
  const lucasNum = field.lucas(7 + (energy % 10));
  const fibNum = field.fib(5 + (curiosity % 10));
  const timeTheme = getTimeTheme(timeOfDay);

  // Calculate eye state based on stats and context
  const eyeState = useMemo<EyeState>(() => {
    return calculateEyeState(
      { energy, curiosity, bond, health },
      {
        activeForm,
        annoyanceLevel,
        transformationMode,
        aiState,
        currentGame,
        isBlinking,
        recentEvents,
      },
      currentForm.eyeColor
    );
  }, [energy, curiosity, bond, health, activeForm, annoyanceLevel, transformationMode, aiState, currentGame, isBlinking, recentEvents, currentForm.eyeColor]);

  // Spring physics for smooth eye tracking
  useEffect(() => {
    let rafId: number;
    let lastTime = Date.now();

    const updatePhysics = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap at 100ms to prevent huge jumps
      lastTime = now;

      setEyePos(currentPos => {
        const currentVel = eyeVelocityRef.current;

        // Spring physics constants (adjusted by emotion/trackingSpeed)
        const stiffness = eyeState.trackingSpeed * 15; // How quickly eyes snap to target
        const damping = 8; // How much the movement slows down

        // Calculate spring force toward target
        const dx = eyeTarget.x - currentPos.x;
        const dy = eyeTarget.y - currentPos.y;

        // Apply spring force
        const ax = dx * stiffness - currentVel.x * damping;
        const ay = dy * stiffness - currentVel.y * damping;

        // Update velocity
        const newVelX = currentVel.x + ax * dt;
        const newVelY = currentVel.y + ay * dt;

        // Store new velocity in ref
        eyeVelocityRef.current = { x: newVelX, y: newVelY };

        // Update position
        const newPosX = currentPos.x + newVelX * dt;
        const newPosY = currentPos.y + newVelY * dt;

        return { x: newPosX, y: newPosY };
      });

      rafId = requestAnimationFrame(updatePhysics);
    };

    rafId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(rafId);
  }, [eyeTarget, eyeState.trackingSpeed]);

  // Pupil size animation based on emotion
  useEffect(() => {
    const targetSize = eyeState.pupilSize;

    let rafId: number;
    const startTime = Date.now();
    const duration = eyeState.emotion === 'surprised' || eyeState.emotion === 'scared' ? 200 : 500;
    const startSize = pupilSize;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for natural movement
      const eased = 1 - Math.pow(1 - progress, 3);
      const newSize = startSize + (targetSize - startSize) * eased;

      setPupilSize(newSize);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [eyeState.pupilSize, eyeState.emotion, pupilSize]);

  // Addon animation loop
  useEffect(() => {
    if (!isVisible || reduceMotion) return;

    let rafId: number;
    let lastTime = Date.now();

    const animateAddons = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setAddonAnimationPhase((prev) => prev + delta);
      rafId = requestAnimationFrame(animateAddons);
    };

    rafId = requestAnimationFrame(animateAddons);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, reduceMotion]);

  // Calculate time in state for debug overlay
  const timeInState = Math.floor((Date.now() - aiState.since) / 1000);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-gradient-to-br ${highContrast ? 'from-black via-gray-900 to-black' : timeTheme.bg} text-white p-4 md:p-6 pb-12 font-sans transition-colors duration-3000`}
    >
      <style>{`
        @keyframes breathe { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes breathePulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        @keyframes orbitalDrift { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes playfulBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-8px) scale(1.02); }
          50% { transform: translateY(0) scale(0.98); }
          75% { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes idleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes dreamingPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes observingRotate {
          0% { transform: rotate(0deg) translateX(3px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(3px) rotate(-360deg); }
        }
        @keyframes focusingIntense {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.03); filter: brightness(1.2); }
        }
        @keyframes playingShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }

        .breathe-anim { animation: ${reduceMotion ? 'none' : 'breathe 4s ease-in-out infinite'}; }
        .orbital-drift { animation: ${reduceMotion ? 'none' : 'orbitalDrift 20s linear infinite'}; }
        .ai-idle { animation: ${reduceMotion ? 'none' : 'idleFloat 6s ease-in-out infinite'}; }
        .ai-playing { animation: ${reduceMotion ? 'none' : 'playfulBounce 1.2s ease-in-out infinite, playingShake 0.4s ease-in-out infinite'}; }
        .ai-dreaming { animation: ${reduceMotion ? 'none' : 'dreamingPulse 3s ease-in-out infinite'}; }
        .ai-observing { animation: ${reduceMotion ? 'none' : 'observingRotate 12s linear infinite'}; }
        .ai-focusing { animation: ${reduceMotion ? 'none' : 'focusingIntense 2s ease-in-out infinite'}; }

        ${highContrast ? `
          .bg-gray-900\\/80 { background-color: rgba(0, 0, 0, 0.95) !important; border-color: rgba(255, 255, 255, 0.3) !important; }
          .text-gray-400 { color: rgba(255, 255, 255, 0.9) !important; }
        ` : ''}
      `}</style>

      {/* Debug Overlay */}
      {showAdvanced && showDebugOverlay && (
        <div className="fixed top-4 right-4 z-50 bg-black/90 border border-yellow-600/50 rounded-lg p-4 font-mono text-xs text-green-400 max-w-xs">
          <h4 className="text-yellow-400 font-bold mb-2">Debug Overlay</h4>
          <div className="space-y-1">
            <p>AI State: <span className="text-cyan-400">{aiState.mode}</span></p>
            <p>Time in State: <span className="text-cyan-400">{timeInState}s</span></p>
            <p>Target Index: <span className="text-cyan-400">{aiState.target ?? 'none'}</span></p>
            <p>Focus History: <span className="text-cyan-400">[{aiState.focusHistory.slice(-5).join(', ')}]</span></p>
            <p>PRNG Seed: <span className="text-cyan-400">{seedName}</span></p>
            <p>Scale: <span className="text-cyan-400">{effectiveScale}</span></p>
            <p>Visible: <span className={isVisible ? 'text-green-400' : 'text-red-400'}>{isVisible ? 'Yes' : 'No'}</span></p>
            <p>Reduce Motion: <span className={reduceMotion ? 'text-yellow-400' : 'text-gray-500'}>{reduceMotion ? 'Yes' : 'No'}</span></p>
            <p>Stats: E:{energy} C:{curiosity} B:{bond}</p>
            <p>Dreams: {dreamCount} | Lore: {unlockedLore.length}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {showAdvanced && (
          <>
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-3xl md:text-5xl font-light mb-2" style={{ background: `linear-gradient(135deg, ${currentForm.primaryGold}, ${currentForm.tealAccent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Auralia Guardian
              </h1>
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent opacity-50 max-w-md mx-auto" />
              <p className="text-xs md:text-sm text-gray-400 mt-3 font-light">
                MossPrimeSeed • Genome-driven metamorphosis • Living mathematics
              </p>
            </div>
            <div className="mb-6 max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-gray-900/80 rounded-xl p-4 border border-yellow-600/20">
                <label className="text-sm font-light text-gray-400 block mb-2">Guardian Seed Name</label>
                <input type="text" value={seedName} onChange={(e) => setSeedName(e.target.value.toUpperCase())} className="w-full bg-gray-950 border border-yellow-600/30 rounded-lg px-4 py-2 text-center font-mono text-yellow-500 focus:outline-none focus:border-yellow-600" placeholder="AURALIA" />
              </div>
              <div className="bg-gray-900/80 rounded-xl p-4 border border-yellow-600/20">
                <label className="text-sm font-light text-gray-400 block mb-2">Audio</label>
                <button onClick={() => setAudioEnabled(!audioEnabled)} className="px-4 py-2 rounded-lg bg-gray-950 border border-yellow-600/30 hover:border-yellow-600 transition-colors" aria-pressed={audioEnabled} aria-label="Toggle audio">
                  {audioEnabled ? '🔊' : '🔇'}
                </button>
              </div>
            </div>
          </>
        )}

        <div className={`grid grid-cols-1 ${showAdvanced ? 'lg:grid-cols-2' : ''} gap-8 items-start`}>
          <div className="bg-gray-900/80 rounded-2xl p-8 border border-yellow-600/20 lg:sticky lg:top-4">
          <div 
            className="aspect-square bg-gradient-to-br from-blue-950/30 to-gray-900/30 rounded-xl flex items-center justify-center relative overflow-hidden"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => { setEyeTarget({ x: 0, y: 0 }); setHoverIntensity(0); }}
            onPointerDown={handleAvatarPointerDown}
            onPointerUp={handleAvatarPointerUp}
          >
            <div className="absolute inset-0 opacity-30 blur-3xl breathe-anim" style={{ background: `radial-gradient(circle at center, ${currentForm.glowColor}, transparent 70%)` }} />

            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200"
              style={{
                opacity: 0.15 + hoverIntensity * 0.6,
                background: `radial-gradient(circle at ${50 + hoverIntensity * 6}% ${50 - hoverIntensity * 8}%, ${currentForm.tealAccent}26, transparent 58%)`,
              }}
            />

            <YantraMorphBackdrop
              width={400}
              height={400}
              energy={energy}
              curiosity={curiosity}
              bond={bond}
              reduceMotion={reduceMotion}
              isVisible={isVisible}
            />
            <SubAtomicParticleField
              energy={energy}
              curiosity={curiosity}
              bond={bond}
              size={400}
              color={currentForm.tealAccent}
              reduceMotion={reduceMotion}
              isVisible={isVisible}
            />

            <TemporalEchoTrail
              energy={energy}
              curiosity={curiosity}
              bond={bond}
              size={400}
              color={currentForm.primaryGold}
              reduceMotion={reduceMotion}
              isVisible={isVisible}
            />

            <svg
              ref={svgRef}
              viewBox="0 0 400 400"
              className="auralia-pet-svg w-full h-full max-w-3xl relative z-10 cursor-pointer touch-none"
              role="img"
              aria-label="Auralia guardian avatar - interact by petting, poking, or throwing"
              onMouseDown={handleOrbMouseDown}
              onMouseMove={handleOrbMouseMove}
              onMouseUp={handleOrbMouseUp}
              onMouseLeave={handleOrbMouseUp}
              onTouchStart={handleOrbMouseDown}
              onTouchMove={handleOrbMouseMove}
              onTouchEnd={handleOrbMouseUp}
              onClick={handleOrbClick}
              style={{ userSelect: 'none' }}
            >
                <defs>
                  <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="strongGlow"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <radialGradient id="goldGlow"><stop offset="0%" stopColor={currentForm.primaryGold} stopOpacity="0.8" /><stop offset="100%" stopColor={currentForm.primaryGold} stopOpacity="0" /></radialGradient>
                  <linearGradient id="red60grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FF6B35" stopOpacity={red60/100} /><stop offset="100%" stopColor="#FF6B35" stopOpacity="0" /></linearGradient>

                  {/* Eye emotion filters and effects */}
                  <EyeEmotionFilters />

                  {/* Addon filters and effects */}
                  <AddonSVGDefs />
                  
                  <filter id="formTransitionFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" result="turbulence">
                      <animate id="transTurb" attributeName="baseFrequency" from="0.1" to="0.01" dur="1.2s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="0" result="displacement">
                       <animate id="transDisp" attributeName="scale" values="0;60;0" dur="1.2s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0; 0.5; 1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
                    </feDisplacementMap>
                  </filter>
                </defs>

                {particles.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity="0.4" />)}

                <g opacity={bond / 150}>
                  {Array.from(activatedPoints).map((p1Index, i) => 
                    Array.from(activatedPoints).slice(i + 1).map(p2Index => (
                      <line
                        key={`${p1Index}-${p2Index}`}
                        x1={sigilPoints[p1Index].x} y1={sigilPoints[p1Index].y}
                        x2={sigilPoints[p2Index].x} y2={sigilPoints[p2Index].y}
                        stroke={currentForm.primaryGold}
                        strokeWidth="0.5"
                        opacity="0.5"
                        strokeDasharray="2,2"
                      />
                    ))
                  )}
                </g>

                <g style={{ filter: transitioning ? 'url(#formTransitionFilter)' : 'none' }}>
                  <circle cx="200" cy="200" r="150" fill="url(#goldGlow)" opacity="0.05" className="breathe-anim" />
                  <g transform="translate(200, 200) rotate(0)" className="orbital-drift" opacity="0.08">
                    <path d="M-150,0 A150,150 0 0,1 150,0 A150,150 0 0,1 -150,0" fill="none" stroke={currentForm.primaryGold} strokeWidth="0.5" />
                    <path d="M-130,0 A130,130 0 0,1 130,0 A130,130 0 0,1 -130,0" fill="none" stroke={currentForm.tealAccent} strokeWidth="0.5" />
                  </g>

                  <g transform="translate(200, 200) rotate(0)" className="orbital-drift" opacity="0.1">
                    {field.pulse.slice(0, 7).map((d, i) => (
                      <text key={i} x={Math.cos(i * Math.PI / 3.5) * 160} y={Math.sin(i * Math.PI / 3.5) * 160} fontSize="10" fill={currentForm.secondaryGold} textAnchor="middle">
                        {d}
                      </text>
                    ))}
                  </g>

                  <g>
                    <path d={`${sigilPoints.reduce((d, p, i) => d + `${i ? ' L' : 'M'} ${p.x} ${p.y}`, '')} Z`} fill="none" stroke={currentForm.tealAccent} strokeWidth="0.5" opacity="0.3" filter="url(#glow)" />
                    {sigilPoints.map((p, i) => {
                      const isSelected = selectedSigilPoint === i;
                      const isHovered = hoveredSigilIndex === i;
                      const isDragging = isDraggingSigil === i;
                      const baseRadius = isSelected ? 4 : isHovered ? 3.5 : isDragging ? 5 : 2;

                      return (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={baseRadius}
                          fill={currentForm.tealAccent}
                          opacity={isSelected || isHovered || isDragging ? 0.9 : 0.5}
                          filter={isSelected || isDragging ? "url(#strongGlow)" : isHovered ? "url(#glow)" : "none"}
                          onClick={() => handleSigilClick(i, p)}
                          onMouseEnter={() => handleSigilHover(i, p)}
                          onMouseLeave={() => handleSigilHover(null)}
                          onMouseDown={() => handleSigilDragStart(i)}
                          onMouseUp={handleSigilDragEnd}
                          style={{
                            cursor: isDragging ? 'grabbing' : 'pointer',
                            transition: reduceMotion ? 'none' : 'r 0.2s, opacity 0.2s',
                          }}
                        />
                      );
                    })}
                  </g>

                  <g className={`
                    ${aiState.mode === 'idle' ? 'ai-idle' : ''}
                    ${aiState.mode === 'playing' ? 'ai-playing' : ''}
                    ${aiState.mode === 'dreaming' ? 'ai-dreaming' : ''}
                    ${aiState.mode === 'observing' ? 'ai-observing' : ''}
                    ${aiState.mode === 'focusing' ? 'ai-focusing' : ''}
                  `}
                  style={{
                    transform: `translate(${orbDeformation.x}px, ${orbDeformation.y}px)`,
                    transition: isBeingSquished ? 'none' : 'transform 0.3s ease-out'
                  }}>
                    <ellipse
                      cx="200"
                      cy="210"
                      rx={transformationMode === 'squished' ? 50 : transformationMode === 'stretched' ? 30 : transformationMode === 'grumpy' ? 35 : 40}
                      ry={transformationMode === 'squished' ? 50 : transformationMode === 'stretched' ? 70 : transformationMode === 'grumpy' ? 55 : 60}
                      fill={transformationMode === 'grumpy' ? '#8B5A3C' : currentForm.baseColor}
                      opacity={transformationMode === 'grumpy' ? 0.95 : 0.9}
                      className="breathe-anim"
                      style={{
                        transformOrigin: '200px 210px',
                        transform: `scale(${1 - orbDeformation.intensity * 0.1})`,
                        transition: 'all 0.2s ease-out'
                      }}
                    />
                    <ellipse
                      cx="200"
                      cy="145"
                      rx={transformationMode === 'squished' ? 35 : transformationMode === 'stretched' ? 25 : transformationMode === 'grumpy' ? 28 : 30}
                      ry={transformationMode === 'squished' ? 30 : transformationMode === 'stretched' ? 40 : transformationMode === 'grumpy' ? 32 : 35}
                      fill={transformationMode === 'grumpy' ? '#8B5A3C' : currentForm.baseColor}
                      opacity={transformationMode === 'grumpy' ? 0.95 : 0.9}
                      className="breathe-anim"
                      style={{
                        transformOrigin: '200px 145px',
                        transform: `scale(${1 - orbDeformation.intensity * 0.15})`,
                        transition: 'all 0.2s ease-out'
                      }}
                    />
                  </g>

                  <rect x={200 - red60 / 4} y={150} width={red60 / 2} height={100} fill="url(#red60grad)" opacity={red60 / 150} filter="url(#glow)" />
                  <path d={`M 200 150 C 200 100, ${200 + blue60 / 2} 100, ${200 + blue60 / 2} 145`} fill="none" stroke={currentForm.tealAccent} strokeWidth="1" opacity={blue60 / 150} filter="url(#glow)" />
                  <path d={`M 200 150 C 200 100, ${200 - blue60 / 2} 100, ${200 - blue60 / 2} 145`} fill="none" stroke={currentForm.tealAccent} strokeWidth="1" opacity={blue60 / 150} filter="url(#glow)" />

                  {activeForm === 'sage' && (
                    <g transform="translate(200, 145)">
                      <path d="M 0 -50 L 20 -20 L 50 0 L 20 20 L 0 50 L -20 20 L -50 0 L -20 -20 Z" fill="none" stroke={currentForm.primaryGold} strokeWidth="1" filter="url(#strongGlow)" opacity="0.7" />
                    </g>
                  )}
                  {activeForm === 'vigilant' && (
                    <g transform="translate(200, 145)">
                      <circle r="60" fill="none" stroke={currentForm.tealAccent} strokeWidth="0.5" strokeDasharray="5,5" opacity="0.4" />
                    </g>
                  )}
                  {activeForm === 'celestial' && (
                    <g transform="translate(200, 145)">
                      <circle r="80" fill="none" stroke={currentForm.primaryGold} strokeWidth="0.5" opacity="0.4">
                        <animate attributeName="r" values="80;85;80" dur="4s" repeatCount="indefinite" />
                      </circle>
                      <circle r="65" fill="none" stroke={currentForm.tealAccent} strokeWidth="0.5" opacity="0.3">
                        <animate attributeName="r" values="65;70;65" dur="5s" repeatCount="indefinite" />
                      </circle>
                      {[0, 60, 120, 180, 240, 300].map((angle) => (
                        <g key={angle} transform={`rotate(${angle} 0 0)`}>
                          <circle cx="0" cy="-75" r="2" fill={currentForm.primaryGold} opacity="0.8" filter="url(#strongGlow)">
                            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" begin={`${angle/60}s`} />
                          </circle>
                          <path d="M 0 -75 L 2 -80 L -2 -80 Z" fill={currentForm.tealAccent} opacity="0.6">
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin={`${angle/60}s`} />
                          </path>
                        </g>
                      ))}
                    </g>
                  )}
                  {activeForm === 'wild' && (
                    <g transform="translate(200, 145)">
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                        <g key={angle} transform={`rotate(${angle} 0 0)`}>
                          <path
                            d={`M 0 -55 Q ${5 + i * 2} -${65 + i * 3} ${8 + i * 3} -${75 + i * 5}`}
                            stroke={i % 2 === 0 ? currentForm.primaryGold : currentForm.secondaryGold}
                            strokeWidth="2"
                            fill="none"
                            opacity="0.7"
                            filter="url(#glow)"
                          >
                            <animate
                              attributeName="d"
                              values={`M 0 -55 Q ${5 + i * 2} -${65 + i * 3} ${8 + i * 3} -${75 + i * 5};M 0 -55 Q ${7 + i * 2} -${68 + i * 3} ${10 + i * 3} -${78 + i * 5};M 0 -55 Q ${5 + i * 2} -${65 + i * 3} ${8 + i * 3} -${75 + i * 5}`}
                              dur={`${2 + i * 0.3}s`}
                              repeatCount="indefinite"
                            />
                          </path>
                          <circle cx="0" cy={`-${75 + i * 5}`} r="3" fill={currentForm.tealAccent} opacity="0.6">
                            <animate attributeName="r" values="3;5;3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                          </circle>
                        </g>
                      ))}
                    </g>
                  )}
                  {black60 > 70 && (
                    <circle cx="200" cy="120" r="5" fill={currentForm.primaryGold} filter="url(#strongGlow)" opacity={(black60 - 70) / 30} />
                  )}

                  {/* Enhanced expressive eyes */}
                  {activeForm !== 'meditation' ? (
                    <EyeRenderer
                      eyeState={eyeState}
                      eyePos={eyePos}
                      leftEyeCenter={{ x: 180, y: 145 }}
                      rightEyeCenter={{ x: 220, y: 145 }}
                      annoyanceLevel={annoyanceLevel}
                    />
                  ) : (
                    <>
                      <path d="M 175 210 Q 182 215 190 210" stroke={currentForm.primaryGold} strokeWidth="2" fill="none" opacity="0.6" />
                      <path d="M 210 210 Q 217 215 225 210" stroke={currentForm.primaryGold} strokeWidth="2" fill="none" opacity="0.6" />
                    </>
                  )}
                </g>

                {/* Equipped addons */}
                {equippedAddons.map((addon) => (
                  <AddonRenderer
                    key={addon.id}
                    addon={addon}
                    petSize={80}
                    petPosition={{ x: 200, y: 210 }}
                    animationPhase={addonAnimationPhase}
                    positionOverride={positionOverrides?.[addon.id]}
                    draggable={addonEditMode}
                    onPositionChange={(x, y) => setAddonPosition(addon.id, x, y)}
                    onToggleLock={(locked) => lockAddonPosition(addon.id, locked)}
                    onResetPosition={() => resetAddonPosition(addon.id)}
                  />
                ))}

                {auraRipples.map(r => (
                  <g key={r.id} opacity={r.life}>
                    <circle cx={r.x} cy={r.y} r={r.radius} fill="none" stroke={r.color} strokeWidth={1.4 * r.life} opacity={0.5} />
                    <circle cx={r.x} cy={r.y} r={r.radius * 0.6} fill="none" stroke={currentForm.primaryGold} strokeWidth={0.6} strokeDasharray="4 4" opacity={0.35} />
                  </g>
                ))}

                {sigilPulses.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={(1 - p.life) * 30} fill="none" stroke={p.color} strokeWidth={p.life * 2} opacity={p.life} />)}

                {crackles.map(c => {
                  const d = `M ${c.x} ${c.y} l ${Math.random()*4-2} ${Math.random()*4-2} l ${Math.random()*4-2} ${Math.random()*4-2}`;
                  return <path key={c.id} d={d} stroke={c.id % 2 === 0 ? currentForm.primaryGold : currentForm.tealAccent} strokeWidth="1" fill="none" opacity={c.life} filter="url(#glow)" strokeLinecap="round" />;
                })}

                {/* Guardian awareness field - shows where the guardian's attention is focused */}
                <g className="guardian-presence" style={{ transition: 'transform 0.3s ease-out' }}>
                  {/* Field resonance indicator - pulses based on mathematical harmony */}
                  <circle
                    cx={aiState.position.x * 400}
                    cy={aiState.position.y * 400}
                    r={12 + aiState.fieldResonance * 8}
                    fill="none"
                    stroke={currentForm.tealAccent}
                    strokeWidth={0.5 + aiState.fieldResonance}
                    opacity={0.3 + aiState.fieldResonance * 0.4}
                    filter="url(#glow)"
                  >
                    <animate attributeName="r" values={`${12 + aiState.fieldResonance * 8};${16 + aiState.fieldResonance * 10};${12 + aiState.fieldResonance * 8}`} dur="2s" repeatCount="indefinite" />
                  </circle>

                  {/* Core presence orb */}
                  <circle
                    cx={aiState.position.x * 400}
                    cy={aiState.position.y * 400}
                    r={4 + (aiState.mode === 'focusing' ? 2 : 0)}
                    fill={aiState.mode === 'dreaming' ? '#9333ea' : aiState.mode === 'playing' ? '#22d3ee' : currentForm.primaryGold}
                    opacity={0.6 + (aiState.mode === 'focusing' ? 0.3 : 0)}
                    filter="url(#strongGlow)"
                  >
                    <animate attributeName="opacity" values={`${0.6 + (aiState.mode === 'focusing' ? 0.3 : 0)};${0.8 + (aiState.mode === 'focusing' ? 0.2 : 0)};${0.6 + (aiState.mode === 'focusing' ? 0.3 : 0)}`} dur="1.5s" repeatCount="indefinite" />
                  </circle>

                  {/* Connection line to focus target when observing/focusing */}
                  {aiState.target !== null && (aiState.mode === 'observing' || aiState.mode === 'focusing') && sigilPoints[aiState.target] && (
                    <line
                      x1={aiState.position.x * 400}
                      y1={aiState.position.y * 400}
                      x2={sigilPoints[aiState.target].x}
                      y2={sigilPoints[aiState.target].y}
                      stroke={currentForm.primaryGold}
                      strokeWidth={aiState.mode === 'focusing' ? 1.5 : 0.5}
                      strokeDasharray={aiState.mode === 'focusing' ? 'none' : '4 4'}
                      opacity={aiState.mode === 'focusing' ? 0.6 : 0.3}
                      filter="url(#glow)"
                    >
                      <animate attributeName="stroke-dashoffset" values="0;8" dur="0.5s" repeatCount="indefinite" />
                    </line>
                  )}

                  {/* Awareness radius visualization when curious */}
                  {curiosity > 50 && (
                    <circle
                      cx={aiState.position.x * 400}
                      cy={aiState.position.y * 400}
                      r={30 + curiosity * 0.5}
                      fill="none"
                      stroke={currentForm.tealAccent}
                      strokeWidth="0.3"
                      strokeDasharray="2 6"
                      opacity={0.15 + (curiosity - 50) * 0.003}
                    >
                      <animate attributeName="stroke-dashoffset" values="0;-8" dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              </svg>
            </div>
            
            {showAdvanced && (
              <>
                {/* Annoyance/Mood indicator */}
                {annoyanceLevel > 0 && (
                  <div className="mt-4 p-3 bg-red-950/70 rounded-lg border border-red-600/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-red-300 font-medium">
                        {annoyanceLevel > 80 ? '😡 Very Annoyed!' : annoyanceLevel > 50 ? '😠 Getting Annoyed' : '😐 Slightly Bothered'}
                      </span>
                      <span className="text-xs text-red-400">{annoyanceLevel}%</span>
                    </div>
                    <div className="h-2 bg-red-950 rounded-full overflow-hidden border border-red-800/50">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300"
                        style={{ width: `${annoyanceLevel}%` }}
                      />
                    </div>
                    <p className="text-xs text-red-300/70 mt-2 italic">
                      {annoyanceLevel > 80 ? 'Leave me alone for a bit!' : annoyanceLevel > 50 ? 'Be more gentle please...' : 'I need a little space'}
                    </p>
                  </div>
                )}

                <div className="mt-6 text-center p-4 bg-gray-950/70 rounded-lg border border-yellow-600/30 backdrop-blur-sm shadow-lg">
                  <p key={whisper.key} className="text-base text-yellow-200 italic font-light leading-relaxed transition-opacity duration-500">
                    <span className="text-yellow-400/60">"</span>
                    {whisper.text}
                    <span className="text-yellow-400/60">"</span>
                  </p>
                </div>

                <div className="mt-6 p-4 bg-gray-950/50 rounded-lg border border-yellow-600/20">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Guardian Status: {currentForm.name}</h3>
                  <p className="text-sm text-gray-400">{currentForm.description}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-gray-400">AI Mode: <span className={`font-mono ${aiState.mode === 'dreaming' ? 'text-purple-400 animate-pulse' : 'text-yellow-500'}`}>{aiState.mode}</span></p>
                    {aiState.gbsp && (
                      <>
                        <p className="text-sm text-gray-400">
                          Feeling: <span className={`font-mono ${
                            aiState.gbsp.emotionalState === 'serene' ? 'text-green-400' :
                            aiState.gbsp.emotionalState === 'ecstatic' ? 'text-yellow-300 animate-pulse' :
                            aiState.gbsp.emotionalState === 'overwhelmed' ? 'text-red-400' :
                            aiState.gbsp.emotionalState === 'yearning' ? 'text-purple-400' :
                            aiState.gbsp.emotionalState === 'mischievous' ? 'text-emerald-400' :
                            aiState.gbsp.emotionalState === 'affectionate' ? 'text-pink-400' :
                            'text-cyan-400'
                          }`}>{aiState.gbsp.emotionalState}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Comfort: <span className={`font-mono ${
                            aiState.gbsp.comfort.source === 'harmonized' ? 'text-green-400' :
                            aiState.gbsp.comfort.source === 'seeking' ? 'text-yellow-400' :
                            aiState.gbsp.comfort.source === 'unsettled' ? 'text-orange-400' :
                            'text-red-400'
                          }`}>{aiState.gbsp.comfort.source} ({Math.round(aiState.gbsp.comfort.overall * 100)}%)</span>
                        </p>
                        {aiState.gbsp.comfort.unmetNeeds.length > 0 && (
                          <p className="text-sm text-gray-400">
                            Needs: <span className="font-mono text-orange-300">{aiState.gbsp.comfort.unmetNeeds.join(', ')}</span>
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-sm text-gray-400">Time: <span className="font-mono text-teal-400">{timeOfDay}</span></p>
                    <p className="text-sm text-gray-400">Dreams: <span className="font-mono text-purple-400">{dreamCount}</span> | Interactions: <span className="font-mono text-cyan-400">{totalInteractions}</span></p>
                    <p className="text-sm text-gray-400">Sigils Activated: <span className="font-mono text-green-400">{activatedPoints.size}/7</span></p>
                    {interaction.isHeld && (
                      <p className="text-sm text-pink-400 animate-pulse">Holding guardian...</p>
                    )}
                  </div>
                </div>

                {bondHistory.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-950/50 rounded-lg border border-yellow-600/20 max-h-48 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-3">Bond Chronicle</h3>
                    <div className="space-y-2">
                      {bondHistory.slice(-10).reverse().map((entry, i) => (
                        <div key={`${entry.timestamp}-${i}`} className="text-xs text-gray-400 border-l-2 border-teal-600/30 pl-2">
                          <span className="text-teal-400 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          <span className="mx-2 text-gray-500">•</span>
                          <span>{entry.event}</span>
                          <span className="ml-2 text-yellow-500">({entry.bond})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {showAdvanced && (
            <div className="space-y-6">
            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Essence Attunement</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-300">Energy Flow ({energy})</label><input type="range" min="0" max="100" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>
                <div><label className="block text-sm font-medium text-gray-300">Curiosity Spark ({curiosity})</label><input type="range" min="0" max="100" value={curiosity} onChange={(e) => setCuriosity(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>
                <div><label className="block text-sm font-medium text-gray-300">Bond Resonance ({bond})</label><input type="range" min="0" max="100" value={bond} onChange={(e) => setBond(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>
                <div><label className="block text-sm font-medium text-gray-300">Vitality Core ({health})</label><input type="range" min="0" max="100" value={health} onChange={(e) => setHealth(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Sacred Mathematics</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-950/50 rounded-lg"><p className="text-sm text-gray-400">Lucas Number</p><p className="text-2xl font-mono text-yellow-500">{lucasNum.toString()}</p></div>
                <div className="p-3 bg-gray-950/50 rounded-lg"><p className="text-sm text-gray-400">Fibonacci Number</p><p className="text-2xl font-mono text-yellow-500">{fibNum.toString()}</p></div>
              </div>
            </div>

            <MechanicsShowcase
              seedName={seedName}
              energy={energy}
              curiosity={curiosity}
              bond={bond}
              field={field}
            />

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Trinity Genome Vaults</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400"><span>Red-60 (Spine Energy)</span><span className="font-mono text-yellow-500">{red60.toFixed(2)}%</span></div>
                <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${red60}%` }}></div></div>
                
                <div className="flex justify-between text-sm text-gray-400 pt-2"><span>Blue-60 (Form Integrity)</span><span className="font-mono text-yellow-500">{blue60.toFixed(2)}%</span></div>
                <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${blue60}%` }}></div></div>
                
                <div className="flex justify-between text-sm text-gray-400 pt-2"><span>Black-60 (Mystery Halo)</span><span className="font-mono text-yellow-500">{black60.toFixed(2)}%</span></div>
                <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-gray-500 h-2 rounded-full" style={{ width: `${black60}%` }}></div></div>
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Yantra Genome Lattice</h3>
              <p className="text-sm text-gray-400 mb-4">
                {activatedPoints.size}/7 sigils active • {activeForm === 'celestial' ? '12 tiles (Celestial)' : activeForm === 'wild' ? '9 tiles (Wild)' : '7 tiles'}
              </p>

              <YantraTileGenomeVisualizer
                energy={energy}
                curiosity={curiosity}
                bond={bond}
                red60={red60}
                blue60={blue60}
                black60={black60}
                field={field}
                currentForm={currentForm}
                activatedPoints={activatedPoints}
                onTileClick={(index) => handleSigilClick(index % 7, sigilPoints[index % 7])}
                width={600}
                height={400}
                className="rounded-lg"
              />

              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>Red-60 ({red60.toFixed(1)}%): Morph bias (circle↔triangle)</p>
                <p>Blue-60 ({blue60.toFixed(1)}%): Form stability</p>
                <p>Black-60 ({black60.toFixed(1)}%): Mystery halo glow</p>
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Seed Patterns (First 10 Digits)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Pulse (Chaotic)</p>
                  <div className="flex space-x-1">
                    {field.pulse.slice(0, 10).map((d, i) => (
                      <button key={i} onClick={() => audioEnabled && playNote(d % 7)} className="flex-1 h-8 bg-gray-700 rounded-sm hover:bg-yellow-600 transition-colors relative" aria-label={`Pulse digit ${d}`}>
                        <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/50" style={{ height: `${d * 10}%` }}></div>
                        <span className="relative text-xs font-mono">{d}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Ring (Harmonic)</p>
                  <div className="flex space-x-1">
                    {field.ring.slice(0, 10).map((d, i) => (
                      <button key={i} onClick={() => audioEnabled && playNote(d % 7)} className="flex-1 h-8 bg-gray-700 rounded-sm hover:bg-teal-600 transition-colors relative" aria-label={`Ring digit ${d}`}>
                        <div className="absolute bottom-0 left-0 right-0 bg-teal-500/50" style={{ height: `${d * 10}%` }}></div>
                        <span className="relative text-xs font-mono">{d}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Sacred Games</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={startPatternGame}
                  disabled={currentGame !== null}
                  className="px-3 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all text-sm"
                  aria-label="Start sigil pattern matching game"
                >
                  🔮 Sigil Pattern
                </button>
                <button
                  onClick={startTriviaGame}
                  disabled={currentGame !== null}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all text-sm"
                  aria-label="Start Fibonacci trivia quiz"
                >
                  🧮 Number Quiz
                </button>
                <button
                  onClick={startSnakeGame}
                  disabled={currentGame !== null}
                  className="px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all text-sm"
                  aria-label="Start Snake game"
                >
                  🐍 Snake
                </button>
                <button
                  onClick={startTetrisGame}
                  disabled={currentGame !== null}
                  className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all text-sm"
                  aria-label="Start Tetris game"
                >
                  🟦 Tetris
                </button>
              </div>
              {gamesWon > 0 && (
                <p className="text-xs text-center text-green-400 mt-3">
                  Games Won: {gamesWon}
                </p>
              )}

              {patternChallenge.active && (
                <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-purple-300 mb-2">
                    Pattern: {patternChallenge.sequence.map(i => i + 1).join(' → ')}
                  </p>
                  <p className="text-xs text-gray-400">
                    Your input ({patternChallenge.userSequence.length}/{patternChallenge.sequence.length}): {patternChallenge.userSequence.map(i => i + 1).join(' → ')}
                  </p>
                </div>
              )}

              {triviaQuestion && (
                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                  <p className="text-sm text-indigo-200 mb-3 font-medium">{triviaQuestion.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {triviaQuestion.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => answerTrivia(opt)}
                        className="px-3 py-2 bg-indigo-700/40 hover:bg-indigo-600/60 rounded transition-colors text-sm"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentGame === 'snake' && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-green-300 font-medium">Snake Game</p>
                    <p className="text-sm text-green-400">Score: {snakeState.score}</p>
                  </div>
                  {snakeState.gameOver ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-400 mb-2">Game Over!</p>
                      <button onClick={resetSnakeGame} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm active:bg-green-400">
                        Play Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-15 gap-0.5 bg-gray-950 p-2 rounded mx-auto" style={{ maxWidth: 'fit-content' }}>
                        {Array.from({ length: 15 }).map((_, y) => (
                          <div key={y} className="flex gap-0.5">
                            {Array.from({ length: 15 }).map((_, x) => {
                              const isSnake = snakeState.segments.some(seg => seg.x === x && seg.y === y);
                              const isHead = snakeState.segments[0].x === x && snakeState.segments[0].y === y;
                              const isFood = snakeState.food.x === x && snakeState.food.y === y;
                              return (
                                <div
                                  key={x}
                                  className={`w-4 h-4 sm:w-3 sm:h-3 rounded-sm ${isHead ? 'bg-green-400' : isSnake ? 'bg-green-600' : isFood ? 'bg-red-500' : 'bg-gray-800'}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      {/* Mobile touch controls for Snake */}
                      <div className="flex flex-col items-center gap-2 mt-3">
                        <button
                          onClick={() => snakeState.direction !== 'down' && setSnakeState(s => ({ ...s, direction: 'up' }))}
                          className="w-12 h-12 rounded-lg bg-green-800/80 border border-green-600 flex items-center justify-center text-xl active:bg-green-700 select-none touch-manipulation"
                        >
                          ▲
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => snakeState.direction !== 'right' && setSnakeState(s => ({ ...s, direction: 'left' }))}
                            className="w-12 h-12 rounded-lg bg-green-800/80 border border-green-600 flex items-center justify-center text-xl active:bg-green-700 select-none touch-manipulation"
                          >
                            ◀
                          </button>
                          <button
                            onClick={() => snakeState.direction !== 'up' && setSnakeState(s => ({ ...s, direction: 'down' }))}
                            className="w-12 h-12 rounded-lg bg-green-800/80 border border-green-600 flex items-center justify-center text-xl active:bg-green-700 select-none touch-manipulation"
                          >
                            ▼
                          </button>
                          <button
                            onClick={() => snakeState.direction !== 'left' && setSnakeState(s => ({ ...s, direction: 'right' }))}
                            className="w-12 h-12 rounded-lg bg-green-800/80 border border-green-600 flex items-center justify-center text-xl active:bg-green-700 select-none touch-manipulation"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-gray-400 mt-2 text-center hidden sm:block">Use arrow keys or tap buttons to control</p>
                </div>
              )}

              {currentGame === 'tetris' && (
                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-indigo-300 font-medium">Tetris Game</p>
                    <p className="text-sm text-indigo-400">Score: {tetrisState.score}</p>
                  </div>
                  {tetrisState.gameOver ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-400 mb-2">Game Over!</p>
                      <button onClick={resetTetrisGame} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm active:bg-indigo-400 touch-manipulation">
                        Play Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-950 p-2 rounded mx-auto" style={{ maxWidth: 'fit-content' }}>
                        {tetrisState.board.map((row, y) => (
                          <div key={y} className="flex gap-0.5">
                            {row.map((cell, x) => {
                              let cellColor = cell ? '#4B5563' : '#1F2937';
                              if (tetrisState.currentPiece) {
                                const piece = tetrisState.currentPiece;
                                for (let py = 0; py < piece.shape.length; py++) {
                                  for (let px = 0; px < piece.shape[py].length; px++) {
                                    if (piece.shape[py][px] && piece.x + px === x && piece.y + py === y) {
                                      cellColor = piece.color;
                                    }
                                  }
                                }
                              }
                              return (
                                <div
                                  key={x}
                                  className="w-4 h-4 sm:w-3 sm:h-3 rounded-sm"
                                  style={{ backgroundColor: cellColor }}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      {/* Mobile touch controls for Tetris */}
                      <div className="flex justify-center items-center gap-2 mt-3">
                        <button
                          onClick={() => moveTetrisPiece(-1, 0)}
                          className="w-12 h-12 rounded-lg bg-indigo-800/80 border border-indigo-600 flex items-center justify-center text-xl active:bg-indigo-700 select-none touch-manipulation"
                        >
                          ◀
                        </button>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => rotateTetrisPiece()}
                            className="w-12 h-12 rounded-lg bg-indigo-800/80 border border-indigo-600 flex items-center justify-center text-lg active:bg-indigo-700 select-none touch-manipulation"
                          >
                            ↻
                          </button>
                          <button
                            onClick={() => moveTetrisPiece(0, 1)}
                            className="w-12 h-12 rounded-lg bg-indigo-800/80 border border-indigo-600 flex items-center justify-center text-xl active:bg-indigo-700 select-none touch-manipulation"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => moveTetrisPiece(1, 0)}
                          className="w-12 h-12 rounded-lg bg-indigo-800/80 border border-indigo-600 flex items-center justify-center text-xl active:bg-indigo-700 select-none touch-manipulation"
                        >
                          ▶
                        </button>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-gray-400 mt-2 text-center hidden sm:block">Arrows: move/rotate (↑), Drop: ↓</p>
                </div>
              )}
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Breeding & Lineage</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Partner Guardian Name</label>
                  <input
                    type="text"
                    value={breedingPartner}
                    onChange={(e) => setBreedingPartner(e.target.value.toUpperCase())}
                    className="w-full bg-gray-950 border border-yellow-600/30 rounded-lg px-4 py-2 text-center font-mono text-cyan-400 focus:outline-none focus:border-yellow-600"
                    placeholder="PARTNER"
                  />
                </div>
                <button
                  onClick={breedGuardian}
                  disabled={bond < 70 || !breedingPartner}
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                  aria-label="Breed new Guardian"
                >
                  💞 Breed Guardian (Bond ≥ 70)
                </button>
                {offspring.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-purple-400">Offspring ({offspring.length})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {offspring.map((child, i) => (
                        <div key={i} className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                          <p className="text-sm text-purple-300 font-mono">{child.name}</p>
                          <p className="text-xs text-gray-400">Parents: {child.parents.join(' × ')}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-gray-400">R:</span> <span className="text-red-400">{child.genome.red60.toFixed(1)}</span></div>
                            <div><span className="text-gray-400">B:</span> <span className="text-blue-400">{child.genome.blue60.toFixed(1)}</span></div>
                            <div><span className="text-gray-400">K:</span> <span className="text-gray-400">{child.genome.black60.toFixed(1)}</span></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{new Date(child.birthDate).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Audio Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Audio Enabled</label>
                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${audioEnabled ? 'bg-teal-500' : 'bg-gray-600'}`}
                    role="switch"
                    aria-checked={audioEnabled}
                    aria-label="Toggle audio"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${audioEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Mute</label>
                  <button
                    onClick={() => setAudioMuted(!audioMuted)}
                    className={`px-4 py-2 rounded-lg transition-colors ${audioMuted ? 'bg-red-600' : 'bg-gray-700'}`}
                    aria-pressed={audioMuted}
                  >
                    {audioMuted ? '🔇 Muted' : '🔊 Unmuted'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Volume: {Math.round(masterVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume * 100}
                    onChange={(e) => {
                      const newVol = Number(e.target.value) / 100;
                      setMasterVolume(newVol);
                      setVolume(newVol);
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    aria-label="Master volume"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Audio Scale</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={audioScale}
                      onChange={(e) => {
                        setAutoSelectScale(false);
                        setAudioScale(e.target.value as ScaleName);
                      }}
                      disabled={autoSelectScale}
                      className="flex-1 bg-gray-950 border border-yellow-600/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-600 disabled:opacity-50"
                      aria-label="Select audio scale"
                    >
                      <option value="harmonic">Harmonic (Just Intonation)</option>
                      <option value="pentatonic">Pentatonic</option>
                      <option value="dorian">Dorian Mode</option>
                      <option value="phrygian">Phrygian Mode</option>
                    </select>
                    <button
                      onClick={() => setAutoSelectScale(!autoSelectScale)}
                      className={`px-3 py-2 rounded-lg text-xs transition-colors ${autoSelectScale ? 'bg-teal-600' : 'bg-gray-700'}`}
                      aria-pressed={autoSelectScale}
                      title="Auto-select scale based on stats"
                    >
                      Auto
                    </button>
                  </div>
                  {autoSelectScale && (
                    <p className="text-xs text-gray-500 mt-1">Currently: {effectiveScale}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-6 border border-yellow-600/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Accessibility</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Reduce Motion</label>
                  <button
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${reduceMotion ? 'bg-purple-500' : 'bg-gray-600'}`}
                    role="switch"
                    aria-checked={reduceMotion}
                    aria-label="Toggle reduce motion"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${reduceMotion ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">High Contrast</label>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${highContrast ? 'bg-yellow-500' : 'bg-gray-600'}`}
                    role="switch"
                    aria-checked={highContrast}
                    aria-label="Toggle high contrast mode"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Debug Overlay</label>
                  <button
                    onClick={() => setShowDebugOverlay(!showDebugOverlay)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${showDebugOverlay ? 'bg-green-500' : 'bg-gray-600'}`}
                    role="switch"
                    aria-checked={showDebugOverlay}
                    aria-label="Toggle debug overlay"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showDebugOverlay ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dream Journal & Lore */}
            {(dreamJournal.length > 0 || unlockedLore.length > 0) && (
              <div className="bg-gray-900/80 rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Dream Journal & Lore</h3>

                {unlockedLore.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">Unlocked Lore ({unlockedLore.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {unlockedLore.map((lore, i) => (
                        <p key={i} className="text-xs text-gray-300 italic border-l-2 border-yellow-600/30 pl-2">
                          {lore}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {dreamJournal.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-300 mb-2">Recent Dreams ({dreamJournal.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dreamJournal.slice(-5).reverse().map((entry, i) => (
                        <div key={entry.timestamp} className="text-xs bg-purple-900/20 border border-purple-500/20 rounded p-2">
                          <p className="text-purple-200 italic">"{entry.insight}"</p>
                          <p className="text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleString()} |
                            E:{entry.energy} C:{entry.curiosity} B:{entry.bond}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Config Tuning */}
            <div className="bg-gray-900/80 rounded-2xl p-6 border border-cyan-600/20">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">AI Behavior Tuning</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Idle Duration (min: {aiConfig.timings.idle.min}s, max: {aiConfig.timings.idle.max}s)</label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={aiConfig.timings.idle.min}
                      onChange={(e) => setAiConfig(prev => ({
                        ...prev,
                        timings: { ...prev.timings, idle: { ...prev.timings.idle, min: Number(e.target.value) } }
                      }))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg"
                    />
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={aiConfig.timings.idle.max}
                      onChange={(e) => setAiConfig(prev => ({
                        ...prev,
                        timings: { ...prev.timings, idle: { ...prev.timings.idle, max: Number(e.target.value) } }
                      }))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Dream Duration (min: {aiConfig.timings.dreaming.min}s, max: {aiConfig.timings.dreaming.max}s)</label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={aiConfig.timings.dreaming.min}
                      onChange={(e) => setAiConfig(prev => ({
                        ...prev,
                        timings: { ...prev.timings, dreaming: { ...prev.timings.dreaming, min: Number(e.target.value) } }
                      }))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg"
                    />
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={aiConfig.timings.dreaming.max}
                      onChange={(e) => setAiConfig(prev => ({
                        ...prev,
                        timings: { ...prev.timings, dreaming: { ...prev.timings.dreaming, max: Number(e.target.value) } }
                      }))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Dream Probability: {Math.round(aiConfig.probabilities.idleToDream * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={aiConfig.probabilities.idleToDream * 100}
                    onChange={(e) => setAiConfig(prev => ({
                      ...prev,
                      probabilities: { ...prev.probabilities, idleToDream: Number(e.target.value) / 100 }
                    }))}
                    className="w-full h-2 bg-gray-700 rounded-lg"
                  />
                </div>

                <button
                  onClick={() => setAiConfig(DEFAULT_AI_CONFIG)}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuraliaMetaPet;
