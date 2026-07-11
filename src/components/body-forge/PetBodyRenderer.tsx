'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type BodyShape = 'round' | 'bean' | 'cubic' | 'crystal' | 'toroid';
export type BodyPattern = 'solid' | 'gradient' | 'striped' | 'spotted';
export type FaceExpression = 'neutral' | 'smile' | 'frown' | 'focused' | 'sleepy';
export type BodyFeature = 'wings' | 'horns' | 'crown' | 'thirdEye' | 'tailFlame';

export interface BodySpec {
  name: string;
  shape: BodyShape;
  pattern: BodyPattern;
  expression: FaceExpression;
  primaryColor: string;
  secondaryColor: string;
  highlightColor: string;
  bodyWidth: number;
  bodyHeight: number;
  bodyScale: number;
  cornerRoundness: number;
  eyeSize: number;
  eyeSpacing: number;
  eyeHeight: number;
  pupilSize: number;
  gazeX: number;
  gazeY: number;
  mouthWidth: number;
  mouthHeight: number;
  wingSpread: number;
  hornLength: number;
  outlineWidth: number;
  glow: number;
  tilt: number;
  bob: number;
  breathe: number;
  animationSpeed: number;
  features: BodyFeature[];
}

export const DEFAULT_BODY_SPEC: BodySpec = {
  name: 'Auralia Body 01',
  shape: 'bean',
  pattern: 'gradient',
  expression: 'smile',
  primaryColor: '#1677ff',
  secondaryColor: '#070b18',
  highlightColor: '#f5c451',
  bodyWidth: 104,
  bodyHeight: 112,
  bodyScale: 1,
  cornerRoundness: 28,
  eyeSize: 12,
  eyeSpacing: 40,
  eyeHeight: 104,
  pupilSize: 5,
  gazeX: 0,
  gazeY: 0,
  mouthWidth: 30,
  mouthHeight: 11,
  wingSpread: 0.78,
  hornLength: 28,
  outlineWidth: 4,
  glow: 0.45,
  tilt: 0,
  bob: 7,
  breathe: 0.035,
  animationSpeed: 1,
  features: ['wings', 'thirdEye', 'tailFlame'],
};

function mouthPath(spec: BodySpec) {
  const x1 = 140 - spec.mouthWidth / 2;
  const x2 = 140 + spec.mouthWidth / 2;
  const y = 132;
  if (spec.expression === 'smile') return `M ${x1} ${y} Q 140 ${y + spec.mouthHeight} ${x2} ${y}`;
  if (spec.expression === 'frown') return `M ${x1} ${y + spec.mouthHeight} Q 140 ${y} ${x2} ${y + spec.mouthHeight}`;
  if (spec.expression === 'focused') return `M ${x1} ${y + 3} L ${x2} ${y + 3}`;
  if (spec.expression === 'sleepy') return `M ${x1 + 6} ${y} Q 140 ${y + 4} ${x2 - 6} ${y}`;
  return `M ${x1 + 3} ${y + 2} L ${x2 - 3} ${y + 2}`;
}

function BodySilhouette({ spec, fill }: { spec: BodySpec; fill: string }) {
  const x = 140 - spec.bodyWidth / 2;
  const y = 112 - spec.bodyHeight / 2;
  const common = { fill, stroke: spec.secondaryColor, strokeWidth: spec.outlineWidth };
  if (spec.shape === 'cubic') {
    return <rect x={x} y={y} width={spec.bodyWidth} height={spec.bodyHeight} rx={spec.cornerRoundness} {...common} />;
  }
  if (spec.shape === 'crystal') {
    return <path d={`M 140 ${y} L ${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.34} L ${x + spec.bodyWidth * 0.76} ${y + spec.bodyHeight} L ${x + spec.bodyWidth * 0.24} ${y + spec.bodyHeight} L ${x} ${y + spec.bodyHeight * 0.34} Z`} {...common} />;
  }
  if (spec.shape === 'toroid') {
    return <g><ellipse cx="140" cy="112" rx={spec.bodyWidth / 2} ry={spec.bodyHeight / 2} {...common} /><ellipse cx="140" cy="112" rx={spec.bodyWidth * 0.19} ry={spec.bodyHeight * 0.19} fill="#050814" stroke={spec.secondaryColor} strokeWidth={spec.outlineWidth} /></g>;
  }
  if (spec.shape === 'bean') {
    return <path d={`M ${x + spec.bodyWidth * 0.52} ${y} C ${x + spec.bodyWidth * 0.92} ${y + 2}, ${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.36}, ${x + spec.bodyWidth * 0.86} ${y + spec.bodyHeight * 0.62} C ${x + spec.bodyWidth * 0.73} ${y + spec.bodyHeight * 0.96}, ${x + spec.bodyWidth * 0.24} ${y + spec.bodyHeight * 1.05}, ${x + spec.bodyWidth * 0.08} ${y + spec.bodyHeight * 0.68} C ${x - 6} ${y + spec.bodyHeight * 0.36}, ${x + spec.bodyWidth * 0.13} ${y - 4}, ${x + spec.bodyWidth * 0.52} ${y} Z`} {...common} />;
  }
  return <ellipse cx="140" cy="112" rx={spec.bodyWidth / 2} ry={spec.bodyHeight / 2} {...common} />;
}

export function PetBodyRenderer({ spec, className = '', animate = true }: { spec: BodySpec; className?: string; animate?: boolean }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const reducedMotion = useReducedMotion();
  const moving = animate && !reducedMotion;
  const patternId = `body-pattern-${rawId}`;
  const glowId = `body-glow-${rawId}`;
  const fill = spec.pattern === 'solid' ? spec.primaryColor : `url(#${patternId})`;
  const leftEye = 140 - spec.eyeSpacing / 2;
  const rightEye = 140 + spec.eyeSpacing / 2;
  const eyeHeight = spec.expression === 'sleepy' ? Math.max(2.4, spec.eyeSize * 0.22) : spec.eyeSize;

  return (
    <motion.svg viewBox="0 0 280 250" className={className} role="img" aria-label={`${spec.name}, ${spec.shape} body`}>
      <defs>
        {spec.pattern === 'gradient' && <linearGradient id={patternId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor={spec.highlightColor} />
          <stop offset="42%" stopColor={spec.primaryColor} />
          <stop offset="100%" stopColor={spec.secondaryColor} />
        </linearGradient>}
        {spec.pattern === 'striped' && <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><rect width="16" height="16" fill={spec.primaryColor} /><rect width="6" height="16" fill={spec.highlightColor} opacity=".8" /></pattern>}
        {spec.pattern === 'spotted' && <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill={spec.primaryColor} /><circle cx="7" cy="8" r="4" fill={spec.highlightColor} /><circle cx="19" cy="18" r="3" fill={spec.secondaryColor} /></pattern>}
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={2 + spec.glow * 10} result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      <motion.ellipse cx="140" cy="120" rx={72 + spec.glow * 28} ry={69 + spec.glow * 25} fill={spec.primaryColor} opacity={0.06 + spec.glow * 0.13} animate={moving ? { scale: [0.96, 1.05, 0.96], opacity: [0.05, 0.18, 0.05] } : undefined} transition={{ duration: 3 / spec.animationSpeed, repeat: Infinity }} />

      <motion.g
        style={{ transformOrigin: '140px 112px' }}
        animate={moving ? { y: [0, -spec.bob, 0], rotate: [spec.tilt - 1, spec.tilt + 1, spec.tilt - 1], scaleX: [spec.bodyScale, spec.bodyScale * (1 + spec.breathe), spec.bodyScale], scaleY: [spec.bodyScale, spec.bodyScale * (1 - spec.breathe * 0.45), spec.bodyScale] } : { rotate: spec.tilt, scale: spec.bodyScale }}
        transition={{ duration: 2.8 / spec.animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        filter={spec.glow > 0 ? `url(#${glowId})` : undefined}
      >
        {spec.features.includes('wings') && <g fill={spec.primaryColor} stroke={spec.secondaryColor} strokeWidth={spec.outlineWidth} opacity=".9"><ellipse cx={140 - spec.bodyWidth * 0.58} cy="115" rx={36 * spec.wingSpread} ry={18 * spec.wingSpread} transform="rotate(-16 80 115)" /><ellipse cx={140 + spec.bodyWidth * 0.58} cy="115" rx={36 * spec.wingSpread} ry={18 * spec.wingSpread} transform="rotate(16 200 115)" /></g>}
        {spec.features.includes('tailFlame') && <motion.path d="M 140 161 C 116 190 133 218 140 226 C 147 218 164 190 140 161 Z" fill={spec.highlightColor} stroke={spec.secondaryColor} strokeWidth={spec.outlineWidth} animate={moving ? { scaleY: [0.82, 1.14, 0.82] } : undefined} transition={{ duration: 0.9 / spec.animationSpeed, repeat: Infinity }} />}
        <BodySilhouette spec={spec} fill={fill} />
        {spec.features.includes('horns') && <g fill="none" stroke={spec.highlightColor} strokeWidth={spec.outlineWidth} strokeLinecap="round"><path d={`M 110 76 Q 93 ${70 - spec.hornLength * 0.45} 101 ${70 - spec.hornLength}`} /><path d={`M 170 76 Q 187 ${70 - spec.hornLength * 0.45} 179 ${70 - spec.hornLength}`} /></g>}
        {spec.features.includes('crown') && <path d="M 105 70 L 113 46 L 126 66 L 140 38 L 154 66 L 167 46 L 175 70" fill="none" stroke={spec.highlightColor} strokeWidth={spec.outlineWidth} strokeLinejoin="round" />}
        <g>
          <ellipse cx={leftEye} cy={spec.eyeHeight} rx={spec.eyeSize} ry={eyeHeight} fill="#fffdf4" stroke={spec.secondaryColor} strokeWidth={Math.max(1.5, spec.outlineWidth * 0.55)} />
          <ellipse cx={rightEye} cy={spec.eyeHeight} rx={spec.eyeSize} ry={eyeHeight} fill="#fffdf4" stroke={spec.secondaryColor} strokeWidth={Math.max(1.5, spec.outlineWidth * 0.55)} />
          <circle cx={leftEye + spec.gazeX} cy={spec.eyeHeight + spec.gazeY} r={spec.pupilSize} fill={spec.secondaryColor} />
          <circle cx={rightEye + spec.gazeX} cy={spec.eyeHeight + spec.gazeY} r={spec.pupilSize} fill={spec.secondaryColor} />
        </g>
        {spec.features.includes('thirdEye') && <g><ellipse cx="140" cy="76" rx={11} ry={7} fill={spec.highlightColor} stroke={spec.secondaryColor} strokeWidth={spec.outlineWidth * 0.7} /><circle cx="140" cy="76" r="3.2" fill={spec.secondaryColor} /></g>}
        <motion.path d={mouthPath(spec)} fill="none" stroke={spec.secondaryColor} strokeWidth={spec.outlineWidth * 0.75} strokeLinecap="round" transition={{ duration: 0.25 }} />
      </motion.g>
    </motion.svg>
  );
}
