/**
 * Cosmetics System - Customization items earned through gameplay
 * Privacy-first: cosmetics are local-only, never sync raw DNA
 */

export interface Cosmetic {
  id: string;
  name: string;
  category: 'accessory' | 'aura' | 'pattern' | 'effect';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockCondition: string;
  description: string;
  visualData: {
    color?: string;
    svgPath?: string;
    animation?: string;
  };
}

export interface CosmeticsState {
  owned: string[];
  equipped: {
    accessory?: string;
    aura?: string;
    pattern?: string;
    effect?: string;
  };
  discovered: number;
  totalAvailable: number;
}

/**
 * Default cosmetics catalog
 */
export const COSMETICS_CATALOG: Cosmetic[] = [
  // Accessories
  {
    id: 'crown-gold',
    name: 'Golden Crown',
    category: 'accessory',
    rarity: 'epic',
    unlocked: false,
    unlockCondition: 'Reach SPECIATION stage',
    description: 'A crown of pure consciousness energy',
    visualData: { color: '#FFD700', svgPath: 'M10,5 L15,10 L20,5 L18,15 L12,15 Z' },
  },
  {
    id: 'halo-sacred',
    name: 'Sacred Halo',
    category: 'accessory',
    rarity: 'legendary',
    unlocked: false,
    unlockCondition: 'Win 50 battles',
    description: 'Radiates pure harmonic resonance',
    visualData: { color: '#FFFACD', svgPath: 'circle' },
  },
  {
    id: 'horns-crystal',
    name: 'Crystal Horns',
    category: 'accessory',
    rarity: 'rare',
    unlocked: false,
    unlockCondition: 'Collect 100 samples',
    description: 'Shimmering crystalline antlers',
    visualData: { color: '#87CEEB' },
  },
  
  // Auras
  {
    id: 'aura-rainbow',
    name: 'Rainbow Aura',
    category: 'aura',
    rarity: 'epic',
    unlocked: false,
    unlockCondition: 'Breed 5 offspring',
    description: 'Multi-spectral energy field',
    visualData: { color: 'rainbow', animation: 'pulse' },
  },
  {
    id: 'aura-void',
    name: 'Void Aura',
    category: 'aura',
    rarity: 'legendary',
    unlocked: false,
    unlockCondition: 'Explore all Vimana cells',
    description: 'Dark energy from quantum depths',
    visualData: { color: '#1a001a', animation: 'swirl' },
  },
  {
    id: 'aura-fire',
    name: 'Flame Aura',
    category: 'aura',
    rarity: 'rare',
    unlocked: false,
    unlockCondition: 'Maintain 90+ energy for 1 hour',
    description: 'Burning life force manifestation',
    visualData: { color: '#FF6B35', animation: 'flicker' },
  },
  
  // Patterns
  {
    id: 'pattern-stars',
    name: 'Starfield Pattern',
    category: 'pattern',
    rarity: 'rare',
    unlocked: false,
    unlockCondition: 'Complete 20 mini-games',
    description: 'Cosmic patterns across the body',
    visualData: { svgPath: 'stars' },
  },
  {
    id: 'pattern-sacred',
    name: 'Sacred Geometry',
    category: 'pattern',
    rarity: 'epic',
    unlocked: false,
    unlockCondition: 'Unlock all HeptaCode achievements',
    description: 'Ancient symbols of power',
    visualData: { svgPath: 'geometry' },
  },
  
  // Effects
  {
    id: 'effect-sparkle',
    name: 'Sparkle Trail',
    category: 'effect',
    rarity: 'common',
    unlocked: true,
    unlockCondition: 'Default',
    description: 'Leave sparkling traces of movement',
    visualData: { animation: 'sparkle' },
  },
  {
    id: 'effect-quantum',
    name: 'Quantum Shimmer',
    category: 'effect',
    rarity: 'legendary',
    unlocked: false,
    unlockCondition: 'Reach QUANTUM stage',
    description: 'Phase between realities',
    visualData: { animation: 'phase' },
  },
];

/**
 * Check unlock conditions for cosmetics
 */
export function checkUnlockConditions(
  gameState: {
    evolution: { state: string };
    battle: { wins: number };
    vimana: { totalSamples: number; anomaliesResolved: number };
    miniGames: { totalPlays: number };
    breeding: { offspringCount: number };
  }
): string[] {
  const unlocked: string[] = ['effect-sparkle']; // Default unlocked
  
  COSMETICS_CATALOG.forEach(cosmetic => {
    const condition = cosmetic.unlockCondition.toLowerCase();
    
    if (condition.includes('speciation') && gameState.evolution.state === 'SPECIATION') {
      unlocked.push(cosmetic.id);
    }
    if (condition.includes('50 battles') && gameState.battle.wins >= 50) {
      unlocked.push(cosmetic.id);
    }
    if (condition.includes('100 samples') && gameState.vimana.totalSamples >= 100) {
      unlocked.push(cosmetic.id);
    }
    if (condition.includes('5 offspring') && gameState.breeding.offspringCount >= 5) {
      unlocked.push(cosmetic.id);
    }
    if (condition.includes('all vimana') && gameState.vimana.anomaliesResolved >= 16) {
      unlocked.push(cosmetic.id);
    }
    if (condition.includes('20 mini-games') && gameState.miniGames.totalPlays >= 20) {
      unlocked.push(cosmetic.id);
    }
    if (condition.includes('quantum') && gameState.evolution.state === 'QUANTUM') {
      unlocked.push(cosmetic.id);
    }
  });
  
  return unlocked;
}

/**
 * Get cosmetic by ID
 */
export function getCosmeticById(id: string): Cosmetic | undefined {
  return COSMETICS_CATALOG.find(c => c.id === id);
}

/**
 * Get cosmetics by category
 */
export function getCosmeticsByCategory(category: Cosmetic['category']): Cosmetic[] {
  return COSMETICS_CATALOG.filter(c => c.category === category);
}

/**
 * Get cosmetics by rarity
 */
export function getCosmeticsByRarity(rarity: Cosmetic['rarity']): Cosmetic[] {
  return COSMETICS_CATALOG.filter(c => c.rarity === rarity);
}
