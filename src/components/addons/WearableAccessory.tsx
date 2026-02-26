/**
 * WearableAccessory - Wearable accessory items for the pet
 * Features various accessories like crowns, scarves, glasses, pendants, etc.
 */

'use client';

import React, { useMemo } from 'react';
import type { Addon } from '@/lib/addons';

export type AccessoryType = 'crown' | 'scarf' | 'glasses' | 'pendant' | 'bow' | 'halo' | 'collar' | 'cape';

interface WearableAccessoryProps {
  addon: Addon;
  accessoryType?: AccessoryType;
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  petMood?: 'happy' | 'neutral' | 'tired' | 'excited';
  scale?: number;
}

export const WearableAccessory: React.FC<WearableAccessoryProps> = ({
  addon,
  accessoryType = 'crown',
  petPosition = { x: 200, y: 210 },
  animationPhase = 0,
  petMood = 'neutral',
  scale = 1,
}) => {
  const { visual, attachment } = addon;
  const colors = visual.colors;

  // Calculate position based on attachment point
  const position = useMemo(() => {
    switch (attachment.anchorPoint) {
      case 'head':
        return { x: 0, y: -65 }; // Above pet head
      case 'body':
        return { x: 0, y: 0 }; // Center of body
      case 'back':
        return { x: 0, y: 0 }; // Behind body
      default:
        return { x: attachment.offset.x, y: attachment.offset.y };
    }
  }, [attachment]);

  // Subtle animation based on mood
  const wobble = useMemo(() => {
    if (petMood === 'excited') {
      return Math.sin(animationPhase / 200) * 3;
    }
    if (petMood === 'happy') {
      return Math.sin(animationPhase / 400) * 1.5;
    }
    return 0;
  }, [animationPhase, petMood]);

  // Sparkle effect for magical accessories
  const sparkleOpacity = useMemo(() => {
    return 0.4 + Math.sin(animationPhase / 300) * 0.3;
  }, [animationPhase]);

  const renderAccessory = () => {
    switch (accessoryType) {
      case 'crown':
        return <CrownAccessory colors={colors} sparkleOpacity={sparkleOpacity} />;
      case 'scarf':
        return <ScarfAccessory colors={colors} animationPhase={animationPhase} />;
      case 'glasses':
        return <GlassesAccessory colors={colors} />;
      case 'pendant':
        return <PendantAccessory colors={colors} sparkleOpacity={sparkleOpacity} animationPhase={animationPhase} />;
      case 'bow':
        return <BowAccessory colors={colors} />;
      case 'halo':
        return <HaloAccessory colors={colors} animationPhase={animationPhase} sparkleOpacity={sparkleOpacity} />;
      case 'collar':
        return <CollarAccessory colors={colors} sparkleOpacity={sparkleOpacity} />;
      case 'cape':
        return <CapeAccessory colors={colors} animationPhase={animationPhase} />;
      default:
        return null;
    }
  };

  return (
    <g transform={`translate(${petPosition.x + position.x}, ${petPosition.y + position.y}) rotate(${wobble}) scale(${scale})`}>
      <defs>
        <filter id="accessoryGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="metalShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="50%" stopColor="white" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0.6" />
        </linearGradient>

        <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.glow || colors.primary} stopOpacity="1" />
          <stop offset="50%" stopColor={colors.primary} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.secondary || colors.primary} stopOpacity="1" />
        </linearGradient>
      </defs>

      {renderAccessory()}
    </g>
  );
};

// Accessory type components
interface AccessoryProps {
  colors: { primary: string; secondary?: string; accent?: string; glow?: string };
  sparkleOpacity?: number;
  animationPhase?: number;
}

const CrownAccessory: React.FC<AccessoryProps> = ({ colors, sparkleOpacity = 0.6 }) => (
  <g transform="translate(0, -10)">
    {/* Crown base */}
    <path
      d="M -18 5 L -18 0 L -12 -8 L -6 2 L 0 -12 L 6 2 L 12 -8 L 18 0 L 18 5 Z"
      fill={colors.primary}
      stroke={colors.secondary || colors.primary}
      strokeWidth="1"
    />

    {/* Metallic shine */}
    <path
      d="M -15 3 L -10 -5 L -5 2 L 0 -9 L 5 2 L 10 -5 L 15 3"
      fill="none"
      stroke="url(#metalShine)"
      strokeWidth="2"
      opacity="0.6"
    />

    {/* Crown band */}
    <rect x="-18" y="2" width="36" height="4" fill={colors.secondary || colors.primary} rx="1" />

    {/* Center gem */}
    <ellipse cx="0" cy="-7" rx="3" ry="4" fill="url(#gemGradient)" filter="url(#accessoryGlow)" />
    <ellipse cx="0" cy="-8" rx="1" ry="1.5" fill="white" opacity={sparkleOpacity} />

    {/* Side gems */}
    <circle cx="-10" cy="-3" r="2" fill={colors.accent || colors.glow || colors.primary} filter="url(#accessoryGlow)" />
    <circle cx="10" cy="-3" r="2" fill={colors.accent || colors.glow || colors.primary} filter="url(#accessoryGlow)" />

    {/* Sparkles */}
    <circle cx="-6" cy="-4" r="1" fill="white" opacity={sparkleOpacity} />
    <circle cx="6" cy="-4" r="1" fill="white" opacity={sparkleOpacity * 0.8} />
  </g>
);

const ScarfAccessory: React.FC<AccessoryProps> = ({ colors, animationPhase = 0 }) => {
  const flutter = Math.sin(animationPhase / 400) * 5;

  return (
    <g transform="translate(0, 25)">
      {/* Scarf wrap around neck */}
      <ellipse cx="0" cy="0" rx="22" ry="8" fill={colors.primary} />
      <ellipse cx="0" cy="-2" rx="18" ry="5" fill={colors.secondary || colors.primary} opacity="0.6" />

      {/* Scarf knot */}
      <ellipse cx="8" cy="5" rx="6" ry="4" fill={colors.primary} />
      <ellipse cx="8" cy="4" rx="4" ry="2.5" fill={colors.secondary || colors.primary} opacity="0.5" />

      {/* Hanging end 1 */}
      <path
        d={`M 5 8 Q ${8 + flutter} 25 ${3 + flutter} 45 L ${8 + flutter} 45 Q ${12 + flutter * 0.5} 25 10 8`}
        fill={colors.primary}
      />
      <path
        d={`M 6 10 Q ${8 + flutter * 0.8} 24 ${5 + flutter * 0.8} 40`}
        fill="none"
        stroke={colors.secondary || colors.primary}
        strokeWidth="2"
        opacity="0.4"
      />

      {/* Hanging end 2 */}
      <path
        d={`M 10 8 Q ${15 + flutter * 0.7} 20 ${12 + flutter * 0.7} 35 L ${17 + flutter * 0.7} 35 Q ${18 + flutter * 0.4} 20 13 8`}
        fill={colors.primary}
      />

      {/* Fringe detail */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={4 + i * 2 + flutter * 0.5}
          y1="43"
          x2={4 + i * 2 + flutter}
          y2="48"
          stroke={colors.primary}
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
};

const GlassesAccessory: React.FC<AccessoryProps> = ({ colors }) => (
  <g transform="translate(0, -60)">
    {/* Left lens */}
    <ellipse cx="-10" cy="0" rx="8" ry="7" fill={colors.glow || colors.primary} opacity="0.3" />
    <ellipse cx="-10" cy="0" rx="8" ry="7" fill="none" stroke={colors.primary} strokeWidth="2" />

    {/* Right lens */}
    <ellipse cx="10" cy="0" rx="8" ry="7" fill={colors.glow || colors.primary} opacity="0.3" />
    <ellipse cx="10" cy="0" rx="8" ry="7" fill="none" stroke={colors.primary} strokeWidth="2" />

    {/* Bridge */}
    <path d="M -2 0 Q 0 -3 2 0" fill="none" stroke={colors.primary} strokeWidth="2" />

    {/* Temple arms */}
    <line x1="-18" y1="0" x2="-25" y2="2" stroke={colors.primary} strokeWidth="2" />
    <line x1="18" y1="0" x2="25" y2="2" stroke={colors.primary} strokeWidth="2" />

    {/* Lens shine */}
    <ellipse cx="-13" cy="-3" rx="2" ry="1.5" fill="white" opacity="0.4" />
    <ellipse cx="7" cy="-3" rx="2" ry="1.5" fill="white" opacity="0.4" />
  </g>
);

const PendantAccessory: React.FC<AccessoryProps> = ({ colors, sparkleOpacity = 0.6, animationPhase = 0 }) => {
  const swing = Math.sin(animationPhase / 500) * 3;

  return (
    <g transform={`translate(0, 20) rotate(${swing})`}>
      {/* Chain */}
      <path
        d="M -15 -20 Q -10 -10 0 -5 Q 10 -10 15 -20"
        fill="none"
        stroke={colors.secondary || colors.primary}
        strokeWidth="1.5"
      />

      {/* Chain links detail */}
      {[-12, -6, 0, 6, 12].map((x, i) => (
        <circle key={i} cx={x} cy={-18 + Math.abs(x) * 0.3} r="1" fill={colors.secondary || colors.primary} />
      ))}

      {/* Pendant setting */}
      <circle cx="0" cy="0" r="10" fill={colors.primary} />
      <circle cx="0" cy="0" r="8" fill={colors.secondary || colors.primary} />

      {/* Gem */}
      <circle cx="0" cy="0" r="6" fill="url(#gemGradient)" filter="url(#accessoryGlow)" />

      {/* Gem facets */}
      <path d="M 0 -4 L 4 0 L 0 4 L -4 0 Z" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
      <line x1="0" y1="-6" x2="0" y2="6" stroke="white" strokeWidth="0.3" opacity="0.4" />
      <line x1="-6" y1="0" x2="6" y2="0" stroke="white" strokeWidth="0.3" opacity="0.4" />

      {/* Sparkle */}
      <circle cx="-2" cy="-2" r="1.5" fill="white" opacity={sparkleOpacity} />

      {/* Decorative dots */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <circle
          key={angle}
          cx={Math.cos((angle * Math.PI) / 180) * 9}
          cy={Math.sin((angle * Math.PI) / 180) * 9}
          r="1"
          fill={colors.accent || colors.glow || colors.primary}
        />
      ))}
    </g>
  );
};

const BowAccessory: React.FC<AccessoryProps> = ({ colors }) => (
  <g transform="translate(0, -5)">
    {/* Left loop */}
    <ellipse cx="-12" cy="0" rx="10" ry="8" fill={colors.primary} />
    <ellipse cx="-14" cy="-2" rx="5" ry="4" fill={colors.secondary || colors.primary} opacity="0.4" />

    {/* Right loop */}
    <ellipse cx="12" cy="0" rx="10" ry="8" fill={colors.primary} />
    <ellipse cx="10" cy="-2" rx="5" ry="4" fill={colors.secondary || colors.primary} opacity="0.4" />

    {/* Center knot */}
    <ellipse cx="0" cy="0" rx="5" ry="6" fill={colors.secondary || colors.primary} />
    <ellipse cx="0" cy="-1" rx="3" ry="3" fill={colors.primary} />

    {/* Ribbon tails */}
    <path d="M -3 5 Q -5 15 -8 20 L -4 20 Q -2 15 0 6" fill={colors.primary} />
    <path d="M 3 5 Q 5 15 8 20 L 4 20 Q 2 15 0 6" fill={colors.primary} />

    {/* Highlights */}
    <ellipse cx="-15" cy="-3" rx="2" ry="1.5" fill="white" opacity="0.3" />
    <ellipse cx="9" cy="-3" rx="2" ry="1.5" fill="white" opacity="0.3" />
  </g>
);

const HaloAccessory: React.FC<AccessoryProps> = ({ colors, animationPhase = 0, sparkleOpacity = 0.6 }) => {
  const rotation = (animationPhase / 100) % 360;
  const floatY = Math.sin(animationPhase / 600) * 2;

  return (
    <g transform={`translate(0, ${-20 + floatY})`}>
      {/* Main halo ring */}
      <ellipse
        cx="0"
        cy="0"
        rx="25"
        ry="8"
        fill="none"
        stroke={colors.primary}
        strokeWidth="4"
        filter="url(#accessoryGlow)"
      />

      {/* Inner glow */}
      <ellipse
        cx="0"
        cy="0"
        rx="25"
        ry="8"
        fill="none"
        stroke={colors.glow || colors.primary}
        strokeWidth="8"
        opacity="0.3"
        filter="url(#accessoryGlow)"
      />

      {/* Rotating sparkles */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = ((angle + rotation) * Math.PI) / 180;
        const x = Math.cos(rad) * 25;
        const y = Math.sin(rad) * 8;
        return (
          <g key={angle}>
            <circle
              cx={x}
              cy={y}
              r="2"
              fill={colors.glow || 'white'}
              opacity={sparkleOpacity}
              filter="url(#accessoryGlow)"
            />
          </g>
        );
      })}

      {/* Center divine light */}
      <ellipse cx="0" cy="0" rx="20" ry="5" fill={colors.glow || colors.primary} opacity="0.15" />
    </g>
  );
};

const CollarAccessory: React.FC<AccessoryProps> = ({ colors, sparkleOpacity = 0.6 }) => (
  <g transform="translate(0, 30)">
    {/* Collar band */}
    <ellipse cx="0" cy="0" rx="22" ry="6" fill={colors.primary} />
    <ellipse cx="0" cy="-1" rx="19" ry="4" fill={colors.secondary || colors.primary} opacity="0.5" />

    {/* Collar edge detail */}
    <ellipse cx="0" cy="0" rx="22" ry="6" fill="none" stroke={colors.secondary || colors.primary} strokeWidth="1" />

    {/* Studs/decorations */}
    {[-15, -8, 0, 8, 15].map((x) => (
      <g key={x}>
        <circle cx={x} cy="0" r="2.5" fill={colors.accent || colors.glow || colors.primary} />
        <circle cx={x} cy="-0.5" r="1" fill="white" opacity={sparkleOpacity * 0.7} />
      </g>
    ))}

    {/* Center tag */}
    <ellipse cx="0" cy="8" rx="6" ry="5" fill={colors.secondary || colors.primary} />
    <ellipse cx="0" cy="7" rx="4" ry="3.5" fill={colors.glow || colors.primary} filter="url(#accessoryGlow)" />
    <circle cx="0" cy="7" r="1.5" fill="white" opacity={sparkleOpacity} />

    {/* Tag ring */}
    <circle cx="0" cy="3" r="2" fill={colors.primary} stroke={colors.secondary || colors.primary} strokeWidth="1" />
  </g>
);

const CapeAccessory: React.FC<AccessoryProps> = ({ colors, animationPhase = 0 }) => {
  const flutter1 = Math.sin(animationPhase / 400) * 5;
  const flutter2 = Math.sin(animationPhase / 350 + 1) * 4;

  return (
    <g transform="translate(0, -5)">
      {/* Cape clasp */}
      <ellipse cx="0" cy="-25" rx="18" ry="5" fill={colors.secondary || colors.primary} />
      <circle cx="-12" cy="-25" r="3" fill={colors.accent || colors.glow || colors.primary} />
      <circle cx="12" cy="-25" r="3" fill={colors.accent || colors.glow || colors.primary} />

      {/* Cape body */}
      <path
        d={`M -18 -22
           Q -25 0 ${-20 + flutter1} 40
           Q -10 45 0 40
           Q 10 45 ${20 + flutter2} 40
           Q 25 0 18 -22`}
        fill={colors.primary}
      />

      {/* Cape lining */}
      <path
        d={`M -15 -20
           Q -20 0 ${-17 + flutter1 * 0.8} 35
           Q -8 38 0 35
           Q 8 38 ${17 + flutter2 * 0.8} 35
           Q 20 0 15 -20`}
        fill={colors.secondary || colors.primary}
        opacity="0.5"
      />

      {/* Cape edge detail */}
      <path
        d={`M ${-20 + flutter1} 40 Q -10 45 0 40 Q 10 45 ${20 + flutter2} 40`}
        fill="none"
        stroke={colors.accent || colors.secondary || colors.primary}
        strokeWidth="2"
      />

      {/* Decorative emblem */}
      <circle cx="0" cy="5" r="8" fill={colors.accent || colors.glow || colors.primary} opacity="0.3" />
      <polygon points="0,-5 3,2 -3,2" fill={colors.glow || colors.primary} opacity="0.5" />
    </g>
  );
};

/**
 * Create a Wearable Accessory addon definition
 */
export function createWearableAccessory(type: AccessoryType = 'crown'): Omit<Addon, 'ownership'> {
  const accessoryConfigs: Record<AccessoryType, {
    colors: { primary: string; secondary: string; accent: string; glow: string };
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    description: string;
    name: string;
    anchorPoint: 'head' | 'body' | 'back';
    offset: { x: number; y: number };
  }> = {
    crown: {
      colors: { primary: '#fcd34d', secondary: '#fbbf24', accent: '#fef3c7', glow: '#f59e0b' },
      rarity: 'legendary',
      description: 'A majestic golden crown befitting royalty, adorned with precious gems.',
      name: 'Royal Crown',
      anchorPoint: 'head',
      offset: { x: 0, y: -10 },
    },
    scarf: {
      colors: { primary: '#f87171', secondary: '#fca5a5', accent: '#fee2e2', glow: '#ef4444' },
      rarity: 'common',
      description: 'A cozy knitted scarf that keeps your pet warm and stylish.',
      name: 'Cozy Scarf',
      anchorPoint: 'body',
      offset: { x: 0, y: 0 },
    },
    glasses: {
      colors: { primary: '#1e293b', secondary: '#334155', accent: '#475569', glow: '#94a3b8' },
      rarity: 'uncommon',
      description: 'Stylish spectacles that give your pet an intellectual appearance.',
      name: 'Scholar Glasses',
      anchorPoint: 'head',
      offset: { x: 0, y: 5 },
    },
    pendant: {
      colors: { primary: '#c084fc', secondary: '#a855f7', accent: '#e9d5ff', glow: '#9333ea' },
      rarity: 'rare',
      description: 'A mystical pendant containing ancient power, hung on a delicate chain.',
      name: 'Mystic Pendant',
      anchorPoint: 'body',
      offset: { x: 0, y: -5 },
    },
    bow: {
      colors: { primary: '#fb7185', secondary: '#fda4af', accent: '#fecdd3', glow: '#f43f5e' },
      rarity: 'common',
      description: 'An adorable bow that adds a touch of charm to any pet.',
      name: 'Pretty Bow',
      anchorPoint: 'head',
      offset: { x: 0, y: 0 },
    },
    halo: {
      colors: { primary: '#fef08a', secondary: '#fde047', accent: '#fef9c3', glow: '#facc15' },
      rarity: 'mythic',
      description: 'A divine halo that marks your pet as truly blessed.',
      name: 'Divine Halo',
      anchorPoint: 'head',
      offset: { x: 0, y: -25 },
    },
    collar: {
      colors: { primary: '#60a5fa', secondary: '#3b82f6', accent: '#93c5fd', glow: '#2563eb' },
      rarity: 'uncommon',
      description: 'A decorative collar with sparkling studs and a heart-shaped tag.',
      name: 'Starlight Collar',
      anchorPoint: 'body',
      offset: { x: 0, y: 5 },
    },
    cape: {
      colors: { primary: '#6366f1', secondary: '#818cf8', accent: '#a5b4fc', glow: '#4f46e5' },
      rarity: 'epic',
      description: 'A flowing cape that billows dramatically in the wind.',
      name: 'Hero Cape',
      anchorPoint: 'back',
      offset: { x: 0, y: 0 },
    },
  };

  const config = accessoryConfigs[type];

  return {
    id: `wearable-accessory-${type}`,
    name: config.name,
    description: config.description,
    category: 'accessory',
    rarity: config.rarity,
    attachment: {
      anchorPoint: config.anchorPoint,
      offset: config.offset,
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      colors: config.colors,
      animation: {
        type: type === 'halo' ? 'glow' : type === 'cape' || type === 'scarf' ? 'float' : 'shimmer',
        duration: 2000,
      },
    },
    modifiers: {
      bond: type === 'crown' ? 5 : type === 'pendant' ? 3 : type === 'halo' ? 10 : 1,
      energy: type === 'cape' ? 3 : type === 'scarf' ? 2 : 0,
      luck: type === 'halo' ? 5 : type === 'pendant' ? 3 : type === 'crown' ? 2 : 0,
      curiosity: type === 'glasses' ? 5 : 0,
    },
    metadata: {
      creator: 'MetaPet Studio',
      createdAt: Date.now(),
      tags: ['accessory', 'wearable', type],
    },
  };
}

export default WearableAccessory;
