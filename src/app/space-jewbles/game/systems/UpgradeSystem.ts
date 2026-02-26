export interface Upgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effect: (level: number) => number;
  category: 'damage' | 'speed' | 'idle' | 'special';
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'damage',
    name: 'Damage Boost',
    description: 'Increase damage dealt',
    level: 0,
    maxLevel: 50,
    baseCost: 50,
    costMultiplier: 1.15,
    effect: (level) => 1 + level * 0.1, // +10% per level
    category: 'damage',
  },
  {
    id: 'fireRate',
    name: 'Fire Rate',
    description: 'Attack faster',
    level: 0,
    maxLevel: 30,
    baseCost: 75,
    costMultiplier: 1.2,
    effect: (level) => Math.max(100, 300 - level * 10), // Reduce cooldown
    category: 'speed',
  },
  {
    id: 'critChance',
    name: 'Critical Hit',
    description: 'Chance for 2x damage',
    level: 0,
    maxLevel: 20,
    baseCost: 100,
    costMultiplier: 1.25,
    effect: (level) => 0.05 + level * 0.02, // +2% per level
    category: 'damage',
  },
  {
    id: 'autoFire',
    name: 'Auto-Fire',
    description: 'Unlock automatic attacks',
    level: 0,
    maxLevel: 1,
    baseCost: 500,
    costMultiplier: 1,
    effect: (level) => level, // Boolean
    category: 'idle',
  },
  {
    id: 'autoFireSpeed',
    name: 'Auto-Fire Speed',
    description: 'Increase auto-fire rate',
    level: 0,
    maxLevel: 25,
    baseCost: 200,
    costMultiplier: 1.18,
    effect: (level) => Math.max(200, 1000 - level * 30), // Reduce interval
    category: 'idle',
  },
  {
    id: 'offlineEarnings',
    name: 'Offline Earnings',
    description: 'Earn more while away',
    level: 0,
    maxLevel: 15,
    baseCost: 300,
    costMultiplier: 1.3,
    effect: (level) => 1 + level * 0.15, // +15% per level
    category: 'idle',
  },
  {
    id: 'multiShot',
    name: 'Multi-Shot',
    description: 'Fire multiple projectiles',
    level: 0,
    maxLevel: 5,
    baseCost: 1000,
    costMultiplier: 2.0,
    effect: (level) => 1 + level, // +1 projectile per level
    category: 'special',
  },
  {
    id: 'piercing',
    name: 'Piercing Shots',
    description: 'Projectiles pierce enemies',
    level: 0,
    maxLevel: 10,
    baseCost: 800,
    costMultiplier: 1.5,
    effect: (level) => level, // Number of pierces
    category: 'special',
  },
];

export class UpgradeSystem {
  private upgrades: Map<string, Upgrade>;
  private points: number = 0;

  constructor() {
    // Create a copy of upgrades for this instance
    this.upgrades = new Map();
    UPGRADES.forEach((upgrade) => {
      this.upgrades.set(upgrade.id, { ...upgrade });
    });
  }

  /**
   * Get cost of next level for an upgrade
   */
  getCost(upgradeId: string): number {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return Infinity;

    if (upgrade.level >= upgrade.maxLevel) return Infinity;

    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
  }

  /**
   * Purchase an upgrade
   */
  purchase(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return false;

    const cost = this.getCost(upgradeId);

    if (this.points < cost || upgrade.level >= upgrade.maxLevel) {
      return false;
    }

    this.points -= cost;
    upgrade.level++;

    return true;
  }

  /**
   * Can afford an upgrade?
   */
  canAfford(upgradeId: string): boolean {
    const cost = this.getCost(upgradeId);
    return this.points >= cost && cost !== Infinity;
  }

  /**
   * Get current effect value for an upgrade
   */
  getEffect(upgradeId: string): number {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return 0;

    return upgrade.effect(upgrade.level);
  }

  /**
   * Get upgrade by ID
   */
  getUpgrade(upgradeId: string): Upgrade | undefined {
    return this.upgrades.get(upgradeId);
  }

  /**
   * Get all upgrades
   */
  getAllUpgrades(): Upgrade[] {
    return Array.from(this.upgrades.values());
  }

  /**
   * Get upgrades by category
   */
  getUpgradesByCategory(category: string): Upgrade[] {
    return this.getAllUpgrades().filter((u) => u.category === category);
  }

  /**
   * Add points
   */
  addPoints(amount: number): void {
    this.points += Math.floor(amount);
  }

  /**
   * Get current points
   */
  getPoints(): number {
    return this.points;
  }

  /**
   * Calculate total DPS based on upgrades
   */
  calculateDPS(): number {
    const damageMultiplier = this.getEffect('damage');
    const fireRateCooldown = this.getEffect('fireRate') || 300;
    const attacksPerSecond = 1000 / fireRateCooldown;
    const critChance = this.getEffect('critChance');
    const multiShot = this.getEffect('multiShot');

    // Base damage (will be multiplied by weapon damage)
    const baseDPS = 10 * damageMultiplier * attacksPerSecond * (1 + critChance * 0.5) * multiShot;

    return Math.floor(baseDPS);
  }

  /**
   * Export save data
   */
  exportSave(): any {
    const saveData: any = {
      points: this.points,
      upgrades: {},
    };

    this.upgrades.forEach((upgrade, id) => {
      saveData.upgrades[id] = upgrade.level;
    });

    return saveData;
  }

  /**
   * Import save data
   */
  importSave(saveData: any): void {
    if (saveData.points !== undefined) {
      this.points = saveData.points;
    }

    if (saveData.upgrades) {
      Object.entries(saveData.upgrades).forEach(([id, level]) => {
        const upgrade = this.upgrades.get(id);
        if (upgrade && typeof level === 'number') {
          upgrade.level = Math.min(level, upgrade.maxLevel);
        }
      });
    }
  }
}
