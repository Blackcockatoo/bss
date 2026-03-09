"use client";

import type React from "react";
import { useMemo } from "react";

interface SeraphicPendantFieldProps {
  animationPhase: number;
  mood: number;
  energy: number;
  curiosity: number;
  bond: number;
  red60: number;
  blue60: number;
  black60: number;
}

interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Point2 {
  x: number;
  y: number;
  depth: number;
}

const TAU = Math.PI * 2;
const HELIX_POINTS = 24;
const PARTICLE_COUNT = 26;

const TESSERACT_VERTICES: Vec4[] = Array.from({ length: 16 }, (_, i) => ({
  x: i & 1 ? 1 : -1,
  y: i & 2 ? 1 : -1,
  z: i & 4 ? 1 : -1,
  w: i & 8 ? 1 : -1,
}));

const TESSERACT_EDGES: Array<[number, number]> = [];
for (let i = 0; i < 16; i++) {
  for (let bit = 0; bit < 4; bit++) {
    const j = i ^ (1 << bit);
    if (i < j) TESSERACT_EDGES.push([i, j]);
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hsla = (h: number, s: number, l: number, a: number) =>
  `hsla(${((h % 360) + 360) % 360} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}% / ${clamp(a, 0, 1)})`;

const binaryString = (value: number) =>
  clamp(Math.floor(value), 0, 255).toString(2).padStart(8, "0");

const hexString = (value: number) =>
  clamp(Math.floor(value), 0, 255).toString(16).toUpperCase().padStart(2, "0");

const buildMetaColor = (
  phase: number,
  energy: number,
  mood: number,
  mystery: number,
) => {
  const r = clamp(
    Math.floor(128 + 127 * Math.sin(phase + energy * 0.03)),
    0,
    255,
  );
  const g = clamp(
    Math.floor(128 + 127 * Math.sin(phase * 1.21 + mood * 0.025 + 2.1)),
    0,
    255,
  );
  const b = clamp(
    Math.floor(128 + 127 * Math.sin(phase * 1.43 + mystery * 0.028 + 4.2)),
    0,
    255,
  );

  return {
    r,
    g,
    b,
    hex: `#${hexString(r)}${hexString(g)}${hexString(b)}`,
    binary: `${binaryString(r)} ${binaryString(g)} ${binaryString(b)}`,
  };
};

const rotateZW = (v: Vec4, angle: number): Vec4 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y, z: v.z * c - v.w * s, w: v.z * s + v.w * c };
};

const rotateXW = (v: Vec4, angle: number): Vec4 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.w * s, y: v.y, z: v.z, w: v.x * s + v.w * c };
};

const rotateXY = (v: Vec4, angle: number): Vec4 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z, w: v.w };
};

const rotateYZ = (v: Vec4, angle: number): Vec4 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c, w: v.w };
};

const project4Dto2D = (v: Vec4, scale: number): Point2 => {
  const distance4 = 4.6;
  const scale4 = distance4 / (distance4 - v.w);
  const x3 = v.x * scale4;
  const y3 = v.y * scale4;
  const z3 = v.z * scale4;
  const distance3 = 4.8;
  const perspective = distance3 / (distance3 - z3);

  return {
    x: x3 * perspective * scale,
    y: y3 * perspective * scale,
    depth: perspective,
  };
};

export const SeraphicPendantField: React.FC<SeraphicPendantFieldProps> = ({
  animationPhase,
  mood,
  energy,
  curiosity,
  bond,
  red60,
  blue60,
  black60,
}) => {
  const time = animationPhase / 1000;
  const baseHue =
    (mood * 2 + curiosity * 0.8 + time * (18 + energy * 0.18)) % 360;

  const projectedVertices = useMemo(() => {
    const rotZW = time * (0.36 + black60 * 0.003);
    const rotXW = time * (0.29 + curiosity * 0.0028) + red60 * 0.01;
    const rotXY = time * (0.22 + energy * 0.0024) + blue60 * 0.008;
    const rotYZ = time * (0.31 + mood * 0.0022);
    const scale = 118 + bond * 0.75;

    return TESSERACT_VERTICES.map((vertex, index) => {
      let v = rotateZW(vertex, rotZW + index * 0.02);
      v = rotateXW(v, rotXW);
      v = rotateXY(v, rotXY);
      v = rotateYZ(v, rotYZ);
      return project4Dto2D(v, scale);
    });
  }, [time, black60, curiosity, red60, energy, blue60, mood, bond]);

  const helixPoints = useMemo(() => {
    const pointsA: Point2[] = [];
    const pointsB: Point2[] = [];
    const helixHeight = 440;
    const strandRadius = 72 + bond * 0.55;
    const rotZW = time * (0.36 + black60 * 0.003) * 0.5;
    const rotXW = (time * (0.29 + curiosity * 0.0028) + red60 * 0.01) * 0.35;
    const rotXY = (time * (0.22 + energy * 0.0024) + blue60 * 0.008) * 0.2;
    const tessScale = 150 + bond * 0.9;

    for (let i = 0; i < HELIX_POINTS; i++) {
      const progress = i / (HELIX_POINTS - 1);
      const y = lerp(-helixHeight / 2, helixHeight / 2, progress);
      const phase =
        progress * TAU * (3.2 + curiosity * 0.012) +
        time * (1.2 + energy * 0.018);
      const pulse = 1 + 0.22 * Math.sin(time * 3.1 + i * 0.3 + red60 * 0.04);

      const projectHelix = (offset: number) => {
        const x = Math.cos(phase + offset) * strandRadius * pulse;
        const z = Math.sin(phase + offset) * strandRadius * pulse;
        const w =
          Math.sin((phase + offset) * 0.5 + time * 0.6) *
          (0.8 + black60 * 0.008);
        const point = rotateXY(
          rotateXW(
            rotateZW(
              { x: x / tessScale, y: y / tessScale, z: z / tessScale, w },
              rotZW,
            ),
            rotXW,
          ),
          rotXY,
        );
        return project4Dto2D(point, 95);
      };

      pointsA.push(projectHelix(0));
      pointsB.push(projectHelix(Math.PI));
    }

    return { pointsA, pointsB };
  }, [time, bond, black60, curiosity, red60, energy, blue60]);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const orbit = time * (0.25 + energy * 0.002) + i * 0.51;
        const radius =
          92 + Math.sin(i * 1.7 + time * 1.8) * 54 + (100 - mood) * 0.18;
        return {
          id: i,
          x: Math.cos(orbit) * radius,
          y: Math.sin(orbit * 1.2) * (radius * 0.72),
          r: 1.8 + (i % 4) * 0.45,
          opacity: 0.28 + ((Math.sin(time * 2.4 + i) + 1) / 2) * 0.5,
          color: hsla(baseHue + i * 11 + red60 * 0.2, 100, 70, 0.9),
        };
      }),
    [time, energy, mood, baseHue, red60],
  );

  const surfaceBands = useMemo(
    () =>
      Array.from({ length: 7 }, (_, ui) => {
        const samples = Array.from({ length: 17 }, (_, vi) => {
          const u = (ui / 7) * TAU + time * 0.22;
          const v = (vi / 16) * TAU + time * 0.19;
          const tube = 0.38 + (black60 / 100) * 0.12;
          const cu = Math.cos(u);
          const su = Math.sin(u);
          const c2 = Math.cos(u / 2);
          const s2 = Math.sin(u / 2);
          const sv = Math.sin(v);
          const radius = 2.3 + tube * (c2 * sv - s2 * Math.sin(2 * v));
          let point: Vec4 = {
            x: radius * cu * 0.34,
            y: radius * su * 0.34,
            z: tube * (s2 * sv + c2 * Math.sin(2 * v)) * 1.35,
            w:
              (Math.sin(u) * Math.cos(v) + Math.sin(v * 2.2) * 0.4) *
              (0.7 + (black60 / 100) * 0.45),
          };
          point = rotateZW(point, time * 0.24);
          point = rotateXW(point, time * 0.17 + red60 * 0.003);
          point = rotateXY(point, time * 0.12 + blue60 * 0.004);
          point = rotateYZ(point, time * 0.15 + mood * 0.002);
          return project4Dto2D(point, 52);
        });

        return samples
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
          )
          .join(" ");
      }),
    [time, black60, red60, blue60, mood],
  );

  return (
    <g>
      <g opacity="0.95">
        <circle
          cx="0"
          cy="14"
          r="102"
          fill={hsla(baseHue + 210, 100, 50, 0.08)}
        />
        <circle
          cx="0"
          cy="14"
          r="132"
          fill="none"
          stroke={hsla(baseHue + 165, 100, 74, 0.18)}
          strokeWidth="4"
        />
        <circle
          cx="0"
          cy="14"
          r="84"
          fill="none"
          stroke={hsla(baseHue + 285, 100, 74, 0.22)}
          strokeWidth="2.5"
          strokeDasharray="5 8"
        />
      </g>

      {surfaceBands.map((path, index) => (
        <path
          key={`surface-${index}`}
          d={path}
          fill="none"
          stroke={hsla(baseHue + index * 17, 100, 70, 0.14)}
          strokeWidth="1"
          filter="url(#particleGlow)"
        />
      ))}

      {TESSERACT_EDGES.map(([a, b], index) => {
        const p1 = projectedVertices[a];
        const p2 = projectedVertices[b];
        const meta = buildMetaColor(
          time * 2 + index * 0.27 + black60 * 0.03,
          energy,
          mood,
          black60,
        );
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        return (
          <g key={`edge-${a}-${b}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={hsla(
                baseHue + index * 10,
                100,
                72,
                0.16 + ((p1.depth + p2.depth) / 2) * 0.08,
              )}
              strokeWidth={1 + ((p1.depth + p2.depth) / 2) * 0.8}
            />
            {index % 5 === 0 && (
              <g opacity="0.65" transform={`translate(${mx} ${my})`}>
                <text
                  x="8"
                  y="-4"
                  fill={hsla(baseHue + 30, 100, 82, 0.85)}
                  fontSize="6"
                  fontFamily="ui-monospace, monospace"
                >
                  {meta.binary}
                </text>
                <text
                  x="10"
                  y="6"
                  fill={hsla(baseHue + 90, 100, 78, 0.85)}
                  fontSize="6"
                  fontFamily="ui-monospace, monospace"
                >
                  {meta.hex}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {helixPoints.pointsA.map((point, index) => {
        if (index === 0) return null;
        const prevA = helixPoints.pointsA[index - 1];
        const prevB = helixPoints.pointsB[index - 1];
        const pointB = helixPoints.pointsB[index];
        const metaA = buildMetaColor(
          index * 0.32 + time * 1.8,
          red60,
          mood,
          black60,
        );
        const metaB = buildMetaColor(
          index * 0.32 + Math.PI / 2 + time * 2.1,
          blue60,
          mood,
          black60,
        );

        return (
          <g key={`helix-${index}`}>
            <line
              x1={prevA.x}
              y1={prevA.y}
              x2={point.x}
              y2={point.y}
              stroke={hsla(baseHue + metaA.r * 0.2, 100, 72, 0.45)}
              strokeWidth={1.5}
            />
            <line
              x1={prevB.x}
              y1={prevB.y}
              x2={pointB.x}
              y2={pointB.y}
              stroke={hsla(baseHue + metaB.b * 0.2 + 80, 100, 72, 0.45)}
              strokeWidth={1.5}
            />
            {index % 3 === 0 && (
              <line
                x1={point.x}
                y1={point.y}
                x2={pointB.x}
                y2={pointB.y}
                stroke={hsla(baseHue + index * 6, 100, 80, 0.24)}
                strokeWidth="1"
              />
            )}
          </g>
        );
      })}

      {helixPoints.pointsA.map((point, index) => {
        const pointB = helixPoints.pointsB[index];
        const metaA = buildMetaColor(
          index * 0.32 + time * 1.8,
          red60,
          mood,
          black60,
        );
        const metaB = buildMetaColor(
          index * 0.32 + Math.PI / 2 + time * 2.1,
          blue60,
          mood,
          black60,
        );

        return (
          <g key={`node-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill={hsla(baseHue + 160, 100, 60, 0.16)}
            />
            <circle
              cx={pointB.x}
              cy={pointB.y}
              r="8"
              fill={hsla(baseHue + 280, 100, 60, 0.16)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={3 + (index % 4) * 0.35}
              fill={metaA.hex}
              filter="url(#particleGlow)"
            />
            <circle
              cx={pointB.x}
              cy={pointB.y}
              r={3 + (index % 4) * 0.35}
              fill={metaB.hex}
              filter="url(#particleGlow)"
            />
          </g>
        );
      })}

      {particles.map((particle) => (
        <g key={`particle-${particle.id}`} opacity={particle.opacity}>
          <circle
            cx={particle.x}
            cy={particle.y}
            r={particle.r * 2.8}
            fill={particle.color}
            opacity="0.14"
          />
          <circle
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            fill={particle.color}
            filter="url(#particleGlow)"
          />
        </g>
      ))}

      <g transform="translate(-108 -108) scale(0.18)">
        <rect width="1200" height="1200" fill="rgba(5,6,13,0)" />

        <g opacity="0.32" filter="url(#addonGlow)">
          <circle cx="600" cy="590" r="300" stroke="#3E2A8F" strokeWidth="2" />
          <circle
            cx="600"
            cy="590"
            r="220"
            stroke="#2FBACF"
            strokeWidth="1.5"
          />
          <path
            d="M600 240L687 393L860 423L736 548L760 720L600 642L440 720L464 548L340 423L513 393L600 240Z"
            stroke="#8C6BFF"
            strokeWidth="2"
          />
        </g>

        <g filter="url(#addonGlow)">
          <path
            d="M300 300C385 205 485 160 600 160C715 160 815 205 900 300"
            stroke="#F3D87A"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M350 340C425 260 508 222 600 222C692 222 775 260 850 340"
            stroke="#F8E7A1"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.72"
          />
        </g>

        <g>
          <circle
            cx="300"
            cy="300"
            r="22"
            fill="#FFF1B8"
            stroke="#E7C96B"
            strokeWidth="6"
          />
          <circle
            cx="900"
            cy="300"
            r="22"
            fill="#FFF1B8"
            stroke="#E7C96B"
            strokeWidth="6"
          />
          <circle
            cx="390"
            cy="242"
            r="18"
            fill="#F7E6A8"
            stroke="#E7C96B"
            strokeWidth="5"
          />
          <circle
            cx="480"
            cy="194"
            r="16"
            fill="#F7E6A8"
            stroke="#E7C96B"
            strokeWidth="5"
          />
          <circle
            cx="600"
            cy="176"
            r="18"
            fill="#F7E6A8"
            stroke="#E7C96B"
            strokeWidth="5"
          />
          <circle
            cx="720"
            cy="194"
            r="16"
            fill="#F7E6A8"
            stroke="#E7C96B"
            strokeWidth="5"
          />
          <circle
            cx="810"
            cy="242"
            r="18"
            fill="#F7E6A8"
            stroke="#E7C96B"
            strokeWidth="5"
          />
        </g>

        <g opacity="0.9">
          <path
            d="M420 436C470 498 529 537 600 550C671 537 730 498 780 436"
            stroke="#F3D87A"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M450 470C492 517 542 547 600 558C658 547 708 517 750 470"
            stroke="#FCE8A4"
            strokeOpacity="0.65"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        <g filter="url(#addonGlow)">
          <circle
            cx="600"
            cy="625"
            r="136"
            fill="#0B0E27"
            stroke="#F3D87A"
            strokeWidth="12"
          />
          <circle
            cx="600"
            cy="625"
            r="112"
            fill="#101739"
            stroke="#F4D97E"
            strokeOpacity="0.65"
            strokeWidth="3"
          />
          <path
            d="M600 510L628 568L692 578L646 623L657 688L600 658L543 688L554 623L508 578L572 568L600 510Z"
            fill="url(#seraphicGemGlow)"
            stroke="#D9F8FF"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle
            cx="600"
            cy="625"
            r="84"
            stroke="#AEEBFF"
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          <circle
            cx="600"
            cy="625"
            r="58"
            stroke="#7E5CFF"
            strokeOpacity="0.8"
            strokeWidth="2"
          />
          <path
            d="M600 540L649 625L600 710L551 625L600 540Z"
            stroke="#E5F7FF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M515 625H685"
            stroke="#E5F7FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M600 540V710"
            stroke="#E5F7FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        <g opacity="0.7" filter="url(#addonGlow)">
          <circle
            cx="600"
            cy="625"
            r="185"
            stroke="#2ED3FF"
            strokeOpacity="0.18"
            strokeWidth="6"
          />
          <circle
            cx="600"
            cy="625"
            r="235"
            stroke="#7E4DFF"
            strokeOpacity="0.12"
            strokeWidth="4"
          />
        </g>

        <g>
          <path
            d="M485 730L455 845"
            stroke="#F3D87A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M600 760L600 900"
            stroke="#F3D87A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M715 730L745 845"
            stroke="#F3D87A"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle
            cx="455"
            cy="845"
            r="24"
            fill="#101739"
            stroke="#F3D87A"
            strokeWidth="7"
          />
          <circle
            cx="600"
            cy="900"
            r="32"
            fill="#101739"
            stroke="#F3D87A"
            strokeWidth="8"
          />
          <circle
            cx="745"
            cy="845"
            r="24"
            fill="#101739"
            stroke="#F3D87A"
            strokeWidth="7"
          />
          <circle cx="455" cy="845" r="10" fill="#5AE6FF" />
          <circle cx="600" cy="900" r="14" fill="#7E5CFF" />
          <circle cx="745" cy="845" r="10" fill="#5AE6FF" />
        </g>

        <g opacity="0.65">
          <path
            d="M530 360C553 339 576 328 600 328C624 328 647 339 670 360"
            stroke="#F8E7A1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M502 390C536 359 568 345 600 345C632 345 664 359 698 390"
            stroke="#F8E7A1"
            strokeOpacity="0.6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        <defs>
          <linearGradient
            id="seraphicGemGlow"
            x1="470"
            y1="420"
            x2="730"
            y2="760"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#7CF7FF" />
            <stop offset="50%" stopColor="#4F7CFF" />
            <stop offset="100%" stopColor="#7B3CFF" />
          </linearGradient>
        </defs>
      </g>
    </g>
  );
};
