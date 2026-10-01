import type { MetaPetState } from '@/lib/store';
import { PET_PROGRESS_KEYS, type PetProgress, type PetRecordV2 } from './record';
import type { PetRepository } from './repository';

export function snapshotPetProgress(state: MetaPetState): PetProgress {
  return structuredClone(Object.fromEntries(PET_PROGRESS_KEYS.map(key => [key, state[key]]))) as PetProgress;
}

/** Serialize writes and snapshot before awaiting: a slower earlier save must
 * never overwrite a later evolution. Read canonical identity for each write
 * so crest/breeding updates are retained. This is a throttle, not a debounce:
 * a continuously ticking creature must still reach durable storage.
 */
export function createPetProgressPersistence({
  repository, store, getRecord, onSaved, onError,
}: {
  repository: PetRepository;
  store: { getState: () => MetaPetState; subscribe: (listener: (state: MetaPetState, previous: MetaPetState) => void) => () => void };
  getRecord: () => PetRecordV2 | null;
  onSaved: (record: PetRecordV2) => void;
  onError: (error: unknown) => void;
}) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: Promise<void> = Promise.resolve();
  let dirty = false;

  const flush = (): Promise<void> => {
    clearTimeout(timer);
    timer = undefined;
    const record = getRecord();
    if (!record || !dirty) return pending;
    const state = store.getState();
    const snapshot = structuredClone({ vitals: state.vitals, evolution: state.evolution, progress: snapshotPetProgress(state) });
    dirty = false;
    pending = pending.then(async () => {
      const canonical = await repository.getRecord(record.petId) ?? record;
      const next = { ...canonical, ...snapshot };
      await repository.saveRecord(next, { activate: false });
      if (getRecord()?.petId === next.petId) onSaved(next);
    }).catch(error => {
      dirty = true;
      onError(error);
    });
    return pending;
  };

  const unsubscribe = store.subscribe((state, previous) => {
    if (state.vitals === previous.vitals && state.evolution === previous.evolution &&
        PET_PROGRESS_KEYS.every(key => state[key] === previous[key])) return;
    dirty = true;
    if (state.evolution.state !== previous.evolution.state) {
      // The action also records achievement rewards synchronously after its
      // stage commit. Capture the whole action at the microtask boundary.
      void Promise.resolve().then(flush);
    } else if (timer === undefined) {
      timer = setTimeout(() => { void flush(); }, 750);
    }
  });

  return {
    flush,
    dispose() {
      unsubscribe();
      return flush();
    },
  };
}
