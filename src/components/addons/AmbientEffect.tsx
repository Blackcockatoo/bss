/**
 * AmbientEffect - Particle and visual effects addon
 * Features various ambient effects like sparkles, fireflies, bubbles, etc.
 */

'use client';

import React, { useMemo } from 'react';
import type { Addon } from '@/lib/addons';

export type EffectType = 'sparkle' | 'firefly' | 'bubble' | 'petal' | 'snowflake' | 'stardust' | 'ember' | 'crystal';

interface AmbientEffectProps {
  addon: Addon;
  effectType?: EffectType;
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  intensity?: number; // 0-1
  petMood?: 'happy' | 'neutral' | 'tired' | 'excited';
}

export const AmbientEffect: React.FC<AmbientEffectProps> = ({
  addon,
  effectType = 'sparkle',
  petPosition = { x: 200, y: 210 },
  animationPhase = 0,
  intensity = 0.8,
  petMood = 'neutral',
}) => {
  const { visual } = addon;
  const colors = visual.colors;

  // Adjust particle count based on mood
  const particleMultiplier = useMemo(() => {
    switch (petMood) {
      case 'excited': return 1.5;
      case 'happy': return 1.2;
      case 'tired': return 0.6;
      default: return 1;
    }
  }, [petMood]);

  const baseCount = Math.floor(15 * intensity * particleMultiplier);

  // Generate particles based on effect type
  const particles = useMemo(() => {
    return Array.from({ length: baseCount }, (_, i) => {
      const seed = i * 137.508; // Golden angle for distribution
      const phase = (animationPhase + seed * 10) % 10000;

      switch (effectType) {
        case 'sparkle':
          return generateSparkle(i, phase, baseCount);
        case 'firefly':
          return generateFirefly(i, phase, baseCount, animationPhase);
        case 'bubble':
          return generateBubble(i, phase, baseCount);
        case 'petal':
          return generatePetal(i, phase, baseCount, animationPhase);
        case 'snowflake':
          return generateSnowflake(i, phase, baseCount);
        case 'stardust':
          return generateStardust(i, phase, baseCount, animationPhase);
        case 'ember':
          return generateEmber(i, phase, baseCount);
        case 'crystal':
          return generateCrystal(i, phase, baseCount, animationPhase);
        default:
          return generateSparkle(i, phase, baseCount);
      }
    });
  }, [effectType, animationPhase, baseCount]);

  const renderParticle = (p: ParticleData, index: number) => {
    switch (effectType) {
      case 'sparkle':
        return (
          <g key={index} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}>
            <line x1={-p.size} y1="0" x2={p.size} y2="0" stroke={colors.primary} strokeWidth="1.5" opacity={p.opacity} />
            <line x1="0" y1={-p.size} x2="0" y2={p.size} stroke={colors.primary} strokeWidth="1.5" opacity={p.opacity} />
            <line x1={-p.size * 0.7} y1={-p.size * 0.7} x2={p.size * 0.7} y2={p.size * 0.7} stroke={colors.glow || colors.primary} strokeWidth="1" opacity={p.opacity * 0.7} />
            <line x1={p.size * 0.7} y1={-p.size * 0.7} x2={-p.size * 0.7} y2={p.size * 0.7} stroke={colors.glow || colors.primary} strokeWidth="1" opacity={p.opacity * 0.7} />
          </g>
        );

      case 'firefly':
        return (
          <g key={index}>
            <circle cx={p.x} cy={p.y} r={p.size + 4} fill={colors.glow || colors.primary} opacity={p.opacity * 0.3} filter="url(#effectGlow)" />
            <circle cx={p.x} cy={p.y} r={p.size} fill={colors.primary} opacity={p.opacity} />
          </g>
        );

      case 'bubble':
        return (
          <g key={index}>
            <circle cx={p.x} cy={p.y} r={p.size} fill="none" stroke={colors.primary} strokeWidth="1" opacity={p.opacity} />
            <ellipse cx={p.x - p.size * 0.3} cy={p.y - p.size * 0.3} rx={p.size * 0.2} ry={p.size * 0.15} fill="white" opacity={p.opacity * 0.6} />
          </g>
        );

      case 'petal':
        return (
          <g key={index} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}>
            <ellipse cx="0" cy="0" rx={p.size * 0.4} ry={p.size} fill={colors.primary} opacity={p.opacity} />
            <ellipse cx="0" cy="0" rx={p.size * 0.2} ry={p.size * 0.7} fill={colors.secondary || colors.primary} opacity={p.opacity * 0.5} />
          </g>
        );

      case 'snowflake':
        return (
          <g key={index} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}>
            {[0, 60, 120].map((angle) => (
              <g key={angle} transform={`rotate(${angle})`}>
                <line x1="0" y1={-p.size} x2="0" y2={p.size} stroke={colors.primary} strokeWidth="1" opacity={p.opacity} />
                <line x1={-p.size * 0.3} y1={-p.size * 0.5} x2="0" y2={-p.size * 0.3} stroke={colors.primary} strokeWidth="0.8" opacity={p.opacity} />
                <line x1={p.size * 0.3} y1={-p.size * 0.5} x2="0" y2={-p.size * 0.3} stroke={colors.primary} strokeWidth="0.8" opacity={p.opacity} />
              </g>
            ))}
          </g>
        );

      case 'stardust':
        return (
          <g key={index} transform={`translate(${p.x}, ${p.y}) scale(${p.scale})`}>
            <polygon points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1" fill={colors.primary} opacity={p.opacity} />
            <circle cx="0" cy="0" r="1.5" fill={colors.glow || 'white'} opacity={p.opacity} />
          </g>
        );

      case 'ember':
        return (
          <g key={index}>
            <ellipse cx={p.x} cy={p.y} rx={p.size * 0.6} ry={p.size} fill={colors.glow || colors.primary} opacity={p.opacity * 0.4} filter="url(#effectGlow)" />
            <ellipse cx={p.x} cy={p.y} rx={p.size * 0.4} ry={p.size * 0.7} fill={colors.primary} opacity={p.opacity} />
            <ellipse cx={p.x} cy={p.y - p.size * 0.2} rx={p.size * 0.2} ry={p.size * 0.4} fill={colors.secondary || '#fef08a'} opacity={p.opacity * 0.8} />
          </g>
        );

      case 'crystal':
        return (
          <g key={index} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}>
            <polygon
              points={`0,${-p.size} ${p.size * 0.5},${-p.size * 0.3} ${p.size * 0.5},${p.size * 0.3} 0,${p.size} ${-p.size * 0.5},${p.size * 0.3} ${-p.size * 0.5},${-p.size * 0.3}`}
              fill={colors.primary}
              opacity={p.opacity}
            />
            <line x1="0" y1={-p.size} x2="0" y2={p.size} stroke={colors.glow || 'white'} strokeWidth="0.5" opacity={p.opacity * 0.6} />
            <line x1={-p.size * 0.5} y1="0" x2={p.size * 0.5} y2="0" stroke={colors.glow || 'white'} strokeWidth="0.5" opacity={p.opacity * 0.6} />
          </g>
        );

      default:
        return <circle key={index} cx={p.x} cy={p.y} r={p.size} fill={colors.primary} opacity={p.opacity} />;
    }
  };

  return (
    <g transform={`translate(${petPosition.x}, ${petPosition.y})`}>
      <defs>
        <filter id="effectGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {particles.map((p, i) => renderParticle(p, i))}
    </g>
  );
};

// Particle data structure
interface ParticleData {
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  scale: number;
}

// Particle generators for each effect type
function generateSparkle(index: number, phase: number, count: number): ParticleData {
  const angle = (index / count) * Math.PI * 2;
  const radius = 40 + Math.sin(phase / 500 + index) * 30;
  const twinkle = (phase % 1000) / 1000;

  return {
    x: Math.cos(angle + phase / 2000) * radius,
    y: Math.sin(angle + phase / 2000) * radius - 20,
    size: 3 + Math.sin(phase / 300 + index) * 2,
    opacity: Math.abs(Math.sin(twinkle * Math.PI * 2 + index)) * 0.8,
    rotation: (phase / 10 + index * 45) % 360,
    scale: 1,
  };
}

function generateFirefly(index: number, phase: number, count: number, animPhase: number): ParticleData {
  const baseAngle = (index / count) * Math.PI * 2;
  const wanderX = Math.sin(animPhase / 1000 + index * 1.5) * 50;
  const wanderY = Math.cos(animPhase / 1200 + index * 1.3) * 40;
  const flicker = (Math.sin(animPhase / 100 + index * 10) + 1) / 2;

  return {
    x: wanderX + Math.cos(baseAngle) * 30,
    y: wanderY + Math.sin(baseAngle) * 25 - 30,
    size: 2 + flicker,
    opacity: 0.3 + flicker * 0.5,
    rotation: 0,
    scale: 1,
  };
}

function generateBubble(index: number, phase: number, count: number): ParticleData {
  const rise = (phase % 4000) / 4000;
  const spread = (index / count - 0.5) * 80;
  const wobble = Math.sin(phase / 300 + index) * 10;

  return {
    x: spread + wobble,
    y: 60 - rise * 140,
    size: 4 + Math.sin(index) * 3,
    opacity: rise < 0.9 ? 0.6 : (1 - rise) * 6,
    rotation: 0,
    scale: 1,
  };
}

function generatePetal(index: number, phase: number, count: number, animPhase: number): ParticleData {
  const fall = (phase % 5000) / 5000;
  const startX = (index / count - 0.5) * 120;
  const drift = Math.sin(animPhase / 800 + index) * 30;

  return {
    x: startX + drift + fall * 20,
    y: -80 + fall * 160,
    size: 5 + Math.sin(index) * 2,
    opacity: fall < 0.1 ? fall * 10 : fall > 0.9 ? (1 - fall) * 10 : 0.7,
    rotation: (animPhase / 20 + index * 60) % 360,
    scale: 1,
  };
}

function generateSnowflake(index: number, phase: number, count: number): ParticleData {
  const fall = (phase % 6000) / 6000;
  const startX = (index / count - 0.5) * 100;
  const sway = Math.sin(phase / 600 + index * 2) * 15;

  return {
    x: startX + sway,
    y: -70 + fall * 150,
    size: 4 + (index % 3),
    opacity: 0.7,
    rotation: (phase / 50 + index * 30) % 360,
    scale: 1,
  };
}

function generateStardust(index: number, phase: number, count: number, animPhase: number): ParticleData {
  const spiral = animPhase / 2000 + index * 0.5;
  const radius = 30 + (index % 4) * 15;
  const twinkle = Math.sin(animPhase / 200 + index * 3);

  return {
    x: Math.cos(spiral) * radius,
    y: Math.sin(spiral) * radius - 20,
    size: 3,
    opacity: 0.4 + twinkle * 0.4,
    rotation: 0,
    scale: 0.6 + twinkle * 0.4,
  };
}

function generateEmber(index: number, phase: number, count: number): ParticleData {
  const rise = (phase % 3000) / 3000;
  const startX = (index / count - 0.5) * 60;
  const drift = Math.sin(phase / 400 + index) * 20;
  const flicker = Math.random() * 0.3;

  return {
    x: startX + drift * rise,
    y: 40 - rise * 120,
    size: 3 + Math.sin(index) * 2,
    opacity: rise < 0.7 ? 0.8 - flicker : (1 - rise) * 2.5,
    rotation: 0,
    scale: 1,
  };
}

function generateCrystal(index: number, phase: number, count: number, animPhase: number): ParticleData {
  const orbit = animPhase / 3000 + index * (Math.PI * 2 / count);
  const radius = 45 + Math.sin(animPhase / 1000 + index) * 15;
  const shimmer = Math.sin(animPhase / 150 + index * 5);

  return {
    x: Math.cos(orbit) * radius,
    y: Math.sin(orbit) * radius * 0.6 - 10,
    size: 6 + (index % 3) * 2,
    opacity: 0.5 + shimmer * 0.3,
    rotation: (animPhase / 30 + index * 45) % 360,
    scale: 1,
  };
}

/**
 * Create an Ambient Effect addon definition
 */
export function createAmbientEffect(type: EffectType = 'sparkle'): Omit<Addon, 'ownership'> {
  const effectConfigs: Record<EffectType, {
    colors: { primary: string; secondary: string; accent: string; glow: string };
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    description: string;
    name: string;
  }> = {
    sparkle: {
      colors: { primary: '#fef08a', secondary: '#fde047', accent: '#fef9c3', glow: '#eab308' },
      rarity: 'common',
      description: 'Twinkling sparkles that dance around your pet, catching the light beautifully.',
      name: 'Sparkle Storm',
    },
    firefly: {
      colors: { primary: '#bef264', secondary: '#a3e635', accent: '#d9f99d', glow: '#84cc16' },
      rarity: 'uncommon',
      description: 'Gentle fireflies that wander around your pet, creating a magical twilight atmosphere.',
      name: 'Firefly Swarm',
    },
    bubble: {
      colors: { primary: '#7dd3fc', secondary: '#38bdf8', accent: '#bae6fd', glow: '#0ea5e9' },
      rarity: 'common',
      description: 'Playful bubbles that float upward around your pet, reflecting rainbow colors.',
      name: 'Bubble Float',
    },
    petal: {
      colors: { primary: '#fda4af', secondary: '#fb7185', accent: '#fecdd3', glow: '#f43f5e' },
      rarity: 'uncommon',
      description: 'Delicate flower petals that drift down around your pet like cherry blossoms.',
      name: 'Petal Drift',
    },
    snowflake: {
      colors: { primary: '#e0f2fe', secondary: '#bae6fd', accent: '#f0f9ff', glow: '#7dd3fc' },
      rarity: 'rare',
      description: 'Gentle snowflakes that fall around your pet, creating a winter wonderland.',
      name: 'Snowfall Embrace',
    },
    stardust: {
      colors: { primary: '#c4b5fd', secondary: '#a78bfa', accent: '#ddd6fe', glow: '#8b5cf6' },
      rarity: 'epic',
      description: 'Cosmic stardust that spirals around your pet, connecting them to the universe.',
      name: 'Cosmic Stardust',
    },
    ember: {
      colors: { primary: '#fdba74', secondary: '#fb923c', accent: '#fed7aa', glow: '#f97316' },
      rarity: 'rare',
      description: 'Warm embers that rise from below, giving your pet a powerful, fiery presence.',
      name: 'Rising Embers',
    },
    crystal: {
      colors: { primary: '#99f6e4', secondary: '#5eead4', accent: '#ccfbf1', glow: '#2dd4bf' },
      rarity: 'epic',
      description: 'Crystalline shards that orbit your pet, refracting light in mesmerizing patterns.',
      name: 'Crystal Orbit',
    },
  };

  const config = effectConfigs[type];

  return {
    id: `ambient-effect-${type}`,
    name: config.name,
    description: config.description,
    category: 'effect',
    rarity: config.rarity,
    attachment: {
      anchorPoint: 'body',
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      colors: config.colors,
      animation: {
        type: 'shimmer',
        duration: 2000,
      },
      particles: {
        count: 15,
        color: config.colors.glow,
        size: 3,
        behavior: 'ambient',
      },
    },
    modifiers: {
      energy: type === 'ember' ? 3 : type === 'stardust' ? 5 : 1,
      bond: type === 'petal' ? 3 : type === 'firefly' ? 2 : 1,
      luck: type === 'crystal' ? 3 : type === 'stardust' ? 2 : 0,
    },
    metadata: {
      creator: 'MetaPet Studio',
      createdAt: Date.now(),
      tags: ['effect', 'ambient', 'particles', type],
    },
  };
}

export default AmbientEffect;
