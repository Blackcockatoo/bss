'use client';

import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { NarrativeScene } from './scenes/NarrativeScene';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 520;
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

const getViewport = () => {
  if (typeof window === 'undefined') {
    return { width: BASE_WIDTH, height: BASE_HEIGHT };
  }

  return {
    width: Math.max(MIN_WIDTH, Math.min(BASE_WIDTH, window.innerWidth)),
    height: Math.max(MIN_HEIGHT, Math.min(BASE_HEIGHT, window.innerHeight - 120)),
  };
};

const viewport = getViewport();

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  width: viewport.width,
  height: viewport.height,
  parent: 'phaser-game-container',
  backgroundColor: '#0a0520',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: viewport.width,
    height: viewport.height,
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
