/**
 * The wardrobe catalogue — every gameplay cosmetic, its slot, and its
 * structured unlock condition.
 *
 * This supersedes the old string-matched cosmetics catalogue
 * (src/lib/cosmetics). Item ids are unchanged so nothing a player earned is
 * ever orphaned. Requirement text shown in the UI is generated from
 * unlockCondition via describeUnlockCondition — never hand-written here.
 */

import { VIMANA_PRESET_CELL_COUNT } from '@/lib/progression/types';
import { HIGH_ENERGY_THRESHOLD } from './progress';
import type { WardrobeItem } from './types';

// ===== Unlock targets (named so no threshold is a magic number) =====

export const SACRED_HALO_BATTLE_WINS = 50;
export const CRYSTAL_HORNS_SAMPLE_TARGET = 100;
export const RAINBOW_AURA_OFFSPRING_TARGET = 5;
export const STARFIELD_MINIGAME_TARGET = 20;
export const FLAME_AURA_DURATION_MS = 60 * 60 * 1000; // one hour sustained
export const GOLDEN_CROWN_STAGE = 'SPECIATION';
export const QUANTUM_SHIMMER_STAGE = 'QUANTUM';

/**
 * The HeptaCode set: seven core achievements (one per pillar of the
 * companion's identity code) whose ids are stable in ACHIEVEMENT_CATALOG.
 * Sacred Geometry unlocks when all seven are earned.
 */
export const HEPTACODE_ACHIEVEMENT_IDS: readonly string[] = [
  'explorer-first-step',
  'explorer-anomaly-hunter',
  'battle-first-win',
  'battle-streak',
  'breeding-first',
  'evolve-neuro',
  'evolve-quantum',
];

export const WARDROBE_CATALOG: readonly WardrobeItem[] = [
  {
    id: 'effect-sparkle',
    name: 'Sparkle Trail',
    description: 'Leave sparkling traces of movement',
    category: 'trail',
    rarity: 'common',
    unlockCondition: { type: 'default' },
    visualData: {
      anchor: 'ground',
      color: '#FDE68A',
      glowColor: '#FEF3C7',
      animation: 'sparkle',
      particles: { count: 6, color: '#FDE68A', size: 1.6, behavior: 'trail' },
    },
  },
  {
    id: 'crown-gold',
    name: 'Golden Crown',
    description: 'A crown of pure consciousness energy',
    category: 'head',
    rarity: 'epic',
    unlockCondition: { type: 'evolution_stage', stage: GOLDEN_CROWN_STAGE },
    visualData: {
      anchor: 'headTop',
      color: '#FFD700',
      secondaryColor: '#B8860B',
      glowColor: '#FFF3B0',
      svgPath:
        'M -16 8 L -16 -4 L -9 2 L 0 -12 L 9 2 L 16 -4 L 16 8 Z M -16 10 L 16 10 L 16 13 L -16 13 Z',
      animation: 'shimmer',
      offset: { x: 0, y: -26 },
    },
  },
  {
    id: 'halo-sacred',
    name: 'Sacred Halo',
    description: 'Radiates pure harmonic resonance',
    category: 'head',
    rarity: 'legendary',
    unlockCondition: { type: 'battle_wins', target: SACRED_HALO_BATTLE_WINS },
    visualData: {
      anchor: 'headTop',
      color: '#FFFACD',
      secondaryColor: '#F5D061',
      glowColor: '#FFF9C4',
      // Donut: outer ellipse wound one way, inner the other.
      svgPath:
        'M -18 0 A 18 7 0 1 0 18 0 A 18 7 0 1 0 -18 0 Z M -13 0 A 13 4.5 0 1 1 13 0 A 13 4.5 0 1 1 -13 0 Z',
      animation: 'pulse',
      offset: { x: 0, y: -40 },
    },
  },
  {
    id: 'horns-crystal',
    name: 'Crystal Horns',
    description: 'Shimmering crystalline antlers',
    category: 'horns',
    rarity: 'rare',
    unlockCondition: {
      type: 'vimana_samples',
      target: CRYSTAL_HORNS_SAMPLE_TARGET,
    },
    visualData: {
      anchor: 'forehead',
      color: '#87CEEB',
      secondaryColor: '#B7E3F5',
      glowColor: '#D6F1FB',
      svgPath:
        'M -18 6 L -24 -14 L -18 -8 L -16 -20 L -11 -4 L -13 6 Z M 18 6 L 24 -14 L 18 -8 L 16 -20 L 11 -4 L 13 6 Z',
      animation: 'shimmer',
      offset: { x: 0, y: -14 },
    },
  },
  {
    id: 'aura-rainbow',
    name: 'Rainbow Aura',
    description: 'Multi-spectral energy field',
    category: 'aura',
    rarity: 'epic',
    unlockCondition: {
      type: 'offspring_count',
      target: RAINBOW_AURA_OFFSPRING_TARGET,
    },
    visualData: {
      anchor: 'auraRing',
      color: '#E879F9',
      secondaryColor: '#60A5FA',
      glowColor: '#F0ABFC',
      svgPath:
        'M -70 0 A 70 82 0 1 0 70 0 A 70 82 0 1 0 -70 0 Z M -62 0 A 62 74 0 1 1 62 0 A 62 74 0 1 1 -62 0 Z',
      animation: 'pulse',
      particles: { count: 8, color: '#93C5FD', size: 2, behavior: 'orbit' },
    },
  },
  {
    id: 'aura-void',
    name: 'Void Aura',
    description: 'Dark energy from quantum depths',
    category: 'aura',
    rarity: 'legendary',
    unlockCondition: {
      type: 'vimana_cells',
      target: VIMANA_PRESET_CELL_COUNT,
      requireAllCells: true,
    },
    hiddenUntilUnlocked: true,
    visualData: {
      anchor: 'auraRing',
      color: '#2E1065',
      secondaryColor: '#6D28D9',
      glowColor: '#7C3AED',
      svgPath:
        'M -72 0 A 72 84 0 1 0 72 0 A 72 84 0 1 0 -72 0 Z M -60 0 A 60 72 0 1 1 60 0 A 60 72 0 1 1 -60 0 Z',
      animation: 'swirl',
      particles: { count: 7, color: '#8B5CF6', size: 1.8, behavior: 'ambient' },
    },
  },
  {
    id: 'aura-fire',
    name: 'Flame Aura',
    description: 'Burning life force manifestation',
    category: 'aura',
    rarity: 'rare',
    unlockCondition: {
      type: 'sustained_stat',
      stat: 'energy',
      minimum: HIGH_ENERGY_THRESHOLD,
      durationMs: FLAME_AURA_DURATION_MS,
    },
    visualData: {
      anchor: 'auraRing',
      color: '#FF6B35',
      secondaryColor: '#F59E0B',
      glowColor: '#FCA311',
      svgPath:
        'M -68 0 A 68 80 0 1 0 68 0 A 68 80 0 1 0 -68 0 Z M -58 0 A 58 70 0 1 1 58 0 A 58 70 0 1 1 -58 0 Z',
      animation: 'flicker',
      particles: { count: 9, color: '#FDBA74', size: 1.8, behavior: 'burst' },
    },
  },
  {
    id: 'pattern-stars',
    name: 'Starfield Pattern',
    description: 'Cosmic patterns across the body',
    category: 'bodyPattern',
    rarity: 'rare',
    unlockCondition: {
      type: 'minigames_completed',
      target: STARFIELD_MINIGAME_TARGET,
    },
    visualData: {
      anchor: 'bodyCenter',
      color: '#C7D2FE',
      glowColor: '#E0E7FF',
      svgPath:
        'M 0 -26 L 2 -20 L 8 -20 L 3 -16 L 5 -10 L 0 -14 L -5 -10 L -3 -16 L -8 -20 L -2 -20 Z ' +
        'M -20 4 L -18.5 8 L -14 8 L -17.5 10.5 L -16 15 L -20 12 L -24 15 L -22.5 10.5 L -26 8 L -21.5 8 Z ' +
        'M 20 -2 L 21.5 2 L 26 2 L 22.5 4.5 L 24 9 L 20 6 L 16 9 L 17.5 4.5 L 14 2 L 18.5 2 Z',
      animation: 'sparkle',
      particles: { count: 5, color: '#E0E7FF', size: 1.2, behavior: 'ambient' },
    },
  },
  {
    id: 'pattern-sacred',
    name: 'Sacred Geometry',
    description: 'Ancient symbols of power',
    category: 'bodyPattern',
    rarity: 'epic',
    unlockCondition: {
      type: 'achievement_set',
      achievementIds: [...HEPTACODE_ACHIEVEMENT_IDS],
      requireAll: true,
    },
    visualData: {
      anchor: 'bodyCenter',
      color: '#F0ABFC',
      secondaryColor: '#A78BFA',
      glowColor: '#E9D5FF',
      svgPath:
        'M 0 -26 L 22.5 13 L -22.5 13 Z M 0 26 L 22.5 -13 L -22.5 -13 Z',
      animation: 'shimmer',
    },
  },
  {
    id: 'effect-quantum',
    name: 'Quantum Shimmer',
    description: 'Phase between realities',
    category: 'trail',
    rarity: 'legendary',
    unlockCondition: { type: 'evolution_stage', stage: QUANTUM_SHIMMER_STAGE },
    visualData: {
      anchor: 'bodyCenter',
      color: '#F472B6',
      secondaryColor: '#38BDF8',
      glowColor: '#FBCFE8',
      animation: 'phase',
      particles: { count: 8, color: '#7DD3FC', size: 1.6, behavior: 'ambient' },
    },
  },
];

const CATALOG_BY_ID = new Map(WARDROBE_CATALOG.map((item) => [item.id, item]));

/** Items owned by every profile without any condition being met. */
export const DEFAULT_WARDROBE_ITEM_IDS: readonly string[] =
  WARDROBE_CATALOG.filter((item) => item.unlockCondition.type === 'default').map(
    (item) => item.id,
  );

export function getWardrobeItem(itemId: string): WardrobeItem | undefined {
  return CATALOG_BY_ID.get(itemId);
}

export function getWardrobeItemsBySlot(slot: WardrobeItem['category']): WardrobeItem[] {
  return WARDROBE_CATALOG.filter((item) => item.category === slot);
}
