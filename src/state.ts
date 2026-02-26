/**
 * Defines the core state structure for the Meta-Pet's vitals.
 * This state is managed by the Zustand store.
 */

export interface PetVitals {
  health: number; // 0-100
  energy: number; // 0-100
  mood: number;   // 0-100
  tickAccumulator: number; // Time elapsed since last full tick (in ms)
  lastTickTime: number; // Timestamp of the last tick
}

export const initialVitals: PetVitals = {
  health: 80,
  energy: 75,
  mood: 90,
  tickAccumulator: 0,
  lastTickTime: Date.now(),
};
