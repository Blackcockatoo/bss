import * as Phaser from 'phaser';

export interface PhysicalTraits {
  bodyType: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  texture: string;
  size: number;
  features: string[];
}

export class PetRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates a dynamic pet sprite based on MetaPet traits
   */
  createPetSprite(
    traits: PhysicalTraits,
    genomeSeed: number = 0,
    size: number = 50
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 1. Body shape based on bodyType
    const body = this.createBody(
      traits.bodyType,
      traits.primaryColor,
      traits.secondaryColor,
      size
    );
    container.add(body);

    // 2. Pattern overlay
    if (traits.pattern !== 'Solid') {
      const pattern = this.createPattern(
        traits.pattern,
        traits.secondaryColor,
        size,
        genomeSeed
      );
      container.add(pattern);
    }

    // 3. Texture effects
    if (traits.texture === 'Glowing') {
      const glow = this.scene.add.pointlight(
        0,
        0,
        this.hexToNumber(traits.primaryColor),
        size * 2,
        0.3
      );
      container.add(glow);
    }

    // 4. Features (wings, horns, tail flame, aura)
    traits.features.forEach((feature) => {
      const featureSprite = this.createFeature(feature, traits, size);
      if (featureSprite) {
        container.add(featureSprite);
      }
    });

    // 5. Eyes
    const eyes = this.createEyes(traits.bodyType, size);
    eyes.forEach((eye) => container.add(eye));

    return container;
  }

  /**
   * Add idle animations to pet container
   */
  addPetAnimations(container: Phaser.GameObjects.Container): void {
    // Breathing animation - gentle scale pulse
    this.scene.tweens.add({
      targets: container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtle floating animation
    const baseY = container.y;
    this.scene.tweens.add({
      targets: container,
      y: baseY - 10,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Eye blinking - find eye objects and animate
    const eyes = container.getAll().filter((obj, index) => index >= container.length - 2);
    if (eyes.length >= 2) {
      this.scene.time.addEvent({
        delay: Phaser.Math.Between(3000, 6000),
        callback: () => {
          eyes.forEach((eye) => {
            this.scene.tweens.add({
              targets: eye,
              scaleY: 0.1,
              duration: 100,
              yoyo: true,
              ease: 'Linear',
            });
          });

        },
        loop: true,
      });
    }
  }

  private createBody(
    bodyType: string,
    color: string,
    strokeColor: string,
    size: number
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const fillColor = this.hexToNumber(color);
    const outlineColor = this.hexToNumber(strokeColor);

    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(3, outlineColor, 1);

    switch (bodyType) {
      case 'Spherical':
        graphics.fillCircle(0, 0, size / 2);
        graphics.strokeCircle(0, 0, size / 2);
        break;

      case 'Cubic':
        graphics.fillRect(-size / 2, -size / 2, size, size);
        graphics.strokeRect(-size / 2, -size / 2, size, size);
        break;

      case 'Pyramidal':
        graphics.fillTriangle(
          0, -size / 2,
          -size / 2, size / 2,
          size / 2, size / 2
        );
        graphics.strokeTriangle(
          0, -size / 2,
          -size / 2, size / 2,
          size / 2, size / 2
        );
        break;

      case 'Cylindrical':
        graphics.fillEllipse(0, 0, size * 0.6, size * 1.2);
        graphics.strokeEllipse(0, 0, size * 0.6, size * 1.2);
        break;

      case 'Toroidal':
        graphics.fillCircle(0, 0, size / 2);
        graphics.strokeCircle(0, 0, size / 2);
        graphics.strokeCircle(0, 0, size / 4);
        break;

      case 'Crystalline':
        graphics.fillPoints([
          new Phaser.Geom.Point(0, -size / 2),
          new Phaser.Geom.Point(size * 0.7, -size * 0.3),
          new Phaser.Geom.Point(size * 0.5, size * 0.5),
          new Phaser.Geom.Point(-size * 0.5, size * 0.5),
          new Phaser.Geom.Point(-size * 0.7, -size * 0.3),
        ], true);
        graphics.strokePoints([
          new Phaser.Geom.Point(0, -size / 2),
          new Phaser.Geom.Point(size * 0.7, -size * 0.3),
          new Phaser.Geom.Point(size * 0.5, size * 0.5),
          new Phaser.Geom.Point(-size * 0.5, size * 0.5),
          new Phaser.Geom.Point(-size * 0.7, -size * 0.3),
        ], true);
        break;

      default:
        // Default to spherical
        graphics.fillCircle(0, 0, size / 2);
        graphics.strokeCircle(0, 0, size / 2);
    }

    return graphics;
  }

  private createPattern(
    pattern: string,
    color: string,
    size: number,
    seed: number
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const fillColor = this.hexToNumber(color);

    switch (pattern) {
      case 'Striped':
        // Vertical stripes with gradient effect
        for (let i = -size / 2; i < size / 2; i += size / 5) {
          graphics.fillStyle(fillColor, 0.6);
          graphics.fillRect(i, -size / 2, size / 10, size);
          // Add highlight to stripes
          graphics.fillStyle(fillColor, 0.3);
          graphics.fillRect(i, -size / 2, size / 20, size);
        }
        break;

      case 'Spotted':
        // Random spots based on seed with varying sizes
        Phaser.Math.RND.sow([seed.toString()]);
        for (let i = 0; i < 5; i++) {
          const x = Phaser.Math.Between(-size / 3, size / 3);
          const y = Phaser.Math.Between(-size / 3, size / 3);
          const spotSize = Phaser.Math.Between(size / 10, size / 6);

          graphics.fillStyle(fillColor, 0.6);
          graphics.fillCircle(x, y, spotSize);
          // Add highlight to spots
          graphics.fillStyle(fillColor, 0.3);
          graphics.fillCircle(x - spotSize / 3, y - spotSize / 3, spotSize / 2);
        }
        break;

      case 'Gradient':
        // Radial gradient effect using multiple circles
        for (let i = 0; i < 5; i++) {
          const alpha = 0.5 - (i * 0.08);
          const circleSize = (size / 2) * (1 - i * 0.15);
          graphics.fillStyle(fillColor, alpha);
          graphics.fillCircle(0, 0, circleSize);
        }
        break;

      case 'Marbled':
        // Organic marble pattern
        Phaser.Math.RND.sow([seed.toString()]);
        for (let i = 0; i < 8; i++) {
          const x = Phaser.Math.Between(-size / 2, size / 2);
          const y = Phaser.Math.Between(-size / 2, size / 2);
          const width = Phaser.Math.Between(size / 8, size / 4);
          const height = Phaser.Math.Between(size / 6, size / 3);

          graphics.fillStyle(fillColor, 0.4);
          graphics.fillEllipse(x, y, width, height);
        }
        break;
    }

    return graphics;
  }

  private createFeature(
    feature: string,
    traits: PhysicalTraits,
    size: number
  ): Phaser.GameObjects.Graphics | null {
    const graphics = this.scene.add.graphics();
    const color = this.hexToNumber(traits.secondaryColor);

    switch (feature) {
      case 'Wings':
        // Enhanced wing shapes with multiple ellipses for organic look
        graphics.fillStyle(color, 0.9);
        graphics.lineStyle(2, 0x000000, 0.3);

        // Left wing - layered ellipses
        graphics.fillEllipse(-size / 2, 0, size / 2.5, size / 1.8);
        graphics.strokeEllipse(-size / 2, 0, size / 2.5, size / 1.8);

        // Wing feather details
        graphics.fillStyle(color, 0.7);
        graphics.fillEllipse(-size / 1.8, -size / 8, size / 4, size / 3);
        graphics.fillEllipse(-size / 1.8, size / 8, size / 4, size / 3);

        // Wing highlight
        graphics.fillStyle(color, 0.4);
        graphics.fillEllipse(-size / 2.2, -size / 8, size / 8, size / 4);

        // Right wing - layered ellipses
        graphics.fillStyle(color, 0.9);
        graphics.fillEllipse(size / 2, 0, size / 2.5, size / 1.8);
        graphics.strokeEllipse(size / 2, 0, size / 2.5, size / 1.8);

        // Wing feather details
        graphics.fillStyle(color, 0.7);
        graphics.fillEllipse(size / 1.8, -size / 8, size / 4, size / 3);
        graphics.fillEllipse(size / 1.8, size / 8, size / 4, size / 3);

        // Right wing highlight
        graphics.fillStyle(color, 0.4);
        graphics.fillEllipse(size / 2.2, -size / 8, size / 8, size / 4);
        break;

      case 'Horns':
        // Enhanced horns with gradient shading
        graphics.lineStyle(2, 0x000000, 0.4);

        // Left horn
        graphics.fillStyle(color, 1);
        graphics.fillTriangle(
          -size / 4,
          -size / 2,
          -size / 4 - 8,
          -size / 2 - 20,
          -size / 4 + 5,
          -size / 2 - 18
        );
        // Horn highlight
        graphics.fillStyle(color, 0.5);
        graphics.fillTriangle(
          -size / 4,
          -size / 2,
          -size / 4 - 3,
          -size / 2 - 10,
          -size / 4 + 2,
          -size / 2 - 9
        );

        // Right horn
        graphics.fillStyle(color, 1);
        graphics.fillTriangle(
          size / 4,
          -size / 2,
          size / 4 - 5,
          -size / 2 - 18,
          size / 4 + 8,
          -size / 2 - 20
        );
        // Horn highlight
        graphics.fillStyle(color, 0.5);
        graphics.fillTriangle(
          size / 4,
          -size / 2,
          size / 4 - 2,
          -size / 2 - 9,
          size / 4 + 3,
          -size / 2 - 10
        );
        break;

      case 'Tail Flame':
        // Enhanced flame effect with gradient layers
        graphics.fillStyle(0xff0000, 0.8);
        graphics.fillTriangle(0, size / 2, -12, size / 2 + 25, 12, size / 2 + 25);

        graphics.fillStyle(0xff6600, 0.9);
        graphics.fillTriangle(0, size / 2 + 3, -8, size / 2 + 20, 8, size / 2 + 20);

        graphics.fillStyle(0xffaa00, 1);
        graphics.fillTriangle(0, size / 2 + 6, -5, size / 2 + 15, 5, size / 2 + 15);

        // Bright tip
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(0, size / 2 + 8, 3);
        break;

      case 'Aura':
        // Multi-layered glow rings
        graphics.lineStyle(4, color, 0.15);
        graphics.strokeCircle(0, 0, size / 2 + 15);

        graphics.lineStyle(3, color, 0.25);
        graphics.strokeCircle(0, 0, size / 2 + 10);

        graphics.lineStyle(2, color, 0.35);
        graphics.strokeCircle(0, 0, size / 2 + 5);

        // Add subtle particles (small dots around aura)
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          const x = Math.cos(angle) * (size / 2 + 12);
          const y = Math.sin(angle) * (size / 2 + 12);

          graphics.fillStyle(color, 0.4);
          graphics.fillCircle(x, y, 2);
        }
        return graphics;

      case 'Third Eye':
        // Mystical third eye on forehead
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(0, -size / 3, size / 6, size / 8);

        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, -size / 3, size / 12);

        // Eye glow
        graphics.fillStyle(color, 0.3);
        graphics.fillCircle(0, -size / 3, size / 8);
        break;

      default:
        return null;
    }

    return graphics;
  }

  private createEyes(bodyType: string, size: number): Phaser.GameObjects.Graphics[] {
    const leftEye = this.scene.add.graphics();
    const rightEye = this.scene.add.graphics();

    // Eye positioning based on body type
    const eyeY = bodyType === 'Pyramidal' ? -size / 4 : -size / 6;

    leftEye.fillStyle(0xffffff, 1);
    leftEye.fillCircle(-size / 4, eyeY, size / 8);
    leftEye.fillStyle(0x000000, 1);
    leftEye.fillCircle(-size / 4, eyeY, size / 12);

    rightEye.fillStyle(0xffffff, 1);
    rightEye.fillCircle(size / 4, eyeY, size / 8);
    rightEye.fillStyle(0x000000, 1);
    rightEye.fillCircle(size / 4, eyeY, size / 12);

    return [leftEye, rightEye];
  }

  /**
   * Apply trait-based stat bonuses
   */
  calculateTraitBonuses(traits: PhysicalTraits): {
    fireRate: number;
    damage: number;
    critChance: number;
    speed: number;
  } {
    const bonuses = {
      fireRate: 1.0,
      damage: 1.0,
      critChance: 0.05,
      speed: 1.0,
    };

    // Body type bonuses
    if (traits.bodyType === 'Spherical') {
      bonuses.speed = 1.2; // Faster movement
    } else if (traits.bodyType === 'Cubic') {
      bonuses.damage = 1.15; // More damage
    } else if (traits.bodyType === 'Pyramidal') {
      bonuses.critChance = 0.15; // Higher crit
    }

    // Size bonuses
    if (traits.size < 1.0) {
      bonuses.fireRate = 1.3; // Smaller = faster fire rate
    } else if (traits.size > 1.5) {
      bonuses.damage = 1.2; // Larger = more damage
    }

    // Feature bonuses
    if (traits.features.includes('Wings')) {
      bonuses.speed = 1.25;
    }
    if (traits.features.includes('Horns')) {
      bonuses.damage = 1.2;
    }

    // Color bonuses (simplified)
    const primaryHue = this.getHue(traits.primaryColor);
    if (primaryHue < 30 || primaryHue > 330) {
      // Red
      bonuses.damage = 1.15;
    } else if (primaryHue > 200 && primaryHue < 260) {
      // Blue
      bonuses.fireRate = 1.15;
    }

    return bonuses;
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  private getHue(hex: string): number {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = ((rgb >> 16) & 255) / 255;
    const g = ((rgb >> 8) & 255) / 255;
    const b = (rgb & 255) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) return 0;

    let hue = 0;
    if (max === r) {
      hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      hue = ((b - r) / delta + 2) / 6;
    } else {
      hue = ((r - g) / delta + 4) / 6;
    }

    return hue * 360;
  }
}
