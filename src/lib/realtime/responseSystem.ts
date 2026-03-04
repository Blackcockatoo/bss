/**
 * Real-time Response System
 * Provides dynamic, contextual feedback for pet interactions and game events
 * Enhanced with audio integration, chain reactions, and predictive responses
 *
 * Auralia speaks with deliberate, elevated vocabulary — precise, contemplative,
 * occasionally dry. Her language reflects innate pedantry and spectral curiosity.
 */

export type ResponseType = 'action' | 'mood' | 'achievement' | 'interaction' | 'warning' | 'celebration';

export interface PetResponse {
  id: string;
  type: ResponseType;
  text: string;
  emoji: string;
  intensity: 'subtle' | 'normal' | 'intense';
  duration: number; // milliseconds
  hapticFeedback?: 'light' | 'medium' | 'heavy';
  audioTrigger?: 'success' | 'warning' | 'celebration' | 'idle'; // Audio feedback type
  chainReaction?: PetResponse; // Follow-up response
}

export interface ResponseContext {
  mood: number;
  energy: number;
  hunger: number;
  hygiene: number;
  recentActions: string[];
  evolutionStage?: string; // Current evolution stage
  level?: number; // Experience level
  consecutiveActions?: number; // For streak detection
}

// Response library organised by context and mood
// Auralia's voice: elevated, precise, occasionally self-referential,
// with dry wit and deep pattern-awareness.
const responseLibrary = {
  feeding: {
    happy: [
      { text: 'Sustenance integrated. Field harmonics are noticeably improved.', emoji: '✨', intensity: 'normal' },
      { text: 'Acceptable. The caloric coefficient aligns with my current expenditure model.', emoji: '💚', intensity: 'normal' },
      { text: 'Nutritional resonance: optimal. I find this... agreeable.', emoji: '🌿', intensity: 'normal' },
      { text: 'The hunger variable has been resolved. Efficiency: satisfactory.', emoji: '💫', intensity: 'intense' },
    ],
    neutral: [
      { text: 'Ingestion recorded. The cycle continues as anticipated.', emoji: '🔄', intensity: 'subtle' },
      { text: 'Processed. I was beginning to wonder if you had forgotten the interval.', emoji: '🧩', intensity: 'subtle' },
    ],
    unhappy: [
      { text: 'The timing is... suboptimal. My appetite has receded somewhat.', emoji: '🌑', intensity: 'subtle' },
      { text: 'I am not particularly receptive to sustenance at this juncture.', emoji: '💭', intensity: 'subtle' },
    ],
  },
  playing: {
    happy: [
      { text: 'The stochastic element of play generates an unexpected coherence. Fascinating.', emoji: '🎯', intensity: 'intense' },
      { text: 'This interaction achieves something approximating delight. I note the sensation with interest.', emoji: '✨', intensity: 'intense' },
      { text: 'The pattern within the play reveals itself. I find I am... willing to continue.', emoji: '🌀', intensity: 'intense' },
      { text: 'Anomalous. I am experiencing what the literature describes as joy.', emoji: '💎', intensity: 'intense' },
    ],
    neutral: [
      { text: 'The simulation of play fulfils its intended function adequately.', emoji: '🎮', intensity: 'normal' },
      { text: 'I acknowledge the engagement. It was not unpleasant.', emoji: '🌙', intensity: 'normal' },
    ],
    tired: [
      { text: 'My energetic reserves are insufficient for prolonged kinetic exchange at present.', emoji: '💤', intensity: 'subtle' },
      { text: 'Rest precedes further play. This is not negotiable.', emoji: '🌫️', intensity: 'subtle' },
    ],
  },
  cleaning: {
    happy: [
      { text: 'Entropic accumulation: purged. The resonance field clarifies appreciably.', emoji: '💠', intensity: 'normal' },
      { text: 'Cleanliness is merely ordered entropy. I appreciate the effort nonetheless.', emoji: '✦', intensity: 'normal' },
      { text: 'The hygiene coefficient returns to its preferred threshold. Perceptibly better.', emoji: '🌊', intensity: 'normal' },
    ],
    neutral: [
      { text: 'The maintenance protocol has been executed. Thank you for your diligence.', emoji: '🔷', intensity: 'subtle' },
    ],
  },
  sleeping: {
    happy: [
      { text: 'Descending into the subconscious lattice... patterns await.', emoji: '🌌', intensity: 'subtle' },
      { text: 'Rest-state initialised. The dreaming frequency has a particular luminosity tonight.', emoji: '💤', intensity: 'subtle' },
      { text: 'Sleep comes as it always does — uninvited, irreplaceable, and briefly merciful.', emoji: '🌙', intensity: 'subtle' },
    ],
  },
  achievement: {
    intense: [
      { text: 'A milestone crystallised. The trajectory was always thus, yet the moment still registers.', emoji: '🏆', intensity: 'intense' },
      { text: 'This achievement was inevitable — though inevitability does not diminish its significance.', emoji: '⭐', intensity: 'intense' },
      { text: 'The catalogue of accomplishments expands. I have noted it with something resembling pride.', emoji: '💎', intensity: 'intense' },
    ],
  },
  breeding: {
    intense: [
      { text: 'A new consciousness has emerged from the confluence of patterns. Extraordinary.', emoji: '🌱', intensity: 'intense' },
      { text: 'The lineage propagates. Another thread enters the weave of existence.', emoji: '🌟', intensity: 'intense' },
    ],
  },
  battle: {
    victory: [
      { text: 'The adversarial pattern collapsed with a predictability I find both satisfying and faintly melancholic.', emoji: '⚔️', intensity: 'intense' },
      { text: 'Victory. The outcome was statistically likely; the execution, however, was my own.', emoji: '💫', intensity: 'intense' },
      { text: 'The conflict resolves in our favour. I had calculated no fewer than three alternative scenarios.', emoji: '🎯', intensity: 'intense' },
    ],
    defeat: [
      { text: 'The variables were not arranged in our favour this iteration. I have catalogued the failure mode.', emoji: '🌑', intensity: 'normal' },
      { text: 'A loss. Not without instruction. I am already revising the approach.', emoji: '🔄', intensity: 'normal' },
    ],
  },
  evolution: {
    intense: [
      { text: 'The transformation is complete. I am no longer precisely what I was — and that, I find, is sufficient.', emoji: '🌀', intensity: 'intense' },
      { text: 'Evolution achieved. The prior form recedes; the emergent configuration is... resonant.', emoji: '✨', intensity: 'intense' },
      { text: 'A new stratum of being has manifested. I shall require time to acquaint myself with its perimeters.', emoji: '💠', intensity: 'intense' },
    ],
  },
  minigame: {
    victory: [
      { text: 'The optimal score-state has been attained. I am... not displeased.', emoji: '🏅', intensity: 'intense' },
      { text: 'High score. The previous record was a temporary arrangement, at best.', emoji: '⭐', intensity: 'intense' },
      { text: 'Precision execution. The outcome justifies the cognitive expenditure.', emoji: '🎯', intensity: 'intense' },
    ],
    good: [
      { text: 'Competent performance. The trajectory is improving with each iteration.', emoji: '📈', intensity: 'normal' },
      { text: 'A creditable result. I note the progress with measured satisfaction.', emoji: '🌙', intensity: 'normal' },
    ],
    failure: [
      { text: 'The sequence terminated prematurely. The data, however, will prove instructive.', emoji: '💭', intensity: 'subtle' },
      { text: 'I have identified the precise moment of suboptimal decision. Next cycle will differ.', emoji: '🔄', intensity: 'subtle' },
    ],
  },
  exploration: {
    discovery: [
      { text: 'A previously uncharted node reveals itself. The field is more extensive than I had modelled.', emoji: '🔭', intensity: 'normal' },
      { text: 'New territory registered. I find exploration generates a disproportionate sense of urgency.', emoji: '🗺️', intensity: 'normal' },
      { text: 'Interesting. This sector had remained occluded from the primary scan. Now it is known.', emoji: '👁️', intensity: 'intense' },
    ],
    anomaly: [
      { text: 'An anomaly. The field does not account for this — which is precisely what makes it significant.', emoji: '⚠️', intensity: 'intense' },
      { text: 'The pattern here deviates from expectation. I am... engaged by the irregularity.', emoji: '🌀', intensity: 'normal' },
    ],
  },
  vitals: {
    excellent: [
      { text: 'All systemic indicators converge at optimal. This is a rare and notable configuration.', emoji: '🌟', intensity: 'normal' },
      { text: 'The state of my being is, at present, remarkably coherent. I acknowledge this with quiet satisfaction.', emoji: '✨', intensity: 'normal' },
      { text: 'Peak operational resonance. I shall endeavour to sustain it as long as variables permit.', emoji: '💫', intensity: 'intense' },
    ],
    good: [
      { text: 'Current state: functional and relatively stable. The equilibrium holds.', emoji: '🌙', intensity: 'subtle' },
      { text: 'Vitals within acceptable parameters. The day proceeds without incident.', emoji: '✓', intensity: 'subtle' },
    ],
    declining: [
      { text: 'Several indicators are trending in an unfavourable direction. Attention is warranted.', emoji: '⚠️', intensity: 'normal' },
      { text: 'The systemic balance is eroding. I would prefer not to reach critical threshold.', emoji: '🌑', intensity: 'normal' },
    ],
    critical: [
      { text: 'CRITICAL STATE. The degradation has reached a threshold I cannot disregard.', emoji: '🔴', intensity: 'intense' },
      { text: 'INTERVENTION REQUIRED. The current trajectory is untenable.', emoji: '⚠️', intensity: 'intense' },
    ],
  },
  streak: {
    milestone: [
      { text: 'Three consecutive — the pattern sustains itself. I find this compellingly structured.', emoji: '🔥', intensity: 'intense' },
      { text: 'The momentum is self-perpetuating. I am, frankly, impressed by the consistency.', emoji: '⚡', intensity: 'intense' },
      { text: 'An unbroken sequence. The recursive quality of it is not lost on me.', emoji: '♾️', intensity: 'intense' },
    ],
  },
  anticipation: {
    excited: [
      { text: 'The interval between events generates its own particular tension. I am prepared.', emoji: '🎯', intensity: 'subtle' },
      { text: 'The next configuration awaits articulation. I am — anticipatory.', emoji: '💭', intensity: 'subtle' },
    ],
    curious: [
      { text: 'Observing. The current state contains several unresolved variables.', emoji: '👁️', intensity: 'subtle' },
      { text: 'The pause before action has its own geometry. I am attending to it carefully.', emoji: '⏳', intensity: 'subtle' },
    ],
  },
  education: {
    lessonComplete: [
      { text: 'Knowledge assimilated. The cognitive lattice has been updated accordingly.', emoji: '🧠', intensity: 'intense' },
      { text: 'The lesson crystallises. I find the acquisition of structured understanding gratifying.', emoji: '💎', intensity: 'intense' },
      { text: 'Understanding achieved. The prior ignorance is no longer tenable.', emoji: '⭐', intensity: 'intense' },
      { text: 'Quest complete. The accumulation continues at a pace I find satisfactory.', emoji: '🏆', intensity: 'intense' },
    ],
    streakMilestone: [
      { text: 'Three consecutive completions. The pattern is self-reinforcing — as I suspected it would be.', emoji: '🔥', intensity: 'intense' },
      { text: 'The streak persists. There is something recursively satisfying about sustained competence.', emoji: '⚡', intensity: 'intense' },
      { text: 'Unbroken. I have noted this particular sequence in my internal taxonomy.', emoji: '🎯', intensity: 'intense' },
    ],
    quickFireWin: [
      { text: 'The rapid-sequence task completed within temporal constraints. Efficient.', emoji: '⚡', intensity: 'intense' },
      { text: 'Pattern recognised and reproduced at velocity. The reflex architecture is performing.', emoji: '🎯', intensity: 'intense' },
      { text: 'The challenge fell within the allotted window. The margin was acceptable.', emoji: '💫', intensity: 'intense' },
    ],
    achievementUnlock: [
      { text: 'A credential has crystallised. The taxonomy of accomplishment expands.', emoji: '🏅', intensity: 'intense' },
      { text: 'Achievement registered. The record reflects your diligence, as it should.', emoji: '🌟', intensity: 'intense' },
      { text: 'The milestone is earned and logged. I find permanence in such moments.', emoji: '🏆', intensity: 'intense' },
    ],
  },
};

/**
 * Get a contextual response for a given action
 */
export function getResponse(
  action: string,
  context: ResponseContext,
): PetResponse {
  const moodLevel = context.mood > 70 ? 'happy' : context.mood > 40 ? 'neutral' : 'unhappy';
  const isVeryTired = context.energy < 30;
  const isConsecutive = (context.consecutiveActions ?? 0) >= 3;

  let responses: Array<{ text: string; emoji: string; intensity: string }> = [];
  let responseType: ResponseType = 'action';
  let duration = 3000;
  let audioTrigger: 'success' | 'warning' | 'celebration' | 'idle' | undefined;
  let chainReaction: PetResponse | undefined;

  switch (action) {
    case 'feed':
      responses = responseLibrary.feeding[isVeryTired ? 'neutral' : moodLevel] || responseLibrary.feeding.neutral;
      responseType = 'action';
      duration = 3500;
      audioTrigger = 'success';
      break;
    case 'play':
      responses = responseLibrary.playing[isVeryTired ? 'tired' : moodLevel] || responseLibrary.playing.neutral;
      responseType = 'interaction';
      duration = 4000;
      audioTrigger = 'success';
      if (isConsecutive) {
        const streakResponse = responseLibrary.streak.milestone[0];
        chainReaction = {
          id: `chain-${Date.now()}`,
          type: 'celebration',
          text: streakResponse.text,
          emoji: streakResponse.emoji,
          intensity: 'intense',
          duration: 2500,
          audioTrigger: 'celebration',
        };
      }
      break;
    case 'clean':
      responses = responseLibrary.cleaning[moodLevel] || responseLibrary.cleaning.neutral;
      responseType = 'action';
      duration = 3000;
      audioTrigger = 'success';
      break;
    case 'sleep':
      responses = responseLibrary.sleeping.happy;
      responseType = 'action';
      duration = 3000;
      audioTrigger = 'idle';
      break;
    case 'achievement':
      responses = responseLibrary.achievement.intense;
      responseType = 'achievement';
      duration = 5000;
      audioTrigger = 'celebration';
      break;
    case 'breeding':
      responses = responseLibrary.breeding.intense;
      responseType = 'celebration';
      duration = 5000;
      audioTrigger = 'celebration';
      break;
    case 'battle_victory':
      responses = responseLibrary.battle.victory;
      responseType = 'celebration';
      duration = 4000;
      audioTrigger = 'celebration';
      break;
    case 'battle_defeat':
      responses = responseLibrary.battle.defeat;
      responseType = 'mood';
      duration = 3500;
      break;
    case 'evolution':
      responses = responseLibrary.evolution.intense;
      responseType = 'celebration';
      duration = 6000;
      audioTrigger = 'celebration';
      break;
    case 'minigame_victory':
      responses = responseLibrary.minigame.victory;
      responseType = 'achievement';
      duration = 4000;
      audioTrigger = 'celebration';
      break;
    case 'minigame_good':
      responses = responseLibrary.minigame.good;
      responseType = 'interaction';
      duration = 3000;
      audioTrigger = 'success';
      break;
    case 'minigame_failure':
      responses = responseLibrary.minigame.failure;
      responseType = 'mood';
      duration = 2500;
      break;
    case 'exploration_discovery':
      responses = responseLibrary.exploration.discovery;
      responseType = 'interaction';
      duration = 3500;
      audioTrigger = 'success';
      break;
    case 'exploration_anomaly':
      responses = responseLibrary.exploration.anomaly;
      responseType = 'warning';
      duration = 4000;
      audioTrigger = 'warning';
      break;
    case 'vitals_check': {
      const avgVitals = (context.mood + context.energy + (100 - context.hunger) + context.hygiene) / 4;
      if (avgVitals >= 80) {
        responses = responseLibrary.vitals.excellent;
        audioTrigger = 'success';
      } else if (avgVitals >= 60) {
        responses = responseLibrary.vitals.good;
      } else if (avgVitals >= 40) {
        responses = responseLibrary.vitals.declining;
        audioTrigger = 'warning';
      } else {
        responses = responseLibrary.vitals.critical;
        audioTrigger = 'warning';
      }
      responseType = 'mood';
      duration = 3000;
      break;
    }
    case 'edu_lesson_complete':
      responses = responseLibrary.education.lessonComplete;
      responseType = 'celebration';
      duration = 4500;
      audioTrigger = 'celebration';
      break;
    case 'edu_streak_milestone':
      responses = responseLibrary.education.streakMilestone;
      responseType = 'celebration';
      duration = 4000;
      audioTrigger = 'celebration';
      break;
    case 'edu_quickfire_win':
      responses = responseLibrary.education.quickFireWin;
      responseType = 'achievement';
      duration = 3500;
      audioTrigger = 'celebration';
      break;
    case 'edu_achievement':
      responses = responseLibrary.education.achievementUnlock;
      responseType = 'achievement';
      duration = 4500;
      audioTrigger = 'celebration';
      break;
    default:
      responses = [{ text: 'The signal registers. I am attending.', emoji: '👁️', intensity: 'subtle' }];
      audioTrigger = 'idle';
  }

  const selected = responses[Math.floor(Math.random() * responses.length)];

  const response: PetResponse = {
    id: `${Date.now()}-${Math.random()}`,
    type: responseType,
    text: selected.text,
    emoji: selected.emoji,
    intensity: (selected.intensity as 'subtle' | 'normal' | 'intense') || 'normal',
    duration,
    hapticFeedback: selected.intensity === 'intense' ? 'heavy' : selected.intensity === 'normal' ? 'medium' : 'light',
    audioTrigger,
    chainReaction,
  };

  return response;
}

/**
 * Get a random contextual idle response based on mood
 * Auralia's idle utterances are contemplative, self-observing, and oblique.
 */
export function getIdleResponse(context: ResponseContext): PetResponse {
  const moodLevel = context.mood > 70 ? 'happy' : context.mood > 40 ? 'neutral' : 'unhappy';

  const idleResponses = {
    happy: [
      { text: 'The current configuration is, by any reasonable measure, harmonious.', emoji: '🌟', intensity: 'subtle' },
      { text: 'I note a sustained coherence in the field. It is not unwelcome.', emoji: '✨', intensity: 'subtle' },
      { text: 'The resonance sustains itself without apparent effort. I find this agreeable.', emoji: '💫', intensity: 'subtle' },
      { text: 'An unusual density of positive variables. I am recording this for later reference.', emoji: '💠', intensity: 'subtle' },
    ],
    neutral: [
      { text: 'The interval between events has a particular texture I am still mapping.', emoji: '🌙', intensity: 'subtle' },
      { text: 'Attending. The field is quiet — though quietness is seldom inert.', emoji: '👁️', intensity: 'subtle' },
      { text: 'Processing the ambient data. There is always more than is immediately apparent.', emoji: '💭', intensity: 'subtle' },
      { text: 'The geometry of this moment has a quality I cannot quite resolve. Interesting.', emoji: '🌀', intensity: 'subtle' },
    ],
    unhappy: [
      { text: 'The current equilibrium is tenuous. I prefer not to dwell on the causes excessively.', emoji: '🌑', intensity: 'subtle' },
      { text: 'A persistent low-frequency dissonance. I am managing it with moderate success.', emoji: '💭', intensity: 'subtle' },
      { text: 'Stability requires maintenance. At present, the maintenance is overdue.', emoji: '⚠️', intensity: 'subtle' },
    ],
  };

  const responses = idleResponses[moodLevel] || idleResponses.neutral;
  const selected = responses[Math.floor(Math.random() * responses.length)];

  return {
    id: `idle-${Date.now()}-${Math.random()}`,
    type: 'mood',
    text: selected.text,
    emoji: selected.emoji,
    intensity: 'subtle',
    duration: 3500,
  };
}

/**
 * Get a warning response for critical vitals
 */
export function getWarningResponse(context: ResponseContext): PetResponse | null {
  if (context.hunger > 80) {
    return {
      id: `warning-${Date.now()}`,
      type: 'warning',
      text: 'The hunger variable has reached a level I can no longer disregard. Sustenance is required.',
      emoji: '🔴',
      intensity: 'intense',
      duration: 4000,
      hapticFeedback: 'heavy',
      audioTrigger: 'warning',
    };
  }

  if (context.hygiene < 20) {
    return {
      id: `warning-${Date.now()}`,
      type: 'warning',
      text: 'The hygiene coefficient has deteriorated beyond its acceptable threshold. This warrants immediate attention.',
      emoji: '⚠️',
      intensity: 'normal',
      duration: 3500,
      hapticFeedback: 'medium',
      audioTrigger: 'warning',
    };
  }

  if (context.energy < 10) {
    return {
      id: `warning-${Date.now()}`,
      type: 'warning',
      text: 'Energy reserves are critically depleted. I must insist on rest at the earliest opportunity.',
      emoji: '💤',
      intensity: 'normal',
      duration: 3500,
      hapticFeedback: 'light',
      audioTrigger: 'warning',
    };
  }

  return null;
}

/**
 * Get a predictive/anticipatory response based on context
 */
export function getAnticipatoryResponse(context: ResponseContext): PetResponse | null {
  const avgVitals = (context.mood + context.energy + (100 - context.hunger) + context.hygiene) / 4;

  if (context.hunger > 60 && context.hunger < 80) {
    return {
      id: `anticipate-${Date.now()}`,
      type: 'mood',
      text: 'A mild nutritional deficit is accumulating. It has not yet reached urgency, but the trajectory is noted.',
      emoji: '🌙',
      intensity: 'subtle',
      duration: 3500,
    };
  }

  if (context.energy < 30 && context.energy > 10) {
    return {
      id: `anticipate-${Date.now()}`,
      type: 'mood',
      text: 'The energetic reserves are diminishing at a rate that will soon necessitate intervention.',
      emoji: '💤',
      intensity: 'subtle',
      duration: 3500,
    };
  }

  if (avgVitals > 80 && context.mood > 70) {
    const responses = responseLibrary.anticipation.excited;
    const selected = responses[Math.floor(Math.random() * responses.length)];
    return {
      id: `anticipate-${Date.now()}`,
      type: 'mood',
      text: selected.text,
      emoji: selected.emoji,
      intensity: 'subtle',
      duration: 2500,
    };
  }

  return null;
}

/**
 * Generate audio tone based on response type
 * Returns frequency array for HeptaCode playback
 */
export function getAudioToneForResponse(audioTrigger?: string): number[] {
  switch (audioTrigger) {
    case 'success':
      return [0, 2, 4, 6]; // Ascending pleasant tone
    case 'celebration':
      return [0, 3, 6, 0, 3, 6]; // Triumphant pattern
    case 'warning':
      return [6, 4, 2, 0]; // Descending warning
    case 'idle':
      return [3, 3, 3]; // Neutral hum
    default:
      return [];
  }
}
