import { describe, expect, it } from 'vitest';

import { normalizePetForm } from './petForms';

describe('normalizePetForm', () => {
  it.each([
    ['auralia', 'auralia'],
    ['evolved', 'evolved'],
    ['geometry', 'geometry'],
    ['geometric', 'evolved'],
    ['hybrid', 'evolved'],
    ['organic', 'auralia'],
    [undefined, 'auralia'],
    ['unknown', 'auralia'],
  ] as const)('normalizes %s to %s', (input, expected) => {
    expect(normalizePetForm(input)).toBe(expected);
  });
});
