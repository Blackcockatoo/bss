/**
 * CelestialAura - A mystical aura addon that surrounds the pet
 * Features layered energy rings, pulsing light, and consciousness-reactive effects
 */

'use client';

import React, { useMemo } from 'react';
import type { Addon } from '@/lib/addons';

interface CelestialAuraProps {
  addon: Addon;
  petSize?: number;
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  consciousness?: number; // 0-100, affects intensity
  mood?: 'happy' | 'neutral' | 'tired' | 'excited';
}

export const CelestialAura: React.FC<CelestialAuraProps> = ({
  addon,
  petPosition = { x: 200, y: 210 },
  animationPhase = 0,
  consciousness = 50,
  mood = 'neutral',
}) => {
  const { visual } = addon;
  const colors = visual.colors;

  // Calculate aura intensity based on consciousness
  const intensity = useMemo(() => {
    const base = consciousness / 100;
    const moodMultiplier = mood === 'excited' ? 1.3 : mood === 'happy' ? 1.1 : mood === 'tired' ? 0.7 : 1;
    return Math.min(1, base * moodMultiplier);
  }, [consciousness, mood]);

  // Pulsing animation
  const pulseScale = useMemo(() => {
    const phase = (animationPhase % 3000) / 3000;
    return 1 + Math.sin(phase * Math.PI * 2) * 0.08 * intensity;
  }, [animationPhase, intensity]);

  // Ring rotations
  const innerRotation = (animationPhase / 50) % 360;
  const middleRotation = -(animationPhase / 70) % 360;
  const outerRotation = (animationPhase / 100) % 360;

  // Energy particles
  const particles = useMemo(() => {
    const count = Math.floor(12 * intensity);
    return Array.from({ length: count }, (_, i) => {
      const baseAngle = (i / count) * Math.PI * 2;
      const phaseOffset = (animationPhase / 2000 + i * 0.5) % (Math.PI * 2);
      const radius = 70 + Math.sin(phaseOffset) * 15;
      return {
        id: i,
        x: Math.cos(baseAngle + animationPhase / 3000) * radius,
        y: Math.sin(baseAngle + animationPhase / 3000) * radius,
        size: 2 + Math.sin(phaseOffset) * 1.5,
        opacity: 0.4 + Math.sin(phaseOffset) * 0.3,
      };
    });
  }, [animationPhase, intensity]);

  // Consciousness streams (vertical energy lines)
  const streams = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + animationPhase / 5000;
      const streamPhase = (animationPhase / 1500 + i * 0.3) % 1;
      return {
        id: i,
        x1: Math.cos(angle) * 50,
        y1: 60 - streamPhase * 120,
        x2: Math.cos(angle) * 55,
        y2: 70 - streamPhase * 120,
        opacity: Math.sin(streamPhase * Math.PI) * intensity * 0.6,
      };
    });
  }, [animationPhase, intensity]);

  return (
    <g transform={`translate(${petPosition.x}, ${petPosition.y})`}>
      {/* Background glow */}
      <defs>
        <radialGradient id="auraGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3 * intensity} />
          <stop offset="50%" stopColor={colors.secondary || colors.primary} stopOpacity={0.15 * intensity} />
          <stop offset="100%" stopColor={colors.glow || colors.primary} stopOpacity={0} />
        </radialGradient>

        <filter id="auraBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>

        <filter id="auraGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main aura glow */}
      <ellipse
        cx="0"
        cy="0"
        rx={90 * pulseScale}
        ry={100 * pulseScale}
        fill="url(#auraGradient)"
        filter="url(#auraBlur)"
      />

      {/* Outer ring */}
      <g transform={`rotate(${outerRotation})`}>
        <ellipse
          cx="0"
          cy="0"
          rx="85"
          ry="95"
          fill="none"
          stroke={colors.glow || colors.primary}
          strokeWidth="1"
          strokeDasharray="8 12 4 8"
          opacity={0.4 * intensity}
          filter="url(#auraGlow)"
        />
      </g>

      {/* Middle ring */}
      <g transform={`rotate(${middleRotation})`}>
        <ellipse
          cx="0"
          cy="0"
          rx="70"
          ry="78"
          fill="none"
          stroke={colors.secondary || colors.primary}
          strokeWidth="1.5"
          strokeDasharray="15 8 3 10"
          opacity={0.5 * intensity}
        />

        {/* Runes on middle ring */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <text
              x="70"
              y="3"
              fontSize="8"
              fill={colors.accent || colors.primary}
              opacity={0.6 * intensity}
              textAnchor="middle"
            >
              {['◈', '◇', '⬡', '✧', '⟡', '⬢'][angle / 60]}
            </text>
          </g>
        ))}
      </g>

      {/* Inner ring */}
      <g transform={`rotate(${innerRotation})`}>
        <ellipse
          cx="0"
          cy="0"
          rx="55"
          ry="62"
          fill="none"
          stroke={colors.primary}
          strokeWidth="2"
          strokeDasharray="20 5"
          opacity={0.6 * intensity}
          filter="url(#auraGlow)"
        />
      </g>

      {/* Energy particles */}
      {particles.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={colors.glow || colors.primary}
          opacity={p.opacity}
          filter="url(#auraGlow)"
        />
      ))}

      {/* Consciousness streams */}
      {streams.map((s) => (
        <line
          key={s.id}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={colors.accent || colors.primary}
          strokeWidth="2"
          opacity={s.opacity}
          strokeLinecap="round"
          filter="url(#auraGlow)"
        />
      ))}

      {/* Core energy pulse */}
      <circle
        cx="0"
        cy="0"
        r={40 * pulseScale}
        fill="none"
        stroke={colors.primary}
        strokeWidth="0.5"
        opacity={0.3 * intensity}
      />
    </g>
  );
};

/**
 * Create a Celestial Aura addon definition
 */
export function createCelestialAura(variant: 'azure' | 'golden' | 'violet' | 'emerald' = 'azure'): Omit<Addon, 'ownership'> {
  const colorSchemes = {
    azure: {
      primary: '#60a5fa',
      secondary: '#3b82f6',
      accent: '#93c5fd',
      glow: '#2563eb',
    },
    golden: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#fde68a',
      glow: '#d97706',
    },
    violet: {
      primary: '#a78bfa',
      secondary: '#8b5cf6',
      accent: '#c4b5fd',
      glow: '#7c3aed',
    },
    emerald: {
      primary: '#34d399',
      secondary: '#10b981',
      accent: '#6ee7b7',
      glow: '#059669',
    },
  };

  const rarities = {
    azure: 'rare' as const,
    golden: 'legendary' as const,
    violet: 'epic' as const,
    emerald: 'rare' as const,
  };

  return {
    id: `celestial-aura-${variant}`,
    name: `Celestial Aura (${variant.charAt(0).toUpperCase() + variant.slice(1)})`,
    description: `A mystical aura of ${variant} energy that surrounds your pet, pulsing with consciousness and ancient power.`,
    category: 'aura',
    rarity: rarities[variant],
    attachment: {
      anchorPoint: 'aura',
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      colors: colorSchemes[variant],
      animation: {
        type: 'pulse',
        duration: 3000,
      },
      particles: {
        count: 12,
        color: colorSchemes[variant].glow,
        size: 2,
        behavior: 'orbit',
      },
    },
    modifiers: {
      energy: 5,
      bond: 3,
    },
    metadata: {
      creator: 'MetaPet Studio',
      createdAt: Date.now(),
      tags: ['aura', 'mystical', 'consciousness', variant],
    },
  };
}

export default CelestialAura;
