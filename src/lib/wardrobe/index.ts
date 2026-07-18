/**
 * Unified Meta-Pet wardrobe system.
 *
 * Progress flow:
 *   gameplay action → live store update → WardrobeSystemBridge snapshot →
 *   persistent progress store (monotonic) → unlock evaluator →
 *   persistent inventory (permanent ownership) → unlock ceremony →
 *   equip actions → live pet renderer.
 */

export * from './types';
export * from './progress';
export * from './conditions';
export * from './catalog';
export * from './evaluator';
export * from './adapter';
export * from './progressStore';
export * from './store';
