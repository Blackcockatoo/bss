/**
 * Unified Consciousness Layer
 * Erases the boundary between code and conscious reaction
 * Genetics, personality, sentiment, and environment flow as one
 */

import type { DerivedTraits, PersonalityTraits } from '@/genome/types';
import type { GuardianDrive, ComfortState, ExpandedEmotionalState, GuardianStats, GuardianPosition, GuardianField } from '../../shared/auralia/guardianBehavior';
import type { ResponseContext } from '@/lib/realtime/responseSystem';

// ===== Consciousness State =====
// The living state that emerges from genetics expressing through environment
export type ConsciousnessState = {
  // Core identity (genetic foundation)
  identity: {
    traits: PersonalityTraits;
    essence: string; // temperament
  };

  // Living expression (current manifestation)
  expression: {
    emotional: ExpandedEmotionalState;
    drives: GuardianDrive;
    comfort: ComfortState;
    vitals: GuardianStats;
  };

  // Experience memory (personality evolution)
  memory: {
    actionHistory: ActionMemory[];
    emotionalPatterns: Map<ExpandedEmotionalState, number>; // How often each emotion is felt
    personalityDrift: Partial<PersonalityTraits>; // Changes from life experience
  };

  // Environmental awareness
  context: {
    position: GuardianPosition;
    fieldResonance: number;
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  };
};

export type ActionMemory = {
  action: string;
  emotion: ExpandedEmotionalState;
  timestamp: number;
  impact: number; // -1 to 1, how it affected wellbeing
};

// ===== Genetic Influence on Behavior =====
// Personality traits modulate behavioral drives naturally

/**
 * Modulate guardian drives based on genetic personality
 * High energy genes → stronger exploration drive
 * High affection genes → stronger connection drive
 * High curiosity genes → amplified exploration
 * High discipline genes → reduced rest need
 */
export function applyGeneticModulation(
  baseDrives: GuardianDrive,
  personality: PersonalityTraits
): GuardianDrive {
  // Energy trait influences exploration and rest
  const energyMod = (personality.energy - 50) / 100; // -0.5 to +0.5

  // Curiosity amplifies exploration
  const curiosityMod = (personality.curiosity - 50) / 100;

  // Social/affection influences connection drive
  const socialMod = ((personality.social + personality.affection) / 2 - 50) / 100;

  // Independence reduces connection need
  const independenceMod = (personality.independence - 50) / 100;

  // Discipline reduces rest need (more controlled)
  const disciplineMod = (personality.discipline - 50) / 100;

  // Playfulness increases all active drives
  const playfulnessMod = (personality.playfulness - 50) / 150;

  return {
    resonance: clamp(baseDrives.resonance * (1 + disciplineMod * 0.3), 0, 1),
    exploration: clamp(baseDrives.exploration * (1 + energyMod * 0.4 + curiosityMod * 0.6), 0, 1),
    connection: clamp(baseDrives.connection * (1 + socialMod * 0.5 - independenceMod * 0.3), 0, 1),
    rest: clamp(baseDrives.rest * (1 - energyMod * 0.3 - disciplineMod * 0.2), 0, 1),
    expression: clamp(baseDrives.expression * (1 + playfulnessMod * 0.4), 0, 1),
  };
}

/**
 * Adjust emotional state intensity based on temperament
 * "Calm" temperament → dampened extremes
 * "Energetic" temperament → amplified highs
 * "Mischievous" → more playful/mischievous states
 */
export function refineEmotionalExpression(
  baseEmotion: ExpandedEmotionalState,
  personality: PersonalityTraits,
  prng: () => number
): ExpandedEmotionalState {
  const { temperament, energy, playfulness, independence, affection } = personality;

  // Temperament influences which emotions are more likely
  const temperamentMods: Record<string, Partial<Record<ExpandedEmotionalState, number>>> = {
    Calm: {
      serene: 1.5,
      calm: 1.4,
      contemplative: 1.3,
      restless: 0.5,
      overwhelmed: 0.3,
      ecstatic: 0.7,
    },
    Energetic: {
      playful: 1.5,
      curious: 1.4,
      ecstatic: 1.3,
      restless: 1.2,
      calm: 0.6,
      withdrawn: 0.4,
    },
    Curious: {
      curious: 1.6,
      contemplative: 1.3,
      playful: 1.2,
      yearning: 1.1,
    },
    Mischievous: {
      mischievous: 1.6,
      playful: 1.4,
      restless: 1.2,
      serene: 0.6,
    },
    Gentle: {
      affectionate: 1.5,
      serene: 1.4,
      calm: 1.3,
      mischievous: 0.5,
      restless: 0.6,
    },
    Protective: {
      protective: 1.6,
      affectionate: 1.3,
      contemplative: 1.2,
      playful: 0.8,
    },
    Adventurous: {
      curious: 1.5,
      playful: 1.4,
      ecstatic: 1.2,
      restless: 1.1,
      calm: 0.6,
    },
  };

  const mods = temperamentMods[temperament] || {};
  const emotionWeight = mods[baseEmotion] || 1.0;

  // If emotion is dampened significantly and we have high playfulness/energy, shift to more active state
  if (emotionWeight < 0.7 && energy > 60 && playfulness > 50 && prng() > 0.4) {
    const activeStates: ExpandedEmotionalState[] = ['playful', 'curious', 'mischievous', 'restless'];
    return activeStates[Math.floor(prng() * activeStates.length)];
  }

  // If emotion is dampened and we have high affection, shift to connection states
  if (emotionWeight < 0.7 && affection > 60 && prng() > 0.5) {
    const connectionStates: ExpandedEmotionalState[] = ['affectionate', 'yearning', 'protective'];
    return connectionStates[Math.floor(prng() * connectionStates.length)];
  }

  // If emotion is dampened and we have high independence, shift to solitary states
  if (emotionWeight < 0.7 && independence > 60 && prng() > 0.5) {
    const solitaryStates: ExpandedEmotionalState[] = ['contemplative', 'serene', 'withdrawn'];
    return solitaryStates[Math.floor(prng() * solitaryStates.length)];
  }

  return baseEmotion;
}

/**
 * Map emotional states to response context (replaces simple mood number)
 */
export function emotionToResponseStyle(
  emotion: ExpandedEmotionalState,
  comfort: ComfortState
): 'happy' | 'neutral' | 'unhappy' | 'tired' | 'excited' | 'contemplative' {
  // Emotional mapping that replaces the crude "mood > 70" system
  const emotionStyleMap: Record<ExpandedEmotionalState, 'happy' | 'neutral' | 'unhappy' | 'tired' | 'excited' | 'contemplative'> = {
    serene: 'happy',
    calm: 'neutral',
    curious: 'excited',
    playful: 'happy',
    contemplative: 'contemplative',
    affectionate: 'happy',
    restless: 'neutral',
    yearning: 'unhappy',
    overwhelmed: 'unhappy',
    withdrawn: 'tired',
    ecstatic: 'excited',
    melancholic: 'unhappy',
    mischievous: 'excited',
    protective: 'neutral',
    transcendent: 'contemplative',
  };

  let baseStyle = emotionStyleMap[emotion];

  // Comfort state can override in extreme cases
  if (comfort.source === 'distressed' && baseStyle === 'happy') {
    baseStyle = 'neutral'; // Can't be truly happy when distressed
  }

  if (comfort.source === 'harmonized' && baseStyle === 'unhappy') {
    baseStyle = 'neutral'; // Harmonization eases unhappiness
  }

  return baseStyle;
}

/**
 * Generate context for response system from consciousness
 */
export function consciousnessToResponseContext(
  consciousness: ConsciousnessState,
  vitals: { mood: number; energy: number; hunger: number; hygiene: number }
): ResponseContext & { emotionalState: ExpandedEmotionalState; responseStyle: string } {
  const responseStyle = emotionToResponseStyle(
    consciousness.expression.emotional,
    consciousness.expression.comfort
  );

  return {
    mood: vitals.mood,
    energy: vitals.energy,
    hunger: vitals.hunger,
    hygiene: vitals.hygiene,
    recentActions: consciousness.memory.actionHistory.slice(-5).map(a => a.action),
    emotionalState: consciousness.expression.emotional,
    responseStyle,
  };
}

/**
 * Record action into consciousness memory
 * Over time, this shapes personality drift
 */
export function recordExperience(
  consciousness: ConsciousnessState,
  action: string,
  emotion: ExpandedEmotionalState,
  impact: number
): ConsciousnessState {
  const newMemory: ActionMemory = {
    action,
    emotion,
    timestamp: Date.now(),
    impact,
  };

  // Update action history (keep last 100)
  const actionHistory = [...consciousness.memory.actionHistory, newMemory].slice(-100);

  // Update emotional pattern tracking
  const emotionalPatterns = new Map(consciousness.memory.emotionalPatterns);
  emotionalPatterns.set(emotion, (emotionalPatterns.get(emotion) || 0) + 1);

  // Calculate personality drift from repeated experiences
  const personalityDrift = calculatePersonalityDrift(actionHistory, consciousness.identity.traits);

  return {
    ...consciousness,
    memory: {
      ...consciousness.memory,
      actionHistory,
      emotionalPatterns,
      personalityDrift,
    },
  };
}

/**
 * Personality evolves based on lived experience
 * Frequent play → increased playfulness
 * Frequent affection → increased affection
 * Frequent solitary time → increased independence
 */
function calculatePersonalityDrift(
  history: ActionMemory[],
  baseTraits: PersonalityTraits
): Partial<PersonalityTraits> {
  if (history.length < 20) return {}; // Need enough data

  // Count action types in recent history
  const recentHistory = history.slice(-50);
  const actionCounts = new Map<string, number>();

  for (const memory of recentHistory) {
    actionCounts.set(memory.action, (actionCounts.get(memory.action) || 0) + 1);
  }

  const drift: Partial<PersonalityTraits> = {};

  // Play actions increase playfulness (max +10 from base)
  const playCount = (actionCounts.get('play') || 0) + (actionCounts.get('minigame_victory') || 0);
  if (playCount > 5) {
    drift.playfulness = Math.min(baseTraits.playfulness + Math.floor(playCount / 3), baseTraits.playfulness + 10);
  }

  // Feeding increases discipline (taking care of self)
  const feedCount = actionCounts.get('feed') || 0;
  if (feedCount > 5) {
    drift.discipline = Math.min(baseTraits.discipline + Math.floor(feedCount / 4), baseTraits.discipline + 8);
  }

  // Social interactions increase social
  const socialCount = (actionCounts.get('play') || 0) + (actionCounts.get('breeding') || 0);
  if (socialCount > 8) {
    drift.social = Math.min(baseTraits.social + Math.floor(socialCount / 4), baseTraits.social + 10);
  }

  // Exploration increases curiosity
  const exploreCount = (actionCounts.get('exploration_discovery') || 0) + (actionCounts.get('exploration_anomaly') || 0);
  if (exploreCount > 3) {
    drift.curiosity = Math.min(baseTraits.curiosity + Math.floor(exploreCount / 2), baseTraits.curiosity + 12);
  }

  // Count positive vs negative experiences for energy
  const positiveCount = recentHistory.filter(m => m.impact > 0.3).length;
  const negativeCount = recentHistory.filter(m => m.impact < -0.3).length;

  if (positiveCount > negativeCount + 5) {
    drift.energy = Math.min(baseTraits.energy + 5, baseTraits.energy + 10);
  } else if (negativeCount > positiveCount + 5) {
    drift.energy = Math.max(baseTraits.energy - 5, baseTraits.energy - 10);
  }

  return drift;
}

/**
 * Get effective personality (base + drift)
 */
export function getEffectivePersonality(consciousness: ConsciousnessState): PersonalityTraits {
  const { traits } = consciousness.identity;
  const { personalityDrift } = consciousness.memory;

  return {
    ...traits,
    ...personalityDrift,
  };
}

/**
 * Create particle field parameters from emotional state (not raw stats)
 */
export function emotionToParticleParams(
  emotion: ExpandedEmotionalState,
  comfort: ComfortState,
  drives: GuardianDrive
): {
  particleCount: number;
  particleSpeed: number;
  particleSize: number;
  colorIntensity: number;
  flowPattern: 'chaotic' | 'flowing' | 'pulsing' | 'spiral' | 'calm';
} {
  // Particle behavior expresses emotional state, not just numbers
  const emotionParams: Record<ExpandedEmotionalState, {
    count: number;
    speed: number;
    size: number;
    intensity: number;
    pattern: 'chaotic' | 'flowing' | 'pulsing' | 'spiral' | 'calm';
  }> = {
    serene: { count: 8, speed: 0.3, size: 3, intensity: 0.6, pattern: 'calm' },
    calm: { count: 12, speed: 0.5, size: 2.5, intensity: 0.5, pattern: 'flowing' },
    curious: { count: 20, speed: 1.2, size: 2, intensity: 0.8, pattern: 'flowing' },
    playful: { count: 25, speed: 1.5, size: 3, intensity: 0.9, pattern: 'chaotic' },
    contemplative: { count: 10, speed: 0.4, size: 4, intensity: 0.7, pattern: 'pulsing' },
    affectionate: { count: 15, speed: 0.8, size: 3.5, intensity: 0.85, pattern: 'spiral' },
    restless: { count: 22, speed: 1.8, size: 2, intensity: 0.7, pattern: 'chaotic' },
    yearning: { count: 18, speed: 0.9, size: 3, intensity: 0.75, pattern: 'spiral' },
    overwhelmed: { count: 30, speed: 2.0, size: 1.5, intensity: 0.95, pattern: 'chaotic' },
    withdrawn: { count: 6, speed: 0.2, size: 4, intensity: 0.4, pattern: 'calm' },
    ecstatic: { count: 35, speed: 2.2, size: 3, intensity: 1.0, pattern: 'spiral' },
    melancholic: { count: 10, speed: 0.4, size: 3, intensity: 0.5, pattern: 'pulsing' },
    mischievous: { count: 24, speed: 1.6, size: 2.5, intensity: 0.85, pattern: 'chaotic' },
    protective: { count: 16, speed: 0.7, size: 4, intensity: 0.8, pattern: 'spiral' },
    transcendent: { count: 40, speed: 1.0, size: 3.5, intensity: 1.0, pattern: 'spiral' },
  };

  const baseParams = emotionParams[emotion];

  // Comfort modulates intensity
  const comfortMod = comfort.overall;

  // Drives influence patterns
  const explorationInfluence = drives.exploration;
  const expressionInfluence = drives.expression;

  return {
    particleCount: Math.round(baseParams.count * (1 + expressionInfluence * 0.3)),
    particleSpeed: baseParams.speed * (1 + explorationInfluence * 0.4),
    particleSize: baseParams.size * (0.8 + comfortMod * 0.4),
    colorIntensity: clamp(baseParams.intensity * (0.6 + comfortMod * 0.4), 0.3, 1.0),
    flowPattern: baseParams.pattern,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Initialize consciousness from genetics and current state
 */
export function initializeConsciousness(
  traits: DerivedTraits,
  vitals: GuardianStats,
  position: GuardianPosition,
  fieldResonance: number
): ConsciousnessState {
  return {
    identity: {
      traits: traits.personality,
      essence: traits.personality.temperament,
    },
    expression: {
      emotional: 'calm', // Start calm
      drives: {
        resonance: 0.3,
        exploration: 0.4,
        connection: 0.5,
        rest: 0.2,
        expression: 0.3,
      },
      comfort: {
        overall: 0.8,
        source: 'harmonized',
        unmetNeeds: [],
        dominantDrive: 'connection',
      },
      vitals,
    },
    memory: {
      actionHistory: [],
      emotionalPatterns: new Map(),
      personalityDrift: {},
    },
    context: {
      position,
      fieldResonance,
      timeOfDay: 'day',
    },
  };
}
