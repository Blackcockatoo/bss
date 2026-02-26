export interface AudioSettings {
  volume: number; // 0-1
  muted: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

const STORAGE_KEY = 'space-jewbles-audio-settings';

const DEFAULT_SETTINGS: AudioSettings = {
  volume: 0.5,
  muted: false,
  musicEnabled: true,
  sfxEnabled: true,
};

export class AudioSettingsManager {
  private settings: AudioSettings;
  private listeners: Array<(settings: AudioSettings) => void> = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AudioSettings {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as Partial<AudioSettings>;
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }

    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }

  /**
   * Add a listener for settings changes
   */
  addListener(callback: (settings: AudioSettings) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener
   */
  removeListener(callback: (settings: AudioSettings) => void): void {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  /**
   * Notify all listeners of settings change
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.settings));
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Get effective volume (returns 0 if muted)
   */
  getVolume(): number {
    return this.settings.muted ? 0 : this.settings.volume;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.settings.muted = !this.settings.muted;
    this.saveSettings();
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.saveSettings();
  }

  /**
   * Toggle music
   */
  toggleMusic(): void {
    this.settings.musicEnabled = !this.settings.musicEnabled;
    this.saveSettings();
  }

  /**
   * Set music enabled
   */
  setMusicEnabled(enabled: boolean): void {
    this.settings.musicEnabled = enabled;
    this.saveSettings();
  }

  /**
   * Toggle SFX
   */
  toggleSfx(): void {
    this.settings.sfxEnabled = !this.settings.sfxEnabled;
    this.saveSettings();
  }

  /**
   * Set SFX enabled
   */
  setSfxEnabled(enabled: boolean): void {
    this.settings.sfxEnabled = enabled;
    this.saveSettings();
  }

  /**
   * Check if music should play
   */
  shouldPlayMusic(): boolean {
    return this.settings.musicEnabled && !this.settings.muted;
  }

  /**
   * Check if SFX should play
   */
  shouldPlaySfx(): boolean {
    return this.settings.sfxEnabled && !this.settings.muted;
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

// Singleton instance
let instance: AudioSettingsManager | null = null;

export function getAudioSettings(): AudioSettingsManager {
  if (!instance) {
    instance = new AudioSettingsManager();
  }
  return instance;
}
