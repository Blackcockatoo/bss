import * as Phaser from 'phaser';
import { PetRenderer, PhysicalTraits } from '../utils/petRenderer';
import { WeaponSystem, WEAPONS } from '../systems/WeaponSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { IdleSystem } from '../systems/IdleSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { SaveManager } from '../utils/saveManager';
import { NarrativeSystem } from '../systems/NarrativeSystem';
import { StoryBeat } from '../data/storyBeats';
import { getAudioSettings } from '../utils/audioSettings';

export class GameScene extends Phaser.Scene {
  // Systems
  private petRenderer!: PetRenderer;
  private weaponSystem!: WeaponSystem;
  private waveSystem!: WaveSystem;
  private idleSystem!: IdleSystem;
  private upgradeSystem!: UpgradeSystem;
  private narrativeSystem!: NarrativeSystem;
  private bossesDefeated: number = 0;
  private mythicDrops: number = 0;
  private runEnded: boolean = false;

  // Game state
  private petData: any;
  private pet!: Phaser.GameObjects.Container;
  private petTraits!: PhysicalTraits;
  private petBonuses: any;
  private highScore: number = 0;

  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;

  private score: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private comboThreshold: number = 3000;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private weaponUI!: Phaser.GameObjects.Container;
  private upgradePanel!: Phaser.GameObjects.Container;
  private upgradeButton!: Phaser.GameObjects.Container;
  private showingUpgrades: boolean = false;
  private audioPanel!: Phaser.GameObjects.Container;
  private audioButton!: Phaser.GameObjects.Container;
  private showingAudioSettings: boolean = false;
  private endRunButton!: Phaser.GameObjects.Container;

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
    this.idleSystem = new IdleSystem(this);
    this.upgradeSystem = new UpgradeSystem();
    this.narrativeSystem = new NarrativeSystem();

    // Set narrative callback
    this.narrativeSystem.setStoryCallback((story: StoryBeat) => {
      this.showStory(story);
    });

    // Load save data
    this.loadGame();

    // Check for offline progress
    this.checkOfflineProgress();

    // Background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0a0520, 0x0a0520, 0x1a0f3a, 0x1a0f3a, 1);
    graphics.fillRect(0, 0, width, height);

    // Add animated stars
    this.createStarfield(width, height);

    // Create player pet
    this.createPet();

    this.narrativeSystem.setContext({
      petTraits: {
        bodyType: this.petTraits.bodyType,
        pattern: this.petTraits.pattern,
        elements: this.petData?.elements ?? [],
      },
      performance: {
        bossCount: this.bossesDefeated,
        upgradesUnlocked: this.getUnlockedUpgradeIds(),
        maxCombo: 0,
      },
    });

    // Create groups for entities
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // Create UI
    this.createUI();
    this.createUpgradeButton();
    this.createAudioButton();
    this.createEndRunButton();

    // Listen for auto-fire
    this.events.on('autoFire', () => {
      this.autoFireAttack();
    });

    // Listen for enemy spawns
    this.events.on('enemySpawned', (enemy: Phaser.Physics.Arcade.Sprite) => {
      this.enemies.add(enemy);
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

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const key = parseInt(event.key);
      if (key >= 1 && key <= 7) {
        this.weaponSystem.setWeapon(key - 1);
        this.updateWeaponUI();
      } else if (event.key === 'u' || event.key === 'U') {
        this.toggleUpgradePanel();
      }
    });

    // Wave complete callback
    this.waveSystem.setWaveCompleteCallback((wave: number) => {
      this.onWaveComplete(wave);
    });

    // Start first wave
    this.waveSystem.startWave(1);

    // Auto-save every 30 seconds
    this.time.addEvent({
      delay: 30000,
      callback: () => this.saveGame(),
      loop: true,
    });
  }

  update(time: number, delta: number) {
    // Update systems
    this.waveSystem.update(delta);
    this.idleSystem.update(delta);

    // Update combo timer
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.updateComboUI();
      }
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Clean up off-screen entities
    this.projectiles.children.entries.forEach((proj) => {
      const projectile = proj as Phaser.Physics.Arcade.Sprite;
      if (
        projectile.x < -100 ||
        projectile.x > width + 100 ||
        projectile.y < -100 ||
        projectile.y > height + 100
      ) {
        projectile.destroy();
      }
    });

    this.enemies.children.entries.forEach((enem) => {
      const enemy = enem as Phaser.Physics.Arcade.Sprite;

      const hpBar = enemy.getData('hpBar') as Phaser.GameObjects.Container;
      if (hpBar) {
        hpBar.setPosition(enemy.x, enemy.y - enemy.displayHeight / 2 - 10);
      }

      const aura = enemy.getData('aura');
      if (aura) {
        aura.setPosition(enemy.x, enemy.y);
      }

      if (enemy.y > height + 100) {
        this.destroyEnemy(enemy);
      }
    });
  }

  private createPet() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const petTraits: PhysicalTraits = {
      bodyType: this.petData?.bodyType || 'Spherical',
      primaryColor: this.petData?.primaryColor || '#00FFFF',
      secondaryColor: this.petData?.secondaryColor || '#FF00FF',
      pattern: this.petData?.pattern || 'Solid',
      texture: this.petData?.texture || 'Smooth',
      size: this.petData?.size || 1,
      features: this.petData?.features || [],
    };
    this.petTraits = petTraits;

    const petSize = Math.max(120, petTraits.size * 160);
    this.pet = this.petRenderer.createPetSprite(
      petTraits,
      this.petData?.genomeSeed || 0,
      petSize
    );

    // Position lower to accommodate larger size
    this.pet.setPosition(width / 2, height - petSize * 0.45);

    this.petBonuses = this.petRenderer.calculateTraitBonuses(petTraits);

    // Apply upgrade bonuses
    const damageBonus = this.upgradeSystem.getEffect('damage');
    this.weaponSystem.setDamageMultiplier(this.petBonuses.damage * damageBonus);

    // Add breathing and floating animations
    this.petRenderer.addPetAnimations(this.pet);
  }

  private createUI() {
    const width = this.cameras.main.width;

    this.scoreText = this.add.text(16, 16, `Score: ${this.score.toLocaleString()}`, {
      font: 'bold 20px Arial',
      color: '#00ffff',
    });

    this.waveText = this.add.text(width - 16, 16, 'Wave: 1', {
      font: 'bold 20px Arial',
      color: '#ff00ff',
    });
    this.waveText.setOrigin(1, 0);

    this.comboText = this.add.text(width / 2, 60, '', {
      font: 'bold 24px Arial',
      color: '#ffff00',
    });
    this.comboText.setOrigin(0.5);
    this.comboText.setVisible(false);

    this.createWeaponUI();
  }

  private createWeaponUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.weaponUI = this.add.container(width / 2, height - 40);

    const weaponCount = WEAPONS.length;
    // Scale spacing based on canvas width for better mobile fit
    const maxSpacing = 60;
    const availableWidth = width - 80; // Leave margins
    const spacing = Math.min(maxSpacing, availableWidth / weaponCount);
    const startX = -(weaponCount * spacing) / 2 + spacing / 2;

    WEAPONS.forEach((weapon, index) => {
      const x = startX + index * spacing;
      // Use larger hit area for better touch targets
      const bg = this.add.circle(x, 0, 25, 0x333333, 0.8);
      bg.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
      bg.on('pointerdown', () => {
        this.weaponSystem.setWeapon(index);
        this.updateWeaponUI();
      });
      const text = this.add.text(x, 0, weapon.emoji, { font: '24px Arial' });
      text.setOrigin(0.5);
      const label = this.add.text(x, -30, `${index + 1}`, {
        font: 'bold 12px Arial',
        color: '#ffffff',
      });
      label.setOrigin(0.5);

      this.weaponUI.add([bg, text, label]);
      weapon['bg'] = bg;
    });

    this.updateWeaponUI();
  }

  private createEndRunButton() {
    const width = this.cameras.main.width;

    this.endRunButton = this.add.container(width - 90, 24);

    const bg = this.add.rectangle(0, 0, 100, 32, 0x222222, 0.8);
    bg.setStrokeStyle(2, 0xff4444);
    const label = this.add.text(0, 0, 'End Run', {
      font: 'bold 14px Arial',
      color: '#ff9999',
    });
    label.setOrigin(0.5);

    this.endRunButton.add([bg, label]);
    this.endRunButton.setSize(100, 32);
    this.endRunButton.setInteractive();

    this.endRunButton.on('pointerdown', () => {
      this.endRun();
    });
  }

  private createUpgradeButton() {
    const width = this.cameras.main.width;

    this.upgradeButton = this.add.container(width - 60, 80);

    const bg = this.add.circle(0, 0, 32, 0x9966ff, 0.9);
    const icon = this.add.text(0, 0, '⬆️', { font: '26px Arial' });
    icon.setOrigin(0.5);

    this.upgradeButton.add([bg, icon]);
    this.upgradeButton.setSize(64, 64);
    this.upgradeButton.setInteractive();

    this.upgradeButton.on('pointerdown', () => {
      this.toggleUpgradePanel();
    });
  }

  private toggleUpgradePanel() {
    if (this.showingUpgrades) {
      this.hideUpgradePanel();
    } else {
      this.showUpgradePanel();
    }
  }

  private showUpgradePanel() {
    this.showingUpgrades = true;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.upgradePanel = this.add.container(width / 2, height / 2);

    const panelWidth = Math.min(600, width - 40);
    const panelHeight = Math.min(500, height - 100);

    // Background
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0x9966ff);
    this.upgradePanel.add(bg);

    // Title
    const title = this.add.text(0, -panelHeight / 2 + 30, 'UPGRADES', {
      font: 'bold 32px Arial',
      color: '#9966ff',
    });
    title.setOrigin(0.5);
    this.upgradePanel.add(title);

    // Points display
    const pointsText = this.add.text(
      0,
      -panelHeight / 2 + 70,
      `Points: ${this.upgradeSystem.getPoints().toLocaleString()}`,
      {
        font: 'bold 20px Arial',
        color: '#ffff00',
      }
    );
    pointsText.setOrigin(0.5);
    this.upgradePanel.add(pointsText);

    // Upgrades list
    const upgrades = this.upgradeSystem.getAllUpgrades();
    const startY = -panelHeight / 2 + 120;
    const itemHeight = 60;

    upgrades.slice(0, 6).forEach((upgrade, index) => {
      const y = startY + index * itemHeight;
      this.createUpgradeItem(upgrade, y, panelWidth - 40);
    });

    // Close button
    const closeBtn = this.add.rectangle(panelWidth / 2 - 30, -panelHeight / 2 + 30, 40, 40, 0xff0000, 0.8);
    const closeX = this.add.text(panelWidth / 2 - 30, -panelHeight / 2 + 30, 'X', {
      font: 'bold 24px Arial',
      color: '#ffffff',
    });
    closeX.setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => this.hideUpgradePanel());

    this.upgradePanel.add([closeBtn, closeX]);
  }

  private createUpgradeItem(upgrade: any, y: number, width: number) {
    const itemBg = this.add.rectangle(0, y, width, 50, 0x2a2a3e, 0.8);
    this.upgradePanel.add(itemBg);

    const nameText = this.add.text(-width / 2 + 10, y - 12, upgrade.name, {
      font: 'bold 16px Arial',
      color: '#ffffff',
    });
    this.upgradePanel.add(nameText);

    const levelText = this.add.text(-width / 2 + 10, y + 10, `Level: ${upgrade.level}/${upgrade.maxLevel}`, {
      font: '12px Arial',
      color: '#aaaaaa',
    });
    this.upgradePanel.add(levelText);

    const cost = this.upgradeSystem.getCost(upgrade.id);
    const canAfford = this.upgradeSystem.canAfford(upgrade.id);

    const costText = this.add.text(width / 2 - 80, y, `${cost.toLocaleString()}`, {
      font: 'bold 16px Arial',
      color: canAfford ? '#00ff00' : '#ff0000',
    });
    costText.setOrigin(1, 0.5);
    this.upgradePanel.add(costText);

    if (upgrade.level < upgrade.maxLevel) {
      const buyBtn = this.add.rectangle(width / 2 - 30, y, 50, 30, canAfford ? 0x00ff00 : 0x666666, 0.8);
      const buyText = this.add.text(width / 2 - 30, y, 'BUY', {
        font: 'bold 12px Arial',
        color: '#ffffff',
      });
      buyText.setOrigin(0.5);

      if (canAfford) {
        buyBtn.setInteractive();
        buyBtn.on('pointerdown', () => {
          if (this.upgradeSystem.purchase(upgrade.id)) {
            this.narrativeSystem.updateContext({
              performance: {
                lastUpgradeId: upgrade.id,
                upgradesUnlocked: this.getUnlockedUpgradeIds(),
              },
            });

            // Check for upgrade narrative
            this.narrativeSystem.checkUpgradeStory(upgrade.id);
            this.narrativeSystem.checkContextualStory('upgradeUnlocked');

            this.hideUpgradePanel();
            this.showUpgradePanel(); // Refresh
            this.applyUpgrades();
          }
        });
      }

      this.upgradePanel.add([buyBtn, buyText]);
    }
  }

  private hideUpgradePanel() {
    if (this.upgradePanel) {
      this.upgradePanel.destroy();
    }
    this.showingUpgrades = false;
  }

  private applyUpgrades() {
    // Apply damage upgrade
    const damageBonus = this.upgradeSystem.getEffect('damage');
    this.weaponSystem.setDamageMultiplier(this.petBonuses.damage * damageBonus);

    // Apply auto-fire
    if (this.upgradeSystem.getEffect('autoFire') > 0) {
      this.idleSystem.enableAutoFire();
      const autoFireInterval = this.upgradeSystem.getEffect('autoFireSpeed');
      this.idleSystem.setAutoFireInterval(autoFireInterval);
    }
  }

  private createAudioButton() {
    const width = this.cameras.main.width;
    const audioSettings = getAudioSettings();

    // Position below upgrade button
    this.audioButton = this.add.container(width - 80, 160);

    const bg = this.add.circle(0, 0, 30, 0x4488ff, 0.9);
    const icon = this.add.text(0, 0, audioSettings.getSettings().muted ? '🔇' : '🔊', {
      font: '24px Arial',
    });
    icon.setOrigin(0.5);

    this.audioButton.add([bg, icon]);
    this.audioButton.setSize(60, 60);
    this.audioButton.setInteractive();

    this.audioButton.on('pointerdown', () => {
      this.toggleAudioPanel();
    });

    // Listen for settings changes to update icon
    audioSettings.addListener((settings) => {
      icon.setText(settings.muted ? '🔇' : '🔊');
    });
  }

  private toggleAudioPanel() {
    if (this.showingAudioSettings) {
      this.hideAudioPanel();
    } else {
      this.showAudioPanel();
    }
  }

  private showAudioPanel() {
    this.showingAudioSettings = true;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const audioSettings = getAudioSettings();
    const settings = audioSettings.getSettings();

    this.audioPanel = this.add.container(width / 2, height / 2);

    const panelWidth = Math.min(400, width - 40);
    const panelHeight = 350;

    // Background
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0x4488ff);
    this.audioPanel.add(bg);

    // Title
    const title = this.add.text(0, -panelHeight / 2 + 30, 'AUDIO SETTINGS', {
      font: 'bold 28px Arial',
      color: '#4488ff',
    });
    title.setOrigin(0.5);
    this.audioPanel.add(title);

    let yPos = -panelHeight / 2 + 80;

    // Volume slider
    const volumeLabel = this.add.text(-panelWidth / 2 + 30, yPos, 'Master Volume', {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    this.audioPanel.add(volumeLabel);

    const volumeValue = this.add.text(panelWidth / 2 - 30, yPos, `${Math.round(settings.volume * 100)}%`, {
      font: 'bold 18px Arial',
      color: '#ffaa00',
    });
    volumeValue.setOrigin(1, 0);
    this.audioPanel.add(volumeValue);

    yPos += 35;

    // Volume slider bar
    const sliderBg = this.add.rectangle(0, yPos, panelWidth - 60, 20, 0x333333, 1);
    sliderBg.setInteractive();
    this.audioPanel.add(sliderBg);

    const sliderFill = this.add.rectangle(
      -(panelWidth - 60) / 2 + (settings.volume * (panelWidth - 60)) / 2,
      yPos,
      settings.volume * (panelWidth - 60),
      20,
      0x4488ff,
      1
    );
    sliderFill.setOrigin(0, 0.5);
    this.audioPanel.add(sliderFill);

    const sliderHandle = this.add.circle(
      -(panelWidth - 60) / 2 + settings.volume * (panelWidth - 60),
      yPos,
      15,
      0xffffff,
      1
    );
    sliderHandle.setInteractive();
    this.audioPanel.add(sliderHandle);

    // Drag handler for slider
    this.input.setDraggable(sliderHandle);
    sliderHandle.on('drag', (pointer: any, dragX: number) => {
      const minX = -(panelWidth - 60) / 2;
      const maxX = (panelWidth - 60) / 2;
      const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

      sliderHandle.x = clampedX;
      const volume = (clampedX - minX) / (maxX - minX);

      audioSettings.setVolume(volume);
      volumeValue.setText(`${Math.round(volume * 100)}%`);

      sliderFill.width = volume * (panelWidth - 60);
      sliderFill.x = minX + sliderFill.width / 2;
    });

    yPos += 50;

    // Mute toggle
    this.createToggle(
      'Mute All',
      settings.muted,
      -panelWidth / 2 + 30,
      yPos,
      panelWidth - 60,
      (enabled) => audioSettings.setMuted(enabled)
    );

    yPos += 50;

    // Music toggle
    this.createToggle(
      'Music',
      settings.musicEnabled,
      -panelWidth / 2 + 30,
      yPos,
      panelWidth - 60,
      (enabled) => audioSettings.setMusicEnabled(enabled)
    );

    yPos += 50;

    // SFX toggle
    this.createToggle(
      'Sound Effects',
      settings.sfxEnabled,
      -panelWidth / 2 + 30,
      yPos,
      panelWidth - 60,
      (enabled) => audioSettings.setSfxEnabled(enabled)
    );

    // Close button
    const closeBtn = this.add.rectangle(panelWidth / 2 - 30, -panelHeight / 2 + 30, 40, 40, 0xff0000, 0.8);
    const closeX = this.add.text(panelWidth / 2 - 30, -panelHeight / 2 + 30, 'X', {
      font: 'bold 24px Arial',
      color: '#ffffff',
    });
    closeX.setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => this.hideAudioPanel());

    this.audioPanel.add([closeBtn, closeX]);
  }

  private createToggle(
    label: string,
    initialState: boolean,
    x: number,
    y: number,
    width: number,
    onChange: (enabled: boolean) => void
  ) {
    const toggleLabel = this.add.text(x, y, label, {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    this.audioPanel.add(toggleLabel);

    const toggleBg = this.add.rectangle(x + width - 50, y + 5, 50, 25, initialState ? 0x00ff00 : 0x666666, 0.8);
    toggleBg.setInteractive();
    this.audioPanel.add(toggleBg);

    const toggleText = this.add.text(x + width - 50, y + 5, initialState ? 'ON' : 'OFF', {
      font: 'bold 14px Arial',
      color: '#ffffff',
    });
    toggleText.setOrigin(0.5);
    this.audioPanel.add(toggleText);

    toggleBg.on('pointerdown', () => {
      const newState = !initialState;
      initialState = newState;

      toggleBg.setFillStyle(newState ? 0x00ff00 : 0x666666, 0.8);
      toggleText.setText(newState ? 'ON' : 'OFF');
      onChange(newState);
    });
  }

  private hideAudioPanel() {
    if (this.audioPanel) {
      this.audioPanel.destroy();
    }
    this.showingAudioSettings = false;
  }

  private autoFireAttack() {
    // Find nearest enemy
    const enemies = this.enemies.children.entries as Phaser.Physics.Arcade.Sprite[];
    if (enemies.length === 0) return;

    let nearestEnemy = enemies[0];
    let nearestDistance = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, nearestEnemy.x, nearestEnemy.y);

    for (let i = 1; i < enemies.length; i++) {
      const enemy = enemies[i];
      const distance = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, enemy.x, enemy.y);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }

    this.handleAttack(nearestEnemy.x, nearestEnemy.y);
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
    const projectile = this.weaponSystem.fireWeapon(this.pet.x, this.pet.y, targetX, targetY);

    if (projectile) {
      this.projectiles.add(projectile);

      this.tweens.add({
        targets: this.pet,
        scaleX: 1.2,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
      });

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }

  private hitEnemy(projectileObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject) {
    const projectile = projectileObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;

    const damage = projectile.getData('damage') as number;
    const special = projectile.getData('special') as string;

    this.weaponSystem.applySpecialEffect(projectile, enemy);

    const currentHP = enemy.getData('hp') as number;
    const newHP = currentHP - damage;
    enemy.setData('hp', newHP);

    this.updateEnemyHealthBar(enemy);

    this.tweens.add({
      targets: enemy,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
    });

    this.createFloatingText(enemy.x, enemy.y, `-${Math.floor(damage)}`, '#ffff00');

    if (newHP <= 0) {
      this.killEnemy(enemy);
    }

    if (special !== 'PIERCE') {
      projectile.destroy();
    }
  }

  private killEnemy(enemy: Phaser.Physics.Arcade.Sprite) {
    const points = enemy.getData('points') as number;
    this.score += points;
    this.upgradeSystem.addPoints(points);

    this.scoreText.setText(`Score: ${this.score.toLocaleString()}`);

    this.combo++;
    this.comboTimer = this.comboThreshold;
    this.updateComboUI();

    this.waveSystem.recordKill();

    const isBoss = enemy.getData('type') === 'Boss';
    this.createExplosion(enemy.x, enemy.y, isBoss);

    // Check for boss narrative
    if (isBoss) {
      this.bossesDefeated++;
      this.narrativeSystem.updateContext({
        performance: {
          bossCount: this.bossesDefeated,
        },
      });
      this.narrativeSystem.checkBossStory(this.bossesDefeated);
      this.narrativeSystem.checkContextualStory('bossDefeated');
      this.cameras.main.shake(300, 0.015);
    }

    this.destroyEnemy(enemy);
  }

  private destroyEnemy(enemy: Phaser.Physics.Arcade.Sprite) {
    const hpBar = enemy.getData('hpBar') as Phaser.GameObjects.Container;
    if (hpBar) hpBar.destroy();

    const aura = enemy.getData('aura');
    if (aura) aura.destroy();

    enemy.destroy();
  }

  private createEnemyHealthBar(enemy: Phaser.Physics.Arcade.Sprite) {
    const container = this.add.container(enemy.x, enemy.y - enemy.displayHeight / 2 - 10);
    const bgWidth = enemy.displayWidth;
    const bgHeight = 4;

    const bg = this.add.rectangle(0, 0, bgWidth, bgHeight, 0x000000, 0.5);
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

    if (percent > 0.5) {
      hpBarFill.fillColor = 0x00ff00;
    } else if (percent > 0.25) {
      hpBarFill.fillColor = 0xffff00;
    } else {
      hpBarFill.fillColor = 0xff0000;
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

      const particle = this.add.circle(x, y, isBoss ? 8 : 4, colors[i % colors.length], 1);

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
    // Check for narrative
    this.narrativeSystem.checkWaveStory(wave);
    this.narrativeSystem.checkContextualStory('waveComplete');

    const msg = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `Wave ${wave} Complete!`, {
      font: 'bold 48px Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    msg.setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        msg.destroy();
        this.waveSystem.startWave(wave + 1);
        this.waveText.setText(`Wave: ${wave + 1}`);
      },
    });
  }

  private saveGame() {
    SaveManager.save({
      score: this.score,
      highScore: Math.max(this.highScore, this.score),
      wave: this.waveSystem.getCurrentWave(),
      maxWave: this.waveSystem.getCurrentWave(),
      bossesDefeated: this.bossesDefeated,
      mythicDrops: this.mythicDrops,
      upgrades: this.upgradeSystem.exportSave(),
      idleState: this.idleSystem.getState(),
    });
  }

  private loadGame() {
    const saveData = SaveManager.load();
    if (saveData) {
      this.highScore = saveData.highScore;
      this.upgradeSystem.importSave(saveData.upgrades);
      this.idleSystem.setState(saveData.idleState);
      this.applyUpgrades();
    }
  }

  private checkOfflineProgress() {
    const timeSinceLastSave = SaveManager.getTimeSinceLastSave();
    if (timeSinceLastSave && timeSinceLastSave > 60000) {
      // More than 1 minute offline
      const offlineProgress = this.idleSystem.calculateOfflineProgress({
        dps: this.upgradeSystem.calculateDPS(),
        wave: this.waveSystem.getCurrentWave(),
      });

      if (offlineProgress.points > 0) {
        this.upgradeSystem.addPoints(offlineProgress.points);

        // Show offline reward message
        const msg = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, offlineProgress.message, {
          font: 'bold 24px Arial',
          color: '#00ff00',
          align: 'center',
          wordWrap: { width: this.cameras.main.width - 100 },
        });
        msg.setOrigin(0.5);

        this.time.delayedCall(5000, () => {
          this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 1000,
            onComplete: () => msg.destroy(),
          });
        });
      }
    }
  }

  private getUnlockedUpgradeIds(): string[] {
    return this.upgradeSystem
      .getAllUpgrades()
      .filter((upgrade) => upgrade.level > 0)
      .map((upgrade) => upgrade.id);
  }

  private showStory(story: StoryBeat) {
    // Pause game
    this.scene.pause();

    // Launch narrative scene
    this.scene.launch('NarrativeScene', {
      story,
      onComplete: () => {
        this.scene.resume();
      },
    });
  }

  private endRun() {
    if (this.runEnded) return;
    this.runEnded = true;

    const detail = {
      score: this.score,
      wave: this.waveSystem.getCurrentWave(),
      bossesDefeated: this.bossesDefeated,
      mythicDrops: this.mythicDrops,
    };

    window.dispatchEvent(new CustomEvent('gameEnd', { detail }));

    this.scene.pause();
    this.scene.stop();
  }

  shutdown() {
    this.saveGame();
  }
}
