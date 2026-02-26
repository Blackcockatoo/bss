/**
 * Musical Scale Configurations
 *
 * Four tuning systems for the generative audio engine
 */

import type { ScaleName, AudioScale } from '../types';

export const AUDIO_SCALES: Record<ScaleName, AudioScale> = {
  harmonic: {
    name: 'Harmonic (Just Intonation)',
    ratios: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 15 / 8, 2],
    description: 'Pure mathematical ratios from the harmonic series',
  },

  pentatonic: {
    name: 'Pentatonic',
    ratios: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2],
    description: 'Five-note East Asian scale',
  },

  dorian: {
    name: 'Dorian Mode',
    ratios: [1, 9 / 8, 32 / 27, 4 / 3, 3 / 2, 27 / 16, 16 / 9, 2],
    description: 'Medieval church mode with minor quality',
  },

  phrygian: {
    name: 'Phrygian Mode',
    ratios: [1, 256 / 243, 32 / 27, 4 / 3, 3 / 2, 128 / 81, 16 / 9, 2],
    description: 'Spanish/Middle Eastern flavored mode',
  },
};

/**
 * Base frequency for all oscillators (432 Hz tuning)
 */
export const BASE_FREQUENCY = 432;

/**
 * Drone oscillator frequency multipliers (sub-bass layer)
 */
export const DRONE_RATIOS = [0.5, 0.75, 1];

/**
 * Ambient texture frequencies (wind-like sound)
 */
export const AMBIENT_FREQUENCIES = [60, 90];

/**
 * Audio system parameters
 */
export const AUDIO_PARAMS = {
  masterGain: 0.8,
  reverbTime: 2,
  reverbDecay: 0.5,
  lfoFrequency: 0.2,
  lfoGain: 0.005,
  ambientLFOFrequency: 0.1,
  ambientLFOGain: 0.3,
  ambientGain: 0.01,
  noteAttackTime: 0.03,
  noteReleaseTime: 0.3,
  noteVolume: 0.15,
  droneMaxVolume: 0.02,
} as const;
