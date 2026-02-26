import * as Phaser from 'phaser';

export interface EnemyType {
  name: string;
  color: number;
  baseHP: number;
  baseSpeed: number;
  basePoints: number;
  size: number;
}

export const ENEMY_TYPES: EnemyType[] = [
  {
    name: 'Gremlin',
    color: 0xff0000,
    baseHP: 10,
    baseSpeed: 50,
    basePoints: 10,
    size: 30,
  },
  {
    name: 'Pickle',
    color: 0x00ff00,
    baseHP: 20,
    baseSpeed: 40,
    basePoints: 20,
    size: 35,
  },
  {
    name: 'Crab',
    color: 0xff6600,
    baseHP: 30,
    baseSpeed: 35,
    basePoints: 30,
    size: 40,
  },
  {
    name: 'Potato',
    color: 0x996633,
    baseHP: 50,
    baseSpeed: 25,
    basePoints: 50,
    size: 45,
  },
  {
    name: 'Boss',
    color: 0x9900ff,
    baseHP: 200,
    baseSpeed: 20,
    basePoints: 200,
    size: 60,
  },
];

export interface WaveConfig {
  wave: number;
  enemyCount: number;
  enemyTypes: string[];
  spawnDelay: number; // ms between spawns
  isBossWave: boolean;
}

export class WaveSystem {
  private scene: Phaser.Scene;
  private currentWave: number = 1;
  private enemiesInWave: number = 0;
  private enemiesKilled: number = 0;
  private spawnTimer: number = 0;
  private currentSpawnIndex: number = 0;
  private currentWaveConfig: WaveConfig | null = null;
  private onWaveComplete?: (wave: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  startWave(wave: number): void {
    this.currentWave = wave;
    this.enemiesKilled = 0;
    this.currentSpawnIndex = 0;
    this.spawnTimer = 0;

    // Generate wave configuration
    this.currentWaveConfig = this.generateWaveConfig(wave);
    this.enemiesInWave = this.currentWaveConfig.enemyCount;
  }

  setWaveCompleteCallback(callback: (wave: number) => void): void {
    this.onWaveComplete = callback;
  }

  update(delta: number): void {
    if (!this.currentWaveConfig) return;

    // Check if wave is complete
    if (this.enemiesKilled >= this.enemiesInWave) {
      this.completeWave();
      return;
    }

    // Spawn enemies
    if (this.currentSpawnIndex < this.enemiesInWave) {
      this.spawnTimer += delta;

      if (this.spawnTimer >= this.currentWaveConfig.spawnDelay) {
        this.spawnEnemy();
        this.spawnTimer = 0;
        this.currentSpawnIndex++;
      }
    }
  }

  recordKill(): void {
    this.enemiesKilled++;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getProgress(): { killed: number; total: number } {
    return {
      killed: this.enemiesKilled,
      total: this.enemiesInWave,
    };
  }

  private generateWaveConfig(wave: number): WaveConfig {
    const isBossWave = wave % 10 === 0;

    if (isBossWave) {
      return {
        wave,
        enemyCount: 1,
        enemyTypes: ['Boss'],
        spawnDelay: 0,
        isBossWave: true,
      };
    }

    // Regular wave
    const baseCount = 5;
    const waveMultiplier = Math.floor(wave / 3);
    const enemyCount = baseCount + waveMultiplier;

    // Determine enemy types based on wave
    const enemyTypes: string[] = [];
    if (wave < 5) {
      enemyTypes.push('Gremlin');
    } else if (wave < 10) {
      enemyTypes.push('Gremlin', 'Pickle');
    } else if (wave < 15) {
      enemyTypes.push('Pickle', 'Crab');
    } else if (wave < 20) {
      enemyTypes.push('Crab', 'Potato');
    } else {
      enemyTypes.push('Pickle', 'Crab', 'Potato');
    }

    return {
      wave,
      enemyCount,
      enemyTypes,
      spawnDelay: Math.max(1000, 2000 - wave * 50), // Faster spawns as waves progress
      isBossWave: false,
    };
  }

  private spawnEnemy(): void {
    if (!this.currentWaveConfig) return;

    // Choose random enemy type from available types
    const typeIndex = Phaser.Math.Between(0, this.currentWaveConfig.enemyTypes.length - 1);
    const typeName = this.currentWaveConfig.enemyTypes[typeIndex];
    const enemyType = ENEMY_TYPES.find((t) => t.name === typeName)!;

    // Calculate scaled stats
    const scaledHP = this.calculateScaledHP(enemyType.baseHP, this.currentWave);
    const scaledSpeed = this.calculateScaledSpeed(enemyType.baseSpeed, this.currentWave);
    const scaledPoints = this.calculateScaledPoints(enemyType.basePoints, this.currentWave);

    // Spawn position
    const width = this.scene.cameras.main.width;
    const x = Phaser.Math.Between(50, width - 50);
    const y = -50;

    // Create enemy texture if needed
    const textureKey = `enemy-${enemyType.name}`;
    if (!this.scene.textures.exists(textureKey)) {
      this.createEnemyTexture(enemyType);
    }

    // Create enemy sprite
    const enemy = this.scene.physics.add.sprite(x, y, textureKey);
    enemy.setDisplaySize(enemyType.size, enemyType.size);

    // Set enemy data
    enemy.setData('hp', scaledHP);
    enemy.setData('maxHP', scaledHP);
    enemy.setData('points', scaledPoints);
    enemy.setData('isEnemy', true);
    enemy.setData('type', enemyType.name);

    // Set velocity
    enemy.setVelocityY(scaledSpeed);

    // Add to enemies group (handled by scene)
    this.scene.events.emit('enemySpawned', enemy);

    // Boss special effects
    if (enemyType.name === 'Boss') {
      // Add boss aura
      const aura = this.scene.add.circle(x, y, enemyType.size + 10, enemyType.color, 0.3);
      this.scene.tweens.add({
        targets: aura,
        radius: enemyType.size + 20,
        alpha: 0.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      // Update aura position with enemy
      enemy.setData('aura', aura);
    }
  }

  private createEnemyTexture(enemyType: EnemyType): void {
    const textureKey = `enemy-${enemyType.name}`;
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(enemyType.color, 1);

    if (enemyType.name === 'Boss') {
      // Boss is a large hexagon
      const points: Phaser.Geom.Point[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push(
          new Phaser.Geom.Point(
            enemyType.size / 2 + Math.cos(angle) * (enemyType.size / 2),
            enemyType.size / 2 + Math.sin(angle) * (enemyType.size / 2)
          )
        );
      }
      graphics.fillPoints(points, true);
    } else {
      // Regular enemies are circles with slight variations
      graphics.fillCircle(enemyType.size / 2, enemyType.size / 2, enemyType.size / 2);

      // Add eyes
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(enemyType.size / 3, enemyType.size / 3, enemyType.size / 10);
      graphics.fillCircle((enemyType.size * 2) / 3, enemyType.size / 3, enemyType.size / 10);
    }

    graphics.generateTexture(textureKey, enemyType.size, enemyType.size);
    graphics.destroy();
  }

  private calculateScaledHP(baseHP: number, wave: number): number {
    return Math.floor(baseHP * Math.pow(1.15, wave - 1));
  }

  private calculateScaledSpeed(baseSpeed: number, wave: number): number {
    return baseSpeed + wave * 2;
  }

  private calculateScaledPoints(basePoints: number, wave: number): number {
    return Math.floor(basePoints * wave * 1.5);
  }

  private completeWave(): void {
    if (this.onWaveComplete) {
      this.onWaveComplete(this.currentWave);
    }

    // Prepare for next wave
    this.currentWave++;
    this.currentWaveConfig = null;
  }
}
