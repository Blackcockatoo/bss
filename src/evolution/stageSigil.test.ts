import { describe, expect, it } from 'vitest';

import { buildStageSigil, type StageSigilLayout } from './stageSigil';
import { EVOLUTION_ORDER } from './types';
import { getCumulativeEvolutionUpgrade } from './stageUpgrades';

const BASE: Omit<StageSigilLayout, 'shape' | 'count'> = {
  cx: 100,
  cy: 100,
  rx: 40,
  ry: 30,
};

const SHAPES = ['helix', 'lattice', 'phase', 'crown'] as const;

function coordinates(primitives: ReturnType<typeof buildStageSigil>): number[] {
  return primitives.flatMap((primitive) =>
    primitive.kind === 'line'
      ? [primitive.x1, primitive.y1, primitive.x2, primitive.y2]
      : primitive.kind === 'ellipse'
        ? [primitive.cx, primitive.cy, primitive.rx, primitive.ry]
        : [primitive.cx, primitive.cy, primitive.r]
  );
}

describe('stage sigil geometry', () => {
  it('draws something for every shape the ladder can reach', () => {
    for (const state of EVOLUTION_ORDER) {
      const upgrade = getCumulativeEvolutionUpgrade(state);
      const primitives = buildStageSigil({
        ...BASE,
        shape: upgrade.mark,
        count: upgrade.markCount,
      });
      expect(primitives.length, state).toBeGreaterThan(0);
    }
  });

  it('is deterministic — the same layout always yields the same geometry', () => {
    for (const shape of SHAPES) {
      const layout = { ...BASE, shape, count: 5 };
      expect(buildStageSigil(layout), shape).toEqual(buildStageSigil(layout));
    }
  });

  it('gives each shape genuinely different geometry', () => {
    const fingerprints = SHAPES.map((shape) =>
      JSON.stringify(buildStageSigil({ ...BASE, shape, count: 5 }))
    );
    expect(new Set(fingerprints).size).toBe(SHAPES.length);
  });

  it('produces only finite coordinates, for hostile counts too', () => {
    for (const shape of SHAPES) {
      for (const count of [-4, 0, 1, 3, 12, 500, Number.NaN]) {
        const primitives = buildStageSigil({ ...BASE, shape, count });
        expect(primitives.length, `${shape}@${count}`).toBeGreaterThan(0);
        for (const value of coordinates(primitives)) {
          expect(Number.isFinite(value), `${shape}@${count}`).toBe(true);
        }
      }
    }
  });

  it('stays inside the sigil field it was given', () => {
    for (const shape of SHAPES) {
      const primitives = buildStageSigil({ ...BASE, shape, count: 7, glow: 1 });
      for (const primitive of primitives) {
        const xs =
          primitive.kind === 'line'
            ? [primitive.x1, primitive.x2]
            : [primitive.cx];
        const ys =
          primitive.kind === 'line'
            ? [primitive.y1, primitive.y2]
            : [primitive.cy];
        // Crown rays reach the field edge; nothing may sail past it.
        for (const x of xs) expect(Math.abs(x - BASE.cx), shape).toBeLessThanOrEqual(BASE.rx * 1.4);
        for (const y of ys) expect(Math.abs(y - BASE.cy), shape).toBeLessThanOrEqual(BASE.ry * 1.4);
      }
    }
  });

  it('scales with the field it is handed rather than assuming a viewBox', () => {
    const small = buildStageSigil({ ...BASE, shape: 'lattice', count: 5 });
    const large = buildStageSigil({
      ...BASE,
      rx: BASE.rx * 3,
      ry: BASE.ry * 3,
      shape: 'lattice',
      count: 5,
    });
    const spread = (primitives: ReturnType<typeof buildStageSigil>) =>
      Math.max(...coordinates(primitives)) - Math.min(...coordinates(primitives));
    expect(spread(large)).toBeGreaterThan(spread(small));
  });

  it('only thickens with glow — it never changes what is drawn', () => {
    const dim = buildStageSigil({ ...BASE, shape: 'lattice', count: 5, glow: 0 });
    const lit = buildStageSigil({ ...BASE, shape: 'lattice', count: 5, glow: 1 });
    expect(lit.length).toBe(dim.length);
    expect(lit.map((p) => p.kind)).toEqual(dim.map((p) => p.kind));
    const dimDot = dim.find((p) => p.kind === 'dot');
    const litDot = lit.find((p) => p.kind === 'dot');
    expect(litDot && dimDot && litDot.kind === 'dot' && dimDot.kind === 'dot'
      ? litDot.r > dimDot.r
      : false).toBe(true);
  });
});
