import * as Phaser from 'phaser';
import { PetRenderer, PhysicalTraits } from '../utils/petRenderer';
import { WeaponSystem, WEAPONS } from '../systems/WeaponSystem';
import { WaveSystem } from '../systems/WaveSystem';

export class GameScene extends Phaser.Scene {
  // Systems
  private petRenderer!: PetRenderer;
  private weaponSystem!: WeaponSystem;
  private waveSystem!: WaveSystem;

  // Game state
  private petData: any;
  private pet!: Phaser.GameObjects.Container;
  private petBonuses: any;

  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;

  private score: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private comboThreshold: number = 3000; // 3 seconds to maintain combo

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private weaponUI!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: any) {
    this.petData = data.petData;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Initialize systems
    this.petRenderer = new PetRenderer(this);
    this.weaponSystem = new WeaponSystem(this);
    this.waveSystem = new WaveSystem(this);

    // Background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0a0520, 0x0a0520, 0x1a0f3a, 0x1a0f3a, 1);
    graphics.fillRect(0, 0, width, height);

    // Add animated stars
    this.createStarfield(width, height);

    // Create player pet
    this.createPet();

    // Create groups for entities
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // Create UI
    this.createUI();

    // Listen for enemy spawns from wave system
    this.events.on('enemySpawned', (enemy: Phaser.Physics.Arcade.Sprite) => {
      this.enemies.add(enemy);

      // Add HP bar above enemy
      this.createEnemyHealthBar(enemy);
    });

    // Collision detection
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Touch/Click input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleAttack(pointer.x, pointer.y);
    });

    // Keyboard shortcuts for weapon switching
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const key = parseInt(event.key);
      if (key >= 1 && key <= 7) {
        this.weaponSystem.setWeapon(key - 1);
        this.updateWeaponUI();
      }
    });

    // Wave complete callback
    this.waveSystem.setWaveCompleteCallback((wave: number) => {
      this.onWaveComplete(wave);
    });

    // Start first wave
    this.waveSystem.startWave(1);
  }

  update(time: number, delta: number) {
    // Update wave system
    this.waveSystem.update(delta);

    // Update combo timer
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.updateComboUI();
      }
    }

    // Clean up off-screen entities
    this.projectiles.children.entries.forEach((proj) => {
      const projectile = proj as Phaser.Physics.Arcade.Sprite;
      if (
        projectile.x < -100 ||
        projectile.x > this.cameras.main.width + 100 ||
        projectile.y < -100 ||
        projectile.y > this.cameras.main.height + 100
      ) {
        projectile.destroy();
      }
    });

    this.enemies.children.entries.forEach((enem) => {
      const enemy = enem as Phaser.Physics.Arcade.Sprite;

      // Update HP bar position
      const hpBar = enemy.getData('hpBar') as Phaser.GameObjects.Container;
      if (hpBar) {
        hpBar.setPosition(enemy.x, enemy.y - enemy.displayHeight / 2 - 10);
      }

      // Update boss aura position
      const aura = enemy.getData('aura');
      if (aura) {
        aura.setPosition(enemy.x, enemy.y);
      }

      // Destroy if off bottom of screen
      if (enemy.y > this.cameras.main.height + 100) {
        this.destroyEnemy(enemy);
      }
    });
  }

  private createPet() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create pet sprite using renderer
    const petTraits: PhysicalTraits = {
      bodyType: this.petData?.bodyType || 'Spherical',
      primaryColor: this.petData?.primaryColor || '#00FFFF',
      secondaryColor: this.petData?.secondaryColor || '#FF00FF',
      pattern: this.petData?.pattern || 'Solid',
      texture: this.petData?.texture || 'Smooth',
      size: this.petData?.size || 1,
      features: this.petData?.features || [],
    };

    this.pet = this.petRenderer.createPetSprite(
      petTraits,
      this.petData?.genomeSeed || 0,
      60
    );

    this.pet.setPosition(width / 2, height - 100);

    // Calculate trait bonuses
    this.petBonuses = this.petRenderer.calculateTraitBonuses(petTraits);
    this.weaponSystem.setDamageMultiplier(this.petBonuses.damage);

    // Idle animation
    this.tweens.add({
      targets: this.pet,
      y: height - 110,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createUI() {
    const width = this.cameras.main.width;

    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      font: 'bold 20px Arial',
      color: '#00ffff',
    });

    // Wave
    this.waveText = this.add.text(width - 16, 16, 'Wave: 1', {
      font: 'bold 20px Arial',
      color: '#ff00ff',
    });
    this.waveText.setOrigin(1, 0);

    // Combo
    this.comboText = this.add.text(width / 2, 60, '', {
      font: 'bold 24px Arial',
      color: '#ffff00',
    });
    this.comboText.setOrigin(0.5);
    this.comboText.setVisible(false);

    // Weapon UI
    this.createWeaponUI();
  }

  private createWeaponUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.weaponUI = this.add.container(width / 2, height - 40);

    const weaponCount = WEAPONS.length;
    const spacing = 60;
    const startX = -(weaponCount * spacing) / 2;

    WEAPONS.forEach((weapon, index) => {
      const x = startX + index * spacing;

      // Background circle
      const bg = this.add.circle(x, 0, 25, 0x333333, 0.8);

      // Weapon emoji/icon
      const text = this.add.text(x, 0, weapon.emoji, {
        font: '24px Arial',
      });
      text.setOrigin(0.5);

      // Number label
      const label = this.add.text(x, -30, `${index + 1}`, {
        font: 'bold 12px Arial',
        color: '#ffffff',
      });
      label.setOrigin(0.5);

      this.weaponUI.add([bg, text, label]);

      // Store references
      weapon['bg'] = bg;
    });

    this.updateWeaponUI();
  }

  private updateWeaponUI() {
    const currentWeapon = this.weaponSystem.getCurrentWeapon();

    WEAPONS.forEach((weapon) => {
      const bg = weapon['bg'] as any;
      if (bg) {
        bg.fillColor = weapon === currentWeapon ? 0x00ff00 : 0x333333;
      }
    });
  }

  private handleAttack(targetX: number, targetY: number) {
    const projectile = this.weaponSystem.fireWeapon(
      this.pet.x,
      this.pet.y,
      targetX,
      targetY
    );

    if (projectile) {
      this.projectiles.add(projectile);

      // Pet attack animation
      this.tweens.add({
        targets: this.pet,
        scaleX: 1.2,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
      });

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }

  private hitEnemy(
    projectileObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ) {
    const projectile = projectileObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;

    // Get damage
    const damage = projectile.getData('damage') as number;
    const special = projectile.getData('special') as string;

    // Apply special effects
    this.weaponSystem.applySpecialEffect(projectile, enemy);

    // Deal damage
    const currentHP = enemy.getData('hp') as number;
    const newHP = currentHP - damage;
    enemy.setData('hp', newHP);

    // Update HP bar
    this.updateEnemyHealthBar(enemy);

    // Flash effect
    this.tweens.add({
      targets: enemy,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
    });

    // Floating damage text
    this.createFloatingText(enemy.x, enemy.y, `-${Math.floor(damage)}`, '#ffff00');

    // Check if enemy is dead
    if (newHP <= 0) {
      this.killEnemy(enemy);
    }

    // Destroy projectile (unless it's piercing)
    if (special !== 'PIERCE') {
      projectile.destroy();
    }
  }

  private killEnemy(enemy: Phaser.Physics.Arcade.Sprite) {
    // Get points
    const points = enemy.getData('points') as number;
    this.score += points;
    this.scoreText.setText(`Score: ${this.score.toLocaleString()}`);

    // Update combo
    this.combo++;
    this.comboTimer = this.comboThreshold;
    this.updateComboUI();

    // Record kill
    this.waveSystem.recordKill();

    // Explosion effect
    this.createExplosion(enemy.x, enemy.y, enemy.getData('type') === 'Boss');

    // Destroy enemy
    this.destroyEnemy(enemy);

    // Camera shake for boss
    if (enemy.getData('type') === 'Boss') {
      this.cameras.main.shake(300, 0.015);
    }
  }

  private destroyEnemy(enemy: Phaser.Physics.Arcade.Sprite) {
    // Destroy HP bar
    const hpBar = enemy.getData('hpBar') as Phaser.GameObjects.Container;
    if (hpBar) {
      hpBar.destroy();
    }

    // Destroy aura
    const aura = enemy.getData('aura');
    if (aura) {
      aura.destroy();
    }

    enemy.destroy();
  }

  private createEnemyHealthBar(enemy: Phaser.Physics.Arcade.Sprite) {
    const container = this.add.container(enemy.x, enemy.y - enemy.displayHeight / 2 - 10);

    const bgWidth = enemy.displayWidth;
    const bgHeight = 4;

    // Background
    const bg = this.add.rectangle(0, 0, bgWidth, bgHeight, 0x000000, 0.5);

    // Health bar
    const bar = this.add.rectangle(-bgWidth / 2, 0, bgWidth, bgHeight, 0x00ff00, 1);
    bar.setOrigin(0, 0.5);

    container.add([bg, bar]);

    enemy.setData('hpBar', container);
    enemy.setData('hpBarFill', bar);
  }

  private updateEnemyHealthBar(enemy: Phaser.Physics.Arcade.Sprite) {
    const hpBarFill = enemy.getData('hpBarFill') as Phaser.GameObjects.Rectangle;
    if (!hpBarFill) return;

    const currentHP = enemy.getData('hp') as number;
    const maxHP = enemy.getData('maxHP') as number;
    const percent = Math.max(0, currentHP / maxHP);

    hpBarFill.width = enemy.displayWidth * percent;

    // Color based on HP
    if (percent > 0.5) {
      hpBarFill.fillColor = 0x00ff00; // Green
    } else if (percent > 0.25) {
      hpBarFill.fillColor = 0xffff00; // Yellow
    } else {
      hpBarFill.fillColor = 0xff0000; // Red
    }
  }

  private updateComboUI() {
    if (this.combo > 2) {
      this.comboText.setText(`${this.combo}x COMBO!`);
      this.comboText.setVisible(true);

      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
      });
    } else {
      this.comboText.setVisible(false);
    }
  }

  private createExplosion(x: number, y: number, isBoss: boolean = false) {
    const particleCount = isBoss ? 20 : 10;
    const colors = [0xff0000, 0xff6600, 0xffff00, 0xff00ff];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = isBoss ? 200 : 100;

      const particle = this.add.circle(
        x,
        y,
        isBoss ? 8 : 4,
        colors[i % colors.length],
        1
      );

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createFloatingText(x: number, y: number, text: string, color: string) {
    const floatText = this.add.text(x, y, text, {
      font: 'bold 20px Arial',
      color: color,
    });
    floatText.setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => floatText.destroy(),
    });
  }

  private createStarfield(width: number, height: number) {
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);

      const star = this.add.circle(x, y, size, 0xffffff, 0.8);

      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private onWaveComplete(wave: number) {
    // Show wave complete message
    const msg = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `Wave ${wave} Complete!`,
      {
        font: 'bold 48px Arial',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    msg.setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        msg.destroy();

        // Start next wave
        this.waveSystem.startWave(wave + 1);
        this.waveText.setText(`Wave: ${wave + 1}`);
      },
    });
  }
}
