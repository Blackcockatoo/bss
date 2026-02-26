'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getResidue, getResidueMeta } from '@/lib/genome';

export type GenomeJewbleRingVariant = 'clarity' | 'dial';

export interface GenomeJewbleRingProps {
  redDigits: number[];
  blackDigits: number[];
  blueDigits: number[];
  showFrontier?: boolean;
  variant?: GenomeJewbleRingVariant;
}

interface PolarPoint {
  x: number;
  y: number;
}

export const GenomeJewbleRing = memo(function GenomeJewbleRing({
  redDigits,
  blackDigits,
  blueDigits,
  showFrontier = true,
  variant = 'clarity',
}: GenomeJewbleRingProps) {
  const gradientId = useMemo(
    () => `jewbleGradient-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const size = variant === 'dial' ? 320 : 240;
  const center = size / 2;
  const tickRadius = variant === 'dial' ? size * 0.45 : size * 0.44;
  const radii = {
    red: size * 0.18,
    black: size * 0.26,
    blue: size * 0.34,
    pair: tickRadius - 6,
    frontier: tickRadius - 2,
  } as const;

  const residuesBySequence = useMemo(() => {
    const toResidues = (digits: number[]) => new Set(digits.map(value => getResidue(value)));
    return {
      red: toResidues(redDigits),
      black: toResidues(blackDigits),
      blue: toResidues(blueDigits),
    };
  }, [redDigits, blackDigits, blueDigits]);

  const residueMeta = useMemo(() => Array.from({ length: 60 }, (_, index) => getResidueMeta(index)), []);
  const showLabels = variant === 'dial';

  const polar = (residue: number, radius: number): PolarPoint => {
    const theta = (residue / 60) * Math.PI * 2 - Math.PI / 2;
    return {
      x: center + radius * Math.cos(theta),
      y: center + radius * Math.sin(theta),
    };
  };

  const renderSequence = (residueSet: Set<number>, color: string, radius: number) => (
    <g>
      {Array.from(residueSet).map(residue => {
        const point = polar(residue, radius);
        return <circle key={`${color}-${residue}`} cx={point.x} cy={point.y} r={variant === 'dial' ? 5 : 4} fill={color} fillOpacity={0.9} />;
      })}
    </g>
  );

  return (
    <div className={cn('relative mx-auto', variant === 'dial' ? 'max-w-[360px]' : 'max-w-[300px]')}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_12px_rgba(0,0,0,0.35)]">
        {/* Backdrop */}
        <circle cx={center} cy={center} r={tickRadius + 8} fill={`url(#${gradientId})`} opacity={variant === 'dial' ? 0.16 : 0.1} />
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Tick marks */}
        {residueMeta.map(meta => {
          const inner = polar(meta.residue, tickRadius - 10);
          const outer = polar(meta.residue, tickRadius);
          return (
            <line
              key={`tick-${meta.residue}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#94a3b8"
              strokeWidth={meta.residue % 5 === 0 ? 1.8 : 1.1}
              strokeOpacity={meta.residue % 5 === 0 ? 0.55 : 0.35}
            />
          );
        })}

        {/* Pair halos */}
        {residueMeta.map(meta => {
          const isUsed =
            residuesBySequence.red.has(meta.residue) ||
            residuesBySequence.black.has(meta.residue) ||
            residuesBySequence.blue.has(meta.residue);

          if (!meta.hasPair60 || !isUsed) {
            return null;
          }
          const point = polar(meta.residue, radii.pair);
          return (
            <circle
              key={`pair-${meta.residue}`}
              cx={point.x}
              cy={point.y}
              r={variant === 'dial' ? 9 : 7}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.4}
              strokeOpacity={0.6}
            />
          );
        })}

        {/* Frontier markers */}
        {showFrontier && residueMeta.map(meta => {
          if (!meta.isFrontierResidue) return null;
          const point = polar(meta.residue, radii.frontier);
          return (
            <circle
              key={`frontier-${meta.residue}`}
              cx={point.x}
              cy={point.y}
              r={variant === 'dial' ? 7 : 6}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2}
              strokeOpacity={
                residuesBySequence.red.has(meta.residue) ||
                residuesBySequence.black.has(meta.residue) ||
                residuesBySequence.blue.has(meta.residue)
                  ? 1
                  : 0.45
              }
            />
          );
        })}

        {/* Genome sequences */}
        {renderSequence(residuesBySequence.red, '#fb7185', radii.red)}
        {renderSequence(residuesBySequence.black, '#a78bfa', radii.black)}
        {renderSequence(residuesBySequence.blue, '#38bdf8', radii.blue)}

        {/* Element labels */}
        {showLabels && residueMeta.map(meta => {
          const labelPoint = polar(meta.residue, tickRadius + 12);
          const combined = [...meta.elements2d, ...meta.elements3d];
          if (combined.length === 0) {
            return null;
          }
          const label = combined.join('/');

          return (
            <text
              key={`label-${meta.residue}`}
              x={labelPoint.x}
              y={labelPoint.y}
              fontSize={8}
              fill="#e2e8f0"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={0.75}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {variant === 'dial' ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-slate-900/70 border border-slate-700 text-[11px] uppercase tracking-[0.2em] text-slate-200">
            Element Dial
          </div>
        </div>
      ) : null}
    </div>
  );
});
