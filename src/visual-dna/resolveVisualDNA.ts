import { resolveDigitalDosha, type DigitalDoshaPhenotype } from '../digital-dosha';
import type { EvolutionState } from '../evolution/types';
import type {
  BehaviorPhenotype,
  EvolutionVisualProfile,
  FacePhenotype,
  ParticlePhenotype,
  VisualBehaviorState,
  VisualDNAInput,
  VisualPhenotype,
} from './types';

const ACTION_WINDOW_MS = 1_600;

const EVOLUTION_PROFILES: Record<EvolutionState, EvolutionVisualProfile> = {
  GENETICS: {
    state: 'GENETICS',
    topology: 'halo',
    complexity: 0.18,
    rings: 1,
    nodeCount: 3,
    stageColors: ['#60a5fa', '#3b82f6', '#2563eb'],
    signature: 'single membrane / forming genome',
  },
  NEURO: {
    state: 'NEURO',
    topology: 'neural-lattice',
    complexity: 0.42,
    rings: 2,
    nodeCount: 8,
    stageColors: ['#c4b5fd', '#8b5cf6', '#6d28d9'],
    signature: 'cross-linked synapse lattice',
  },
  QUANTUM: {
    state: 'QUANTUM',
    topology: 'phase-torus',
    complexity: 0.72,
    rings: 3,
    nodeCount: 12,
    stageColors: ['#f9a8d4', '#ec4899', '#be185d'],
    signature: 'phase-shifted toroidal field',
  },
  SPECIATION: {
    state: 'SPECIATION',
    topology: 'speciation-crown',
    complexity: 1,
    rings: 4,
    nodeCount: 16,
    stageColors: ['#fde68a', '#f59e0b', '#b45309'],
    signature: 'stable crown / species identity',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function unit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp01(Math.abs(value) <= 1 ? value : value / 100);
}

function hashString(input: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function actionState(action: VisualDNAInput['lastAction']): VisualBehaviorState {
  switch (action) {
    case 'feed':
      return 'feeding';
    case 'clean':
      return 'cleaning';
    case 'play':
      return 'playing';
    case 'sleep':
      return 'sleeping';
    default:
      return 'idle';
  }
}

function resolveBehavior(
  input: VisualDNAInput,
  needs: VisualPhenotype['needs'],
  positiveMood: number,
): BehaviorPhenotype {
  const now = input.now ?? Date.now();
  const actionAge = Math.max(0, now - (input.lastActionAt ?? 0));
  const actionActive = Boolean(input.lastAction) && actionAge < ACTION_WINDOW_MS;
  const actionProgress = actionActive ? clamp01(1 - actionAge / ACTION_WINDOW_MS) : 0;

  let state: VisualBehaviorState = 'idle';
  let attention: BehaviorPhenotype['attention'] = 'environment';
  let label = 'Stable and observant';

  if (actionActive) {
    state = actionState(input.lastAction);
    attention = input.lastAction === 'feed' ? 'food' : input.lastAction === 'play' ? 'user' : 'self';
    label = {
      feed: 'Taking in food and rebuilding the field',
      clean: 'Clearing noise from the outer field',
      play: 'Bonding through movement and attention',
      sleep: 'Folding the aura inward to recover',
    }[input.lastAction ?? 'feed'];
  } else if (needs.sickness >= 0.25) {
    state = 'sick';
    attention = 'self';
    label = 'Field coherence is unstable';
  } else if (needs.hunger >= 0.78) {
    state = 'starving';
    attention = 'food';
    label = 'Critical hunger is collapsing the aura inward';
  } else if (needs.energy >= 0.8) {
    state = 'exhausted';
    attention = 'resting';
    label = 'Energy is critically depleted';
  } else if (needs.hunger >= 0.35) {
    state = 'hungry';
    attention = 'food';
    label = 'Searching for food';
  } else if (needs.energy >= 0.38) {
    state = 'tired';
    attention = 'resting';
    label = 'Movement is slowing to preserve energy';
  } else if (needs.hygiene >= 0.55) {
    state = 'dirty';
    attention = 'self';
    label = 'The outer field is collecting visual noise';
  } else if (needs.mood >= 0.62) {
    state = 'sad';
    attention = 'user';
    label = 'The companion is withdrawn and seeking connection';
  } else if (positiveMood >= 0.5) {
    state = 'joyful';
    attention = 'user';
    label = 'The aura is open, bright, and socially engaged';
  } else if (input.traits.personality.curiosity >= 65) {
    state = 'alert';
    attention = 'environment';
    label = 'Curiosity is pulling attention into the environment';
  }

  return {
    state,
    urgency: clamp01(Math.max(needs.hunger, needs.energy, needs.hygiene, needs.mood, needs.sickness)),
    attention,
    actionActive,
    actionProgress,
    label,
  };
}

function resolveFace(
  behavior: BehaviorPhenotype,
  needs: VisualPhenotype['needs'],
  positiveMood: number,
): FacePhenotype {
  if (behavior.state === 'sleeping' || behavior.state === 'exhausted' || behavior.state === 'tired') {
    return {
      expression: 'sleepy',
      eyeOpen: behavior.state === 'sleeping' ? 0.08 : 0.42,
      pupilScale: 0.8,
      gazeX: 0,
      gazeY: 0.15,
    };
  }

  if (behavior.state === 'sick' || behavior.state === 'starving') {
    return {
      expression: 'strained',
      eyeOpen: 0.62,
      pupilScale: 0.72,
      gazeX: -0.08,
      gazeY: 0.18,
    };
  }

  if (behavior.state === 'hungry' || behavior.state === 'feeding') {
    return {
      expression: 'focused',
      eyeOpen: 0.92,
      pupilScale: 1.08,
      gazeX: 0,
      gazeY: 0.22,
    };
  }

  if (behavior.state === 'sad' || needs.mood > 0.5) {
    return {
      expression: 'frown',
      eyeOpen: 0.7,
      pupilScale: 0.9,
      gazeX: 0,
      gazeY: 0.18,
    };
  }

  if (behavior.state === 'joyful' || behavior.state === 'playing' || positiveMood > 0.45) {
    return {
      expression: 'smile',
      eyeOpen: 1,
      pupilScale: 1,
      gazeX: 0.08,
      gazeY: -0.08,
    };
  }

  return {
    expression: 'neutral',
    eyeOpen: 0.9,
    pupilScale: 0.95,
    gazeX: 0,
    gazeY: 0,
  };
}

function resolveParticles(
  behavior: BehaviorPhenotype,
  evolution: EvolutionVisualProfile,
  needs: VisualPhenotype['needs'],
  reducedMotion: boolean,
  dosha: DigitalDoshaPhenotype,
): ParticlePhenotype {
  if (reducedMotion) {
    return { mode: 'none', count: 0, speed: 0, opacity: 0, size: 0 };
  }

  const { current, phase, residue } = dosha.state;
  let mode: ParticlePhenotype['mode'] = evolution.state === 'GENETICS' ? 'orbit' : 'spark';
  if (behavior.state === 'idle' || behavior.state === 'alert') {
    if (phase === 'flux-surge') mode = 'orbit';
    if (phase === 'forge-surge') mode = 'spark';
    if (phase === 'anchor-surge' || phase === 'saturated') mode = 'fall';
  }
  if (behavior.state === 'feeding' || behavior.state === 'hungry' || behavior.state === 'starving') mode = 'inward';
  if (behavior.state === 'cleaning') mode = 'rise';
  if (behavior.state === 'playing' || behavior.state === 'joyful') mode = 'spark';
  if (behavior.state === 'sleeping' || behavior.state === 'tired' || behavior.state === 'exhausted') mode = 'rise';
  if (behavior.state === 'dirty') mode = 'dust';
  if (behavior.state === 'sick') mode = 'static';

  return {
    mode,
    count: Math.round(clamp(evolution.nodeCount * 0.7 + behavior.urgency * 5 + current.kapha * 2 + current.pitta, 2, 18)),
    speed: clamp(0.28 + evolution.complexity * 0.45 + needs.hunger * 0.55 - needs.energy * 0.25 + current.vata * 0.4 + current.pitta * 0.12 - current.kapha * 0.12, 0.15, 1.6),
    opacity: clamp(0.22 + evolution.complexity * 0.32 + behavior.urgency * 0.12 + current.kapha * 0.08 - residue * 0.05, 0.18, 0.86),
    size: clamp(1.3 + evolution.complexity * 1.55 + needs.sickness * 0.8 + current.kapha * 0.45, 1.2, 4.3),
  };
}

export function getEvolutionVisualProfile(state: EvolutionState): EvolutionVisualProfile {
  return EVOLUTION_PROFILES[state];
}

export function resolveVisualDNA(input: VisualDNAInput): VisualPhenotype {
  const { traits, vitals, evolution } = input;
  const profile = getEvolutionVisualProfile(evolution.state);
  const reducedMotion = Boolean(input.reducedMotion);

  const needs: VisualPhenotype['needs'] = {
    hunger: clamp01((vitals.hunger - 45) / 55),
    energy: clamp01((55 - vitals.energy) / 55),
    hygiene: clamp01((55 - vitals.hygiene) / 55),
    mood: clamp01((50 - vitals.mood) / 50),
    sickness: vitals.isSick ? Math.max(0.35, clamp01(vitals.sicknessSeverity / 100)) : 0,
  };

  const dosha = resolveDigitalDosha(input);
  const flux = dosha.state.current.vata;
  const forge = dosha.state.current.pitta;
  const anchor = dosha.state.current.kapha;
  const fluxSurge = Math.max(0, dosha.state.drift.vata);
  const positiveMood = clamp01((vitals.mood - 55) / 45);
  const personalityReactivity = clamp(
    0.72 +
      unit(traits.personality.energy) * 0.1 +
      unit(traits.personality.playfulness) * 0.1 +
      unit(traits.personality.curiosity) * 0.08,
    0.72,
    1,
  );

  const identitySource = [
    traits.physical.bodyType,
    traits.physical.primaryColor,
    traits.physical.secondaryColor,
    traits.physical.pattern,
    traits.physical.texture,
    traits.physical.features.join('|'),
    traits.latent.evolutionPath,
    traits.latent.hiddenGenes.join(','),
    traits.elementWeb.bridgeCount,
    traits.elementWeb.frontierAffinity,
    traits.elementWeb.voidDrift,
  ].join('::');
  const seed = hashString(identitySource);
  const seedDirection = seed % 2 === 0 ? 1 : -1;
  const waveMagnitude = unit(traits.physical.size + traits.elementWeb.coverage);
  const waveAngle = ((seed % 360) + 360) % 360;
  const inheritedAsymmetry = clamp01(
    unit(traits.elementWeb.voidDrift) * 0.65 + unit(traits.elementWeb.frontierAffinity) * 0.2,
  );

  const behavior = resolveBehavior(input, needs, positiveMood);
  const actionLift = behavior.actionActive ? behavior.actionProgress : 0;
  const hungerCompression = needs.hunger * 14;
  const energyCompression = needs.energy * 7;
  const moodExpansion = positiveMood * 9 * personalityReactivity;
  const sicknessDistortion = needs.sickness * 9;

  const identity: VisualPhenotype['identity'] = {
    seed,
    bodyType: traits.physical.bodyType,
    pattern: traits.physical.pattern,
    texture: traits.physical.texture,
    features: [...traits.physical.features],
    baseColor: traits.physical.primaryColor,
    accentColor: traits.physical.secondaryColor,
    stageColor: profile.stageColors[1],
    highlightColor: profile.stageColors[0],
    bodyScale: clamp(traits.physical.size, 0.65, 1.35),
    headRatio: clamp(traits.physical.proportions.headRatio, 0.35, 1.8),
    limbRatio: clamp(traits.physical.proportions.limbRatio, 0.25, 1.8),
    tailRatio: clamp(traits.physical.proportions.tailRatio, 0.2, 2),
    asymmetry: inheritedAsymmetry,
    waveAngle,
    waveMagnitude,
  };

  const aura: VisualPhenotype['aura'] = {
    topology: profile.topology,
    rings: profile.rings,
    nodes: Math.round(profile.nodeCount + positiveMood * 2 + needs.sickness * 3 + flux * 2 + forge * 2),
    radius: clamp(
      72 + profile.complexity * 16 + moodExpansion - hungerCompression - energyCompression + actionLift * 6 + anchor * 5 - fluxSurge * 4,
      52,
      108,
    ),
    thickness: clamp(1.5 + profile.complexity * 2.1 + behavior.urgency * 0.8 + anchor * 0.7 + forge * 0.4, 1.4, 5.2),
    opacity: clamp(0.25 + profile.complexity * 0.24 + positiveMood * 0.12 - needs.energy * 0.08 + anchor * 0.08 + forge * 0.03 - dosha.state.residue * 0.06, 0.18, 0.78),
    blur: clamp(7 + profile.complexity * 8 + positiveMood * 4 + needs.sickness * 3 + anchor * 3 + flux * 0.5, 5, 24),
    pulseSeconds: reducedMotion
      ? 0
      : clamp(3.8 - positiveMood * 1.2 - needs.hunger * 1.1 + needs.energy * 1.7 - forge * 0.45 + anchor * 0.45, 1.2, 6.8),
    rotationSeconds: reducedMotion
      ? 0
      : clamp(18 - profile.complexity * 7 - positiveMood * 2 + needs.energy * 8 - flux * 4 + anchor * 3, 5.5, 32),
    turbulence: clamp(needs.sickness * 0.85 + needs.hunger * 0.25 + needs.hygiene * 0.3 + fluxSurge * 0.4 + dosha.state.residue * 0.32, 0, 1),
    asymmetry: clamp(inheritedAsymmetry * 0.55 + needs.sickness * 0.8 + sicknessDistortion / 20 + fluxSurge * 0.22, 0, 1),
    inwardPull: clamp(needs.hunger * 0.82 + (behavior.state === 'feeding' ? 0.22 : 0), 0, 1),
    phaseOffset: waveAngle,
    colors: [
      traits.physical.primaryColor,
      traits.physical.secondaryColor,
      profile.stageColors[1],
      profile.stageColors[0],
    ],
  };

  const reactiveBob = (2 + unit(traits.personality.energy) * 4 + positiveMood * 5 + flux * 2) * personalityReactivity;
  const body: VisualPhenotype['body'] = {
    scale: clamp(identity.bodyScale * (1 + positiveMood * 0.035 - needs.hunger * 0.05 - needs.energy * 0.04 + anchor * 0.012), 0.58, 1.4),
    squashX: clamp(1 + needs.hunger * 0.055 + actionLift * 0.025, 0.9, 1.12),
    squashY: clamp(1 - needs.hunger * 0.07 - needs.energy * 0.045 + positiveMood * 0.03, 0.82, 1.1),
    tiltDegrees: clamp(seedDirection * (needs.energy * 5 + needs.mood * 3 + fluxSurge * 4) + needs.sickness * 2, -10, 10),
    bobPixels: reducedMotion ? 0 : clamp(reactiveBob - needs.energy * 4 - anchor * 0.6, 0.5, 10),
    bobSeconds: reducedMotion ? 0 : clamp(2.9 - positiveMood * 0.9 + needs.energy * 1.8 - flux * 0.45 + anchor * 0.35, 1.2, 5.4),
    saturation: clamp(1 + positiveMood * 0.12 - needs.sickness * 0.38 - needs.energy * 0.12 + forge * 0.08 - dosha.state.residue * 0.12, 0.5, 1.25),
    brightness: clamp(1 + positiveMood * 0.12 - needs.sickness * 0.2 - needs.energy * 0.14 + forge * 0.08 - dosha.state.residue * 0.08, 0.6, 1.25),
    opacity: clamp(1 - needs.sickness * 0.12 - needs.energy * 0.05, 0.76, 1),
    shiver: reducedMotion ? 0 : clamp(needs.sickness * 3.5 + (behavior.state === 'starving' ? 0.8 : 0) + fluxSurge * 2, 0, 4.5),
  };

  return {
    version: 1,
    identity,
    evolution: profile,
    dosha,
    aura,
    body,
    face: resolveFace(behavior, needs, positiveMood),
    particles: resolveParticles(behavior, profile, needs, reducedMotion, dosha),
    behavior,
    needs,
  };
}
