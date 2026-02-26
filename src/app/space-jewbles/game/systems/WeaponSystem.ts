import * as Phaser from 'phaser';

export interface WeaponConfig {
  name: string;
  emoji: string;
  damage: number;
  speed: number;
  cooldown: number;
  special: string;
  color: number;
}

export const WEAPONS: WeaponConfig[] = [
  {
    name: 'Banana',
    emoji: '🍌',
    damage: 10,
    speed: 400,
    cooldown: 300,
    special: 'DOT', // Damage over time
    color: 0xffff00,
  },
  {
    name: 'Boot',
    emoji: '🥾',
    damage: 25,
    speed: 350,
    cooldown: 600,
    special: 'CRIT', // High crit chance
    color: 0x8b4513,
  },
  {
    name: 'Book',
    emoji: '📚',
    damage: 15,
    speed: 450,
    cooldown: 400,
    special: 'SPLASH', // Area damage
    color: 0x0066cc,
  },
  {
    name: 'Chicken',
    emoji: '🍗',
    damage: 8,
    speed: 500,
    cooldown: 200,
    special: 'RAPID', // Fast fire rate
    color: 0xffa500,
  },
  {
    name: 'Donut',
    emoji: '🍩',
    damage: 12,
    speed: 380,
    cooldown: 500,
    special: 'SLOW', // Slows enemies
    color: 0xff69b4,
  },
  {
    name: 'Toilet Paper',
    emoji: '🧻',
    damage: 6,
    speed: 550,
    cooldown: 250,
    special: 'PIERCE', // Hits multiple enemies
    color: 0xffffff,
  },
  {
    name: 'Cosmic Sock',
    emoji: '🧦',
    damage: 40,
    speed: 300,
    cooldown: 1500,
    special: 'ULTIMATE', // Huge damage, long cooldown
    color: 0x9966ff,
  },
];

export class WeaponSystem {
  private scene: Phaser.Scene;
  private currentWeapon: number = 0;
  private lastFireTime: number = 0;
  private damageMultiplier: number = 1.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getCurrentWeapon(): WeaponConfig {
    return WEAPONS[this.currentWeapon];
  }

  setWeapon(index: number): void {
    if (index >= 0 && index < WEAPONS.length) {
      this.currentWeapon = index;
    }
  }

  setDamageMultiplier(multiplier: number): void {
    this.damageMultiplier = multiplier;
  }

  canFire(): boolean {
    const now = this.scene.time.now;
    const weapon = this.getCurrentWeapon();
    return now - this.lastFireTime >= weapon.cooldown;
  }

  fireWeapon(
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number
  ): Phaser.Physics.Arcade.Sprite | null {
    if (!this.canFire()) return null;

    const weapon = this.getCurrentWeapon();
    this.lastFireTime = this.scene.time.now;

    // Create projectile sprite
    const projectile = this.scene.physics.add.sprite(fromX, fromY, '');

    // Generate projectile texture
    this.createProjectileTexture(weapon);
    projectile.setTexture(`weapon-${weapon.name}`);

    // Calculate direction and velocity
    const angle = Phaser.Math.Angle.Between(fromX, fromY, targetX, targetY);
    projectile.setVelocity(
      Math.cos(angle) * weapon.speed,
      Math.sin(angle) * weapon.speed
    );

    // Store weapon data on projectile
    projectile.setData('weapon', weapon);
    projectile.setData('damage', weapon.damage * this.damageMultiplier);
    projectile.setData('special', weapon.special);
    projectile.setData('angle', angle);

    // Rotate projectile to face direction
    projectile.setRotation(angle);

    // Auto-destroy after 5 seconds
    this.scene.time.delayedCall(5000, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });

    return projectile;
  }

  private createProjectileTexture(weapon: WeaponConfig): void {
    const textureKey = `weapon-${weapon.name}`;

    // Only create if doesn't exist
    if (this.scene.textures.exists(textureKey)) return;

    const graphics = this.scene.add.graphics();

    switch (weapon.special) {
      case 'DOT': // Banana - curved shape
        graphics.fillStyle(weapon.color, 1);
        graphics.fillEllipse(0, 0, 20, 8);
        break;

      case 'CRIT': // Boot - angular
        graphics.fillStyle(weapon.color, 1);
        graphics.fillRect(-10, -10, 20, 20);
        break;

      case 'SPLASH': // Book - rectangular
        graphics.fillStyle(weapon.color, 1);
        graphics.fillRect(-12, -8, 24, 16);
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(-12, -8, 24, 16);
        break;

      case 'RAPID': // Chicken - small circle
        graphics.fillStyle(weapon.color, 1);
        graphics.fillCircle(0, 0, 8);
        break;

      case 'SLOW': // Donut - ring
        graphics.fillStyle(weapon.color, 1);
        graphics.fillCircle(0, 0, 12);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(0, 0, 6);
        break;

      case 'PIERCE': // Toilet Paper - thin line
        graphics.lineStyle(4, weapon.color);
        graphics.lineBetween(-15, 0, 15, 0);
        break;

      case 'ULTIMATE': // Cosmic Sock - large star
        graphics.fillStyle(weapon.color, 1);
        this.drawStar(graphics, 0, 0, 5, 15, 8);
        break;

      default:
        graphics.fillStyle(weapon.color, 1);
        graphics.fillCircle(0, 0, 10);
    }

    graphics.generateTexture(textureKey, 32, 32);
    graphics.destroy();
  }

  private drawStar(
    graphics: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    graphics.beginPath();
    graphics.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      graphics.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      graphics.lineTo(x, y);
      rot += step;
    }

    graphics.lineTo(cx, cy - outerRadius);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Apply special weapon effects on hit
   */
  applySpecialEffect(
    projectile: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite
  ): void {
    const special = projectile.getData('special') as string;

    switch (special) {
      case 'DOT':
        // Apply damage over time
        this.applyDOT(enemy, 5, 2000); // 5 damage over 2 seconds
        break;

      case 'CRIT':
        // 50% chance to double damage
        if (Math.random() < 0.5) {
          const damage = projectile.getData('damage');
          projectile.setData('damage', damage * 2);
        }
        break;

      case 'SPLASH':
        // Damage nearby enemies
        this.applySplashDamage(enemy, 50, projectile.getData('damage') * 0.5);
        break;

      case 'SLOW':
        // Slow enemy movement
        const currentVel = enemy.body as Phaser.Physics.Arcade.Body;
        currentVel.velocity.x *= 0.5;
        currentVel.velocity.y *= 0.5;

        // Reset velocity after 2 seconds
        this.scene.time.delayedCall(2000, () => {
          if (enemy.active) {
            currentVel.velocity.x *= 2;
            currentVel.velocity.y *= 2;
          }
        });
        break;

      case 'PIERCE':
        // Projectile continues through enemy
        // (handled in collision logic - don't destroy projectile)
        break;

      case 'ULTIMATE':
        // Massive damage + screen shake effect
        this.scene.cameras.main.shake(200, 0.01);
        break;
    }
  }

  private applyDOT(enemy: Phaser.Physics.Arcade.Sprite, damage: number, duration: number): void {
    const tickInterval = 500; // Damage every 500ms
    const ticks = duration / tickInterval;
    let currentTick = 0;

    const dotTimer = this.scene.time.addEvent({
      delay: tickInterval,
      callback: () => {
        if (enemy.active) {
          const currentHP = enemy.getData('hp') as number;
          enemy.setData('hp', currentHP - damage);

          // Visual feedback
          this.scene.tweens.add({
            targets: enemy,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
          });
        }

        currentTick++;
        if (currentTick >= ticks) {
          dotTimer.destroy();
        }
      },
      loop: true,
    });
  }

  private applySplashDamage(
    epicenter: Phaser.Physics.Arcade.Sprite,
    radius: number,
    damage: number
  ): void {
    // Find all enemies in scene
    const enemies = this.scene.physics.world.bodies.entries.filter(
      (body) => body.gameObject && body.gameObject.getData('isEnemy')
    );

    enemies.forEach((body) => {
      const enemy = body.gameObject as Phaser.Physics.Arcade.Sprite;
      const distance = Phaser.Math.Distance.Between(
        epicenter.x,
        epicenter.y,
        enemy.x,
        enemy.y
      );

      if (distance <= radius && enemy !== epicenter) {
        const currentHP = enemy.getData('hp') as number;
        enemy.setData('hp', currentHP - damage);

        // Visual feedback
        this.scene.tweens.add({
          targets: enemy,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
        });
      }
    });

    // Splash visual effect
    const splash = this.scene.add.circle(epicenter.x, epicenter.y, 5, 0xffff00, 0.5);
    this.scene.tweens.add({
      targets: splash,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => splash.destroy(),
    });
  }
}
