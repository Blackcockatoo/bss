/**
 * Guardian Form Definitions
 *
 * Six archetypal transformations with unique visual identities
 */

import type { Form, FormKey } from '../types';

export const GUARDIAN_FORMS: Record<FormKey, Form> = {
  radiant: {
    name: 'Radiant Guardian',
    baseColor: '#2C3E77',
    primaryGold: '#F4B942',
    secondaryGold: '#FFD700',
    tealAccent: '#4ECDC4',
    eyeColor: '#F4B942',
    glowColor: 'rgba(244, 185, 66, 0.3)',
    description: 'Calm strength - balanced blue and gold',
  },

  meditation: {
    name: 'Meditation Cocoon',
    baseColor: '#0d1321',
    primaryGold: '#2DD4BF',
    secondaryGold: '#4ECDC4',
    tealAccent: '#1a4d4d',
    eyeColor: '#2DD4BF',
    glowColor: 'rgba(45, 212, 191, 0.2)',
    description: 'Quiet endurance - dusk-teal respite',
  },

  sage: {
    name: 'Sage Luminary',
    baseColor: '#1a1f3a',
    primaryGold: '#FFD700',
    secondaryGold: '#F4B942',
    tealAccent: '#4ECDC4',
    eyeColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    description: 'Luminous focus - hepta-crown activated',
  },

  vigilant: {
    name: 'Vigilant Sentinel',
    baseColor: '#1a1f3a',
    primaryGold: '#FF6B35',
    secondaryGold: '#FF8C42',
    tealAccent: '#4ECDC4',
    eyeColor: '#FF6B35',
    glowColor: 'rgba(255, 107, 53, 0.4)',
    description: 'Focused will - indigo with neon fire',
  },

  celestial: {
    name: 'Celestial Voyager',
    baseColor: '#0A1128',
    primaryGold: '#E0E7FF',
    secondaryGold: '#C4B5FD',
    tealAccent: '#8B5CF6',
    eyeColor: '#E0E7FF',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    description: 'Cosmic transcendence - stardust and void',
  },

  wild: {
    name: 'Wild Verdant',
    baseColor: '#1A4D2E',
    primaryGold: '#7FFF00',
    secondaryGold: '#32CD32',
    tealAccent: '#90EE90',
    eyeColor: '#7FFF00',
    glowColor: 'rgba(127, 255, 0, 0.4)',
    description: 'Primal vitality - fractal growth unleashed',
  },
};

/**
 * Form unlock conditions
 */
export const FORM_CONDITIONS = {
  radiant: {
    check: () => true, // Default form, always available
    description: 'Default active state',
  },

  meditation: {
    check: (energy: number, health: number) => energy < 30 && health < 50,
    description: 'Energy < 30 AND Health < 50',
  },

  sage: {
    check: (energy: number, _health: number, curiosity: number, bond: number) =>
      bond > 60 && curiosity > 50,
    description: 'Bond > 60 AND Curiosity > 50',
  },

  vigilant: {
    check: (energy: number, _health: number, curiosity: number) =>
      energy > 70 && curiosity > 60,
    description: 'Energy > 70 AND Curiosity > 60',
  },

  celestial: {
    check: (
      _energy: number,
      _health: number,
      _curiosity: number,
      bond: number,
      dreamCount: number
    ) => bond > 80 && dreamCount > 3,
    description: 'Bond > 80 AND 3+ Dreams',
  },

  wild: {
    check: (
      energy: number,
      _health: number,
      curiosity: number,
      _bond: number,
      _dreamCount: number,
      activatedSigils: number
    ) => energy > 80 && curiosity > 70 && activatedSigils >= 5,
    description: 'Energy > 80, Curiosity > 70, 5+ Sigils',
  },
} as const;

/**
 * Determine active form based on stats
 */
export function getActiveForm(
  energy: number,
  health: number,
  curiosity: number,
  bond: number,
  dreamCount: number,
  activatedSigils: number
): FormKey {
  // Priority order (specific conditions first)
  if (FORM_CONDITIONS.meditation.check(energy, health)) return 'meditation';
  if (FORM_CONDITIONS.celestial.check(energy, health, curiosity, bond, dreamCount))
    return 'celestial';
  if (FORM_CONDITIONS.wild.check(energy, health, curiosity, bond, dreamCount, activatedSigils))
    return 'wild';
  if (FORM_CONDITIONS.vigilant.check(energy, health, curiosity)) return 'vigilant';
  if (FORM_CONDITIONS.sage.check(energy, health, curiosity, bond)) return 'sage';

  return 'radiant';
}
