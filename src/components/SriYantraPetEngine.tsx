"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { triggerHaptic } from "@/lib/haptics";

const VIEW = 1200;
const CX = 600;
const CY = 540;
const REGIONS = [
  "binduCore",
  "innerTriangles",
  "midTriangles",
  "outerTriangles",
  "chestShell",
  "spineAxis",
  "shoulderNodes",
  "hipNodes",
  "haloRings",
  "orbitMachinery",
];

export type PetInteractiveZone = "crown" | "eyes" | "core" | "void" | "tail";

export type PetReactionState = {
  zone: PetInteractiveZone;
  label: string;
  intensity: number;
  startedAt: number;
};

export type PetMovementPreset =
  | "idle"
  | "wave"
  | "dab"
  | "shuffle"
  | "walk"
  | "dance"
  | "lotus";

export const PET_MOVEMENT_PRESETS = [
  "idle",
  "wave",
  "dab",
  "shuffle",
  "walk",
  "dance",
  "lotus",
] as const satisfies readonly PetMovementPreset[];

type PetPoint = { x: number; y: number };
type PetLimbId = "arm-left" | "arm-right" | "leg-left" | "leg-right";
type PetLimbTransform = {
  rotate?: number;
  translateX?: number;
  translateY?: number;
};
type PetMovementProfile = {
  motionScale: number;
  motionBias: number;
  bodyX: number;
  bodyY: number;
  bodyRotate: number;
  headTilt: number;
  gazeX: number;
  gazeY: number;
  tailSwing: number;
  jaw: number;
  ringSpeed: number;
  eyeSquint: number;
  limbTransforms: Partial<Record<PetLimbId, PetLimbTransform>>;
};

const BASE_MOVEMENT_PROFILE: PetMovementProfile = {
  motionScale: 1,
  motionBias: 0,
  bodyX: 0,
  bodyY: 0,
  bodyRotate: 0,
  headTilt: 0,
  gazeX: 0,
  gazeY: 0,
  tailSwing: 0,
  jaw: 0,
  ringSpeed: 1,
  eyeSquint: 0,
  limbTransforms: {},
};

function createMovementProfile(
  overrides: Partial<PetMovementProfile>,
): PetMovementProfile {
  return {
    ...BASE_MOVEMENT_PROFILE,
    ...overrides,
    limbTransforms: {
      ...BASE_MOVEMENT_PROFILE.limbTransforms,
      ...overrides.limbTransforms,
    },
  };
}

function getMovementProfile(
  movement: PetMovementPreset,
  time: number,
): PetMovementProfile {
  switch (movement) {
    case "wave": {
      const wave = Math.sin(time * 5.2);
      const greet = Math.sin(time * 2.1);

      return createMovementProfile({
        motionScale: 1.08,
        motionBias: 0.1,
        bodyX: 12 + greet * 3,
        bodyY: Math.max(0, greet) * 6,
        bodyRotate: 4 + greet * 1.5,
        headTilt: 8 + wave * 2.5,
        gazeX: 9,
        gazeY: -4,
        tailSwing: 10 + Math.sin(time * 3.6) * 4,
        jaw: 2 + Math.max(0, wave) * 2,
        ringSpeed: 1.08,
        eyeSquint: 0.05,
        limbTransforms: {
          "arm-left": {
            rotate: 82 + wave * 12,
            translateX: -4,
            translateY: -12,
          },
          "arm-right": {
            rotate: 8 + greet * 4,
            translateX: 2,
          },
          "leg-left": { rotate: -6, translateX: -2, translateY: 2 },
          "leg-right": { rotate: 6, translateX: 2, translateY: -2 },
        },
      });
    }
    case "dab": {
      const groove = Math.sin(time * 2.8);

      return createMovementProfile({
        motionScale: 1.12,
        motionBias: 0.06,
        bodyX: -16,
        bodyY: 6 + Math.max(0, groove) * 6,
        bodyRotate: -16 + groove * 2,
        headTilt: -30 + groove * 2,
        gazeX: -18,
        gazeY: -10,
        tailSwing: 16 + Math.sin(time * 4.3) * 6,
        jaw: 1,
        ringSpeed: 1.18,
        eyeSquint: 0.12,
        limbTransforms: {
          "arm-left": {
            rotate: 138 + groove * 6,
            translateX: 28,
            translateY: -20,
          },
          "arm-right": {
            rotate: -76 - groove * 8,
            translateX: 16,
            translateY: -22,
          },
          "leg-left": { rotate: 10, translateX: -8 },
          "leg-right": { rotate: -14, translateX: 8, translateY: -4 },
        },
      });
    }
    case "shuffle": {
      const sway = Math.sin(time * 4.2);
      const beat = Math.cos(time * 8.4);

      return createMovementProfile({
        motionScale: 1.18,
        motionBias: 0.08,
        bodyX: sway * 24,
        bodyY: Math.abs(beat) * 10,
        bodyRotate: sway * 5,
        headTilt: -sway * 4,
        gazeX: sway * 6,
        gazeY: 2,
        tailSwing: sway * 20 + beat * 4,
        jaw: Math.max(0, beat) * 2,
        ringSpeed: 1.25,
        eyeSquint: 0.02,
        limbTransforms: {
          "arm-left": {
            rotate: 22 + sway * 18,
            translateX: -10,
            translateY: 8,
          },
          "arm-right": {
            rotate: -22 + sway * 18,
            translateX: 10,
            translateY: -6,
          },
          "leg-left": { rotate: -18 - sway * 20, translateX: -10 },
          "leg-right": { rotate: 18 - sway * 20, translateX: 10 },
        },
      });
    }
    case "walk": {
      const stride = Math.sin(time * 3.1);
      const lift = (Math.cos(time * 3.1) + 1) * 0.5;

      return createMovementProfile({
        motionScale: 1.14,
        bodyX: stride * 10,
        bodyY: lift * 10,
        bodyRotate: stride * 3,
        headTilt: stride * 2,
        gazeX: stride * 4,
        tailSwing: stride * 14,
        jaw: lift * 1.2,
        ringSpeed: 1.1,
        limbTransforms: {
          "arm-left": {
            rotate: 16 + stride * 20,
            translateX: -4,
            translateY: 4,
          },
          "arm-right": {
            rotate: -16 - stride * 20,
            translateX: 4,
            translateY: -4,
          },
          "leg-left": {
            rotate: -18 - stride * 26,
            translateX: -6,
          },
          "leg-right": {
            rotate: 18 + stride * 26,
            translateX: 6,
          },
        },
      });
    }
    case "dance": {
      const bounce = Math.sin(time * 5.4);
      const sway = Math.sin(time * 2.7);

      return createMovementProfile({
        motionScale: 1.36,
        motionBias: 0.16,
        bodyX: sway * 18,
        bodyY: Math.abs(bounce) * 18,
        bodyRotate: sway * 8,
        headTilt: bounce * 4 - sway * 2,
        gazeX: sway * 10,
        gazeY: -3 + Math.cos(time * 5.4) * 2,
        tailSwing: sway * 22 + Math.sin(time * 7.2) * 10,
        jaw: Math.max(0, bounce) * 3,
        ringSpeed: 1.45,
        eyeSquint: 0.04,
        limbTransforms: {
          "arm-left": {
            rotate: 52 + bounce * 20,
            translateX: -6,
            translateY: -8,
          },
          "arm-right": {
            rotate: -52 + bounce * 20,
            translateX: 6,
            translateY: -8,
          },
          "leg-left": { rotate: -12 - sway * 18, translateX: -4 },
          "leg-right": { rotate: 12 + sway * 18, translateX: 4 },
        },
      });
    }
    case "lotus": {
      const drift = Math.sin(time * 1.35);

      return createMovementProfile({
        motionScale: 0.42,
        motionBias: 0.06,
        bodyY: 24 + drift * 4,
        bodyRotate: drift * 1.5,
        headTilt: drift * 2,
        gazeY: -6,
        tailSwing: drift * 3,
        ringSpeed: 0.42,
        eyeSquint: 0.2,
        limbTransforms: {
          "arm-left": {
            rotate: 54 + drift * 4,
            translateX: 24,
            translateY: 28,
          },
          "arm-right": {
            rotate: -54 - drift * 4,
            translateX: -24,
            translateY: 28,
          },
          "leg-left": {
            rotate: 74 + drift * 2,
            translateX: 18,
            translateY: -32,
          },
          "leg-right": {
            rotate: -74 - drift * 2,
            translateX: -18,
            translateY: -32,
          },
        },
      });
    }
    case "idle":
    default:
      return BASE_MOVEMENT_PROFILE;
  }
}

function rotatePoint(point: PetPoint, anchor: PetPoint, angle: number): PetPoint {
  if (!angle) {
    return point;
  }

  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;

  return {
    x: anchor.x + dx * cos - dy * sin,
    y: anchor.y + dx * sin + dy * cos,
  };
}

function transformJoints(
  joints: PetPoint[],
  transform?: PetLimbTransform,
): PetPoint[] {
  if (!transform) {
    return joints;
  }

  const translateX = transform.translateX ?? 0;
  const translateY = transform.translateY ?? 0;
  const anchor = {
    x: joints[0].x + translateX,
    y: joints[0].y + translateY,
  };

  return joints.map((joint) =>
    rotatePoint(
      {
        x: joint.x + translateX,
        y: joint.y + translateY,
      },
      anchor,
      transform.rotate ?? 0,
    ),
  );
}

function sanitizeDigits(s: string | number) {
  const c = (String(s) || "").replace(/\D+/g, "");
  return c.length ? c : "00000000000000000000";
}

function digitAt(s: string | number, i: number): number {
  const d = sanitizeDigits(s);
  return Number(d[((i % d.length) + d.length) % d.length]) || 0;
}

function sampleRegion(
  packets: {
    red: string | number;
    blue: string | number;
    black: string | number;
  },
  index: number,
  phaseR = 0,
  phaseB = 0,
  phaseK = 0,
) {
  const r = digitAt(packets.red, index * 3 + phaseR);
  const b = digitAt(packets.blue, index * 5 + phaseB);
  const k = digitAt(packets.black, index * 7 + phaseK);
  const build = r + b - k;
  const edge = 2 * r + b;
  const flow = 2 * b + r - k;
  const voidv = 2 * k + 1 - b;
  const formClass = (2 * r + 3 * b + 5 * k) % 5;
  const active = build >= 6;
  const sharpened = edge >= 11;
  const bridged = flow >= 9;
  const hollowed = voidv >= 10;
  const weight =
    Math.max(0, build) + edge * 0.35 + flow * 0.25 + (hollowed ? 2 : 0);
  return {
    id: REGIONS[index],
    index,
    r,
    b,
    k,
    build,
    edge,
    flow,
    voidv,
    formClass,
    active,
    sharpened,
    bridged,
    hollowed,
    weight,
  };
}

function trianglePoints(radius: number, rotationDeg: number) {
  const a = ((rotationDeg - 90) * Math.PI) / 180;
  return [0, 1, 2].map((i) => {
    const t = a + (i * Math.PI * 2) / 3;
    return { x: CX + Math.cos(t) * radius, y: CY + Math.sin(t) * radius };
  });
}

function trianglePath(pts: Array<{ x: number; y: number }>) {
  return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)} L ${pts[2].x.toFixed(2)} ${pts[2].y.toFixed(2)} Z`;
}

function linePath(pts: Array<{ x: number; y: number }>) {
  if (!pts.length) return "";
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
}

function buildTriangles(
  regions: ReturnType<typeof sampleRegion>[],
  motion = 0,
) {
  const inner = regions[1];
  const mid = regions[2];
  const outer = regions[3];
  const chest = regions[4];
  const halo = regions[8];
  const specs: any[] = [];
  const upRadii = [376, 332, 286, 236, 176];
  const downRadii = [318, 270, 220, 138];
  const upRotBase = [-4, 6, 16, 26, 36];
  const downRotBase = [180, 192, 206, 220];

  upRadii.forEach((baseRadius, i) => {
    const radius =
      baseRadius +
      outer.r * (i < 2 ? 5.5 : 2.4) +
      inner.b * (4 - i) * 0.8 -
      inner.k * i * 0.65 +
      (i === 0 && outer.sharpened ? 28 : 0) +
      motion * (14 - i * 2.2);
    const crownLift = 24 + outer.edge * 0.65 + i * 8 + motion * (18 - i * 2);
    const shoulderSpread = 46 + chest.r * 2.8 + (4 - i) * 4;
    const waistPinch = 18 + inner.k * 1.4 + i * 3.5 - motion * 4.5;
    const rot = upRotBase[i] + inner.b * 1.15 - outer.k * 0.45;
    const pts = trianglePoints(radius, rot).map((p, idx) => {
      if (idx === 0) {
        return { x: p.x, y: p.y - crownLift };
      }
      const sign = idx === 1 ? 1 : -1;
      return { x: p.x + sign * shoulderSpread, y: p.y + waistPinch };
    });
    specs.push({
      id: `up-${i}`,
      family: "up",
      role:
        i === 0
          ? "crownBlade"
          : i === 1
            ? "throatSpear"
            : i === 2
              ? "heartFrame"
              : i === 3
                ? "bellyFurnace"
                : "rootAnchor",
      points: pts,
      direction: "up",
      tier: i < 2 ? "outer" : i < 4 ? "mid" : "inner",
      strokeWidth: Math.max(
        2,
        5.4 - i * 0.68 + outer.r * 0.08 + chest.r * 0.03,
      ),
      opacity: 0.84 - i * 0.08,
      glow: 0.22 + (4 - i) * 0.03,
    });
  });

  downRadii.forEach((baseRadius, i) => {
    const radius =
      baseRadius +
      mid.b * (4.8 - i * 0.55) +
      (outer.active ? 1 : 0) * 14 -
      outer.k * 0.7 * i +
      halo.b * 0.5 +
      motion * (8 - i * 1.8);
    const canopyDrop = 12 + mid.b * 1.8 + i * 11 - motion * 8;
    const jawPull = 30 + outer.k * 2.3 + i * 5;
    const sealRise = 22 + chest.b * 1.7 + (3 - i) * 4 + motion * 5.2;
    const rot = downRotBase[i] - outer.k * 1.05 + mid.b * 0.55;
    const pts = trianglePoints(radius, rot).map((p, idx) => {
      if (idx === 0) {
        return { x: p.x, y: p.y + canopyDrop };
      }
      const sign = idx === 1 ? 1 : -1;
      return { x: p.x + sign * jawPull, y: p.y - sealRise };
    });
    specs.push({
      id: `down-${i}`,
      family: "down",
      role:
        i === 0
          ? "oracleHood"
          : i === 1
            ? "maskGate"
            : i === 2
              ? "ribVault"
              : "wombSeal",
      points: pts,
      direction: "down",
      tier: i < 1 ? "outer" : i < 3 ? "mid" : "inner",
      strokeWidth: Math.max(1.9, 4.9 - i * 0.6 + mid.b * 0.08),
      opacity: 0.8 - i * 0.09,
      glow: 0.18 + (3 - i) * 0.035,
    });
  });

  return specs;
}

function buildRings(regions: ReturnType<typeof sampleRegion>[], motion = 0) {
  const halo = regions[8];
  const orbit = regions[9];
  const inner = regions[1];
  return [
    {
      id: "halo-outer",
      radius: 396 + halo.r * 2 + motion * 12,
      strokeWidth: 2.2 + halo.b * 0.05,
      opacity: halo.active ? 0.42 : 0.18,
      dash: orbit.bridged ? "3 12" : null,
      hue: "blue",
      rotateSpeed: 0.0018 + orbit.b * 0.00008,
    },
    {
      id: "halo-mid",
      radius: 292 + halo.b * 2 + motion * 8,
      strokeWidth: 1.8,
      opacity: 0.28,
      dash: null,
      hue: "gold",
      rotateSpeed: -0.0012 - halo.k * 0.00006,
    },
    {
      id: "halo-core",
      radius: 152 + inner.r + motion * 4,
      strokeWidth: 1.6,
      opacity: 0.4,
      dash: "2 10",
      hue: "violet",
      rotateSpeed: 0.0026,
    },
  ];
}

function buildBodyPath(regions: ReturnType<typeof sampleRegion>[], motion = 0) {
  const shoulders = 214 + regions[6].r * 6 + motion * 10;
  const hips = 176 + regions[7].b * 5 + motion * 7;
  const crown = 330 + regions[3].r * 5 - motion * 16;
  const hem = 434 + regions[7].k * 4 + motion * 18;
  const chestLift = motion * 18;
  const torsoEase = motion * 14;
  return [
    `M ${CX} ${CY - crown}`,
    `C ${CX + shoulders * 0.62} ${CY - 292 - chestLift}, ${CX + shoulders} ${CY - 182 - torsoEase * 0.4}, ${CX + shoulders} ${CY - 40 - torsoEase}`,
    `C ${CX + shoulders} ${CY + 82 + torsoEase * 0.2}, ${CX + hips} ${CY + 212 + torsoEase * 0.6}, ${CX + hips * 0.82} ${CY + 328 + motion * 8}`,
    `C ${CX + hips * 0.7} ${CY + 398}, ${CX + 118} ${CY + hem * 0.82}, ${CX} ${CY + hem}`,
    `C ${CX - 118} ${CY + hem * 0.82}, ${CX - hips * 0.7} ${CY + 398}, ${CX - hips * 0.82} ${CY + 328 + motion * 8}`,
    `C ${CX - hips} ${CY + 212 + torsoEase * 0.6}, ${CX - shoulders} ${CY + 82 + torsoEase * 0.2}, ${CX - shoulders} ${CY - 40 - torsoEase}`,
    `C ${CX - shoulders} ${CY - 182 - torsoEase * 0.4}, ${CX - shoulders * 0.62} ${CY - 292 - chestLift}, ${CX} ${CY - crown}`,
    "Z",
  ].join(" ");
}

function buildLimbs(regions: ReturnType<typeof sampleRegion>[], motion = 0) {
  const sy = CY + 20 - motion * 8;
  const hy = CY + 312 + motion * 12;
  const ar = 220 + regions[6].r * 8;
  const ld = 254 + regions[7].b * 8;
  const eo = 112 + regions[6].b * 6;
  const ko = 72 + regions[7].r * 3;
  const wa = 8 + Math.max(regions[6].r, regions[6].b) * 0.4;
  const wl = 10 + Math.max(regions[7].r, regions[7].b) * 0.42;
  const armSwing = motion * (24 + regions[6].b * 1.1);
  const legSwing = motion * (18 + regions[7].b * 0.9);
  return [
    {
      id: "arm-left",
      side: "left",
      kind: "arm",
      joints: [
        { x: CX - 176, y: sy },
        { x: CX - 176 - eo + armSwing * 0.25, y: sy + 86 - armSwing * 0.35 },
        { x: CX - 176 - ar + armSwing, y: sy + 154 - armSwing * 0.45 },
      ],
      width: wa,
      opacity: 0.64,
    },
    {
      id: "arm-right",
      side: "right",
      kind: "arm",
      joints: [
        { x: CX + 176, y: sy },
        { x: CX + 176 + eo - armSwing * 0.25, y: sy + 86 + armSwing * 0.35 },
        { x: CX + 176 + ar - armSwing, y: sy + 154 + armSwing * 0.45 },
      ],
      width: wa,
      opacity: 0.64,
    },
    {
      id: "leg-left",
      side: "left",
      kind: "leg",
      joints: [
        { x: CX - 86, y: hy },
        { x: CX - 86 - ko + legSwing * 0.22, y: hy + 142 + legSwing * 0.2 },
        { x: CX - 92 + legSwing * 0.18, y: hy + ld - legSwing * 0.35 },
      ],
      width: wl,
      opacity: 0.58,
    },
    {
      id: "leg-right",
      side: "right",
      kind: "leg",
      joints: [
        { x: CX + 86, y: hy },
        { x: CX + 86 + ko - legSwing * 0.22, y: hy + 142 - legSwing * 0.2 },
        { x: CX + 92 - legSwing * 0.18, y: hy + ld + legSwing * 0.35 },
      ],
      width: wl,
      opacity: 0.58,
    },
  ];
}

function buildVoids(regions: ReturnType<typeof sampleRegion>[]) {
  const bindu = regions[0];
  const spine = regions[5];
  const outer = regions[3];
  const cv = 36 + bindu.k * 3;
  const ew = 10 + outer.k;
  const eh = 20 + bindu.k * 1.6;
  return [
    {
      id: "iris",
      opacity: bindu.hollowed ? 0.92 : 0.4,
      path: `M ${CX} ${CY - 72} C ${CX + cv} ${CY - 72}, ${CX + 64} ${CY - 28}, ${CX + 64} ${CY + 10} C ${CX + 64} ${CY + 38}, ${CX + 42} ${CY + 68}, ${CX} ${CY + 112} C ${CX - 42} ${CY + 68}, ${CX - 64} ${CY + 38}, ${CX - 64} ${CY + 10} C ${CX - 64} ${CY - 28}, ${CX - cv} ${CY - 72}, ${CX} ${CY - 72} Z`,
    },
    {
      id: "eye-left",
      opacity: outer.hollowed ? 0.9 : 0.22,
      path: `M ${CX - 54 - ew} ${CY - 22} C ${CX - 54} ${CY - 22 - eh}, ${CX - 36} ${CY - 22 - eh}, ${CX - 28 + ew * 0.3} ${CY - 22} C ${CX - 36} ${CY - 6 + eh * 0.35}, ${CX - 54} ${CY - 6 + eh * 0.35}, ${CX - 54 - ew} ${CY - 22} Z`,
    },
    {
      id: "eye-right",
      opacity: outer.hollowed ? 0.9 : 0.22,
      path: `M ${CX + 54 + ew} ${CY - 22} C ${CX + 54} ${CY - 22 - eh}, ${CX + 36} ${CY - 22 - eh}, ${CX + 28 - ew * 0.3} ${CY - 22} C ${CX + 36} ${CY - 6 + eh * 0.35}, ${CX + 54} ${CY - 6 + eh * 0.35}, ${CX + 54 + ew} ${CY - 22} Z`,
    },
    {
      id: "spine-slit",
      opacity: spine.hollowed ? 0.88 : 0.28,
      path: `M ${CX} ${CY + 148} L ${CX + 22} ${CY + 226} L ${CX} ${CY + 316} L ${CX - 22} ${CY + 226} Z`,
    },
  ];
}

function buildCenterGlyph(ct: number) {
  switch (ct % 7) {
    case 0:
      return `M ${CX} ${CY - 20} A 20 20 0 1 1 ${CX - 0.01} ${CY - 20} Z`;
    case 1:
      return `M ${CX} ${CY - 34} C ${CX + 22} ${CY - 34}, ${CX + 34} ${CY - 10}, ${CX + 34} ${CY + 8} C ${CX + 34} ${CY + 26}, ${CX + 18} ${CY + 44}, ${CX} ${CY + 60} C ${CX - 18} ${CY + 44}, ${CX - 34} ${CY + 26}, ${CX - 34} ${CY + 8} C ${CX - 34} ${CY - 10}, ${CX - 22} ${CY - 34}, ${CX} ${CY - 34} Z`;
    case 2:
      return trianglePath(trianglePoints(42, 0));
    case 3:
      return `${trianglePath(trianglePoints(40, 0))} ${trianglePath(trianglePoints(26, 180))}`;
    case 4:
      return `${trianglePath(trianglePoints(44, 0))} ${trianglePath(trianglePoints(24, 180))}`;
    case 5:
      return `M ${CX} ${CY - 28} A 28 28 0 1 1 ${CX - 0.01} ${CY - 28} Z M ${CX} ${CY - 11} A 11 11 0 1 0 ${CX - 0.01} ${CY - 11} Z`;
    default:
      return `M ${CX} ${CY - 42} L ${CX + 30} ${CY - 6} L ${CX + 12} ${CY + 42} L ${CX - 12} ${CY + 42} L ${CX - 30} ${CY - 6} Z`;
  }
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return [
    `M ${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
    `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 0 ${(cx + rx).toFixed(2)} ${cy.toFixed(2)}`,
    `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 0 ${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function almondPath(cx: number, cy: number, rx: number, ry: number) {
  return [
    `M ${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx - rx * 0.4).toFixed(2)} ${(cy - ry).toFixed(2)}, ${(cx + rx * 0.4).toFixed(2)} ${(cy - ry).toFixed(2)}, ${(cx + rx).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx + rx * 0.4).toFixed(2)} ${(cy + ry).toFixed(2)}, ${(cx - rx * 0.4).toFixed(2)} ${(cy + ry).toFixed(2)}, ${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function buildFaceArchitecture(
  regions: ReturnType<typeof sampleRegion>[],
  motion = 0,
) {
  const bindu = regions[0];
  const inner = regions[1];
  const outer = regions[3];
  const chest = regions[4];
  const shoulders = regions[6];
  const hips = regions[7];
  const orbit = regions[9];

  const topY = CY - 206 - outer.r * 4 - motion * 12;
  const templeX = 124 + outer.b * 4 + shoulders.r * 1.6;
  const cheekY = CY + 8 + inner.b * 2 + motion * 4;
  const jawY = CY + 132 + bindu.b * 3 + hips.k * 0.6 + motion * 10;
  const jawX = 86 + bindu.k * 2 + chest.b * 0.45;
  const maskWidth = templeX * 0.78;
  const maskJaw = jawX * 0.82;
  const maskTop = topY + 36;
  const maskCheekY = CY + 24 + motion * 3;
  const maskJawY = jawY - 28;
  const muzzleWidth = 76 + bindu.r * 2 + inner.b * 1.3;
  const muzzleHeight = 54 + inner.k * 2 + bindu.b * 0.8 + motion * 2.5;
  const muzzleY = CY + 42 + inner.b * 1.4 + motion * 4.5;
  const eyeX = 72 + outer.r * 1.6;
  const eyeY = CY - 20 - outer.k * 1.2 + inner.b * 0.8 - motion * 2;
  const eyeWidth = 30 + inner.r * 0.8;
  const eyeHeight = 18 + bindu.b * 0.65 + outer.b * 0.2;
  const browY = eyeY - 18;
  const browLift = 34 + outer.r * 0.35;
  const mouthY = CY + 74 + bindu.b * 1.6 + motion * 5;
  const mouthWidth = 48 + bindu.r * 1.4 + orbit.b;
  const mouthCurve = 10 + (chest.b - bindu.k) * 0.7;
  const noseY = muzzleY - 10;
  const whiskerSpread = 48 + chest.r * 1.4 + orbit.b * 0.85;
  const whiskerLift = 18 + outer.b * 0.8;
  const chinY = mouthY + 30;

  const shellPath = [
    `M ${CX} ${topY}`,
    `C ${CX + templeX * 0.25} ${topY + 22}, ${CX + templeX} ${CY - 122}, ${CX + templeX} ${cheekY}`,
    `C ${CX + templeX} ${CY + 64}, ${CX + jawX} ${jawY}, ${CX} ${jawY}`,
    `C ${CX - jawX} ${jawY}, ${CX - templeX} ${CY + 64}, ${CX - templeX} ${cheekY}`,
    `C ${CX - templeX} ${CY - 122}, ${CX - templeX * 0.25} ${topY + 22}, ${CX} ${topY}`,
    "Z",
  ].join(" ");

  const maskPath = [
    `M ${CX} ${maskTop}`,
    `C ${CX + maskWidth * 0.2} ${maskTop + 18}, ${CX + maskWidth} ${CY - 62}, ${CX + maskWidth} ${maskCheekY}`,
    `C ${CX + maskWidth} ${CY + 74}, ${CX + maskJaw} ${maskJawY}, ${CX} ${maskJawY}`,
    `C ${CX - maskJaw} ${maskJawY}, ${CX - maskWidth} ${CY + 74}, ${CX - maskWidth} ${maskCheekY}`,
    `C ${CX - maskWidth} ${CY - 62}, ${CX - maskWidth * 0.2} ${maskTop + 18}, ${CX} ${maskTop}`,
    "Z",
  ].join(" ");

  return {
    topY,
    templeX,
    jawY,
    maskWidth,
    maskJawY,
    muzzleY,
    muzzleWidth,
    muzzleHeight,
    shellPath,
    maskPath,
    muzzlePath: ellipsePath(CX, muzzleY, muzzleWidth, muzzleHeight),
    nosePath: `M ${CX} ${noseY - 18} L ${CX + 18} ${noseY + 4} L ${CX} ${noseY + 24} L ${CX - 18} ${noseY + 4} Z`,
    browPath: `M ${CX - eyeX - eyeWidth} ${browY} Q ${CX} ${browY - browLift} ${CX + eyeX + eyeWidth} ${browY}`,
    mouthBaseY: mouthY,
    mouthWidth,
    mouthCurve,
    chinPath: `M ${CX - 24} ${chinY} Q ${CX} ${chinY + 24} ${CX + 24} ${chinY}`,
    eyeX,
    eyeY,
    eyeWidth,
    eyeHeight,
    whiskers: [
      {
        id: "left-upper",
        path: `M ${CX - muzzleWidth * 0.78} ${mouthY - 6} Q ${CX - muzzleWidth - whiskerSpread * 0.72} ${mouthY - whiskerLift} ${CX - muzzleWidth - whiskerSpread - 18} ${mouthY - 12}`,
      },
      {
        id: "left-lower",
        path: `M ${CX - muzzleWidth * 0.72} ${mouthY + 10} Q ${CX - muzzleWidth - whiskerSpread * 0.7} ${mouthY + whiskerLift * 0.5} ${CX - muzzleWidth - whiskerSpread} ${mouthY + 22}`,
      },
      {
        id: "right-upper",
        path: `M ${CX + muzzleWidth * 0.78} ${mouthY - 6} Q ${CX + muzzleWidth + whiskerSpread * 0.72} ${mouthY - whiskerLift} ${CX + muzzleWidth + whiskerSpread + 18} ${mouthY - 12}`,
      },
      {
        id: "right-lower",
        path: `M ${CX + muzzleWidth * 0.72} ${mouthY + 10} Q ${CX + muzzleWidth + whiskerSpread * 0.7} ${mouthY + whiskerLift * 0.5} ${CX + muzzleWidth + whiskerSpread} ${mouthY + 22}`,
      },
    ],
    crestPaths: [
      `M ${CX - 28} ${topY + 44} Q ${CX} ${topY + 12} ${CX + 28} ${topY + 44}`,
      `M ${CX - 18} ${topY + 78} Q ${CX} ${topY + 54} ${CX + 18} ${topY + 78}`,
    ],
    hornLeftPath: `M ${CX - 94} ${topY + 70} Q ${CX - 166} ${topY + 26} ${CX - 184} ${topY - 34} Q ${CX - 132} ${topY + 6} ${CX - 116} ${topY + 92} Z`,
    hornRightPath: `M ${CX + 94} ${topY + 70} Q ${CX + 166} ${topY + 26} ${CX + 184} ${topY - 34} Q ${CX + 132} ${topY + 6} ${CX + 116} ${topY + 92} Z`,
  };
}

function buildTail(regions: ReturnType<typeof sampleRegion>[]) {
  const hips = regions[7];
  const orbit = regions[9];
  const baseX = CX + 126;
  const baseY = CY + 274;
  const tipX = CX + 316 + orbit.r * 4;
  const tipY = CY + 314 + hips.k * 4;

  return {
    baseX,
    baseY,
    spinePath: `M ${baseX} ${baseY} C ${CX + 184} ${CY + 228}, ${CX + 248 + hips.b * 4} ${CY + 220 - orbit.k * 5}, ${tipX} ${tipY}`,
    finPath: `M ${tipX - 24} ${tipY - 16} Q ${tipX + 46 + orbit.b * 2} ${tipY - 42 - orbit.r} ${tipX + 26} ${tipY + 24} Q ${tipX + 6} ${tipY + 8} ${tipX - 24} ${tipY - 16} Z`,
  };
}

function packetForces(regions: ReturnType<typeof sampleRegion>[]) {
  const r = regions.reduce((a, x) => a + x.edge, 0);
  const b = regions.reduce((a, x) => a + x.flow, 0);
  const k = regions.reduce((a, x) => a + x.voidv, 0);
  return {
    red: +r.toFixed(1),
    blue: +b.toFixed(1),
    black: +k.toFixed(1),
    symmetry: +Math.max(
      0,
      100 - Math.abs(r - b) - Math.abs(b - k) * 0.5,
    ).toFixed(1),
  };
}

function inferSpecies(f: { red: number; blue: number; black: number }) {
  if (f.red > f.blue + 18 && f.red > f.black + 12) return "crown-predator";
  if (f.blue > f.red + 10 && f.blue > f.black + 10) return "temple-guardian";
  if (f.black > f.red && f.black > f.blue) return "void-oracle";
  if (Math.abs(f.red - f.blue) < 10 && Math.abs(f.blue - f.black) < 16)
    return "balanced-engine";
  return "split-hybrid";
}

const SM: Record<string, { label: string; color: string; desc: string }> = {
  "crown-predator": {
    label: "Crown Predator",
    color: "#F4D07A",
    desc: "Sigil-faced hunter with a breathing crown, predatory eyes, and sharpened temple armor.",
  },
  "temple-guardian": {
    label: "Temple Guardian",
    color: "#63C0FF",
    desc: "A living ritual guardian with calm machine symmetry, steady breath, and watchful reactor eyes.",
  },
  "void-oracle": {
    label: "Void Oracle",
    color: "#CAA3FF",
    desc: "A hollow-faced oracle carrying black-channel breath, occult slits, and slow night-tide motion.",
  },
  "balanced-engine": {
    label: "Balanced Engine",
    color: "#7FFFD4",
    desc: "A poised organism where body, face, crown, and void stay in rare living accord.",
  },
  "split-hybrid": {
    label: "Split Hybrid",
    color: "#FFB347",
    desc: "A feral hybrid with mixed crown, circuit, and void impulses fighting across one living shell.",
  },
};

function SvgPet({
  pet,
  time,
  showConstellation,
  showScaffold,
  idPrefix,
  movement = "idle",
  interactive = false,
  activeZone = null,
  reaction = null,
  gazeTarget = null,
  onZoneHover,
  onZoneTap,
}: {
  pet: any;
  time: number;
  showConstellation: boolean;
  showScaffold: boolean;
  idPrefix: string;
  movement?: PetMovementPreset;
  interactive?: boolean;
  activeZone?: PetInteractiveZone | null;
  reaction?: PetReactionState | null;
  gazeTarget?: { x: number; y: number } | null;
  onZoneHover?: (zone: PetInteractiveZone | null) => void;
  onZoneTap?: (zone: PetInteractiveZone) => void;
}) {
  const bgId = `${idPrefix}-bg`;
  const goldId = `${idPrefix}-gold`;
  const blueId = `${idPrefix}-blue`;
  const violetId = `${idPrefix}-violet`;
  const emberId = `${idPrefix}-ember`;
  const glowId = `${idPrefix}-glow`;
  const softGlowId = `${idPrefix}-sg`;
  const bodyClipId = `${idPrefix}-bc`;
  const voidMaskId = `${idPrefix}-vm`;

  const reactionProgress = reaction?.intensity ?? 0;
  const focusedZone = activeZone ?? reaction?.zone ?? null;
  const zoneBoost = (zone: PetInteractiveZone) =>
    focusedZone === zone
      ? (activeZone === zone ? 0.22 : 0.12) +
        (reaction?.zone === zone ? reactionProgress * reaction.intensity : 0)
      : 0;
  const crownBoost = zoneBoost("crown");
  const eyesBoost = zoneBoost("eyes");
  const coreBoost = zoneBoost("core");
  const voidBoost = zoneBoost("void");
  const tailBoost = zoneBoost("tail");
  const movementProfile = getMovementProfile(movement, time);

  const breathBase = Math.sin(
    time * (1.16 + pet.regions[1].b * 0.03) + pet.regions[0].r * 0.2,
  );
  const breath = breathBase * (1 + coreBoost * 0.4) + coreBoost * 0.22;
  const pulse =
    (Math.sin(time * 1.94 + pet.regions[4].b * 0.45) + 1) *
    0.5 *
    (1 + coreBoost * 0.7);
  const blinkA = Math.pow(
    Math.max(0, Math.sin(time * 0.72 + pet.regions[0].k * 0.3)),
    18,
  );
  const blinkB = Math.pow(
    Math.max(0, Math.sin(time * 0.23 + pet.regions[3].b * 0.35 + 1.4)),
    32,
  );
  const eyeOpen = Math.max(
    0.08,
    1 -
      blinkA * 0.92 -
      blinkB * 0.36 -
      eyesBoost * 0.32 -
      movementProfile.eyeSquint,
  );
  const baseGazeX =
    Math.sin(time * 0.58 + pet.regions[1].b) * (6 + pet.regions[3].r * 0.18);
  const baseGazeY = Math.cos(time * 0.76 + pet.regions[0].k) * 3.8;
  const gazeX = gazeTarget
    ? baseGazeX * 0.22 +
        Math.max(-1, Math.min(1, gazeTarget.x)) * (10 + eyesBoost * 8) +
        movementProfile.gazeX
    : baseGazeX + movementProfile.gazeX;
  const gazeY = gazeTarget
    ? baseGazeY * 0.18 +
        Math.max(-1, Math.min(1, gazeTarget.y)) * (5 + eyesBoost * 4) +
        movementProfile.gazeY
    : baseGazeY + movementProfile.gazeY;
  const tailSwing =
    Math.sin(time * 0.94 + pet.regions[7].b * 0.25) *
      (8 + pet.regions[9].r * 0.55) +
    Math.sin(time * 3.6 + reactionProgress * 2.4) * tailBoost * 16 +
    movementProfile.tailSwing;
  const headTilt =
    Math.sin(time * 0.44 + pet.regions[8].b) * (2.2 + pet.regions[3].b * 0.08) +
    crownBoost * 3.4 -
    voidBoost * 1.8 +
    movementProfile.headTilt;
  const jawDrop =
    Math.max(0, Math.sin(time * 0.82 + pet.regions[0].r * 0.16)) * 4 +
    crownBoost * 8 +
    coreBoost * 4 +
    movementProfile.jaw;
  const motion =
    breath *
      (0.95 + coreBoost * 0.18) *
      movementProfile.motionScale +
    movementProfile.motionBias;
  const liveTriangles = buildTriangles(pet.regions, motion);
  const liveRings = buildRings(pet.regions, motion);
  const liveBodyPath = buildBodyPath(pet.regions, motion);
  const liveLimbs = buildLimbs(pet.regions, motion).map((limb: any) => ({
    ...limb,
    joints: transformJoints(
      limb.joints,
      movementProfile.limbTransforms[limb.id as PetLimbId],
    ),
  }));
  const liveVoids = buildVoids(pet.regions);
  const face = buildFaceArchitecture(pet.regions, motion);
  const tail = buildTail(pet.regions);
  const beastTransform =
    movementProfile.bodyX ||
    movementProfile.bodyY ||
    movementProfile.bodyRotate
      ? `translate(${movementProfile.bodyX.toFixed(2)} ${movementProfile.bodyY.toFixed(2)}) rotate(${movementProfile.bodyRotate.toFixed(2)} ${CX} ${CY})`
      : undefined;
  const crownZonePath = `M ${CX - face.templeX - 48} ${face.topY + 122} Q ${CX} ${face.topY - 116} ${CX + face.templeX + 48} ${face.topY + 122} Q ${CX} ${face.topY + 32} ${CX - face.templeX - 48} ${face.topY + 122} Z`;
  const eyesZonePath = `M ${CX - face.eyeX - face.eyeWidth - 54} ${face.eyeY} Q ${CX} ${face.eyeY - 78} ${CX + face.eyeX + face.eyeWidth + 54} ${face.eyeY} Q ${CX} ${face.eyeY + 72} ${CX - face.eyeX - face.eyeWidth - 54} ${face.eyeY} Z`;
  const coreZonePath = ellipsePath(CX, CY + 118, 166, 106);
  const voidZonePath = ellipsePath(
    CX,
    face.muzzleY + 8,
    face.muzzleWidth + 34,
    face.muzzleHeight + 58,
  );
  const hitZones: Record<
    PetInteractiveZone,
    | { type: "path"; d: string }
    | { type: "stroke"; d: string; strokeWidth: number }
  > = {
    crown: { type: "path", d: crownZonePath },
    eyes: { type: "path", d: eyesZonePath },
    core: { type: "path", d: coreZonePath },
    void: { type: "path", d: voidZonePath },
    tail: { type: "stroke", d: tail.spinePath, strokeWidth: 76 },
  };
  const vd = liveVoids.map((v: any) => (
    <path key={v.id} d={v.path} fill="black" opacity={v.opacity} />
  ));
  const upTriangles = liveTriangles.filter((t: any) => t.family === "up");
  const downTriangles = liveTriangles.filter((t: any) => t.family === "down");
  const liveEyeHeight = Math.max(3.4, face.eyeHeight * eyeOpen);
  const leftEyePath = almondPath(
    CX - face.eyeX,
    face.eyeY,
    face.eyeWidth,
    liveEyeHeight,
  );
  const rightEyePath = almondPath(
    CX + face.eyeX,
    face.eyeY,
    face.eyeWidth,
    liveEyeHeight,
  );
  const leftPupilX = CX - face.eyeX + gazeX;
  const rightPupilX = CX + face.eyeX + gazeX;
  const pupilY = face.eyeY + gazeY;
  const irisRadius = 7 + pet.regions[1].b * 0.26;
  const pupilRadius = 3.5 + pet.regions[0].r * 0.15;
  const mouthPath = `M ${CX - face.mouthWidth} ${face.mouthBaseY.toFixed(2)} Q ${CX} ${(face.mouthBaseY + face.mouthCurve + breath * 7 + jawDrop).toFixed(2)} ${CX + face.mouthWidth} ${face.mouthBaseY.toFixed(2)}`;
  const lowerMouthPath = `M ${(CX - face.mouthWidth * 0.52).toFixed(2)} ${(face.mouthBaseY + 8).toFixed(2)} Q ${CX} ${(face.mouthBaseY + 18 + jawDrop).toFixed(2)} ${(CX + face.mouthWidth * 0.52).toFixed(2)} ${(face.mouthBaseY + 8).toFixed(2)}`;
  const handleZoneEnter = (
    zone: PetInteractiveZone,
    event: React.PointerEvent<SVGElement>,
  ) => {
    if (!interactive) {
      return;
    }
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      onZoneHover?.(zone);
    }
  };
  const handleZoneLeave = (event: React.PointerEvent<SVGElement>) => {
    if (!interactive) {
      return;
    }
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      onZoneHover?.(null);
    }
  };
  const handleZoneTap = (
    zone: PetInteractiveZone,
    event: React.PointerEvent<SVGElement>,
  ) => {
    if (!interactive) {
      return;
    }
    if (event.pointerType !== "mouse") {
      triggerHaptic("selection");
    }
    onZoneTap?.(zone);
  };

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full h-full block">
      <defs>
        <radialGradient id={bgId} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0e1a2e" />
          <stop offset="55%" stopColor="#080f1a" />
          <stop offset="100%" stopColor="#030609" />
        </radialGradient>
        <linearGradient
          id={goldId}
          x1="240"
          y1="160"
          x2="920"
          y2="1020"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F4D07A" />
          <stop offset="46%" stopColor="#E7B85D" />
          <stop offset="100%" stopColor="#9D671F" />
        </linearGradient>
        <linearGradient
          id={blueId}
          x1="280"
          y1="220"
          x2="940"
          y2="960"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A3E6FF" />
          <stop offset="52%" stopColor="#63C0FF" />
          <stop offset="100%" stopColor="#365DFF" />
        </linearGradient>
        <linearGradient
          id={violetId}
          x1="410"
          y1="260"
          x2="820"
          y2="960"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#CAA3FF" />
          <stop offset="100%" stopColor="#755DFF" />
        </linearGradient>
        <radialGradient id={emberId} cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#f5c87f" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#63C0FF" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={softGlowId} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={bodyClipId}>
          <path d={liveBodyPath} />
        </clipPath>
        <mask id={voidMaskId}>
          <rect width={VIEW} height={VIEW} fill="white" />
          {vd}
        </mask>
      </defs>
      <rect width={VIEW} height={VIEW} fill={`url(#${bgId})`} />
      {showScaffold && (
        <g opacity="0.11">
          {[110, 180, 260, 340, 420].map((r) => (
            <circle
              key={r}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="#9fb0c6"
              strokeWidth="1"
            />
          ))}
          {[...Array(12)].map((_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={CX + Math.cos(a) * 470}
                y2={CY + Math.sin(a) * 470}
                stroke="#9fb0c6"
                strokeWidth="1"
              />
            );
          })}
        </g>
      )}
      <g transform={beastTransform}>
        <ellipse
          cx={CX}
          cy={CY}
          rx={440}
          ry={520}
          fill={SM[pet.species].color}
          fillOpacity="0.022"
          filter={`url(#${glowId})`}
        />
        <ellipse
          cx={CX}
          cy={CY + 478}
          rx={250 + breath * 14}
          ry={46 + pulse * 8}
          fill="black"
          opacity={0.26 + pulse * 0.08}
        />
        <g
          transform={`rotate(${tailSwing.toFixed(2)} ${tail.baseX} ${tail.baseY})`}
        >
        <path
          d={tail.spinePath}
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="16"
          strokeOpacity="0.14"
          strokeLinecap="round"
        />
        <path
          d={tail.spinePath}
          fill="none"
          stroke={`url(#${violetId})`}
          strokeWidth="9"
          strokeOpacity="0.56"
          strokeLinecap="round"
          filter={`url(#${softGlowId})`}
        />
        <path
          d={tail.finPath}
          fill={`url(#${blueId})`}
          fillOpacity="0.16"
          stroke={`url(#${goldId})`}
          strokeWidth="2.4"
          opacity="0.82"
        />
        {tailBoost > 0 && (
          <path
            d={tail.spinePath}
            fill="none"
            stroke={`url(#${blueId})`}
            strokeWidth={6 + tailBoost * 4}
            strokeOpacity={0.18 + tailBoost * 0.45}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
          />
        )}
        </g>
        {liveRings.map((r: any) => {
          const rot =
            ((time * movementProfile.ringSpeed * r.rotateSpeed * 180) /
              Math.PI) %
            360;
        const hueId =
          r.hue === "gold" ? goldId : r.hue === "blue" ? blueId : violetId;
        return (
          <g key={r.id} transform={`rotate(${rot.toFixed(2)} ${CX} ${CY})`}>
            <circle
              cx={CX}
              cy={CY}
              r={r.radius}
              fill="none"
              stroke={`url(#${hueId})`}
              strokeWidth={r.strokeWidth}
              opacity={r.opacity}
              strokeDasharray={r.dash || undefined}
            />
          </g>
        );
      })}
      <path
        d={liveBodyPath}
        fill="#0A1220"
        stroke={`url(#${goldId})`}
        strokeWidth="5.5"
        opacity="0.95"
      />
      <g clipPath={`url(#${bodyClipId})`} filter={`url(#${softGlowId})`}>
        <ellipse
          cx={CX}
          cy={CY + 112}
          rx={118 + breath * 10}
          ry={56 + pulse * 12}
          fill={`url(#${emberId})`}
          opacity={0.22 + pulse * 0.1}
        />
        {coreBoost > 0 && (
          <ellipse
            cx={CX}
            cy={CY + 118}
            rx={142 + coreBoost * 28}
            ry={82 + coreBoost * 20}
            fill={`url(#${emberId})`}
            opacity={0.08 + coreBoost * 0.22}
          />
        )}
        {downTriangles.map((t: any) => (
          <g key={t.id} opacity={0.9}>
            <path
              d={trianglePath(t.points)}
              fill="rgba(99,192,255,0.032)"
              stroke={`url(#${blueId})`}
              strokeWidth={t.strokeWidth + 0.35}
              opacity={t.opacity}
            />
            <path
              d={trianglePath(t.points)}
              fill="none"
              stroke={`url(#${violetId})`}
              strokeWidth="1.1"
              opacity={t.glow}
              filter={`url(#${glowId})`}
            />
          </g>
        ))}
        {upTriangles.map((t: any) => (
          <g key={t.id} opacity={0.95}>
            <path
              d={trianglePath(t.points)}
              fill="rgba(244,208,122,0.04)"
              stroke={`url(#${goldId})`}
              strokeWidth={t.strokeWidth}
              opacity={t.opacity}
            />
            <path
              d={trianglePath(t.points)}
              fill="none"
              stroke={`url(#${goldId})`}
              strokeWidth="1.2"
              opacity={t.glow}
              filter={`url(#${glowId})`}
            />
          </g>
        ))}
        <path
          d={`M ${CX - 138} ${CY + 94} Q ${CX} ${CY + 46 - breath * 8} ${CX + 138} ${CY + 94}`}
          fill="none"
          stroke={`url(#${blueId})`}
          strokeWidth="2.2"
          opacity="0.18"
        />
        <circle
          cx={CX}
          cy={CY}
          r="218"
          fill={`url(#${goldId})`}
          fillOpacity="0.03"
        />
        <circle
          cx={CX}
          cy={CY}
          r="152"
          fill={`url(#${blueId})`}
          fillOpacity="0.04"
        />
        <circle
          cx={CX}
          cy={CY}
          r="88"
          fill={`url(#${violetId})`}
          fillOpacity="0.06"
        />
      </g>
      <g mask={`url(#${voidMaskId})`} clipPath={`url(#${bodyClipId})`}>
        <path
          d={pet.centerGlyphPath}
          fill={`url(#${goldId})`}
          fillOpacity="0.18"
          stroke={`url(#${goldId})`}
          strokeWidth="2.6"
          filter={`url(#${glowId})`}
        />
        {upTriangles.slice(0, 2).map((t: any) => {
          const apex = t.points[0];
          return (
            <line
              key={`${t.id}-spine`}
              x1={CX}
              y1={CY}
              x2={apex.x}
              y2={apex.y}
              stroke={`url(#${goldId})`}
              strokeWidth="1.4"
              opacity="0.22"
            />
          );
        })}
        {downTriangles.map((t: any) => {
          const apex = t.points[0];
          return (
            <circle
              key={`${t.id}-node`}
              cx={apex.x}
              cy={apex.y}
              r="3.2"
              fill={`url(#${blueId})`}
              opacity="0.45"
              filter={`url(#${glowId})`}
            />
          );
        })}
      </g>
      {liveLimbs.map((l: any) => (
        <path
          key={l.id}
          d={linePath(l.joints)}
          fill="none"
          stroke={l.kind === "arm" ? `url(#${violetId})` : `url(#${goldId})`}
          strokeWidth={l.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={l.opacity}
        />
      ))}
      <g transform={`rotate(${headTilt.toFixed(2)} ${CX} ${CY - 22})`}>
        <path
          d={face.hornLeftPath}
          fill={`url(#${goldId})`}
          fillOpacity="0.14"
          stroke={`url(#${goldId})`}
          strokeWidth="1.5"
          opacity="0.7"
        />
        <path
          d={face.hornRightPath}
          fill={`url(#${goldId})`}
          fillOpacity="0.14"
          stroke={`url(#${goldId})`}
          strokeWidth="1.5"
          opacity="0.7"
        />
        <path
          d={face.shellPath}
          fill="rgba(4,8,14,0.82)"
          stroke={`url(#${goldId})`}
          strokeWidth="3.2"
          opacity="0.92"
        />
        <path
          d={face.maskPath}
          fill="rgba(247,240,223,0.035)"
          stroke={`url(#${blueId})`}
          strokeWidth="1.8"
          opacity={0.7 + voidBoost * 0.1}
        />
        {crownBoost > 0 && (
          <path
            d={crownZonePath}
            fill={`url(#${goldId})`}
            fillOpacity={0.04 + crownBoost * 0.12}
            stroke={`url(#${goldId})`}
            strokeWidth="2"
            opacity={0.38 + crownBoost * 0.5}
            filter={`url(#${glowId})`}
          />
        )}
        {voidBoost > 0 && (
          <path
            d={voidZonePath}
            fill={`url(#${violetId})`}
            fillOpacity={0.05 + voidBoost * 0.16}
            stroke={`url(#${violetId})`}
            strokeWidth="1.6"
            opacity={0.24 + voidBoost * 0.48}
            filter={`url(#${glowId})`}
          />
        )}
        {face.crestPaths.map((path: string, index: number) => (
          <path
            key={path}
            d={path}
            fill="none"
            stroke={`url(#${index === 0 ? goldId : violetId})`}
            strokeWidth={index === 0 ? "2.4" : "1.8"}
            opacity={0.68}
            filter={`url(#${glowId})`}
          />
        ))}
        <path
          d={face.browPath}
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="2.6"
          opacity="0.82"
        />
        <path
          d={face.muzzlePath}
          fill="rgba(247,240,223,0.055)"
          stroke={`url(#${goldId})`}
          strokeWidth="2.3"
          opacity="0.84"
        />
        <path
          d={face.nosePath}
          fill={`url(#${violetId})`}
          fillOpacity="0.18"
          stroke={`url(#${goldId})`}
          strokeWidth="1.6"
          opacity="0.88"
        />
        <path
          d={leftEyePath}
          fill="rgba(2,4,8,0.94)"
          stroke={`url(#${goldId})`}
          strokeWidth="1.8"
          opacity={0.94 + eyesBoost * 0.04}
        />
        <path
          d={rightEyePath}
          fill="rgba(2,4,8,0.94)"
          stroke={`url(#${goldId})`}
          strokeWidth="1.8"
          opacity={0.94 + eyesBoost * 0.04}
        />
        {eyeOpen > 0.16 && (
          <>
            <circle
              cx={leftPupilX}
              cy={pupilY}
              r={irisRadius}
              fill={`url(#${blueId})`}
              fillOpacity={0.42 + eyesBoost * 0.26}
              filter={`url(#${glowId})`}
            />
            <circle
              cx={rightPupilX}
              cy={pupilY}
              r={irisRadius}
              fill={`url(#${blueId})`}
              fillOpacity={0.42 + eyesBoost * 0.26}
              filter={`url(#${glowId})`}
            />
            <circle
              cx={leftPupilX}
              cy={pupilY}
              r={pupilRadius}
              fill={SM[pet.species].color}
              opacity="0.92"
            />
            <circle
              cx={rightPupilX}
              cy={pupilY}
              r={pupilRadius}
              fill={SM[pet.species].color}
              opacity="0.92"
            />
            <circle
              cx={leftPupilX - 2.2}
              cy={pupilY - 2.6}
              r="1.7"
              fill="white"
              opacity="0.72"
            />
            <circle
              cx={rightPupilX - 2.2}
              cy={pupilY - 2.6}
              r="1.7"
              fill="white"
              opacity="0.72"
            />
          </>
        )}
        {face.whiskers.map((mark: any) => (
          <path
            key={mark.id}
            d={mark.path}
            fill="none"
            stroke={`url(#${violetId})`}
            strokeWidth="1.8"
            opacity="0.56"
          />
        ))}
        <path
          d={mouthPath}
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="2.6"
          opacity="0.92"
        />
        <path
          d={lowerMouthPath}
          fill="none"
          stroke={`url(#${blueId})`}
          strokeWidth="1.5"
          opacity="0.58"
        />
        <path
          d={face.chinPath}
          fill="none"
          stroke={`url(#${violetId})`}
          strokeWidth="1.3"
          opacity="0.52"
        />
      </g>
      {showConstellation && (
        <g opacity="0.42">
          {pet.regions.map((reg: any, i: number) => {
            const radius = 82 + i * 36;
            const angle =
              -Math.PI / 2 + i * 0.72 + time * 0.08 * (reg.bridged ? 1.4 : 0.8);
            const x = CX + Math.cos(angle) * radius;
            const y = CY + Math.sin(angle) * (radius * 0.88);
            return (
              <g key={reg.id}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke="#9fb0c6"
                  strokeWidth="1"
                  opacity="0.15"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={3 + reg.r * 0.16}
                  fill={
                    reg.hollowed
                      ? "#CAA3FF"
                      : reg.sharpened
                        ? "#F4D07A"
                        : "#63C0FF"
                  }
                  filter={`url(#${glowId})`}
                />
              </g>
            );
          })}
        </g>
      )}
      <g filter={`url(#${glowId})`}>
        <circle
          cx={CX}
          cy={CY - 350}
          r="8"
          fill={`url(#${goldId})`}
          opacity="0.9"
        />
        <circle
          cx={CX - 148}
          cy={CY + 337}
          r="7"
          fill={`url(#${blueId})`}
          opacity="0.8"
        />
        <circle
          cx={CX + 148}
          cy={CY + 337}
          r="7"
          fill={`url(#${blueId})`}
          opacity="0.8"
        />
      </g>
      <circle
        cx={CX}
        cy={CY}
        r="6"
        fill={`url(#${violetId})`}
        opacity="0.95"
        filter={`url(#${glowId})`}
      />
        {interactive &&
          (
            Object.entries(hitZones) as Array<
              [PetInteractiveZone, (typeof hitZones)[PetInteractiveZone]]
            >
          ).map(([zone, shape]) =>
            shape.type === "path" ? (
              <path
                key={zone}
                d={shape.d}
                fill="white"
                fillOpacity="0"
                stroke="white"
                strokeOpacity="0"
                strokeWidth="2"
                pointerEvents="all"
                className="cursor-pointer"
                style={{ touchAction: "manipulation" }}
                onPointerEnter={(event) => handleZoneEnter(zone, event)}
                onPointerLeave={handleZoneLeave}
                onPointerUp={(event) => handleZoneTap(zone, event)}
              />
            ) : (
              <path
                key={zone}
                d={shape.d}
                fill="none"
                stroke="white"
                strokeOpacity="0"
                strokeWidth={shape.strokeWidth}
                strokeLinecap="round"
                pointerEvents="all"
                className="cursor-pointer"
                style={{ touchAction: "manipulation" }}
                onPointerEnter={(event) => handleZoneEnter(zone, event)}
                onPointerLeave={handleZoneLeave}
                onPointerUp={(event) => handleZoneTap(zone, event)}
              />
            ),
          )}
      </g>
    </svg>
  );
}

interface SriYantraPetEngineProps {
  red?: string | number;
  blue?: string | number;
  black?: string | number;
  animated?: boolean;
  movement?: PetMovementPreset;
  showConstellation?: boolean;
  showScaffold?: boolean;
  compact?: boolean;
  interactive?: boolean;
  activeZone?: PetInteractiveZone | null;
  reaction?: PetReactionState | null;
  gazeTarget?: { x: number; y: number } | null;
  onZoneHover?: (zone: PetInteractiveZone | null) => void;
  onZoneTap?: (zone: PetInteractiveZone) => void;
}

export function SriYantraPetEngine({
  red = "0",
  blue = "0",
  black = "0",
  animated = true,
  movement = "idle",
  showConstellation = false,
  showScaffold = false,
  compact = false,
  interactive = false,
  activeZone = null,
  reaction = null,
  gazeTarget = null,
  onZoneHover,
  onZoneTap,
}: SriYantraPetEngineProps) {
  const [time, setTime] = useState(0);
  const raf = useRef<number | undefined>(undefined);
  const t0 = useRef(0);
  const svgId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!animated) return;
    t0.current = performance.now();
    const tick = () => {
      setTime((performance.now() - t0.current) * 0.001);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [animated]);

  const pet = useMemo(() => {
    const packets = { red, blue, black };
    const regions = REGIONS.map((_, i) => sampleRegion(packets, i));
    const ct =
      regions.reduce((a, c, i) => a + (i + 1) * (c.r + 2 * c.b + 3 * c.k), 0) %
      7;
    const forces = packetForces(regions);
    const triangles = buildTriangles(regions);
    const anatomy = {
      crown: triangles.find((t) => t.role === "crownBlade"),
      throat: triangles.find((t) => t.role === "throatSpear"),
      chest: triangles.find((t) => t.role === "heartFrame"),
      solar: triangles.find((t) => t.role === "bellyFurnace"),
      root: triangles.find((t) => t.role === "rootAnchor"),
      brow: triangles.find((t) => t.role === "oracleHood"),
      mask: triangles.find((t) => t.role === "maskGate"),
      ribs: triangles.find((t) => t.role === "ribVault"),
      womb: triangles.find((t) => t.role === "wombSeal"),
    };

    return {
      packets,
      coreType: ct,
      species: inferSpecies(forces),
      forces,
      regions,
      triangles,
      anatomy,
      rings: buildRings(regions),
      limbs: buildLimbs(regions),
      voids: buildVoids(regions),
      bodyPath: buildBodyPath(regions),
      centerGlyphPath: buildCenterGlyph(ct),
    };
  }, [red, blue, black]);

  const meta = SM[pet.species];
  const maxForce = Math.max(
    pet.forces.red,
    pet.forces.blue,
    pet.forces.black,
    1,
  );

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden ${compact ? "" : "p-6"}`}
    >
      {!compact && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: meta.color,
                boxShadow: `0 0 8px ${meta.color}`,
              }}
            />
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-mono">
                Living Geometry Beast
              </div>
              <div
                className="text-lg font-semibold tracking-[0.15em]"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
            </div>
          </div>
          <p className="text-xs text-white/60 leading-5">{meta.desc}</p>
        </div>
      )}

      <div
        className={`rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden ${compact ? "h-96" : "h-[500px]"}`}
      >
        <SvgPet
          pet={pet}
          time={time}
          showConstellation={showConstellation}
          showScaffold={showScaffold}
          idPrefix={svgId}
          movement={movement}
          interactive={interactive}
          activeZone={activeZone}
          reaction={reaction}
          gazeTarget={gazeTarget}
          onZoneHover={onZoneHover}
          onZoneTap={onZoneTap}
        />
      </div>

      {!compact && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Red Force
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-yellow-500"
                style={{
                  width: `${Math.min(100, (pet.forces.red / maxForce) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-xs text-white/60">
              {pet.forces.red.toFixed(1)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Blue Force
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-cyan-400"
                style={{
                  width: `${Math.min(100, (pet.forces.blue / maxForce) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-xs text-white/60">
              {pet.forces.blue.toFixed(1)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Black Force
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-purple-500"
                style={{
                  width: `${Math.min(100, (pet.forces.black / maxForce) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-xs text-white/60">
              {pet.forces.black.toFixed(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
