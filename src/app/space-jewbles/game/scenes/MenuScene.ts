import * as Phaser from 'phaser';
import { getAudioSettings } from '../utils/audioSettings';

export class MenuScene extends Phaser.Scene {
  private petData: any;
  private genomeHeptaSignature: any;
  private playHepta: any;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Dynamic import of heptatone functions (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const genomeModule = await import('@/genome');
        const audioModule = await import('@/lib/identity/hepta/audio');
        this.genomeHeptaSignature = genomeModule.genomeHeptaSignature;
        this.playHepta = audioModule.playHepta;
      } catch (error) {
        console.error('Failed to load heptatone modules:', error);
      }
    }

    // Listen for pet data from React
    this.events.on('petData', (data: any) => {
      this.petData = data;
    });

    // Background gradient
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0a0520, 0x0a0520, 0x1a0f3a, 0x1a0f3a, 1);
    graphics.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, height / 3, 'SPACE JEWBLES', {
      font: 'bold 48px Arial',
      color: '#00ffff',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 60, 'Tap to Attack • Idle to Progress', {
      font: '20px Arial',
      color: '#ff00ff',
    });
    subtitle.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(width / 2, height - 100, 'Tap anywhere to start', {
      font: '18px Arial',
      color: '#ffffff',
    });
    instructions.setOrigin(0.5);

    // Pulsing animation for instructions
    this.tweens.add({
      targets: instructions,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Start game on tap/click
    this.input.once('pointerdown', async () => {
      const audioSettings = getAudioSettings();

      // Play heptatone if available and music is enabled
      if (
        this.petData?.genome &&
        this.genomeHeptaSignature &&
        this.playHepta &&
        audioSettings.shouldPlayMusic()
      ) {
        try {
          // Show "Your Pet's Song" text
          const songText = this.add.text(width / 2, height / 2, '♪ Your Pet\'s Song ♪', {
            font: 'bold 32px Arial',
            color: '#ffaa00',
          });
          songText.setOrigin(0.5);

          // Add floating musical notes
          const notes = ['🎵', '🎶', '♪', '♫'];
          for (let i = 0; i < 4; i++) {
            const note = this.add.text(
              width / 2 + (i - 1.5) * 50,
              height / 2 + 60,
              notes[i % notes.length],
              { font: '32px Arial' }
            );
            note.setOrigin(0.5);
            note.setAlpha(0);

            this.tweens.add({
              targets: note,
              alpha: 1,
              y: note.y - 100,
              duration: 2000,
              delay: i * 150,
              ease: 'Sine.easeOut',
              onComplete: () => note.destroy(),
            });
          }

          // Generate and play heptatone with user's volume setting
          const heptaSig = this.genomeHeptaSignature(this.petData.genome);
          await this.playHepta(heptaSig.mod7, {
            tempo: 180,
            volume: audioSettings.getVolume() * 0.6, // Max 60% of user volume
            sustainRatio: 0.7,
          });

          // Clean up text
          this.tweens.add({
            targets: songText,
            alpha: 0,
            duration: 500,
            onComplete: () => songText.destroy(),
          });
        } catch (error) {
          console.error('Heptatone playback error:', error);
        }
      }

      // Start game scene
      this.scene.start('GameScene', { petData: this.petData });
    });
  }
}
