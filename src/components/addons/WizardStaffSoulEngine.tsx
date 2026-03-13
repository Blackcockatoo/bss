"use client";

import type React from "react";
import { useMemo } from "react";

interface WizardStaffSoulEngineProps {
  animationPhase: number;
  mood: number;
  energy: number;
  curiosity: number;
  bond: number;
}

const TAU = Math.PI * 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hsla = (h: number, s: number, l: number, a: number) =>
  `hsla(${((h % 360) + 360) % 360} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}% / ${clamp(a, 0, 1)})`;

const sriPoints = (radius: number, sides: number, twist = 0) =>
  Array.from({ length: sides }, (_, index) => {
    const angle = (TAU * index) / sides - Math.PI / 2 + twist;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

const pathFromPoints = (points: Array<{ x: number; y: number }>) =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ") + " Z";

export const WizardStaffSoulEngine: React.FC<WizardStaffSoulEngineProps> = ({
  animationPhase,
  mood,
  energy,
  curiosity,
  bond,
}) => {
  const time = animationPhase / 1000;
  const hue =
    (190 + mood * 0.7 + curiosity * 0.9 + time * (16 + energy * 0.04)) % 360;
  const pulse =
    1 + Math.sin(time * (1.3 + energy * 0.008)) * (0.05 + bond * 0.0005);

  const ringPaths = useMemo(
    () =>
      Array.from({ length: 4 }, (_, ringIndex) => {
        const radius = (16 + ringIndex * 8) * pulse;
        const twist =
          time * 0.45 * (ringIndex % 2 === 0 ? 1 : -1) + ringIndex * 0.3;
        return {
          key: `ring-${ringIndex}`,
          path: pathFromPoints(sriPoints(radius, 7, twist)),
          stroke: hsla(hue + ringIndex * 16, 92, 66, 0.13 + ringIndex * 0.05),
          width: 0.8 + ringIndex * 0.22,
        };
      }),
    [hue, pulse, time],
  );

  const helixPaths = useMemo(
    () =>
      Array.from({ length: 7 }, (_, strand) => {
        const baseAngle = (TAU * strand) / 7;
        const points = Array.from({ length: 28 }, (_, step) => {
          const fraction = step / 27;
          const orbit = baseAngle + fraction * TAU * 1.3 + time * 0.9;
          return {
            x:
              Math.cos(orbit) *
              21 *
              (0.68 + 0.22 * Math.sin(fraction * TAU + strand)),
            y:
              -6 +
              Math.sin(orbit) *
                9 *
                (0.75 + 0.18 * Math.cos(fraction * TAU + strand)) +
              (fraction - 0.5) * 18,
          };
        });

        return {
          key: `helix-${strand}`,
          path: points
            .map(
              (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
            )
            .join(" "),
          stroke: hsla(hue + strand * 18, 90, 68, 0.18),
        };
      }),
    [hue, time],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const orbit = time * (0.8 + energy * 0.003) + index * 0.7;
        const radius = 18 + Math.sin(index * 0.9 + time * 1.4) * 8;
        return {
          key: `particle-${index}`,
          x: Math.cos(orbit) * radius,
          y: -8 + Math.sin(orbit * 1.1) * (radius * 0.5),
          r: 0.9 + (index % 3) * 0.45,
          fill: hsla(
            hue + index * 11,
            100,
            76,
            0.55 + ((Math.sin(time * 2.6 + index) + 1) / 2) * 0.35,
          ),
        };
      }),
    [energy, hue, time],
  );

  const gemPoints = useMemo(
    () => sriPoints(23 * pulse, 7, time * 0.55),
    [pulse, time],
  );

  return (
    <g>
      <defs>
        <linearGradient
          id="wizardStaffWoodGradient"
          x1="0"
          y1="-44"
          x2="0"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7c4a1f" />
          <stop offset="50%" stopColor="#4a2f1a" />
          <stop offset="100%" stopColor="#2f1a0f" />
        </linearGradient>
        <linearGradient
          id="wizardStaffCrystalGradient"
          x1="-10"
          y1="-46"
          x2="10"
          y2="-18"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={hsla(hue + 34, 100, 90, 1)} />
          <stop offset="45%" stopColor={hsla(hue + 8, 96, 70, 1)} />
          <stop offset="100%" stopColor={hsla(hue - 26, 92, 54, 1)} />
        </linearGradient>
        <radialGradient id="wizardStaffCoreGradient" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={hsla(hue + 20, 100, 92, 0.95)} />
          <stop offset="55%" stopColor={hsla(hue - 8, 95, 62, 0.72)} />
          <stop offset="100%" stopColor={hsla(hue - 24, 88, 36, 0)} />
        </radialGradient>
      </defs>

      <g opacity="0.95">
        <path
          d="M -3 -30 C -5 -16 -4 6 -4 44 L 4 44 C 4 5 5 -17 3 -30 Z"
          fill="url(#wizardStaffWoodGradient)"
          stroke="#9a6a36"
          strokeWidth="1"
        />
        <path
          d="M -1 -30 C -2 -18 -1 6 -1 44"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.9"
        />
        <path
          d="M -7 41 Q 0 47 7 41"
          fill="none"
          stroke="#c58f54"
          strokeWidth="1.1"
        />
      </g>

      <path
        d="M -7 -32 L -11 -16 L 0 -10 L 11 -16 L 7 -32 L 0 -40 Z"
        fill="url(#wizardStaffCrystalGradient)"
        stroke={hsla(hue + 22, 100, 86, 0.92)}
        strokeWidth="1.2"
        filter="url(#addonGlow)"
      />

      <circle
        cx="0"
        cy="-8"
        r={26 * pulse}
        fill="url(#wizardStaffCoreGradient)"
        opacity="0.85"
      />

      {ringPaths.map((ring) => (
        <path
          key={ring.key}
          d={ring.path}
          fill="none"
          stroke={ring.stroke}
          strokeWidth={ring.width}
          transform="translate(0 -8)"
        />
      ))}

      {helixPaths.map((strand) => (
        <path
          key={strand.key}
          d={strand.path}
          fill="none"
          stroke={strand.stroke}
          strokeWidth="0.75"
          transform="translate(0 -8)"
        />
      ))}

      {gemPoints.map((point, index) => (
        <circle
          key={`gem-${index}`}
          cx={point.x}
          cy={point.y - 8}
          r={1.6 + Math.sin(time * 2.2 + index) * 0.35}
          fill={hsla(hue + index * 22, 100, 82, 0.78)}
          filter="url(#particleGlow)"
        />
      ))}

      <g transform="translate(0 -8)">
        <circle
          cx="0"
          cy="0"
          r={7.5 * pulse}
          fill={hsla(hue + 14, 100, 92, 0.9)}
          filter="url(#addonGlow)"
        />
        <circle cx="0" cy="0" r="3.2" fill="#020412" />
        {Array.from({ length: 7 }, (_, index) => {
          const angle = (TAU * index) / 7 + time * 1.4;
          return (
            <line
              key={`spoke-${index}`}
              x1="0"
              y1="0"
              x2={(Math.cos(angle) * 5.2).toFixed(2)}
              y2={(Math.sin(angle) * 5.2).toFixed(2)}
              stroke={hsla(hue + 180, 100, 82, 0.72)}
              strokeWidth="0.7"
            />
          );
        })}
      </g>

      <text
        x="0"
        y="16"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
        fontSize="7"
        letterSpacing="2"
        fill={hsla(hue + 12, 100, 88, 0.55)}
      >
        ✦
      </text>

      {particles.map((particle) => (
        <circle
          key={particle.key}
          cx={particle.x}
          cy={particle.y}
          r={particle.r}
          fill={particle.fill}
          filter="url(#particleGlow)"
        />
      ))}
    </g>
  );
};
