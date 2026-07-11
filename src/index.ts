import { createMetaPetWebStore, type MetaPetState } from '@metapet/core/store';

export type { MetaPetState };
export { createMetaPetWebStore } from '@metapet/core/store';
export type { Vitals } from '@metapet/core/vitals';

export const useStore = createMetaPetWebStore();

// Element number theory exports
export * from './elements';

// Digital constitution and live drift engine
export * from './digital-dosha';

// Visual phenotype resolver shared by every pet renderer
export * from './visual-dna';

// MOSS60 share/widget bundle
export * from './lib/moss60';
