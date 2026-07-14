'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type BodyShape = 'round' | 'orb' | 'bean' | 'cubic' | 'block' | 'crystal' | 'toroid' | 'droplet' | 'bell' | 'seed' | 'manta' | 'lantern' | 'crown' | 'hourglass' | 'wisp';
export type BodyPattern = 'solid' | 'gradient' | 'striped' | 'spotted' | 'stripes' | 'spots' | 'velvet' | 'pearl' | 'glass' | 'chrome' | 'scales' | 'moss' | 'stone' | 'ink';
export type FaceExpression = 'neutral' | 'smile' | 'frown' | 'focused' | 'sleepy';
export type BodyFeature = 'wings' | 'horns' | 'crown' | 'thirdEye' | 'tailFlame';
export type GenderFrame = 'male' | 'neutral' | 'female';
export type WingStyle = 'feather' | 'moth' | 'blade' | 'veil';
export type WingPurpose = 'flight' | 'attack' | 'attract' | 'defend' | 'decorative';

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
  genderFrame: GenderFrame;
  shoulders: number;
  waist: number;
  hips: number;
  textureScale: number;
  textureDepth: number;
  textureRoughness: number;
  eyeSize: number;
  eyeSpacing: number;
  eyeHeight: number;
  pupilSize: number;
  gazeX: number;
  gazeY: number;
  mouthWidth: number;
  mouthHeight: number;
  wingSpread: number;
  wingStyle: WingStyle;
  wingPurpose: WingPurpose;
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
  genderFrame: 'neutral',
  shoulders: 50,
  waist: 50,
  hips: 50,
  textureScale: 48,
  textureDepth: 58,
  textureRoughness: 22,
  eyeSize: 12,
  eyeSpacing: 40,
  eyeHeight: 104,
  pupilSize: 5,
  gazeX: 0,
  gazeY: 0,
  mouthWidth: 30,
  mouthHeight: 11,
  wingSpread: 0.78,
  wingStyle: 'feather',
  wingPurpose: 'flight',
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
  const shoulder = spec.bodyWidth * (0.37 + spec.shoulders / 420);
  const mid = spec.bodyWidth * (0.26 + spec.waist / 520);
  const hip = spec.bodyWidth * (0.36 + spec.hips / 390);
  const common = { fill, stroke: spec.secondaryColor, strokeWidth: spec.outlineWidth };
  if (spec.shape === 'cubic' || spec.shape === 'block') {
    return <rect x={x} y={y} width={spec.bodyWidth} height={spec.bodyHeight} rx={spec.cornerRoundness} {...common} />;
  }
  if (spec.shape === 'crystal') {
    return <path d={`M 140 ${y} L ${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.34} L ${x + spec.bodyWidth * 0.76} ${y + spec.bodyHeight} L ${x + spec.bodyWidth * 0.24} ${y + spec.bodyHeight} L ${x} ${y + spec.bodyHeight * 0.34} Z`} {...common} />;
  }
  if (spec.shape === 'toroid') {
    return <g><ellipse cx="140" cy="112" rx={spec.bodyWidth / 2} ry={spec.bodyHeight / 2} {...common} /><ellipse cx="140" cy="112" rx={spec.bodyWidth * 0.19} ry={spec.bodyHeight * 0.19} fill="#050814" stroke={spec.secondaryColor} strokeWidth={spec.outlineWidth} /></g>;
  }
  if (spec.shape === 'bean') {
    return <path d={`M 140 ${y} C ${140 + shoulder} ${y + spec.bodyHeight * 0.05}, ${140 + shoulder} ${y + spec.bodyHeight * 0.24}, ${140 + mid} ${y + spec.bodyHeight * 0.47} C ${140 + hip} ${y + spec.bodyHeight * 0.68}, ${140 + hip} ${y + spec.bodyHeight * 0.91}, 140 ${y + spec.bodyHeight} C ${140 - hip} ${y + spec.bodyHeight * 0.91}, ${140 - hip} ${y + spec.bodyHeight * 0.68}, ${140 - mid} ${y + spec.bodyHeight * 0.47} C ${140 - shoulder} ${y + spec.bodyHeight * 0.24}, ${140 - shoulder} ${y + spec.bodyHeight * 0.05}, 140 ${y} Z`} {...common} />;
  }
  if (spec.shape === 'droplet') return <path d={`M 140 ${y} C ${x + spec.bodyWidth * .9} ${y + spec.bodyHeight * .42}, ${x + spec.bodyWidth} ${y + spec.bodyHeight * .62}, ${x + spec.bodyWidth * .83} ${y + spec.bodyHeight * .82} C ${x + spec.bodyWidth * .64} ${y + spec.bodyHeight * 1.05}, ${x + spec.bodyWidth * .34} ${y + spec.bodyHeight * 1.05}, ${x + spec.bodyWidth * .17} ${y + spec.bodyHeight * .82} C ${x} ${y + spec.bodyHeight * .61}, ${x + spec.bodyWidth * .12} ${y + spec.bodyHeight * .39}, 140 ${y} Z`} {...common} />;
  if (spec.shape === 'bell') return <path d={`M 140 ${y} C ${x + spec.bodyWidth * .82} ${y + spec.bodyHeight * .05}, ${x + spec.bodyWidth * .82} ${y + spec.bodyHeight * .4}, ${x + spec.bodyWidth * .9} ${y + spec.bodyHeight * .72} L ${x + spec.bodyWidth} ${y + spec.bodyHeight * .9} Q ${x + spec.bodyWidth * .76} ${y + spec.bodyHeight}, ${x + spec.bodyWidth * .62} ${y + spec.bodyHeight * .91} Q 140 ${y + spec.bodyHeight * 1.06}, ${x + spec.bodyWidth * .38} ${y + spec.bodyHeight * .91} Q ${x + spec.bodyWidth * .24} ${y + spec.bodyHeight}, ${x} ${y + spec.bodyHeight * .9} L ${x + spec.bodyWidth * .1} ${y + spec.bodyHeight * .72} C ${x + spec.bodyWidth * .18} ${y + spec.bodyHeight * .4}, ${x + spec.bodyWidth * .18} ${y + spec.bodyHeight * .05}, 140 ${y} Z`} {...common} />;
  if (spec.shape === 'seed') return <path d={`M 140 ${y} C ${x + spec.bodyWidth * 1.03} ${y + spec.bodyHeight * .28}, ${x + spec.bodyWidth * .94} ${y + spec.bodyHeight * .72}, 140 ${y + spec.bodyHeight} C ${x + spec.bodyWidth * .06} ${y + spec.bodyHeight * .72}, ${x - spec.bodyWidth * .03} ${y + spec.bodyHeight * .28}, 140 ${y} Z`} {...common} />;
  if (spec.shape === 'manta') return <path d={`M 140 ${y + spec.bodyHeight * .18} Q ${x + spec.bodyWidth * .76} ${y - spec.bodyHeight * .08}, ${x + spec.bodyWidth} ${y + spec.bodyHeight * .28} L ${x + spec.bodyWidth * .72} ${y + spec.bodyHeight * .56} Q ${x + spec.bodyWidth * .62} ${y + spec.bodyHeight * .74}, 140 ${y + spec.bodyHeight} Q ${x + spec.bodyWidth * .38} ${y + spec.bodyHeight * .74}, ${x + spec.bodyWidth * .28} ${y + spec.bodyHeight * .56} L ${x} ${y + spec.bodyHeight * .28} Q ${x + spec.bodyWidth * .24} ${y - spec.bodyHeight * .08}, 140 ${y + spec.bodyHeight * .18} Z`} {...common} />;
  if (spec.shape === 'lantern') return <path d={`M ${x + spec.bodyWidth * .34} ${y} L ${x + spec.bodyWidth * .66} ${y} L ${x + spec.bodyWidth * .78} ${y + spec.bodyHeight * .13} Q ${x + spec.bodyWidth} ${y + spec.bodyHeight * .5}, ${x + spec.bodyWidth * .78} ${y + spec.bodyHeight * .87} L ${x + spec.bodyWidth * .66} ${y + spec.bodyHeight} L ${x + spec.bodyWidth * .34} ${y + spec.bodyHeight} L ${x + spec.bodyWidth * .22} ${y + spec.bodyHeight * .87} Q ${x} ${y + spec.bodyHeight * .5}, ${x + spec.bodyWidth * .22} ${y + spec.bodyHeight * .13} Z`} {...common} />;
  if (spec.shape === 'crown') return <path d={`M ${x} ${y + spec.bodyHeight * .24} L ${x + spec.bodyWidth * .2} ${y + spec.bodyHeight * .42} L ${x + spec.bodyWidth * .35} ${y} L 140 ${y + spec.bodyHeight * .4} L ${x + spec.bodyWidth * .65} ${y} L ${x + spec.bodyWidth * .8} ${y + spec.bodyHeight * .42} L ${x + spec.bodyWidth} ${y + spec.bodyHeight * .24} L ${x + spec.bodyWidth * .84} ${y + spec.bodyHeight} L ${x + spec.bodyWidth * .16} ${y + spec.bodyHeight} Z`} {...common} />;
  if (spec.shape === 'hourglass') return <path d={`M ${x} ${y} Q 140 ${y + spec.bodyHeight * .42}, ${x + spec.bodyWidth * .38} ${y + spec.bodyHeight * .5} Q 140 ${y + spec.bodyHeight * .58}, ${x} ${y + spec.bodyHeight} L ${x + spec.bodyWidth} ${y + spec.bodyHeight} Q 140 ${y + spec.bodyHeight * .58}, ${x + spec.bodyWidth * .62} ${y + spec.bodyHeight * .5} Q 140 ${y + spec.bodyHeight * .42}, ${x + spec.bodyWidth} ${y} Z`} {...common} />;
  if (spec.shape === 'wisp') return <path d={`M ${x + spec.bodyWidth * .78} ${y} Q ${x + spec.bodyWidth * .58} ${y + spec.bodyHeight * .28}, ${x + spec.bodyWidth * .9} ${y + spec.bodyHeight * .43} Q ${x + spec.bodyWidth * 1.08} ${y + spec.bodyHeight * .62}, ${x + spec.bodyWidth * .63} ${y + spec.bodyHeight * .75} Q ${x + spec.bodyWidth * .31} ${y + spec.bodyHeight * .82}, ${x + spec.bodyWidth * .18} ${y + spec.bodyHeight} Q ${x + spec.bodyWidth * .2} ${y + spec.bodyHeight * .7}, ${x} ${y + spec.bodyHeight * .53} Q ${x + spec.bodyWidth * .22} ${y + spec.bodyHeight * .39}, ${x + spec.bodyWidth * .36} ${y + spec.bodyHeight * .12} Q ${x + spec.bodyWidth * .57} ${y + spec.bodyHeight * .24}, ${x + spec.bodyWidth * .78} ${y} Z`} {...common} />;
  return <ellipse cx="140" cy="112" rx={spec.bodyWidth / 2} ry={spec.bodyHeight / 2} {...common} />;
}

function WingPair({ spec }: { spec: BodySpec }) {
  const x = 140 - spec.bodyWidth / 2;
  const reach = 52 * spec.wingSpread * (spec.wingPurpose === 'attack' ? 1.12 : spec.wingPurpose === 'decorative' ? .62 : spec.wingPurpose === 'defend' ? .8 : spec.wingPurpose === 'attract' ? 1.04 : 1);
  const left = spec.wingStyle === 'blade'
    ? `M ${x + 8} 104 L ${x - reach} ${spec.wingPurpose === 'attack' ? 70 : 87} L ${x - reach * .42} 128 L ${x + 14} 124 Z`
    : spec.wingStyle === 'moth'
      ? `M ${x + 8} 103 C ${x - reach * .82} 66, ${x - reach} 94, ${x - reach * .55} 116 C ${x - reach * .95} 144, ${x - reach * .27} 150, ${x + 14} 124 Z`
      : spec.wingStyle === 'veil'
        ? `M ${x + 8} 102 Q ${x - reach} 82, ${x - reach * .62} 142 Q ${x - reach * .15} 158, ${x + 14} 124 Z`
        : `M ${x + 7} 103 Q ${x - reach} 78, ${x - reach * .65} 134 Q ${x - 12} 142, ${x + 14} 124 Z`;
  return <g fill={spec.wingPurpose === 'decorative' ? spec.highlightColor : spec.primaryColor} stroke={spec.wingPurpose === 'attack' ? spec.highlightColor : spec.secondaryColor} strokeWidth={spec.wingPurpose === 'attack' ? spec.outlineWidth * 1.35 : spec.outlineWidth} opacity=".92">
    <path d={left}/><path d={left} transform="translate(280 0) scale(-1 1)"/>
    {spec.wingPurpose === 'attract' && <g fill={spec.highlightColor} stroke="none"><circle cx={x - reach * .46} cy="104" r="4"/><circle cx={280 - x + reach * .46} cy="104" r="4"/></g>}
  </g>;
}

export function PetBodyRenderer({ spec, className = '', animate = true }: { spec: BodySpec; className?: string; animate?: boolean }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const reducedMotion = useReducedMotion();
  const moving = animate && !reducedMotion;
  const patternId = `body-pattern-${rawId}`;
  const glowId = `body-glow-${rawId}`;
  const fill = spec.pattern === 'solid' ? spec.primaryColor : `url(#${patternId})`;
  const textureSize = 6 + spec.textureScale / 3;
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
        {spec.pattern === 'velvet' && <radialGradient id={patternId} cx="38%" cy="28%"><stop stopColor={spec.highlightColor}/><stop offset=".28" stopColor={spec.primaryColor}/><stop offset=".76" stopColor={spec.primaryColor}/><stop offset="1" stopColor={spec.secondaryColor}/></radialGradient>}
        {spec.pattern === 'pearl' && <radialGradient id={patternId} cx="32%" cy="24%"><stop stopColor="#fff"/><stop offset=".17" stopColor={spec.highlightColor}/><stop offset=".53" stopColor={spec.primaryColor}/><stop offset=".82" stopColor={spec.highlightColor}/><stop offset="1" stopColor={spec.secondaryColor}/></radialGradient>}
        {spec.pattern === 'glass' && <linearGradient id={patternId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".85"/><stop offset=".2" stopColor={spec.highlightColor} stopOpacity=".32"/><stop offset=".48" stopColor={spec.primaryColor} stopOpacity=".72"/><stop offset=".76" stopColor="#fff" stopOpacity=".18"/><stop offset="1" stopColor={spec.secondaryColor} stopOpacity=".82"/></linearGradient>}
        {spec.pattern === 'chrome' && <linearGradient id={patternId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f8ffff"/><stop offset=".18" stopColor={spec.primaryColor}/><stop offset=".37" stopColor={spec.secondaryColor}/><stop offset=".52" stopColor="#fff"/><stop offset=".66" stopColor={spec.highlightColor}/><stop offset=".83" stopColor={spec.secondaryColor}/><stop offset="1" stopColor={spec.primaryColor}/></linearGradient>}
        {(spec.pattern === 'striped' || spec.pattern === 'stripes') && <pattern id={patternId} width={textureSize} height={textureSize} patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><rect width={textureSize} height={textureSize} fill={spec.primaryColor} /><rect width={textureSize * .36} height={textureSize} fill={spec.highlightColor} opacity=".8" /></pattern>}
        {(spec.pattern === 'spotted' || spec.pattern === 'spots') && <pattern id={patternId} width={textureSize * 1.4} height={textureSize * 1.4} patternUnits="userSpaceOnUse"><rect width={textureSize * 1.4} height={textureSize * 1.4} fill={spec.primaryColor} /><circle cx={textureSize * .42} cy={textureSize * .46} r={textureSize * .24} fill={spec.highlightColor} /><circle cx={textureSize * 1.12} cy={textureSize * 1.08} r={textureSize * .16} fill={spec.secondaryColor} /></pattern>}
        {spec.pattern === 'scales' && <pattern id={patternId} width={textureSize} height={textureSize * .68} patternUnits="userSpaceOnUse"><rect width={textureSize} height={textureSize} fill={spec.primaryColor}/><path d={`M 0 0 Q ${textureSize * .25} ${textureSize * .55} ${textureSize * .5} 0 Q ${textureSize * .75} ${textureSize * .55} ${textureSize} 0`} fill="none" stroke={spec.highlightColor} strokeWidth={1 + spec.textureDepth / 45}/></pattern>}
        {spec.pattern === 'moss' && <pattern id={patternId} width={textureSize} height={textureSize} patternUnits="userSpaceOnUse"><rect width={textureSize} height={textureSize} fill={spec.primaryColor}/><circle cx={textureSize * .25} cy={textureSize * .55} r={textureSize * .24} fill={spec.highlightColor} opacity=".65"/><circle cx={textureSize * .72} cy={textureSize * .28} r={textureSize * .17} fill={spec.secondaryColor} opacity=".7"/></pattern>}
        {(spec.pattern === 'stone' || spec.pattern === 'ink') && <pattern id={patternId} width="280" height="250" patternUnits="userSpaceOnUse"><rect width="280" height="250" fill={spec.primaryColor}/><rect width="280" height="250" fill={spec.pattern === 'ink' ? spec.secondaryColor : spec.highlightColor} opacity={spec.textureDepth / 220} filter={`url(#body-grain-${rawId})`}/></pattern>}
        <filter id={`body-grain-${rawId}`}><feTurbulence type={spec.pattern === 'ink' ? 'fractalNoise' : 'turbulence'} baseFrequency={.008 + spec.textureRoughness / 620} numOctaves="3" seed="11"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" mode={spec.pattern === 'ink' ? 'multiply' : 'overlay'}/></filter>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={2 + spec.glow * 10} result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      <motion.ellipse cx="140" cy="120" rx={72 + spec.glow * 28} ry={69 + spec.glow * 25} fill={spec.primaryColor} opacity={0.06 + spec.glow * 0.13} animate={moving ? { scale: [0.96, 1.05, 0.96], opacity: [0.05, 0.18, 0.05] } : undefined} transition={{ duration: 3 / spec.animationSpeed, repeat: Infinity }} />

      <motion.g
        style={{ transformOrigin: '140px 112px' }}
        animate={moving ? { y: [0, -spec.bob, 0], rotate: [spec.tilt - 1, spec.tilt + 1, spec.tilt - 1], scaleX: [spec.bodyScale, spec.bodyScale * (1 + spec.breathe), spec.bodyScale], scaleY: [spec.bodyScale, spec.bodyScale * (1 - spec.breathe * 0.45), spec.bodyScale] } : { rotate: spec.tilt, scale: spec.bodyScale }}
        transition={{ duration: 2.8 / spec.animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        filter={spec.glow > 0 ? `url(#${glowId})` : undefined}
      >
        {spec.features.includes('wings') && <WingPair spec={spec} />}
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
