'use client';

import { memo } from 'react';

import { useStore } from '@/lib/store';
import { EVOLUTION_VISUALS } from '@/lib/evolution';
import { motion } from 'framer-motion';

export const PetSprite = memo(function PetSprite({ staticMode = false }: { staticMode?: boolean }) {
  const traits = useStore(s => s.traits);
  const vitals = useStore(s => s.vitals);
  const evolution = useStore(s => s.evolution);

  if (!traits) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-6xl animate-pulse">🧬</div>
      </div>
    );
  }

  const { physical } = traits;

  // Determine animation state based on vitals
  const isHappy = vitals.mood > 70;
  const isTired = vitals.energy < 30;
  const isHungry = vitals.hunger > 70;

  // Map body types to SVG shapes
  const getBodyShape = () => {
    const size = physical.size * 80; // Scale to pixel size
    const baseProps = {
      fill: physical.primaryColor,
      stroke: physical.secondaryColor,
      strokeWidth: 3,
    };

    switch (physical.bodyType) {
      case 'Spherical':
        return <circle cx="100" cy="100" r={size} {...baseProps} />;
      case 'Cubic':
        return (
          <rect
            x={100 - size}
            y={100 - size}
            width={size * 2}
            height={size * 2}
            {...baseProps}
          />
        );
      case 'Pyramidal':
        return (
          <polygon
            points={`100,${100 - size} ${100 - size},${100 + size} ${100 + size},${100 + size}`}
            {...baseProps}
          />
        );
      case 'Cylindrical':
        return (
          <ellipse
            cx="100"
            cy="100"
            rx={size * 0.6}
            ry={size * 1.2}
            {...baseProps}
          />
        );
      case 'Toroidal':
        return (
          <g>
            <circle cx="100" cy="100" r={size} {...baseProps} />
            <circle cx="100" cy="100" r={size * 0.5} fill="none" stroke={baseProps.stroke} strokeWidth={baseProps.strokeWidth} />
          </g>
        );
      case 'Crystalline':
        return (
          <polygon
            points={`100,${100 - size} ${100 + size * 0.7},${100 - size * 0.3} ${100 + size * 0.5},${100 + size * 0.5} ${100 - size * 0.5},${100 + size * 0.5} ${100 - size * 0.7},${100 - size * 0.3}`}
            {...baseProps}
          />
        );
      default:
        return <circle cx="100" cy="100" r={size} {...baseProps} />;
    }
  };

  // Apply texture/pattern effects
  const getPatternDefs = () => {
    const patternId = 'petPattern';
    switch (physical.pattern) {
      case 'Striped':
        return (
          <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="20" stroke={physical.secondaryColor} strokeWidth="8" />
          </pattern>
        );
      case 'Spotted':
        return (
          <pattern id={patternId} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="5" fill={physical.secondaryColor} opacity="0.6" />
          </pattern>
        );
      case 'Gradient':
        return (
          <linearGradient id={patternId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={physical.primaryColor} />
            <stop offset="100%" stopColor={physical.secondaryColor} />
          </linearGradient>
        );
      default:
        return null;
    }
  };

  // Add glow effect for glowing texture
  const getGlowFilter = () => {
    if (physical.texture === 'Glowing') {
      return (
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      );
    }
    return null;
  };

  const visuals = EVOLUTION_VISUALS[evolution.state];

  return (
    <motion.div
      className="w-full h-full flex items-center justify-center relative"
      animate={
        staticMode
          ? { scale: 1, y: 0 }
          : {
              scale: isHappy ? [1, 1.05, 1] : isTired ? 0.95 : 1,
              y: isHungry ? [0, -5, 0] : 0,
            }
      }
      transition={
        staticMode
          ? { duration: 0 }
          : {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }
      }
    >
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `radial-gradient(circle at center, ${visuals.colors[0]}33, transparent 70%)`,
          filter: `blur(${(visuals.glowIntensity ?? 0.5) * 20}px)`
        }}
        animate={
          staticMode
            ? { opacity: 0.6, scale: 1 }
            : {
                opacity: [0.4, 0.8, 0.4],
                scale: [0.95, 1.05, 0.95],
              }
        }
        transition={
          staticMode
            ? { duration: 0 }
            : {
                duration: 6 - (visuals.glowIntensity ?? 0.5) * 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }
        }
      />

      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          {getPatternDefs()}
          {getGlowFilter()}
        </defs>

        {/* Main body */}
        <g filter={physical.texture === 'Glowing' ? 'url(#glow)' : undefined}>
          {getBodyShape()}
        </g>

        {/* Eyes (position based on body type) */}
        <g>
          <circle cx="85" cy="90" r="8" fill="white" />
          <circle cx="115" cy="90" r="8" fill="white" />
          <circle cx="87" cy="92" r="4" fill="black" />
          <circle cx="117" cy="92" r="4" fill="black" />
        </g>

        {/* Features */}
        {physical.features.includes('Horns') && (
          <g>
            <path
              d="M 70 70 Q 60 50 65 40"
              stroke={physical.secondaryColor}
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M 130 70 Q 140 50 135 40"
              stroke={physical.secondaryColor}
              strokeWidth="4"
              fill="none"
            />
          </g>
        )}

        {physical.features.includes('Wings') && (
          <g>
            <ellipse
              cx="60"
              cy="100"
              rx="25"
              ry="15"
              fill={physical.primaryColor}
              opacity="0.6"
            />
            <ellipse
              cx="140"
              cy="100"
              rx="25"
              ry="15"
              fill={physical.primaryColor}
              opacity="0.6"
            />
          </g>
        )}

        {physical.features.includes('Tail Flame') && (
          <motion.g
            animate={staticMode ? { opacity: 0.9 } : { opacity: [0.7, 1, 0.7] }}
            transition={
              staticMode
                ? { duration: 0 }
                : {
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                  }
            }
          >
            <circle cx="100" cy="160" r="10" fill="#FF6B00" />
            <circle cx="100" cy="155" r="8" fill="#FFD700" />
          </motion.g>
        )}

        {physical.features.includes('Aura') && (
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={visuals.colors[1] || physical.primaryColor}
            strokeWidth="2"
            opacity="0.3"
            animate={
              staticMode
                ? { r: 90, opacity: 0.3 }
                : {
                    r: [85, 95, 85],
                    opacity: [0.2, 0.5, 0.2],
                  }
            }
            transition={
              staticMode
                ? { duration: 0 }
                : {
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                  }
            }
          />
        )}

        {physical.features.includes('Third Eye') && (
          <g>
            <circle cx="100" cy="75" r="6" fill={physical.secondaryColor} />
            <circle cx="100" cy="75" r="3" fill="white" />
          </g>
        )}

        {physical.features.includes('Crown') && (
          <g>
            <path
              d="M 80 65 L 85 50 L 90 65 L 95 50 L 100 65 L 105 50 L 110 65 L 115 50 L 120 65"
              stroke={physical.secondaryColor}
              strokeWidth="3"
              fill="none"
            />
          </g>
        )}
      </svg>

      {/* Mood indicator */}
      <div className="absolute bottom-2 right-2">
        {isHappy ? '😊' : isTired ? '😴' : isHungry ? '🍽️' : '😐'}
      </div>
    </motion.div>
  );
});
