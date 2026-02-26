'use client';

import type { HeptaDigits } from '@/lib/identity/types';

interface HeptaTagProps {
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
 * HeptaTag: 7-sided, 3-ring visualization of 42-digit HeptaCode
 * Ring 1 (outer): digits 0-13
 * Ring 2 (middle): digits 14-27
 * Ring 3 (inner): digits 28-41
 */
export function HeptaTag({ digits, size = 320 }: HeptaTagProps) {
  if (digits.length !== 42) {
    return <div className="text-red-500">Invalid HeptaCode (expected 42 digits)</div>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const rings = [
    { radius: size * 0.42, count: 14, start: 0 },   // outer
    { radius: size * 0.30, count: 14, start: 14 },  // middle
    { radius: size * 0.18, count: 14, start: 28 },  // inner
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-lg"
    >
      {/* Background glow */}
      <defs>
        <radialGradient id="bg-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f0f1e" stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={size * 0.48} fill="url(#bg-glow)" />

      {/* Rings */}
      {rings.map((ring, ringIdx) => {
        const angleStep = (Math.PI * 2) / ring.count;

        return (
          <g key={ringIdx}>
            {Array.from({ length: ring.count }).map((_, i) => {
              const digitIdx = ring.start + i;
              if (digitIdx >= digits.length) return null;

              const digit = digits[digitIdx];
              const angle = i * angleStep - Math.PI / 2; // start at top
              const x = cx + ring.radius * Math.cos(angle);
              const y = cy + ring.radius * Math.sin(angle);

              // Bounds check: ensure digit is in valid range [0-6]
              const safeDigit = Math.max(0, Math.min(6, digit));

              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={size * 0.04}
                    fill={COLORS[safeDigit]}
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={size * 0.03}
                    fill="white"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {digit}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Center label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.06}
        fill="#4ECDC4"
        fontWeight="bold"
        className="select-none"
      >
        HEPTA
      </text>
    </svg>
  );
}
