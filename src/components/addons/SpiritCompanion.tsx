/**
 * SpiritCompanion - A small familiar creature that accompanies the pet
 * Features different spirit types, idle animations, and pet interaction behaviors
 */

'use client';

import React, { useMemo } from 'react';
import type { Addon } from '@/lib/addons';

export type SpiritType = 'wisp' | 'sprite' | 'phoenix' | 'dragon' | 'fairy' | 'starling';

interface SpiritCompanionProps {
  addon: Addon;
  spiritType?: SpiritType;
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  petMood?: 'happy' | 'neutral' | 'tired' | 'excited';
  isInteracting?: boolean;
}

export const SpiritCompanion: React.FC<SpiritCompanionProps> = ({
  addon,
  spiritType = 'wisp',
  petPosition = { x: 200, y: 210 },
  animationPhase = 0,
  petMood = 'neutral',
  isInteracting = false,
}) => {
  const { visual } = addon;
  const colors = visual.colors;

  // Calculate companion position (orbits around pet)
  const position = useMemo(() => {
    const baseRadius = isInteracting ? 45 : 65;
    const verticalOffset = petMood === 'excited' ? -20 : petMood === 'tired' ? 10 : 0;

    // Figure-8 orbit pattern
    const t = animationPhase / 4000;
    const x = Math.sin(t * Math.PI * 2) * baseRadius;
    const y = Math.sin(t * Math.PI * 4) * 20 + verticalOffset - 30;

    return { x, y };
  }, [animationPhase, isInteracting, petMood]);

  // Bobbing animation
  const bobOffset = useMemo(() => {
    return Math.sin(animationPhase / 500) * 3;
  }, [animationPhase]);

  // Wing/appendage flap
  const flapAngle = useMemo(() => {
    return Math.sin(animationPhase / 150) * 15;
  }, [animationPhase]);

  // Eye blink
  const eyeOpen = useMemo(() => {
    const blinkCycle = animationPhase % 4000;
    return blinkCycle > 200 && blinkCycle < 4000;
  }, [animationPhase]);

  // Glow intensity
  const glowIntensity = useMemo(() => {
    return 0.5 + Math.sin(animationPhase / 800) * 0.3;
  }, [animationPhase]);

  // Render different spirit types
  const renderSpirit = () => {
    switch (spiritType) {
      case 'wisp':
        return <WispSpirit colors={colors} flapAngle={flapAngle} glowIntensity={glowIntensity} eyeOpen={eyeOpen} />;
      case 'sprite':
        return <SpriteSpirit colors={colors} flapAngle={flapAngle} glowIntensity={glowIntensity} eyeOpen={eyeOpen} />;
      case 'phoenix':
        return <PhoenixSpirit colors={colors} flapAngle={flapAngle} glowIntensity={glowIntensity} eyeOpen={eyeOpen} animationPhase={animationPhase} />;
      case 'dragon':
        return <DragonSpirit colors={colors} flapAngle={flapAngle} glowIntensity={glowIntensity} eyeOpen={eyeOpen} />;
      case 'fairy':
        return <FairySpirit colors={colors} flapAngle={flapAngle} glowIntensity={glowIntensity} eyeOpen={eyeOpen} />;
      case 'starling':
        return <StarlingSpirit colors={colors} flapAngle={flapAngle} glowIntensity={glowIntensity} eyeOpen={eyeOpen} animationPhase={animationPhase} />;
      default:
        return <WispSpirit colors={colors} flapAngle={flapAngle} glowIntensity={glowIntensity} eyeOpen={eyeOpen} />;
    }
  };

  // Trail particles
  const trailParticles = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const delay = i * 150;
      const trailPhase = ((animationPhase - delay) % 4000) / 4000;
      const trailX = Math.sin((trailPhase - 0.1 * i) * Math.PI * 2) * (65 - i * 3);
      const trailY = Math.sin((trailPhase - 0.1 * i) * Math.PI * 4) * 20 - 30 - i * 5;
      return {
        id: i,
        x: trailX,
        y: trailY,
        opacity: (1 - i * 0.18) * 0.4,
        size: 3 - i * 0.4,
      };
    });
  }, [animationPhase]);

  return (
    <g transform={`translate(${petPosition.x}, ${petPosition.y})`}>
      <defs>
        <filter id="spiritGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="spiritAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.glow || colors.primary} stopOpacity={0.6} />
          <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Trail particles */}
      {trailParticles.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={colors.glow || colors.primary}
          opacity={p.opacity}
          filter="url(#spiritGlow)"
        />
      ))}

      {/* Main spirit */}
      <g transform={`translate(${position.x}, ${position.y + bobOffset})`}>
        {/* Aura glow behind spirit */}
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="url(#spiritAura)"
          opacity={glowIntensity}
        />

        {/* Spirit body */}
        <g transform="scale(0.8)">
          {renderSpirit()}
        </g>

        {/* Interaction indicator */}
        {isInteracting && (
          <g>
            <circle
              cx="0"
              cy="-20"
              r="4"
              fill={colors.accent || colors.primary}
              opacity={Math.sin(animationPhase / 200) * 0.5 + 0.5}
            />
            <text
              x="0"
              y="-18"
              fontSize="6"
              fill="white"
              textAnchor="middle"
            >
              !
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

// Spirit type components
interface SpiritProps {
  colors: { primary: string; secondary?: string; accent?: string; glow?: string };
  flapAngle: number;
  glowIntensity: number;
  eyeOpen: boolean;
  animationPhase?: number;
}

const WispSpirit: React.FC<SpiritProps> = ({ colors, glowIntensity, eyeOpen }) => (
  <g filter="url(#spiritGlow)">
    {/* Body - flame-like wisp */}
    <ellipse cx="0" cy="0" rx="10" ry="12" fill={colors.primary} opacity={0.9} />
    <ellipse cx="0" cy="-2" rx="7" ry="8" fill={colors.secondary || colors.primary} opacity={0.7} />
    <ellipse cx="0" cy="-4" rx="4" ry="5" fill={colors.glow || 'white'} opacity={glowIntensity} />

    {/* Eyes */}
    {eyeOpen ? (
      <>
        <ellipse cx="-3" cy="-2" rx="2" ry="2.5" fill="white" />
        <ellipse cx="3" cy="-2" rx="2" ry="2.5" fill="white" />
        <circle cx="-3" cy="-2" r="1" fill="#1e293b" />
        <circle cx="3" cy="-2" r="1" fill="#1e293b" />
      </>
    ) : (
      <>
        <line x1="-5" y1="-2" x2="-1" y2="-2" stroke="#1e293b" strokeWidth="1" />
        <line x1="1" y1="-2" x2="5" y2="-2" stroke="#1e293b" strokeWidth="1" />
      </>
    )}

    {/* Tail flame */}
    <path
      d="M -4 8 Q 0 12 4 8 Q 2 14 0 16 Q -2 14 -4 8"
      fill={colors.glow || colors.primary}
      opacity={0.6}
    />
  </g>
);

const SpriteSpirit: React.FC<SpiritProps> = ({ colors, flapAngle, eyeOpen }) => (
  <g filter="url(#spiritGlow)">
    {/* Wings */}
    <g transform={`rotate(${flapAngle})`}>
      <ellipse cx="-12" cy="0" rx="8" ry="12" fill={colors.secondary || colors.primary} opacity={0.6} />
    </g>
    <g transform={`rotate(${-flapAngle})`}>
      <ellipse cx="12" cy="0" rx="8" ry="12" fill={colors.secondary || colors.primary} opacity={0.6} />
    </g>

    {/* Body */}
    <ellipse cx="0" cy="2" rx="7" ry="9" fill={colors.primary} />
    <ellipse cx="0" cy="0" rx="5" ry="6" fill={colors.glow || 'white'} opacity={0.5} />

    {/* Head */}
    <circle cx="0" cy="-8" r="5" fill={colors.primary} />

    {/* Eyes */}
    {eyeOpen ? (
      <>
        <circle cx="-2" cy="-9" r="1.5" fill="white" />
        <circle cx="2" cy="-9" r="1.5" fill="white" />
        <circle cx="-2" cy="-9" r="0.7" fill="#1e293b" />
        <circle cx="2" cy="-9" r="0.7" fill="#1e293b" />
      </>
    ) : (
      <>
        <path d="M -3.5 -9 Q -2 -8 -0.5 -9" stroke="#1e293b" strokeWidth="0.8" fill="none" />
        <path d="M 0.5 -9 Q 2 -8 3.5 -9" stroke="#1e293b" strokeWidth="0.8" fill="none" />
      </>
    )}

    {/* Antennae */}
    <line x1="-2" y1="-12" x2="-4" y2="-16" stroke={colors.accent || colors.primary} strokeWidth="1" />
    <line x1="2" y1="-12" x2="4" y2="-16" stroke={colors.accent || colors.primary} strokeWidth="1" />
    <circle cx="-4" cy="-16" r="1.5" fill={colors.glow || colors.primary} />
    <circle cx="4" cy="-16" r="1.5" fill={colors.glow || colors.primary} />
  </g>
);

const PhoenixSpirit: React.FC<SpiritProps> = ({ colors, flapAngle, eyeOpen, animationPhase = 0 }) => (
  <g filter="url(#spiritGlow)">
    {/* Flame trail */}
    <path
      d={`M -3 10 Q 0 ${15 + Math.sin(animationPhase / 200) * 3} 3 10 L 0 ${20 + Math.sin(animationPhase / 150) * 4} Z`}
      fill={colors.glow || '#f97316'}
      opacity={0.7}
    />

    {/* Wings */}
    <g transform={`rotate(${flapAngle * 1.5}) translate(-15, -2)`}>
      <path d="M 0 0 Q -8 -10 -3 -15 Q 2 -8 0 0" fill={colors.secondary || colors.primary} opacity={0.8} />
    </g>
    <g transform={`rotate(${-flapAngle * 1.5}) translate(15, -2)`}>
      <path d="M 0 0 Q 8 -10 3 -15 Q -2 -8 0 0" fill={colors.secondary || colors.primary} opacity={0.8} />
    </g>

    {/* Body */}
    <ellipse cx="0" cy="2" rx="6" ry="10" fill={colors.primary} />

    {/* Head */}
    <ellipse cx="0" cy="-10" rx="5" ry="4" fill={colors.primary} />

    {/* Crest */}
    <path d="M -2 -14 L 0 -20 L 2 -14" fill={colors.glow || colors.primary} />
    <path d="M -4 -13 L -3 -17" stroke={colors.accent || colors.primary} strokeWidth="1.5" />
    <path d="M 4 -13 L 3 -17" stroke={colors.accent || colors.primary} strokeWidth="1.5" />

    {/* Eyes */}
    {eyeOpen ? (
      <>
        <ellipse cx="-2" cy="-10" rx="1.2" ry="1.5" fill="white" />
        <ellipse cx="2" cy="-10" rx="1.2" ry="1.5" fill="white" />
        <circle cx="-2" cy="-10" r="0.6" fill="#dc2626" />
        <circle cx="2" cy="-10" r="0.6" fill="#dc2626" />
      </>
    ) : (
      <>
        <line x1="-3.5" y1="-10" x2="-0.5" y2="-10" stroke="#dc2626" strokeWidth="0.8" />
        <line x1="0.5" y1="-10" x2="3.5" y2="-10" stroke="#dc2626" strokeWidth="0.8" />
      </>
    )}

    {/* Beak */}
    <path d="M -1 -8 L 0 -6 L 1 -8" fill={colors.accent || '#f59e0b'} />
  </g>
);

const DragonSpirit: React.FC<SpiritProps> = ({ colors, flapAngle, eyeOpen }) => (
  <g filter="url(#spiritGlow)">
    {/* Wings */}
    <g transform={`rotate(${flapAngle}) translate(-10, 0)`}>
      <path d="M 0 0 L -12 -8 L -10 0 L -12 8 Z" fill={colors.secondary || colors.primary} opacity={0.7} />
    </g>
    <g transform={`rotate(${-flapAngle}) translate(10, 0)`}>
      <path d="M 0 0 L 12 -8 L 10 0 L 12 8 Z" fill={colors.secondary || colors.primary} opacity={0.7} />
    </g>

    {/* Body */}
    <ellipse cx="0" cy="3" rx="7" ry="10" fill={colors.primary} />

    {/* Scales pattern */}
    <path d="M -3 0 Q 0 2 3 0 Q 0 4 -3 0" fill={colors.secondary || colors.primary} opacity={0.5} />
    <path d="M -3 5 Q 0 7 3 5 Q 0 9 -3 5" fill={colors.secondary || colors.primary} opacity={0.5} />

    {/* Head */}
    <ellipse cx="0" cy="-8" rx="6" ry="5" fill={colors.primary} />

    {/* Horns */}
    <path d="M -4 -11 L -6 -17 L -3 -13" fill={colors.accent || colors.primary} />
    <path d="M 4 -11 L 6 -17 L 3 -13" fill={colors.accent || colors.primary} />

    {/* Eyes */}
    {eyeOpen ? (
      <>
        <ellipse cx="-2" cy="-8" rx="1.8" ry="2" fill={colors.glow || '#fef08a'} />
        <ellipse cx="2" cy="-8" rx="1.8" ry="2" fill={colors.glow || '#fef08a'} />
        <ellipse cx="-2" cy="-8" rx="0.8" ry="1.5" fill="#1e293b" />
        <ellipse cx="2" cy="-8" rx="0.8" ry="1.5" fill="#1e293b" />
      </>
    ) : (
      <>
        <line x1="-4" y1="-8" x2="0" y2="-8" stroke="#1e293b" strokeWidth="1" />
        <line x1="0" y1="-8" x2="4" y2="-8" stroke="#1e293b" strokeWidth="1" />
      </>
    )}

    {/* Snout */}
    <ellipse cx="0" cy="-4" rx="3" ry="2" fill={colors.primary} />
    <circle cx="-1" cy="-4" r="0.5" fill="#1e293b" />
    <circle cx="1" cy="-4" r="0.5" fill="#1e293b" />

    {/* Tail */}
    <path d="M 0 12 Q 8 15 10 12 Q 12 10 14 12" stroke={colors.primary} strokeWidth="3" fill="none" />
    <path d="M 14 12 L 16 10 L 14 14 Z" fill={colors.accent || colors.primary} />
  </g>
);

const FairySpirit: React.FC<SpiritProps> = ({ colors, flapAngle, eyeOpen }) => (
  <g filter="url(#spiritGlow)">
    {/* Wings - butterfly style */}
    <g transform={`rotate(${flapAngle * 0.8})`}>
      <ellipse cx="-10" cy="-3" rx="10" ry="8" fill={colors.secondary || colors.primary} opacity={0.5} />
      <ellipse cx="-8" cy="5" rx="7" ry="6" fill={colors.accent || colors.primary} opacity={0.4} />
    </g>
    <g transform={`rotate(${-flapAngle * 0.8})`}>
      <ellipse cx="10" cy="-3" rx="10" ry="8" fill={colors.secondary || colors.primary} opacity={0.5} />
      <ellipse cx="8" cy="5" rx="7" ry="6" fill={colors.accent || colors.primary} opacity={0.4} />
    </g>

    {/* Body */}
    <ellipse cx="0" cy="2" rx="4" ry="8" fill={colors.primary} />

    {/* Head */}
    <circle cx="0" cy="-8" r="5" fill={colors.primary} />

    {/* Hair/Crown */}
    <path d="M -4 -10 Q -3 -15 0 -14 Q 3 -15 4 -10" fill={colors.glow || colors.primary} />

    {/* Eyes */}
    {eyeOpen ? (
      <>
        <ellipse cx="-2" cy="-8" rx="1.5" ry="2" fill="white" />
        <ellipse cx="2" cy="-8" rx="1.5" ry="2" fill="white" />
        <circle cx="-2" cy="-8" r="0.8" fill={colors.accent || '#6366f1'} />
        <circle cx="2" cy="-8" r="0.8" fill={colors.accent || '#6366f1'} />
        {/* Sparkle in eyes */}
        <circle cx="-1.5" cy="-8.5" r="0.3" fill="white" />
        <circle cx="2.5" cy="-8.5" r="0.3" fill="white" />
      </>
    ) : (
      <>
        <path d="M -3.5 -8 Q -2 -7 -0.5 -8" stroke={colors.accent || '#6366f1'} strokeWidth="0.8" fill="none" />
        <path d="M 0.5 -8 Q 2 -7 3.5 -8" stroke={colors.accent || '#6366f1'} strokeWidth="0.8" fill="none" />
      </>
    )}

    {/* Smile */}
    <path d="M -1.5 -5 Q 0 -4 1.5 -5" stroke={colors.accent || '#ec4899'} strokeWidth="0.5" fill="none" />

    {/* Wand */}
    <line x1="4" y1="0" x2="12" y2="-8" stroke={colors.accent || '#f59e0b'} strokeWidth="1" />
    <polygon points="12,-8 10,-10 14,-10" fill={colors.glow || '#fef08a'} />
  </g>
);

const StarlingSpirit: React.FC<SpiritProps> = ({ colors, flapAngle, glowIntensity, eyeOpen, animationPhase = 0 }) => (
  <g filter="url(#spiritGlow)">
    {/* Star points that pulse */}
    {[0, 72, 144, 216, 288].map((angle, i) => (
      <g key={i} transform={`rotate(${angle + animationPhase / 100})`}>
        <polygon
          points="0,-18 2,-8 0,-10 -2,-8"
          fill={colors.glow || colors.primary}
          opacity={0.3 + Math.sin(animationPhase / 300 + i) * 0.3}
        />
      </g>
    ))}

    {/* Core body - star shape */}
    <circle cx="0" cy="0" r="8" fill={colors.primary} />
    <circle cx="0" cy="0" r="5" fill={colors.glow || 'white'} opacity={glowIntensity} />

    {/* Inner sparkle */}
    <g transform={`rotate(${animationPhase / 50})`}>
      <line x1="-4" y1="0" x2="4" y2="0" stroke="white" strokeWidth="1" opacity={0.8} />
      <line x1="0" y1="-4" x2="0" y2="4" stroke="white" strokeWidth="1" opacity={0.8} />
    </g>

    {/* Eyes */}
    {eyeOpen ? (
      <>
        <circle cx="-2" cy="-1" r="1.5" fill="#1e293b" />
        <circle cx="2" cy="-1" r="1.5" fill="#1e293b" />
        <circle cx="-1.5" cy="-1.5" r="0.5" fill="white" />
        <circle cx="2.5" cy="-1.5" r="0.5" fill="white" />
      </>
    ) : (
      <>
        <line x1="-3.5" y1="-1" x2="-0.5" y2="-1" stroke="#1e293b" strokeWidth="1" />
        <line x1="0.5" y1="-1" x2="3.5" y2="-1" stroke="#1e293b" strokeWidth="1" />
      </>
    )}

    {/* Orbit ring */}
    <ellipse
      cx="0"
      cy="0"
      rx="12"
      ry="4"
      fill="none"
      stroke={colors.secondary || colors.primary}
      strokeWidth="1"
      opacity={0.4}
      transform={`rotate(${animationPhase / 80})`}
    />
  </g>
);

/**
 * Create a Spirit Companion addon definition
 */
export function createSpiritCompanion(type: SpiritType = 'wisp'): Omit<Addon, 'ownership'> {
  const spiritConfigs: Record<SpiritType, {
    colors: { primary: string; secondary: string; accent: string; glow: string };
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    description: string;
  }> = {
    wisp: {
      colors: { primary: '#93c5fd', secondary: '#60a5fa', accent: '#dbeafe', glow: '#3b82f6' },
      rarity: 'common',
      description: 'A gentle flame spirit that drifts alongside your pet, leaving trails of soft blue light.',
    },
    sprite: {
      colors: { primary: '#a5f3fc', secondary: '#22d3ee', accent: '#67e8f9', glow: '#06b6d4' },
      rarity: 'uncommon',
      description: 'A playful nature sprite with delicate wings, bringing luck and joy to your companion.',
    },
    phoenix: {
      colors: { primary: '#fdba74', secondary: '#fb923c', accent: '#fed7aa', glow: '#f97316' },
      rarity: 'epic',
      description: 'A miniature phoenix spirit that burns with eternal flame, symbolizing rebirth and power.',
    },
    dragon: {
      colors: { primary: '#86efac', secondary: '#4ade80', accent: '#bbf7d0', glow: '#22c55e' },
      rarity: 'rare',
      description: 'A tiny dragon familiar with gleaming scales, fierce loyalty, and ancient wisdom.',
    },
    fairy: {
      colors: { primary: '#f0abfc', secondary: '#e879f9', accent: '#f5d0fe', glow: '#d946ef' },
      rarity: 'rare',
      description: 'A magical fairy companion wielding a star wand, spreading enchantment wherever she goes.',
    },
    starling: {
      colors: { primary: '#fef08a', secondary: '#facc15', accent: '#fef9c3', glow: '#eab308' },
      rarity: 'legendary',
      description: 'A celestial star spirit from the cosmos, orbited by rings of pure starlight.',
    },
  };

  const config = spiritConfigs[type];

  return {
    id: `spirit-companion-${type}`,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Companion`,
    description: config.description,
    category: 'companion',
    rarity: config.rarity,
    attachment: {
      anchorPoint: 'floating',
      offset: { x: 65, y: -30 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      colors: config.colors,
      animation: {
        type: 'float',
        duration: 4000,
      },
      particles: {
        count: 5,
        color: config.colors.glow,
        size: 2,
        behavior: 'trail',
      },
    },
    modifiers: {
      bond: type === 'fairy' ? 8 : type === 'starling' ? 10 : 5,
      luck: type === 'starling' ? 5 : type === 'phoenix' ? 3 : 1,
      curiosity: type === 'sprite' ? 5 : 2,
    },
    metadata: {
      creator: 'MetaPet Studio',
      createdAt: Date.now(),
      tags: ['companion', 'spirit', type, 'familiar'],
    },
  };
}

export default SpiritCompanion;
