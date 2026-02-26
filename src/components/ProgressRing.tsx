'use client';

import { useMemo } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'pink';
  className?: string;
  showPercentage?: boolean;
}

const colorMap = {
  cyan: {
    stroke: 'stroke-cyan-400',
    glow: 'rgba(34, 211, 238, 0.4)',
  },
  purple: {
    stroke: 'stroke-purple-400',
    glow: 'rgba(192, 132, 252, 0.4)',
  },
  emerald: {
    stroke: 'stroke-emerald-400',
    glow: 'rgba(52, 211, 153, 0.4)',
  },
  amber: {
    stroke: 'stroke-amber-400',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
  pink: {
    stroke: 'stroke-pink-400',
    glow: 'rgba(244, 114, 182, 0.4)',
  },
};

/**
 * Circular progress ring component for displaying vitals/evolution progress
 */
export function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 4,
  color = 'cyan',
  className = '',
  showPercentage = false,
}: ProgressRingProps) {
  const { stroke, glow } = colorMap[color];

  const dimensions = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return { radius, circumference, offset };
  }, [size, strokeWidth, progress]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Glow filter */}
        <defs>
          <filter id={`ring-glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={dimensions.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800/50"
        />

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={dimensions.radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={stroke}
          style={{
            strokeDasharray: dimensions.circumference,
            strokeDashoffset: dimensions.offset,
            transition: 'stroke-dashoffset 0.5s ease-in-out',
            filter: `drop-shadow(0 0 4px ${glow})`,
          }}
        />
      </svg>

      {/* Optional percentage display */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${stroke.replace('stroke-', 'text-')}`}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}
