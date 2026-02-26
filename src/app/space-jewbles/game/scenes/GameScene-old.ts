import * as Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private petData: any;
  private pet!: Phaser.GameObjects.Container;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;

  private wave: number = 1;
  private score: number = 0;
  private enemiesKilled: number = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;

  private spawnTimer: number = 0;
  private spawnInterval: number = 2000; // Spawn enemy every 2 seconds

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: any) {
    this.petData = data.petData;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0a0520, 0x0a0520, 0x1a0f3a, 0x1a0f3a, 1);
    graphics.fillRect(0, 0, width, height);

    // Create player pet
    this.createPet();

    // Create groups for entities
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // UI
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      font: 'bold 20px Arial',
      color: '#00ffff',
    });

    this.waveText = this.add.text(width - 16, 16, 'Wave: 1', {
      font: 'bold 20px Arial',
      color: '#ff00ff',
    });
    this.waveText.setOrigin(1, 0);

    // Tap anywhere to fire weapon
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.fireWeapon(pointer.x, pointer.y);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });

    // Collision detection
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Spawn first enemies
    this.spawnEnemies(3);
  }

  update(time: number, delta: number) {
    // Spawn enemies periodically
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemies(1);
    }

    // Clean up off-screen projectiles
    this.projectiles.children.entries.forEach((proj) => {
      const projectile = proj as Phaser.Physics.Arcade.Sprite;
      if (projectile.x < -50 || projectile.x > this.cameras.main.width + 50 ||
          projectile.y < -50 || projectile.y > this.cameras.main.height + 50) {
        projectile.destroy();
      }
    });
  }

  private createPet() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create pet container
    this.pet = this.add.container(width / 2, height - 100);

    // Simple pet visualization (will be enhanced with petRenderer later)
    const petBody = this.add.circle(0, 0, 30, this.hexToNumber(this.petData?.primaryColor || '#00ffff'));
    const petEye1 = this.add.circle(-10, -5, 5, 0x000000);
    const petEye2 = this.add.circle(10, -5, 5, 0x000000);

    this.pet.add([petBody, petEye1, petEye2]);

    // Idle animation
    this.tweens.add({
      targets: this.pet,
      y: height - 110,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private fireWeapon(targetX: number, targetY: number) {
    // Create projectile from pet to target
    const projectile = this.physics.add.sprite(this.pet.x, this.pet.y, '');

    // Simple emoji projectile (banana for now) - create as graphics texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFFF00, 1);
    graphics.fillCircle(12, 12, 10);
    const texture = graphics.generateTexture('projectile', 24, 24);
    graphics.destroy();

    projectile.setTexture('projectile');
    projectile.setDisplaySize(24, 24);

    // Calculate direction
    const angle = Phaser.Math.Angle.Between(this.pet.x, this.pet.y, targetX, targetY);
    const velocity = 400;

    projectile.setVelocity(
      Math.cos(angle) * velocity,
      Math.sin(angle) * velocity
    );

    this.projectiles.add(projectile);

    // Pet attack animation
    this.tweens.add({
      targets: this.pet,
      scaleX: 1.2,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
    });

    // Destroy projectile after 3 seconds
    this.time.delayedCall(3000, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
  }

  private spawnEnemies(count: number) {
    const width = this.cameras.main.width;

    for (let i = 0; i < count; i++) {
      // Random spawn position at top of screen
      const x = Phaser.Math.Between(50, width - 50);
      const y = -50;

      // Simple enemy visual (will be enhanced later)
      if (!this.textures.exists('enemy-texture')) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture('enemy-texture', 40, 40);
        graphics.destroy();
      }

      const enemy = this.physics.add.sprite(x, y, 'enemy-texture');
      enemy.setDisplaySize(40, 40);
      enemy.setData('hp', 1);

      // Move towards bottom of screen
      enemy.setVelocityY(50 * this.wave * 0.5); // Speed increases with wave

      this.enemies.add(enemy);
    }
  }

  private hitEnemy(projectile: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    const proj = projectile as Phaser.Physics.Arcade.Sprite;
    const enem = enemy as Phaser.Physics.Arcade.Sprite;

    // Destroy projectile
    proj.destroy();

    // Reduce enemy HP
    const hp = enem.getData('hp') - 1;
    enem.setData('hp', hp);

    // Flash enemy
    this.tweens.add({
      targets: enem,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
    });

    if (hp <= 0) {
      // Destroy enemy
      enem.destroy();

      // Update score
      this.enemiesKilled++;
      this.score += 10 * this.wave;
      this.scoreText.setText(`Score: ${this.score}`);

      // Particle explosion
      this.createExplosion(enem.x, enem.y);

      // Check for wave progression
      if (this.enemiesKilled >= 10 * this.wave) {
        this.wave++;
        this.waveText.setText(`Wave: ${this.wave}`);

        // Show wave complete message
        const msg = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
          `Wave ${this.wave - 1} Complete!`, {
          font: 'bold 32px Arial',
          color: '#ffff00',
        });
        msg.setOrigin(0.5);

        this.tweens.add({
          targets: msg,
          alpha: 0,
          duration: 2000,
          onComplete: () => msg.destroy(),
        });
      }
    }
  }

  private createExplosion(x: number, y: number) {
    const particles = this.add.particles(x, y, 'enemy-texture', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 8,
    });

    this.time.delayedCall(500, () => particles.destroy());
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }
}
