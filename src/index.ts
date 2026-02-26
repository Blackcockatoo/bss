import { createMetaPetWebStore, type MetaPetState } from '@metapet/core/store';

export type { MetaPetState };
export { createMetaPetWebStore } from '@metapet/core/store';
export type { Vitals } from '@metapet/core/vitals';

export const useStore = createMetaPetWebStore();

// Element number theory exports
export * from './elements';

// MOSS60 share/widget bundle
export * from './lib/moss60';
