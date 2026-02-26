'use client';

import type { HeptaDigits } from '@/lib/identity/types';

interface SeedOfLifeGlyphProps {
  digits: HeptaDigits;
  size?: number;
}

const COLORS = [
  '#FF6B6B', // 0: red
  '#F59E42', // 1: orange
  '#FFD93D', // 2: yellow
  '#6BCF7F', // 3: green
  '#4ECDC4', // 4: cyan
  '#A66FB5', // 5: purple
  '#C44569', // 6: magenta
];

/**
 * Seed of Life: 7 overlapping circles (sacred geometry)
 * Each circle colored by average of digits in that sector
 */
export function SeedOfLifeGlyph({ digits, size = 300 }: SeedOfLifeGlyphProps) {
  if (digits.length !== 42) {
    return <div className="text-red-500">Invalid HeptaCode (expected 42 digits)</div>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.22; // circle radius
  const spacing = r * 1.1; // spacing between centers

  // 7 circle positions: 1 center + 6 around
  const positions = [
    { x: cx, y: cy }, // center
    { x: cx + spacing, y: cy },
    { x: cx + spacing * Math.cos(Math.PI / 3), y: cy + spacing * Math.sin(Math.PI / 3) },
    { x: cx - spacing * Math.cos(Math.PI / 3), y: cy + spacing * Math.sin(Math.PI / 3) },
    { x: cx - spacing, y: cy },
    { x: cx - spacing * Math.cos(Math.PI / 3), y: cy - spacing * Math.sin(Math.PI / 3) },
    { x: cx + spacing * Math.cos(Math.PI / 3), y: cy - spacing * Math.sin(Math.PI / 3) },
  ];

  // Compute average color for each circle (6 digits each)
  const circleColors = positions.map((_, i) => {
    const start = i * 6;
    const chunk = digits.slice(start, start + 6);
    const avg = chunk.reduce((sum, d) => sum + d, 0) / chunk.length;
    return COLORS[Math.round(avg) % 7];
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-xl"
    >
      {/* Background */}
      <rect width={size} height={size} fill="#0f0f1e" rx="16" />

      {/* 7 circles */}
      {positions.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r={r}
          fill={circleColors[i]}
          fillOpacity="0.3"
          stroke={circleColors[i]}
          strokeWidth="3"
          strokeOpacity="0.8"
        />
      ))}

      {/* Center symbol */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.3}
        fill="white"
        fillOpacity="0.1"
        stroke="#4ECDC4"
        strokeWidth="2"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.05}
        fill="#4ECDC4"
        fontWeight="bold"
        className="select-none"
      >
        7
      </text>
    </svg>
  );
}
