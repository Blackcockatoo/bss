'use client';

import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { NarrativeScene } from './scenes/NarrativeScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  width: 800,
  height: 600,
  parent: 'phaser-game-container',
  backgroundColor: '#0a0520',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  input: {
    touch: {
      capture: true, // Prevent default browser touch behaviors in game area
    },
    activePointers: 3, // Support multi-touch for mobile
  },
  render: {
    pixelArt: false,
    antialias: true,
    powerPreference: 'low-power', // Battery saving for mobile
  },
  fps: {
    target: 60,
    forceSetTimeOut: true, // Better mobile performance
  },
  scene: [BootScene, MenuScene, GameScene, NarrativeScene],
};
