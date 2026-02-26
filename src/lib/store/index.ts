import { createMetaPetWebStore, type MetaPetState, type PetType, type MirrorModeState, type MirrorPhase, type MirrorOutcome, type MirrorPrivacyPreset } from '@metapet/core/store';

export type { MetaPetState, PetType, MirrorModeState, MirrorPhase, MirrorOutcome, MirrorPrivacyPreset };
export { createMetaPetWebStore } from '@metapet/core/store';
export type { Vitals } from '@metapet/core/vitals';

export const useStore = createMetaPetWebStore();
