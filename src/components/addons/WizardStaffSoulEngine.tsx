"use client";

import type React from "react";
import { useId, useMemo } from "react";

interface WizardStaffSoulEngineProps {
  animationPhase: number;
  mood: number;
  energy: number;
  curiosity: number;
  bond: number;
}

const TAU = Math.PI * 2;
const GLYPHS = ["0", "1", "A", "B", "C", "D", "E", "F", "7", "9"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hsla = (h: number, s: number, l: number, a: number) =>
  `hsla(${((h % 360) + 360) % 360} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}% / ${clamp(a, 0, 1)})`;

const heptaPoints = (radius: number, sides: number, twist = 0) =>
  Array.from({ length: sides }, (_, index) => {
    const angle = (TAU * index) / sides - Math.PI / 2 + twist;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

const closedPath = (points: Array<{ x: number; y: number }>) =>
  `${points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ")} Z`;

const openPath = (points: Array<{ x: number; y: number }>) =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

export const WizardStaffSoulEngine: React.FC<WizardStaffSoulEngineProps> = ({
  animationPhase,
  mood,
  energy,
  curiosity,
  bond,
}) => {
  const time = animationPhase / 1000;
  const pulse =
    1 + Math.sin(time * (1.25 + energy * 0.01)) * (0.06 + bond * 0.0006);
  const hue =
    (200 + mood * 0.65 + curiosity * 0.85 + time * (18 + energy * 0.05)) % 360;
  const sway = Math.sin(time * 1.7) * 3.5;
  const driftY = Math.sin(time * 2.1) * 1.8;
  const outerSpin = time * 22;
  const innerSpin = -time * 30;
  const glyphSpin = time * 14;
  const spokeSpin = time * 80;
  const corePulse = 1 + Math.sin(time * 3.2) * 0.08;
  const id = useId().replace(/:/g, "");

  const woodGradientId = `wizardStaffWood-${id}`;
  const crystalGradientId = `wizardStaffCrystal-${id}`;
  const auraGradientId = `wizardStaffAura-${id}`;
  const singularityGradientId = `wizardStaffSingularity-${id}`;

  const ringPaths = useMemo(
    () =>
      Array.from({ length: 5 }, (_, ring) => {
        const radius = (12 + ring * 7.5) * pulse;
        const twist = time * 0.48 * (ring % 2 === 0 ? 1 : -1) + ring * 0.34;
        return {
          key: `ring-${ring}`,
          d: closedPath(heptaPoints(radius, 7, twist)),
          stroke: hsla(hue + ring * 18, 90, 68, 0.06 + ring * 0.05),
          width: 0.7 + ring * 0.22,
        };
      }),
    [hue, pulse, time],
  );

  const gemPoints = useMemo(
    () => heptaPoints(26 * pulse, 7, time * 0.55 + 0.72),
    [pulse, time],
  );

  const helixRails = useMemo(
    () =>
      Array.from({ length: 7 }, (_, strand) => {
        const baseAngle = (TAU * strand) / 7;
        const strandHue = (hue + strand * 42) % 360;

        const buildRail = (dir: 1 | -1, phaseOffset: number) =>
          openPath(
            Array.from({ length: 44 }, (_, step) => {
              const frac = step / 43;
              const angle =
                baseAngle + dir * frac * TAU * 1.76 + time + phaseOffset;
              const radius = 24 * (0.72 + 0.22 * Math.sin(frac * TAU + strand));
              return {
                x: Math.cos(angle) * radius,
                y:
                  -8 +
                  Math.sin(frac * TAU * 2 + time * dir + strand * 0.8) *
                    15 *
                    (0.48 + 0.18 * Math.cos(frac * TAU * 2 + strand)),
              };
            }),
          );

        const nodes = Array.from({ length: 9 }, (_, nodeIndex) => {
          const frac = nodeIndex / 8;
          const phase = baseAngle + frac * TAU * 1.62 + time;
          const x1 = Math.cos(phase) * 19.4;
          const y1 = -8 + Math.sin(frac * TAU * 2 + time + strand) * 7.6;
          const x2 = Math.cos(phase + Math.PI * 0.92) * 19.4;
          const y2 = -8 + Math.sin(frac * TAU * 2 - time - strand * 0.4) * 7.6;
          return {
            key: `node-${strand}-${nodeIndex}`,
            x1,
            y1,
            x2,
            y2,
            glyph:
              GLYPHS[
                (nodeIndex + strand + Math.floor(time * 5)) % GLYPHS.length
              ],
            glow:
              0.16 + 0.22 * Math.abs(Math.sin(time * 3.4 + nodeIndex + strand)),
          };
        });

        return {
          key: `strand-${strand}`,
          railA: buildRail(1, 0),
          railB: buildRail(-1, -0.3),
          strokeA: hsla(strandHue, 95, 68, 0.3),
          strokeB: hsla(strandHue + 18, 95, 62, 0.22),
          nodes,
          nodeFill: hsla(strandHue, 100, 82, 0.42),
          rungStroke: hsla(strandHue, 100, 74, 0.14),
          glyphFill: hsla(strandHue, 100, 78, 0.26),
        };
      }),
    [hue, time],
  );

  const orbitGlyphs = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (TAU * index) / 12 + time * 0.55;
        const radius = 54 + (index % 2) * 4;
        return {
          key: `orbit-glyph-${index}`,
          x: Math.cos(angle) * radius,
          y: -8 + Math.sin(angle) * radius,
          glyph: GLYPHS[(index + Math.floor(time * 7)) % GLYPHS.length],
          fill: hsla(hue + index * 7, 100, 76, 0.18 + (index % 3) * 0.04),
        };
      }),
    [hue, time],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => {
        const orbit = time * (0.82 + energy * 0.003) + index * 0.7;
        const radius = 18 + Math.sin(index * 0.9 + time * 1.4) * 8;
        return {
          key: `particle-${index}`,
          x: Math.cos(orbit) * radius,
          y: -8 + Math.sin(orbit * 1.1) * (radius * 0.54),
          r: 0.8 + (index % 3) * 0.45,
          fill: hsla(
            hue + index * 11,
            100,
            78,
            0.5 + ((Math.sin(time * 2.6 + index) + 1) / 2) * 0.32,
          ),
        };
      }),
    [energy, hue, time],
  );

  const sparkGlyphs = useMemo(
    () =>
      particles.slice(0, 8).map((particle, index) => ({
        key: `spark-glyph-${index}`,
        x: particle.x,
        y: particle.y - 5,
        glyph: GLYPHS[(index + Math.floor(time * 9)) % GLYPHS.length],
        fill: hsla(hue + index * 14, 100, 84, 0.18),
      })),
    [hue, particles, time],
  );

  const outerTicks = useMemo(
    () =>
      Array.from({ length: 21 }, (_, index) => {
        const angle = (TAU * index) / 21 + time * 0.12;
        const outer = 61 + (index % 7 === 0 ? 6 : 0);
        const inner = outer - (index % 7 === 0 ? 8 : 4);
        return {
          key: `tick-${index}`,
          x1: Math.cos(angle) * inner,
          y1: -8 + Math.sin(angle) * inner,
          x2: Math.cos(angle) * outer,
          y2: -8 + Math.sin(angle) * outer,
          stroke: hsla(
            hue + (index % 7 === 0 ? 34 : 0),
            92,
            index % 7 === 0 ? 84 : 66,
            index % 7 === 0 ? 0.46 : 0.18,
          ),
          width: index % 7 === 0 ? 0.95 : 0.55,
        };
      }),
    [hue, time],
  );

  return (
    <g
      transform={`translate(0 ${driftY.toFixed(2)}) rotate(${sway.toFixed(2)})`}
    >
      <defs>
        <linearGradient
          id={woodGradientId}
          x1="0"
          y1="-44"
          x2="0"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8a5728" />
          <stop offset="52%" stopColor="#4a2f1a" />
          <stop offset="100%" stopColor="#25140c" />
        </linearGradient>
        <linearGradient
          id={crystalGradientId}
          x1="-10"
          y1="-48"
          x2="10"
          y2="-12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={hsla(hue + 36, 100, 92, 1)} />
          <stop offset="40%" stopColor={hsla(hue + 4, 98, 72, 1)} />
          <stop offset="78%" stopColor={hsla(hue - 18, 92, 58, 1)} />
          <stop offset="100%" stopColor={hsla(hue + 70, 88, 46, 1)} />
        </linearGradient>
        <radialGradient id={auraGradientId} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={hsla(hue, 100, 78, 0.36)} />
          <stop offset="45%" stopColor={hsla(hue + 34, 84, 56, 0.18)} />
          <stop offset="100%" stopColor={hsla(hue, 70, 40, 0)} />
        </radialGradient>
        <radialGradient id={singularityGradientId} cx="50%" cy="50%" r="72%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.96)" />
          <stop offset="42%" stopColor="rgba(0,0,0,0.9)" />
          <stop offset="74%" stopColor={hsla(hue, 100, 68, 0.18)} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <g opacity="0.94">
        <path
          d="M -3.3 -28 C -5 -10 -4.6 14 -4.8 44 L 4.8 44 C 4.6 14 5 -10 3.3 -28 Z"
          fill={`url(#${woodGradientId})`}
          stroke="#a06d3d"
          strokeWidth="1"
        />
        <path
          d="M -0.8 -28 C -1.7 -12 -1.1 14 -1.1 43"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.8"
        />
        <path
          d="M -6.2 40.5 Q 0 46 6.2 40.5"
          fill="none"
          stroke="#d3a26f"
          strokeWidth="1.05"
        />
      </g>

      <path
        d="M -8 -31 L -12 -16 L 0 -8 L 12 -16 L 8 -31 L 0 -41 Z"
        fill={`url(#${crystalGradientId})`}
        stroke={hsla(hue + 20, 100, 88, 0.94)}
        strokeWidth="1.25"
        filter="url(#addonGlow)"
      />

      <circle
        cx="0"
        cy="-8"
        r={34 * pulse}
        fill={`url(#${auraGradientId})`}
        opacity="0.95"
      />

      <g transform="translate(0 -8)">
        <g transform={`rotate(${outerSpin.toFixed(2)})`}>
          {ringPaths.slice(0, 3).map((ring) => (
            <path
              key={ring.key}
              d={ring.d}
              fill="none"
              stroke={ring.stroke}
              strokeWidth={ring.width}
            />
          ))}
        </g>
        <g transform={`rotate(${innerSpin.toFixed(2)})`}>
          {ringPaths.slice(3).map((ring) => (
            <path
              key={ring.key}
              d={ring.d}
              fill="none"
              stroke={ring.stroke}
              strokeWidth={ring.width}
            />
          ))}
        </g>

        <ellipse
          cx="0"
          cy="0"
          rx={56 * pulse}
          ry={44 * pulse}
          fill="none"
          stroke={hsla(hue, 80, 66, 0.18)}
          strokeWidth="1.35"
        />
        <ellipse
          cx="0"
          cy="0"
          rx={63 * pulse}
          ry={50 * pulse}
          fill="none"
          stroke={hsla(hue + 24, 84, 72, 0.1)}
          strokeWidth="0.9"
        />

        {outerTicks.map((tick) => (
          <line
            key={tick.key}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.stroke}
            strokeWidth={tick.width}
          />
        ))}

        <g transform={`rotate(${glyphSpin.toFixed(2)})`}>
          {orbitGlyphs.map((glyph) => (
            <text
              key={glyph.key}
              x={glyph.x}
              y={glyph.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'Courier New', monospace"
              fontSize="5"
              letterSpacing="0.4"
              fill={glyph.fill}
            >
              {glyph.glyph}
            </text>
          ))}
        </g>

        {helixRails.map((strand) => (
          <g key={strand.key}>
            <path
              d={strand.railA}
              fill="none"
              stroke={strand.strokeA}
              strokeWidth="1.05"
            />
            <path
              d={strand.railB}
              fill="none"
              stroke={strand.strokeB}
              strokeWidth="0.76"
            />
            {strand.nodes.map((node) => (
              <g key={node.key}>
                <line
                  x1={node.x1}
                  y1={node.y1}
                  x2={node.x2}
                  y2={node.y2}
                  stroke={strand.rungStroke}
                  strokeWidth="0.6"
                />
                <circle
                  cx={node.x1}
                  cy={node.y1}
                  r={1.1 + node.glow}
                  fill={strand.nodeFill}
                  filter="url(#particleGlow)"
                />
                <text
                  x={lerp(node.x1, node.x2, 0.5)}
                  y={lerp(node.y1, node.y2, 0.5)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="'Courier New', monospace"
                  fontSize="3.6"
                  fill={strand.glyphFill}
                >
                  {node.glyph}
                </text>
              </g>
            ))}
          </g>
        ))}

        {gemPoints.map((point, index) => (
          <circle
            key={`gem-${index}`}
            cx={point.x}
            cy={point.y}
            r={1.5 + Math.sin(time * 2.2 + index) * 0.32}
            fill={hsla(hue + index * 22, 100, 82, 0.8)}
            filter="url(#particleGlow)"
          />
        ))}

        <circle
          cx="0"
          cy="0"
          r={18 * pulse * corePulse}
          fill={`url(#${singularityGradientId})`}
          opacity="0.98"
        />
        <circle
          cx="0"
          cy="0"
          r={13.5 * pulse * corePulse}
          fill={hsla(hue + 12, 100, 92, 0.92)}
          filter="url(#addonGlow)"
        />
        <circle cx="0" cy="0" r="6" fill="#020412" />
        <g transform={`rotate(${spokeSpin.toFixed(2)})`}>
          {Array.from({ length: 7 }, (_, index) => {
            const angle = (TAU * index) / 7;
            return (
              <line
                key={`spoke-${index}`}
                x1="0"
                y1="0"
                x2={(Math.cos(angle) * 7).toFixed(2)}
                y2={(Math.sin(angle) * 7).toFixed(2)}
                stroke={hsla(hue + 180, 100, 82, 0.72)}
                strokeWidth="0.72"
              />
            );
          })}
        </g>
      </g>

      <text
        x="0"
        y="17"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
        fontSize="7"
        letterSpacing="1.8"
        fill={hsla(hue + 10, 100, 88, 0.42)}
      >
        ◎
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

      {sparkGlyphs.map((glyph) => (
        <text
          key={glyph.key}
          x={glyph.x}
          y={glyph.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Courier New', monospace"
          fontSize="4.2"
          fill={glyph.fill}
        >
          {glyph.glyph}
        </text>
      ))}
    </g>
  );
};
