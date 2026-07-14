import { describe, expect, it } from 'vitest';

import { SCAN_TIER_SCORES } from '@/progression/vimana';
import {
  SCAN_RING_COUNT,
  createScanRing,
  evaluateScanResult,
  registerScanTap,
} from './vimanaScanRing';

describe('createScanRing', () => {
  it('lays out one ascending target per ring', () => {
    const ring = createScanRing(1000);
    expect(ring.targets).toHaveLength(SCAN_RING_COUNT);
    expect(ring.targets).toEqual([...ring.targets].sort((a, b) => a - b));
    expect(ring.targets.every((target) => target > 1000)).toBe(true);
  });
});

describe('registerScanTap', () => {
  it('appends taps in order and completes once all rings are tapped', () => {
    let ring = createScanRing(0);
    ring = registerScanTap(ring, 100);
    expect(ring.taps).toEqual([100]);
    expect(ring.complete).toBe(false);

    ring = registerScanTap(ring, 200);
    ring = registerScanTap(ring, 300);
    expect(ring.complete).toBe(true);
  });

  it('ignores extra taps once complete', () => {
    let ring = createScanRing(0);
    ring = registerScanTap(ring, 100);
    ring = registerScanTap(ring, 200);
    ring = registerScanTap(ring, 300);
    const completed = ring;
    ring = registerScanTap(ring, 400);
    expect(ring).toBe(completed);
    expect(ring.taps).toHaveLength(3);
  });
});

describe('evaluateScanResult', () => {
  it('scores a perfect run when every tap lands on its target', () => {
    const ring = createScanRing(0);
    let state = ring;
    for (const target of ring.targets) {
      state = registerScanTap(state, target);
    }
    const result = evaluateScanResult(state);
    expect(result.tier).toBe('perfect');
    expect(result.accuracy).toBe(100);
    expect(result.scanQuality).toBe(SCAN_TIER_SCORES.perfect);
  });

  it('scores clean when taps are close but outside the perfect window', () => {
    const ring = createScanRing(0);
    let state = ring;
    for (const target of ring.targets) {
      state = registerScanTap(state, target + 150); // within clean, outside perfect
    }
    const result = evaluateScanResult(state);
    expect(result.tier).toBe('clean');
    expect(result.scanQuality).toBe(SCAN_TIER_SCORES.clean);
  });

  it('scores rough when taps are far off or missing entirely', () => {
    const ring = createScanRing(0);
    const result = evaluateScanResult(ring); // no taps registered at all
    expect(result.tier).toBe('rough');
    expect(result.accuracy).toBe(0);
    expect(result.scanQuality).toBe(SCAN_TIER_SCORES.rough);
  });

  it('never throws and always returns a real tier for a partial attempt', () => {
    const ring = createScanRing(0);
    const oneTap = registerScanTap(ring, ring.targets[0]);
    const result = evaluateScanResult(oneTap);
    expect(['rough', 'clean', 'perfect']).toContain(result.tier);
    expect(result.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeLessThanOrEqual(100);
  });

  it('mixed timing across the three rings averages down to rough', () => {
    const ring = createScanRing(0);
    let state = registerScanTap(ring, ring.targets[0]); // perfect
    state = registerScanTap(state, ring.targets[1] + 2000); // way off
    state = registerScanTap(state, ring.targets[2] + 2000); // way off
    const result = evaluateScanResult(state);
    expect(result.tier).toBe('rough');
    expect(result.accuracy).toBeLessThan(SCAN_TIER_SCORES.clean);
  });
});
