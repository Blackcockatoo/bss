/**
 * Renderer-neutral geometry for the evolution stage sigil.
 *
 * Three renderers show the same companion — the Evolved body (Body Forge),
 * Auralia, and Geometry — and a stage has to look like the same stage on all
 * three. This module owns the sigil's SHAPE; each renderer owns how it is
 * painted into its own coordinate space. Nothing here imports React or any
 * component, so it can be unit tested and reused freely.
 *
 * Geometry is deterministic (no `Math.random`, fixed rounding) so a sigil
 * hydrates identically on server and client.
 */

import type { EvolutionMarkShape } from './stageUpgrades';

export type SigilPrimitive =
  | {
      kind: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      /** Paint with the accent colour rather than the primary. */
      accent: boolean;
    }
  | {
      kind: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      dash?: string;
      accent: boolean;
    }
  | { kind: 'dot'; cx: number; cy: number; r: number; accent: boolean };

export interface StageSigilLayout {
  shape: EvolutionMarkShape;
  /** How many sigil elements to draw; clamped to a sane range. */
  count: number;
  /** Sigil centre in the caller's coordinate space. */
  cx: number;
  cy: number;
  /** Half-extent of the sigil in the caller's coordinate space. */
  rx: number;
  ry: number;
  /** 0..1 live emphasis; only thickens dots and lengthens crown rays. */
  glow?: number;
}

/** Rounded so server and client agree bit-for-bit on every coordinate. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clamps to a usable range, substituting `fallback` for non-finite input. */
function sanitize(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

/**
 * Total by construction: any layout — including non-finite numbers from a
 * caller mid-transition — yields drawable geometry rather than an empty
 * sigil or a `NaN` in an SVG attribute.
 */
export function buildStageSigil(layout: StageSigilLayout): SigilPrimitive[] {
  const count = Math.round(sanitize(layout.count, 1, 12, 1));
  const cx = sanitize(layout.cx, -1e4, 1e4, 0);
  const cy = sanitize(layout.cy, -1e4, 1e4, 0);
  const rx = sanitize(layout.rx, 0.5, 1e4, 1);
  const ry = sanitize(layout.ry, 0.5, 1e4, 1);
  const glow = sanitize(layout.glow ?? 0, 0, 1, 0);
  const out: SigilPrimitive[] = [];

  if (layout.shape === 'helix') {
    // GENETICS: a double strand twisting through the sigil field — the two
    // backbones drawn as polylines, cross-linked by rungs every few samples.
    const samples = count * 7;
    const at = (index: number, side: 1 | -1) => {
      const p = index / (samples - 1);
      return {
        x: round(cx + side * Math.sin(p * Math.PI * 2) * rx),
        y: round(cy - ry + p * ry * 2),
      };
    };
    for (let index = 0; index < samples - 1; index += 1) {
      for (const side of [1, -1] as const) {
        const from = at(index, side);
        const to = at(index + 1, side);
        out.push({
          kind: 'line',
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          accent: side === -1,
        });
      }
      if (index % 3 === 1) {
        const left = at(index, -1);
        const right = at(index, 1);
        out.push({
          kind: 'line',
          x1: left.x,
          y1: left.y,
          x2: right.x,
          y2: right.y,
          accent: false,
        });
      }
    }
    return out;
  }

  if (layout.shape === 'lattice') {
    // NEURO: nodes ringing the field, cross-linked through the centre.
    const nodes = Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      return {
        x: round(cx + Math.cos(angle) * rx),
        y: round(cy + Math.sin(angle) * ry),
      };
    });
    nodes.forEach((node, index) => {
      const next = nodes[(index + 1) % nodes.length];
      out.push({
        kind: 'line',
        x1: node.x,
        y1: node.y,
        x2: next.x,
        y2: next.y,
        accent: true,
      });
      out.push({
        kind: 'line',
        x1: node.x,
        y1: node.y,
        x2: round(cx),
        y2: round(cy),
        accent: false,
      });
      out.push({
        kind: 'dot',
        cx: node.x,
        cy: node.y,
        r: round(1.8 + glow * 1.4),
        accent: false,
      });
    });
    return out;
  }

  if (layout.shape === 'phase') {
    // QUANTUM: rings knocked out of alignment with one another.
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * 4.5;
      out.push({
        kind: 'ellipse',
        cx: round(cx + offset),
        cy: round(cy - offset * 0.45),
        rx: round(rx * (0.42 + index * 0.29)),
        ry: round(ry * (0.42 + index * 0.29)),
        dash: `${3 + index} ${4 + index * 2}`,
        accent: index % 2 === 1,
      });
    }
    return out;
  }

  // SPECIATION: a crown of rays radiating from the core.
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const inner = 0.3;
    const outer = 1 + (index % 2) * 0.22 + glow * 0.12;
    out.push({
      kind: 'line',
      x1: round(cx + Math.cos(angle) * rx * inner),
      y1: round(cy + Math.sin(angle) * ry * inner),
      x2: round(cx + Math.cos(angle) * rx * outer),
      y2: round(cy + Math.sin(angle) * ry * outer),
      accent: index % 2 === 1,
    });
  }
  out.push({
    kind: 'ellipse',
    cx: round(cx),
    cy: round(cy),
    rx: round(rx * 0.26),
    ry: round(ry * 0.26),
    accent: false,
  });
  return out;
}
