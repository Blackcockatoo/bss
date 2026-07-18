import { describe, expect, it } from 'vitest';
import { BODY_FORGE_ADDON_SCALE, resolveBodyForgeAnchor } from './bodyForgeAnchors';

const spec = { bodyWidth: 104, bodyHeight: 112 };
const zeroOffset = { x: 0, y: 0 };

describe('resolveBodyForgeAnchor', () => {
  it('centers body/back/aura anchors on the body center', () => {
    expect(resolveBodyForgeAnchor(spec, 'body', zeroOffset)).toEqual({ x: 140, y: 112 });
    expect(resolveBodyForgeAnchor(spec, 'back', zeroOffset)).toEqual({ x: 140, y: 112 });
    expect(resolveBodyForgeAnchor(spec, 'aura', zeroOffset)).toEqual({ x: 140, y: 112 });
  });

  it('places head anchors above the crown/third-eye feature band', () => {
    const { x, y } = resolveBodyForgeAnchor(spec, 'head', zeroOffset);
    expect(x).toBe(140);
    expect(y).toBeLessThan(76);
  });

  it('mirrors left/right hand anchors around the body center', () => {
    const left = resolveBodyForgeAnchor(spec, 'left-hand', zeroOffset);
    const right = resolveBodyForgeAnchor(spec, 'right-hand', zeroOffset);
    expect(left.x).toBeLessThan(140);
    expect(right.x).toBeGreaterThan(140);
    expect(140 - left.x).toBeCloseTo(right.x - 140);
    expect(left.y).toBe(right.y);
  });

  it('places floating anchors above the body, scaling with body height', () => {
    const small = resolveBodyForgeAnchor({ bodyWidth: 80, bodyHeight: 60 }, 'floating', zeroOffset);
    const tall = resolveBodyForgeAnchor({ bodyWidth: 80, bodyHeight: 200 }, 'floating', zeroOffset);
    expect(tall.y).toBeLessThan(small.y);
  });

  it('scales the attachment offset by BODY_FORGE_ADDON_SCALE', () => {
    const { x, y } = resolveBodyForgeAnchor(spec, 'body', { x: 10, y: -20 });
    expect(x).toBeCloseTo(140 + 10 * BODY_FORGE_ADDON_SCALE);
    expect(y).toBeCloseTo(112 - 20 * BODY_FORGE_ADDON_SCALE);
  });
});
