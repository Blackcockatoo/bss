import { createMetaPetWebStore, type MetaPetState, type PetType, type MirrorModeState, type MirrorPhase, type MirrorOutcome, type MirrorPrivacyPreset } from '@metapet/core/store';

export type { MetaPetState, PetType, MirrorModeState, MirrorPhase, MirrorOutcome, MirrorPrivacyPreset };
export { buildEvolutionContext, createMetaPetWebStore } from '@metapet/core/store';
export type { Vitals } from '@metapet/core/vitals';

export const useStore = createMetaPetWebStore();

// Dev-only handle for visual QA tooling (Movement Parade, state staging).
// Never present in production bundles and never a second source of truth.
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__bssMetaPetStore = useStore;
}
