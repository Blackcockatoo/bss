/**
 * Registry bootstrap — ends the `genome: null` runtime state.
 *
 * On the client, ensure exactly one registered pet exists (loading, migrating,
 * or minting via the repository's atomic flow) and hydrate the runtime store
 * from that record. The store is a view of the record, so reload always
 * restores the identical genome, traits, and identity.
 */

import { useStore } from '@/lib/store';

import { createPetRepository, type PetRepository } from './repository';
import type { PetRecordV2 } from './record';

let sharedRepository: PetRepository | null = null;

export function getPetRepository(): PetRepository {
  if (!sharedRepository) {
    sharedRepository = createPetRepository();
  }
  return sharedRepository;
}

export function hydrateStoreFromRecord(
  record: PetRecordV2,
  store: Pick<typeof useStore, 'getState'> = useStore,
): void {
  // Test doubles for @/lib/store are often bare selector functions without
  // zustand's getState; skip hydration rather than crash the boot path.
  if (typeof store.getState !== 'function') return;
  const state = store.getState();
  // A live genome in the store (e.g. staged by dev tooling) outranks a
  // re-hydration; never clobber it mid-session.
  if (state.genome) return;
  state.hydrate({
    vitals: record.vitals,
    genome: record.genome,
    traits: record.traits,
    evolution: record.evolution,
  });
}

/**
 * The production boot path for /pet: one registered pet, hydrated into the
 * runtime store. Safe to call repeatedly; the underlying flow is idempotent.
 */
export async function bootRegisteredPet(
  repository: PetRepository = getPetRepository(),
): Promise<PetRecordV2> {
  const record = await repository.ensureRegisteredPet();
  hydrateStoreFromRecord(record);
  return record;
}
