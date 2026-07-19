import { beforeAll, describe, expect, it } from 'vitest';

import type { PetSaveData } from '@/lib/persistence/indexeddb';

import { createMemoryStorage, createPetRepository } from './repository';
import { buildPetRecord } from './registration';

let hmacKey: CryptoKey;

beforeAll(async () => {
  hmacKey = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
});

function legacySave(overrides: Partial<PetSaveData> = {}): PetSaveData {
  return {
    id: 'legacy-pet-42',
    name: 'Archived Friend',
    genome: {
      red60: Array.from({ length: 60 }, (_, index) => index % 7),
      blue60: Array.from({ length: 60 }, (_, index) => (index * 2) % 7),
      black60: Array.from({ length: 60 }, (_, index) => (index * 4) % 7),
    },
    createdAt: 1_650_000_000_000,
    lastSaved: 1_700_000_000_000,
    ...overrides,
  } as PetSaveData;
}

describe('PetRepository.ensureRegisteredPet', () => {
  it('mints and activates one genesis pet when nothing exists, idempotently', async () => {
    const repository = createPetRepository(createMemoryStorage());

    const first = await repository.ensureRegisteredPet({
      loadLegacyPets: async () => [],
      hmacKey,
    });
    const second = await repository.ensureRegisteredPet({
      loadLegacyPets: async () => {
        throw new Error('must not re-run genesis');
      },
      hmacKey,
    });

    expect(first.genomeRadix).toBe(10);
    expect(second).toEqual(first);
    expect(await repository.loadActiveRecord()).toEqual(first);
  });

  it('migrates the newest legacy save without rerolling its identity', async () => {
    const repository = createPetRepository(createMemoryStorage());
    const older = legacySave({ id: 'legacy-old', lastSaved: 1 });
    const newest = legacySave();
    const genomeSnapshot = structuredClone(newest.genome);

    const record = await repository.ensureRegisteredPet({
      loadLegacyPets: async () => [older, newest],
      hmacKey,
    });

    expect(record.petId).toBe('legacy-pet-42');
    expect(record.name).toBe('Archived Friend');
    expect(record.createdAt).toBe(1_650_000_000_000);
    expect(record.genome).toEqual(genomeSnapshot);
    expect(record.genomeRadix).toBe(7);
  });

  it('preserves a legacy crest and HeptaCode instead of reminting them', async () => {
    const repository = createPetRepository(createMemoryStorage());
    const crest = {
      vault: 'red',
      rotation: 'CW',
      tail: [1, 2, 3, 4],
      coronatedAt: 123,
      dnaHash: 'aa',
      mirrorHash: 'bb',
      signature: 'legacy-signature',
    } as PetSaveData['crest'];
    const heptaDigits = Array.from({ length: 42 }, (_, index) => index % 7);

    const record = await repository.ensureRegisteredPet({
      loadLegacyPets: async () => [
        legacySave({ crest, heptaDigits } as Partial<PetSaveData>),
      ],
      hmacKey,
    });

    expect(record.crest?.signature).toBe('legacy-signature');
    expect(record.registrationSignature).toBe('legacy-signature');
    expect(record.heptaCode?.digits).toEqual(heptaDigits);
  });

  it('falls back to genesis when the legacy archive is unreadable', async () => {
    const repository = createPetRepository(createMemoryStorage());

    const record = await repository.ensureRegisteredPet({
      loadLegacyPets: async () => {
        throw new Error('corrupt archive');
      },
      hmacKey,
    });

    expect(record.genomeRadix).toBe(10);
    expect(record.lineage.generation).toBe(0);
  });
});

describe('PetRepository.saveRecord', () => {
  it('refuses to overwrite a registered pet with a different genome', async () => {
    const repository = createPetRepository(createMemoryStorage());
    const record = await repository.ensureRegisteredPet({
      loadLegacyPets: async () => [],
      hmacKey,
    });

    const impostor = await buildPetRecord({ hmacKey });
    const clash = { ...impostor, petId: record.petId };

    await expect(repository.saveRecord(clash)).rejects.toThrow(
      /never regenerated/,
    );
    expect(await repository.loadActiveRecord()).toEqual(record);
  });

  it('accepts an update that keeps the same genome', async () => {
    const repository = createPetRepository(createMemoryStorage());
    const record = await repository.ensureRegisteredPet({
      loadLegacyPets: async () => [],
      hmacKey,
    });

    const renamed = { ...record, name: 'Renamed Friend' };
    await repository.saveRecord(renamed);

    expect((await repository.loadActiveRecord())?.name).toBe('Renamed Friend');
  });
});
