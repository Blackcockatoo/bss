import { describe, expect, it } from 'vitest';
import { getLabelLines } from './labelUtils';

describe('steering label helpers', () => {
  it('keeps short one-word labels on one line', () => {
    expect(getLabelLines('Identity')).toEqual(['Identity']);
  });

  it('splits long multi-word labels near the midpoint', () => {
    expect(getLabelLines('Monkey Invaders')).toEqual(['Monkey', 'Invaders']);
    expect(getLabelLines('Genome Resonance')).toEqual(['Genome', 'Resonance']);
  });

  it('keeps QR Messaging together for readability', () => {
    expect(getLabelLines('QR Messaging')).toEqual(['QR Messaging']);
  });
});
