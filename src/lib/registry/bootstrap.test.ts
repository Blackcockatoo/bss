import { describe, expect, it, vi } from 'vitest';

import { hydrateStoreFromRecord } from './bootstrap';
import type { PetRecordV2 } from './record';

const record = {
  vitals: { hunger: 80 },
  genome: { red60: [1], blue60: [2], black60: [3] },
  traits: { personality: { temperament: 'calm' } },
  evolution: { state: 'GENETICS' },
} as unknown as PetRecordV2;

describe('hydrateStoreFromRecord', () => {
  it('hydrates an empty store from the record', () => {
    const hydrate = vi.fn();
    const store = {
      getState: () => ({ genome: null, hydrate }),
    } as unknown as Parameters<typeof hydrateStoreFromRecord>[1];

    hydrateStoreFromRecord(record, store);

    expect(hydrate).toHaveBeenCalledWith({
      vitals: record.vitals,
      genome: record.genome,
      traits: record.traits,
      evolution: record.evolution,
    });
  });

  it('never clobbers a live genome already in the store', () => {
    const hydrate = vi.fn();
    const store = {
      getState: () => ({ genome: { red60: [9] }, hydrate }),
    } as unknown as Parameters<typeof hydrateStoreFromRecord>[1];

    hydrateStoreFromRecord(record, store);

    expect(hydrate).not.toHaveBeenCalled();
  });
});
