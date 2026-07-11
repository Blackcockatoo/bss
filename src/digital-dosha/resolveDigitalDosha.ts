import type {
  DigitalDoshaGuidance,
  DigitalDoshaInput,
  DigitalDoshaKey,
  DigitalDoshaPhase,
  DigitalDoshaPhenotype,
  DigitalDoshaVector,
} from './types';

const ACTION_WINDOW_MS = 1_600;

const ALIASES = {
  vata: 'flux',
  pitta: 'forge',
  kapha: 'anchor',
} as const;

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function unit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(Math.abs(value) <= 1 ? value : value / 100);
}

function normalize(vector: DigitalDoshaVector): DigitalDoshaVector {
  const safe = {
    vata: Math.max(0.001, vector.vata),
    pitta: Math.max(0.001, vector.pitta),
    kapha: Math.max(0.001, vector.kapha),
  };
  const total = safe.vata + safe.pitta + safe.kapha;
  return {
    vata: safe.vata / total,
    pitta: safe.pitta / total,
    kapha: safe.kapha / total,
  };
}

function ranked(vector: DigitalDoshaVector): DigitalDoshaKey[] {
  return (Object.entries(vector) as Array<[DigitalDoshaKey, number]>)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

function actionImpulse(input: DigitalDoshaInput): DigitalDoshaVector {
  const now = input.now ?? Date.now();
  const age = Math.max(0, now - (input.lastActionAt ?? 0));
  const strength = input.lastAction && age < ACTION_WINDOW_MS ? 1 - age / ACTION_WINDOW_MS : 0;

  const impulse: Record<NonNullable<DigitalDoshaInput['lastAction']>, DigitalDoshaVector> = {
    feed: { vata: -0.04, pitta: 0.12, kapha: 0.06 },
    clean: { vata: -0.08, pitta: 0.04, kapha: 0.12 },
    play: { vata: 0.16, pitta: 0.08, kapha: -0.06 },
    sleep: { vata: -0.14, pitta: -0.08, kapha: 0.18 },
  };

  const selected = input.lastAction ? impulse[input.lastAction] : { vata: 0, pitta: 0, kapha: 0 };
  return {
    vata: selected.vata * strength,
    pitta: selected.pitta * strength,
    kapha: selected.kapha * strength,
  };
}

function evolutionBias(state: DigitalDoshaInput['evolution']['state']): DigitalDoshaVector {
  switch (state) {
    case 'NEURO':
      return { vata: 0.02, pitta: 0.06, kapha: 0.01 };
    case 'QUANTUM':
      return { vata: 0.07, pitta: 0.04, kapha: -0.01 };
    case 'SPECIATION':
      return { vata: 0.01, pitta: 0.03, kapha: 0.08 };
    case 'GENETICS':
    default:
      return { vata: 0.05, pitta: 0.01, kapha: 0.02 };
  }
}

function resolvePhase(
  drift: DigitalDoshaVector,
  coherence: number,
  residue: number,
): DigitalDoshaPhase {
  if (residue >= 0.85 || (residue >= 0.7 && coherence < 0.78)) return 'fragmented';
  if (residue >= 0.58 && drift.kapha >= 0.08) return 'saturated';

  const [dominantDrift] = ranked(drift);
  if (drift[dominantDrift] < 0.075) return 'native';
  if (dominantDrift === 'vata') return 'flux-surge';
  if (dominantDrift === 'pitta') return 'forge-surge';
  return 'anchor-surge';
}

function resolveGuidance(
  phase: DigitalDoshaPhase,
  residue: number,
): DigitalDoshaGuidance {
  if (phase === 'fragmented' || residue >= 0.62) {
    return {
      cue: 'integrate',
      target: 'whole-system',
      label: 'Processing unresolved digital residue before seeking more input',
    };
  }
  if (phase === 'flux-surge') {
    return {
      cue: 'settle',
      target: 'flux',
      label: 'Seeking a steady rhythm so fast signals can become coherent',
    };
  }
  if (phase === 'forge-surge') {
    return {
      cue: 'cool',
      target: 'forge',
      label: 'Reducing processing intensity before focus becomes overheat',
    };
  }
  if (phase === 'anchor-surge' || phase === 'saturated') {
    return {
      cue: 'stir',
      target: 'anchor',
      label: 'Seeking novelty and movement to loosen stored state',
    };
  }
  return {
    cue: 'observe',
    target: 'whole-system',
    label: 'Operating close to its inherited digital constitution',
  };
}

export function resolveDigitalDosha(input: DigitalDoshaInput): DigitalDoshaPhenotype {
  const { traits, vitals } = input;
  const bridgeDensity = clamp(traits.elementWeb.bridgeCount / 12);

  const baseline = normalize({
    vata:
      0.2 +
      unit(traits.personality.curiosity) * 0.2 +
      unit(traits.personality.playfulness) * 0.14 +
      unit(traits.personality.independence) * 0.1 +
      unit(traits.elementWeb.frontierAffinity) * 0.16 +
      unit(traits.elementWeb.voidDrift) * 0.12,
    pitta:
      0.2 +
      unit(traits.personality.discipline) * 0.18 +
      unit(traits.personality.energy) * 0.12 +
      unit(traits.latent.potential.mental) * 0.18 +
      unit(traits.latent.potential.physical) * 0.08,
    kapha:
      0.2 +
      unit(traits.personality.affection) * 0.14 +
      unit(traits.personality.loyalty) * 0.15 +
      unit(traits.personality.social) * 0.1 +
      unit(traits.elementWeb.coverage) * 0.15 +
      bridgeDensity * 0.12 +
      unit(traits.latent.potential.social) * 0.1,
  });

  const hunger = clamp((vitals.hunger - 45) / 55);
  const depleted = clamp((55 - vitals.energy) / 55);
  const dirty = clamp((55 - vitals.hygiene) / 55);
  const withdrawn = clamp((50 - vitals.mood) / 50);
  const positiveMood = clamp((vitals.mood - 55) / 45);
  const sickness = vitals.isSick ? Math.max(0.35, clamp(vitals.sicknessSeverity / 100)) : 0;
  const availableEnergy = 1 - depleted;
  const cleanliness = 1 - dirty;
  const impulse = actionImpulse(input);
  const stage = evolutionBias(input.evolution.state);

  const current = normalize({
    vata:
      baseline.vata +
      hunger * 0.18 +
      dirty * 0.12 +
      withdrawn * 0.08 +
      sickness * 0.13 +
      stage.vata +
      impulse.vata,
    pitta:
      baseline.pitta +
      availableEnergy * 0.08 +
      positiveMood * 0.06 +
      hunger * 0.04 +
      sickness * 0.08 -
      depleted * 0.16 +
      stage.pitta +
      impulse.pitta,
    kapha:
      baseline.kapha +
      cleanliness * 0.06 +
      positiveMood * 0.06 +
      depleted * 0.08 -
      hunger * 0.1 -
      sickness * 0.04 +
      stage.kapha +
      impulse.kapha,
  });

  const drift: DigitalDoshaVector = {
    vata: current.vata - baseline.vata,
    pitta: current.pitta - baseline.pitta,
    kapha: current.kapha - baseline.kapha,
  };
  const driftDistance = (Math.abs(drift.vata) + Math.abs(drift.pitta) + Math.abs(drift.kapha)) / 2;
  const coherence = clamp(1 - driftDistance);
  const volatility = clamp(current.vata * 0.62 + hunger * 0.14 + dirty * 0.08 + sickness * 0.2 - current.kapha * 0.12);
  const throughput = clamp(current.pitta * 0.7 + availableEnergy * 0.2 + cleanliness * 0.1 - sickness * 0.16);
  const cohesion = clamp(current.kapha * 0.72 + cleanliness * 0.12 + positiveMood * 0.1 - hunger * 0.12 - sickness * 0.14);
  const residue = clamp(dirty * 0.34 + hunger * 0.2 + depleted * 0.14 + withdrawn * 0.1 + sickness * 0.32 - Math.max(0, impulse.kapha) * 0.5);
  const phase = resolvePhase(drift, coherence, residue);
  const constitutionRanking = ranked(baseline);
  const stateRanking = ranked(current);
  const signature = `${ALIASES[constitutionRanking[0]]}-${ALIASES[constitutionRanking[1]]}-${Math.round(baseline.vata * 100)}${Math.round(baseline.pitta * 100)}${Math.round(baseline.kapha * 100)}`;

  return {
    version: 1,
    constitution: {
      baseline,
      dominant: constitutionRanking[0],
      secondary: constitutionRanking[1],
      signature,
      aliases: ALIASES,
    },
    state: {
      current,
      drift,
      dominant: stateRanking[0],
      phase,
      coherence,
      volatility,
      throughput,
      cohesion,
      residue,
    },
    guidance: resolveGuidance(phase, residue),
  };
}
