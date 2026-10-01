import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createMetaPetWebStore } from '@/store';
import { EVOLUTION_REQUIREMENTS, initializeEvolution } from '@/evolution';
import { hydrateStoreFromRecord } from './bootstrap';
import { createMemoryStorage, createPetRepository } from './repository';
import { createPetProgressPersistence } from './progressPersistence';
import type { PetRecordV2 } from './record';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-01T00:00:00Z')); });
afterEach(() => vi.useRealTimers());

async function setup() {
  const repository = createPetRepository(createMemoryStorage());
  const hmacKey = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  let record = await repository.ensureRegisteredPet({ loadLegacyPets: async () => [], hmacKey });
  const store = createMetaPetWebStore({ autoPauseOnVisibilityChange: false });
  hydrateStoreFromRecord(record, store);
  const onError = vi.fn();
  const persistence = createPetProgressPersistence({ repository, store, getRecord: () => record, onSaved: next => { record = next; }, onError });
  return { repository, store, persistence, onError, getRecord: () => record };
}

describe('registered pet evolution lifecycle', () => {
  it('earns eligibility, evolves all stages, saves effects/history and reloads without changing DNA', async () => {
    const { store, repository, persistence, getRecord, onError } = await setup();
    const genome = structuredClone(store.getState().genome);
    expect(store.getState().tryEvolve()).toBe(false);
    store.getState().recordMiniGameResult({ game: 'memory', score: 10 });
    for (const stage of ['NEURO', 'QUANTUM', 'SPECIATION'] as const) {
      // Earn levels through the same care action used by the UI. Fake time
      // removes only the wait; no threshold or eligibility is bypassed.
      while (store.getState().evolution.level < EVOLUTION_REQUIREMENTS[stage].minLevel) store.getState().play();
      // Retain all path-specific evidence, regardless of the minted branch.
      for (let i = 0; i < 8; i++) store.getState().recordMiniGameResult({ game: 'memory', score: 10 });
      for (let i = 0; i < 5; i++) store.getState().recordBattle('win', 'test-opponent');
      store.getState().addEssence({ amount: 100, source: 'system' });
      for (let i = 0; i < 10; i++) { store.getState().feed(); store.getState().clean(); store.getState().sleep(); }
      vi.setSystemTime(Date.now() + EVOLUTION_REQUIREMENTS[stage].minAge);
      const before = store.getState();
      expect(before.tryEvolve()).toBe(true);
      expect(store.getState().evolution).not.toBe(before.evolution);
      expect(store.getState().evolution.state).toBe(stage);
      expect(store.getState().tryEvolve()).toBe(false); // no duplicate grant
      await persistence.flush();
      const saved = await repository.loadActiveRecord();
      expect(saved?.evolution.state).toBe(stage);
      expect(saved?.progress?.miniGames.totalPlays).toBe(store.getState().miniGames.totalPlays);
      expect(saved?.progress?.essence).toBe(store.getState().essence);
      expect(saved?.progress?.achievements).toEqual(store.getState().achievements);
      const reloaded = createMetaPetWebStore({ autoPauseOnVisibilityChange: false });
      hydrateStoreFromRecord(saved!, reloaded);
      expect(reloaded.getState().evolution.state).toBe(stage);
      expect(reloaded.getState().genome).toEqual(genome);
      expect(reloaded.getState().battle).toEqual(store.getState().battle);
      expect(reloaded.getState().miniGames).toEqual(store.getState().miniGames);
    }
    expect(getRecord().evolution.history?.map(entry => entry.to)).toEqual(['NEURO', 'QUANTUM', 'SPECIATION']);
    expect(onError).not.toHaveBeenCalled();
    await persistence.dispose();
  });

  it('writes during continuous changes rather than waiting indefinitely for quiet', async () => {
    const { store, repository, persistence } = await setup();
    for (let i = 0; i < 5; i++) {
      store.getState().play();
      await vi.advanceTimersByTimeAsync(200);
    }
    const saved = await repository.loadActiveRecord();
    expect(saved?.evolution.totalInteractions).toBeGreaterThan(0);
    await persistence.dispose();
    expect((await repository.loadActiveRecord())?.evolution.totalInteractions).toBe(5);
  });

  it('flushes navigation/unmount changes and preserves the active record metadata', async () => {
    const { store, repository, persistence, getRecord } = await setup();
    await repository.saveRecord({ ...getRecord(), name: 'Updated name' });
    store.getState().recordMiniGameResult({ game: 'memory', score: 10 });
    await persistence.dispose();
    const saved = (await repository.loadActiveRecord())!;
    expect(saved.name).toBe('Updated name');
    const reloaded = createMetaPetWebStore({ autoPauseOnVisibilityChange: false });
    hydrateStoreFromRecord(saved, reloaded);
    expect(reloaded.getState().miniGames.totalPlays).toBe(1);
  });

  it('serializes a slow earlier save before the newer evolution', async () => {
    const { store, repository, persistence } = await setup();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const original = repository.saveRecord.bind(repository);
    const writes: string[] = [];
    repository.saveRecord = async (record, options) => {
      writes.push(record.evolution.state);
      if (writes.length === 1) await gate;
      return original(record, options);
    };
    store.getState().play();
    const first = persistence.flush();
    await Promise.resolve(); await Promise.resolve();
    store.setState({ evolution: { ...store.getState().evolution, state: 'NEURO' } });
    release();
    await first;
    await persistence.flush();
    expect(writes).toEqual(['GENETICS', 'NEURO']);
    expect((await repository.loadActiveRecord())?.evolution.state).toBe('NEURO');
    await persistence.dispose();
  });

  it('reports failed writes and retries the latest progress', async () => {
    const { store, repository, persistence, onError } = await setup();
    const original = repository.saveRecord.bind(repository);
    repository.saveRecord = vi.fn().mockRejectedValueOnce(new Error('disk unavailable')).mockImplementation(original);
    store.getState().play();
    await persistence.flush();
    expect(onError).toHaveBeenCalledOnce();
    await persistence.flush();
    expect((await repository.loadActiveRecord())?.evolution.totalInteractions).toBe(1);
    await persistence.dispose();
  });

  it('backfills pre-level saves and retains already-evolved stage and history', async () => {
    const { store, getRecord, persistence } = await setup();
    const old = { ...getRecord(), evolution: { state: 'QUANTUM', birthTime: Date.now(), lastEvolutionTime: Date.now(), experience: 20, totalInteractions: 40 } } as PetRecordV2;
    const reloaded = createMetaPetWebStore({ autoPauseOnVisibilityChange: false });
    hydrateStoreFromRecord(old, reloaded);
    reloaded.getState().play();
    expect(reloaded.getState().evolution.state).toBe('QUANTUM');
    expect(Number.isFinite(reloaded.getState().evolution.totalXp)).toBe(true);
    expect(reloaded.getState().evolution.level).toBeGreaterThanOrEqual(1);
    expect(store.getState().evolution).toEqual(initializeEvolution());
    await persistence.dispose();
  });
});
