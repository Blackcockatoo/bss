import * as Phaser from 'phaser';

export interface IdleState {
  autoFireEnabled: boolean;
  autoFireTimer: number;
  autoFireInterval: number; // ms between auto attacks
  pointsPerSecond: number;
  lastPlayTime: number;
}

export class IdleSystem {
  private scene: Phaser.Scene;
  private state: IdleState;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Initialize idle state
    this.state = {
      autoFireEnabled: false,
      autoFireTimer: 0,
      autoFireInterval: 1000, // 1 second
      pointsPerSecond: 0,
      lastPlayTime: Date.now(),
    };
  }

  update(delta: number): void {
    if (!this.state.autoFireEnabled) return;

    // Update auto-fire timer
    this.state.autoFireTimer += delta;

    if (this.state.autoFireTimer >= this.state.autoFireInterval) {
      this.state.autoFireTimer = 0;
      this.scene.events.emit('autoFire');
    }
  }

  enableAutoFire(): void {
    this.state.autoFireEnabled = true;
  }

  disableAutoFire(): void {
    this.state.autoFireEnabled = false;
  }

  isAutoFireEnabled(): boolean {
    return this.state.autoFireEnabled;
  }

  setAutoFireInterval(interval: number): void {
    this.state.autoFireInterval = Math.max(100, interval);
  }

  getAutoFireInterval(): number {
    return this.state.autoFireInterval;
  }

  /**
   * Calculate offline progress
   */
  calculateOfflineProgress(upgrades: {
    dps: number;
    wave: number;
  }): {
    points: number;
    timeAway: number;
    message: string;
  } {
    const now = Date.now();
    const timeAway = now - this.state.lastPlayTime;
    const secondsAway = timeAway / 1000;

    // Cap offline time at 4 hours
    const maxOfflineSeconds = 4 * 60 * 60;
    const effectiveSeconds = Math.min(secondsAway, maxOfflineSeconds);

    // Calculate points earned
    // Formula: DPS * time * diminishing returns factor
    const diminishingFactor = Math.pow(0.95, effectiveSeconds / 3600); // 5% reduction per hour
    const pointsEarned = Math.floor(upgrades.dps * effectiveSeconds * diminishingFactor);

    // Update last play time
    this.state.lastPlayTime = now;

    // Generate message
    const hoursAway = Math.floor(effectiveSeconds / 3600);
    const minutesAway = Math.floor((effectiveSeconds % 3600) / 60);

    let timeString = '';
    if (hoursAway > 0) {
      timeString = `${hoursAway}h ${minutesAway}m`;
    } else if (minutesAway > 0) {
      timeString = `${minutesAway} minutes`;
    } else {
      timeString = `${Math.floor(effectiveSeconds)} seconds`;
    }

    return {
      points: pointsEarned,
      timeAway: effectiveSeconds,
      message: `Welcome back! You were away for ${timeString} and earned ${pointsEarned.toLocaleString()} points!`,
    };
  }

  updateLastPlayTime(): void {
    this.state.lastPlayTime = Date.now();
  }

  getState(): IdleState {
    return { ...this.state };
  }

  setState(state: Partial<IdleState>): void {
    this.state = { ...this.state, ...state };
  }
}
