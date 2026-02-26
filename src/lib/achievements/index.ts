/**
 * Achievements System - Milestone tracking and rewards
 * Offline-first, privacy-preserving progress tracking
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'care' | 'battle' | 'exploration' | 'evolution' | 'social';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  reward: {
    type: 'cosmetic' | 'boost' | 'badge';
    value: string;
  };
}

export interface AchievementsState {
  achievements: Achievement[];
  totalUnlocked: number;
  totalPoints: number;
  lastChecked: number;
}

/**
 * Default achievements catalog
 */
export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  // Care achievements
  {
    id: 'caretaker-novice',
    name: 'Novice Caretaker',
    description: 'Keep vitals above 50 for 1 hour',
    category: 'care',
    tier: 'bronze',
    unlocked: false,
    progress: 0,
    maxProgress: 60,
    reward: { type: 'boost', value: 'vitals_decay_-10%' },
  },
  {
    id: 'caretaker-master',
    name: 'Master Caretaker',
    description: 'Keep vitals above 80 for 24 hours',
    category: 'care',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 1440,
    reward: { type: 'cosmetic', value: 'halo-sacred' },
  },
  {
    id: 'perfect-day',
    name: 'Perfect Day',
    description: 'Maintain all vitals at 100 for 1 hour',
    category: 'care',
    tier: 'platinum',
    unlocked: false,
    progress: 0,
    maxProgress: 60,
    reward: { type: 'badge', value: 'platinum_caretaker' },
  },
  
  // Battle achievements
  {
    id: 'first-victory',
    name: 'First Victory',
    description: 'Win your first consciousness battle',
    category: 'battle',
    tier: 'bronze',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    reward: { type: 'boost', value: 'shield_regen_+5' },
  },
  {
    id: 'battle-veteran',
    name: 'Battle Veteran',
    description: 'Win 25 battles',
    category: 'battle',
    tier: 'silver',
    unlocked: false,
    progress: 0,
    maxProgress: 25,
    reward: { type: 'cosmetic', value: 'aura-fire' },
  },
  {
    id: 'battle-master',
    name: 'Battle Master',
    description: 'Win 100 battles',
    category: 'battle',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    reward: { type: 'cosmetic', value: 'effect-quantum' },
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Win 10 battles in a row',
    category: 'battle',
    tier: 'platinum',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    reward: { type: 'badge', value: 'unstoppable_champion' },
  },
  
  // Exploration achievements
  {
    id: 'first-scan',
    name: 'First Scan',
    description: 'Explore your first Vimana cell',
    category: 'exploration',
    tier: 'bronze',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    reward: { type: 'boost', value: 'sample_rate_+10%' },
  },
  {
    id: 'field-researcher',
    name: 'Field Researcher',
    description: 'Collect 50 field samples',
    category: 'exploration',
    tier: 'silver',
    unlocked: false,
    progress: 0,
    maxProgress: 50,
    reward: { type: 'cosmetic', value: 'horns-crystal' },
  },
  {
    id: 'anomaly-hunter',
    name: 'Anomaly Hunter',
    description: 'Resolve 10 anomalies',
    category: 'exploration',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    reward: { type: 'cosmetic', value: 'aura-void' },
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    description: 'Explore all Vimana cells',
    category: 'exploration',
    tier: 'platinum',
    unlocked: false,
    progress: 0,
    maxProgress: 16,
    reward: { type: 'badge', value: 'master_explorer' },
  },
  
  // Evolution achievements
  {
    id: 'first-evolution',
    name: 'First Evolution',
    description: 'Evolve to NEURO stage',
    category: 'evolution',
    tier: 'bronze',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    reward: { type: 'boost', value: 'evolution_speed_+15%' },
  },
  {
    id: 'quantum-being',
    name: 'Quantum Being',
    description: 'Reach QUANTUM stage',
    category: 'evolution',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    reward: { type: 'cosmetic', value: 'pattern-sacred' },
  },
  {
    id: 'speciation',
    name: 'Speciation',
    description: 'Achieve final SPECIATION stage',
    category: 'evolution',
    tier: 'platinum',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    reward: { type: 'cosmetic', value: 'crown-gold' },
  },
  
  // Social/Breeding achievements
  {
    id: 'first-offspring',
    name: 'First Offspring',
    description: 'Breed your first offspring',
    category: 'social',
    tier: 'bronze',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    reward: { type: 'boost', value: 'breeding_success_+10%' },
  },
  {
    id: 'lineage-keeper',
    name: 'Lineage Keeper',
    description: 'Create a family of 5 offspring',
    category: 'social',
    tier: 'silver',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    reward: { type: 'cosmetic', value: 'aura-rainbow' },
  },
  {
    id: 'dynasty-founder',
    name: 'Dynasty Founder',
    description: 'Create 20 offspring',
    category: 'social',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 20,
    reward: { type: 'badge', value: 'dynasty_founder' },
  },
];

/**
 * Check and update achievement progress
 */
export function updateAchievementProgress(
  achievements: Achievement[],
  gameState: {
    vitals: { hunger: number; energy: number; mood: number; hygiene: number };
    battle: { wins: number; streak: number };
    vimana: { totalSamples: number; anomaliesResolved: number; cells: Array<{ explored: boolean }> };
    evolution: { state: string };
    breeding: { offspringCount: number };
  }
): Achievement[] {
  return achievements.map(achievement => {
    if (achievement.unlocked) return achievement;
    
    let newProgress = achievement.progress;
    
    // Update based on achievement ID
    switch (achievement.id) {
      case 'first-victory':
        newProgress = gameState.battle.wins > 0 ? 1 : 0;
        break;
      case 'battle-veteran':
        newProgress = gameState.battle.wins;
        break;
      case 'battle-master':
        newProgress = gameState.battle.wins;
        break;
      case 'unstoppable':
        newProgress = gameState.battle.streak;
        break;
      case 'first-scan':
        newProgress = gameState.vimana.cells.filter(c => c.explored).length > 0 ? 1 : 0;
        break;
      case 'field-researcher':
        newProgress = gameState.vimana.totalSamples;
        break;
      case 'anomaly-hunter':
        newProgress = gameState.vimana.anomaliesResolved;
        break;
      case 'cartographer':
        newProgress = gameState.vimana.cells.filter(c => c.explored).length;
        break;
      case 'first-evolution':
        newProgress = ['NEURO', 'QUANTUM', 'SPECIATION'].includes(gameState.evolution.state) ? 1 : 0;
        break;
      case 'quantum-being':
        newProgress = ['QUANTUM', 'SPECIATION'].includes(gameState.evolution.state) ? 1 : 0;
        break;
      case 'speciation':
        newProgress = gameState.evolution.state === 'SPECIATION' ? 1 : 0;
        break;
      case 'first-offspring':
        newProgress = gameState.breeding.offspringCount > 0 ? 1 : 0;
        break;
      case 'lineage-keeper':
        newProgress = gameState.breeding.offspringCount;
        break;
      case 'dynasty-founder':
        newProgress = gameState.breeding.offspringCount;
        break;
    }
    
    const unlocked = newProgress >= achievement.maxProgress;
    
    return {
      ...achievement,
      progress: newProgress,
      unlocked,
      unlockedAt: unlocked && !achievement.unlockedAt ? Date.now() : achievement.unlockedAt,
    };
  });
}

/**
 * Get achievement points based on tier
 */
export function getAchievementPoints(tier: Achievement['tier']): number {
  const points = {
    bronze: 10,
    silver: 25,
    gold: 50,
    platinum: 100,
  };
  return points[tier];
}

/**
 * Calculate total achievement points
 */
export function calculateTotalPoints(achievements: Achievement[]): number {
  return achievements
    .filter(a => a.unlocked)
    .reduce((total, a) => total + getAchievementPoints(a.tier), 0);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS_CATALOG.filter(a => a.category === category);
}
