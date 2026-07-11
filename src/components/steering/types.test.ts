import { describe, expect, it } from 'vitest';
import {
  COMPASS_NAVIGATION_TARGETS,
  GENOME_RESONANCE_ROUTE,
  NAVIGATION_TARGETS,
  getCompassNavigationTargets,
} from './types';

describe('steering compass navigation targets', () => {
  it('remaps filtered destinations into contiguous render slots', () => {
    const targets = getCompassNavigationTargets();

    expect(targets).toHaveLength(NAVIGATION_TARGETS.length - 1);
    expect(targets.some((target) => target.route === GENOME_RESONANCE_ROUTE)).toBe(false);
    expect(targets.map((target) => target.renderPosition)).toEqual(
      Array.from({ length: targets.length }, (_, index) => index),
    );
    expect(targets.map((target) => target.renderAngle)).toEqual(
      Array.from({ length: targets.length }, (_, index) => index * (360 / targets.length)),
    );
  });

  it('preserves original destination positions for activation', () => {
    const qrMessaging = COMPASS_NAVIGATION_TARGETS.find(
      (target) => target.route === '/qr-messaging',
    );

    expect(qrMessaging?.position).toBe(11);
    expect(qrMessaging?.renderPosition).toBe(10);
  });
});
