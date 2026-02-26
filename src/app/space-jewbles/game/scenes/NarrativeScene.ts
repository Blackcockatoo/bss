import * as Phaser from 'phaser';
import { StoryBeat } from '../data/storyBeats';

export class NarrativeScene extends Phaser.Scene {
  private story?: StoryBeat;
  private currentLineIndex: number = 0;
  private textObject?: Phaser.GameObjects.Text;
  private container?: Phaser.GameObjects.Container;
  private isTyping: boolean = false;
  private typewriterEvent?: Phaser.Time.TimerEvent;
  private onComplete?: () => void;

  constructor() {
    super({ key: 'NarrativeScene' });
  }

  init(data: { story: StoryBeat; onComplete?: () => void }) {
    this.story = data.story;
    this.onComplete = data.onComplete;
    this.currentLineIndex = 0;
    this.isTyping = false;
  }

  create() {
    if (!this.story) return;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0);

    // Create dialogue container
    this.container = this.add.container(width / 2, height - 200);

    const boxWidth = Math.min(700, width - 40);
    const boxHeight = 180;

    // Dialogue box background
    const box = this.add.rectangle(0, 0, boxWidth, boxHeight, 0x1a1a2e, 0.95);
    box.setStrokeStyle(3, this.story.isImportant ? 0xffaa00 : 0x6666ff);
    this.container.add(box);

    // Speaker name
    const speakerBg = this.add.rectangle(0, -boxHeight / 2 - 20, 200, 40, 0x6666ff, 1);
    const speakerText = this.add.text(0, -boxHeight / 2 - 20, this.story.speaker, {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    speakerText.setOrigin(0.5);
    this.container.add([speakerBg, speakerText]);

    // Story title (if important)
    if (this.story.isImportant) {
      const titleText = this.add.text(0, -boxHeight / 2 + 20, this.story.title, {
        font: 'bold 20px Arial',
        color: '#ffaa00',
      });
      titleText.setOrigin(0.5);
      this.container.add(titleText);
    }

    // Dialogue text
    this.textObject = this.add.text(0, this.story.isImportant ? -20 : 0, '', {
      font: '16px Arial',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: boxWidth - 60 },
    });
    this.textObject.setOrigin(0.5);
    this.container.add(this.textObject);

    // Continue indicator
    const continueText = this.add.text(boxWidth / 2 - 20, boxHeight / 2 - 20, '▼', {
      font: 'bold 20px Arial',
      color: '#ffaa00',
    });
    continueText.setOrigin(0.5);
    continueText.setAlpha(0);
    this.container.add(continueText);

    // Animate continue indicator
    this.tweens.add({
      targets: continueText,
      alpha: 1,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Concept tag (bottom right)
    const conceptTag = this.add.text(boxWidth / 2 - 10, -boxHeight / 2 + 10, this.story.concept, {
      font: 'italic 12px Arial',
      color: '#888888',
    });
    conceptTag.setOrigin(1, 0);
    this.container.add(conceptTag);

    // Input to advance dialogue
    this.input.on('pointerdown', () => this.advanceLine());
    this.input.keyboard?.on('keydown-SPACE', () => this.advanceLine());
    this.input.keyboard?.on('keydown-ENTER', () => this.advanceLine());

    // Skip button
    const skipBtn = this.add.rectangle(width - 80, 40, 120, 40, 0xff0000, 0.8);
    const skipText = this.add.text(width - 80, 40, 'Skip', {
      font: 'bold 16px Arial',
      color: '#ffffff',
    });
    skipText.setOrigin(0.5);
    skipBtn.setInteractive();
    skipBtn.on('pointerdown', () => this.skipStory());

    // Show first line
    this.showLine(0);
  }

  private showLine(index: number) {
    if (!this.story || !this.textObject) return;

    if (index >= this.story.lines.length) {
      this.completeStory();
      return;
    }

    this.currentLineIndex = index;
    const line = this.story.lines[index];

    // Type out the text
    this.isTyping = true;
    this.textObject.setText('');

    let charIndex = 0;
    const typeSpeed = 30; // ms per character

    if (this.typewriterEvent) {
      this.typewriterEvent.destroy();
    }

    this.typewriterEvent = this.time.addEvent({
      delay: typeSpeed,
      callback: () => {
        if (charIndex < line.length) {
          this.textObject!.setText(line.substring(0, charIndex + 1));
          charIndex++;
        } else {
          this.isTyping = false;
          if (this.typewriterEvent) {
            this.typewriterEvent.destroy();
          }
        }
      },
      loop: true,
    });
  }

  private advanceLine() {
    if (this.isTyping && this.textObject && this.story) {
      // Complete current line immediately
      this.isTyping = false;
      if (this.typewriterEvent) {
        this.typewriterEvent.destroy();
      }
      this.textObject.setText(this.story.lines[this.currentLineIndex]);
    } else {
      // Move to next line
      this.showLine(this.currentLineIndex + 1);
    }
  }

  private skipStory() {
    if (this.typewriterEvent) {
      this.typewriterEvent.destroy();
    }
    this.completeStory();
  }

  private completeStory() {
    if (this.onComplete) {
      this.onComplete();
    }
    this.scene.stop('NarrativeScene');
  }
}
