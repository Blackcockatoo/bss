export interface SaveData {
  version: string;
  lastSave: number;
  score: number;
  highScore: number;
  wave: number;
  maxWave: number;
  bossesDefeated: number;
  mythicDrops: number;
  upgrades: any;
  idleState: any;
}

const SAVE_KEY = 'space-jewbles-save';
const SAVE_VERSION = '1.0.0';

export class SaveManager {
  /**
   * Save game data to localStorage
   */
  static save(data: Partial<SaveData>): void {
    try {
      const saveData: SaveData = {
        version: SAVE_VERSION,
        lastSave: Date.now(),
        score: data.score || 0,
        highScore: data.highScore || 0,
        wave: data.wave || 1,
        maxWave: data.maxWave || 1,
        bossesDefeated: data.bossesDefeated || 0,
        mythicDrops: data.mythicDrops || 0,
        upgrades: data.upgrades || {},
        idleState: data.idleState || {},
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  /**
   * Load game data from localStorage
   */
  static load(): SaveData | null {
    try {
      const savedString = localStorage.getItem(SAVE_KEY);
      if (!savedString) return null;

      const saveData = JSON.parse(savedString) as SaveData;

      // Version check
      if (saveData.version !== SAVE_VERSION) {
        console.warn('Save version mismatch, resetting save');
        return null;
      }

      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if save exists
   */
  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Delete save data
   */
  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Get time since last save
   */
  static getTimeSinceLastSave(): number | null {
    const saveData = this.load();
    if (!saveData) return null;

    return Date.now() - saveData.lastSave;
  }
}
