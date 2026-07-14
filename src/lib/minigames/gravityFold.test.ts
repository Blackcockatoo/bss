import { describe, expect, it } from 'vitest';

import {
  GRAVITY_FOLD_ROTATIONS,
  GRAVITY_FOLD_TILE_COUNT,
  createGravityFold,
  remainingGravityTaps,
  rotateGravityTile,
} from './gravityFold';

describe('createGravityFold', () => {
  it('is deterministic for the same seed', () => {
    expect(createGravityFold(7).tiles).toEqual(createGravityFold(7).tiles);
  });

  it('generates the requested tile count, never pre-solved', () => {
    const state = createGravityFold(42);
    expect(state.tiles).toHaveLength(GRAVITY_FOLD_TILE_COUNT);
    expect(state.solved).toBe(false);
    for (const tile of state.tiles) {
      expect(tile.rotation).toBeGreaterThanOrEqual(0);
      expect(tile.rotation).toBeLessThan(GRAVITY_FOLD_ROTATIONS);
      expect(['straight', 'elbow']).toContain(tile.kind);
    }
  });

  it('is always solvable by rotation alone within a bounded number of taps', () => {
    for (let seed = 0; seed < 50; seed++) {
      const state = createGravityFold(seed);
      const taps = remainingGravityTaps(state);
      expect(taps).toBeGreaterThan(0);
      expect(taps).toBeLessThanOrEqual(GRAVITY_FOLD_TILE_COUNT * (GRAVITY_FOLD_ROTATIONS - 1));
    }
  });
});

describe('rotateGravityTile', () => {
  it('cycles a tile through 0-3 and wraps back to 0', () => {
    let state = createGravityFold(1);
    const index = 0;
    const start = state.tiles[index].rotation;
    for (let i = 0; i < GRAVITY_FOLD_ROTATIONS; i++) {
      state = rotateGravityTile(state, index);
    }
    expect(state.tiles[index].rotation).toBe(start);
  });

  it('solves when every tile reaches rotation 0', () => {
    let state = createGravityFold(5);
    let guard = 0;
    while (!state.solved && guard < 1000) {
      const index = state.tiles.findIndex((tile) => tile.rotation !== 0);
      state = rotateGravityTile(state, index);
      guard += 1;
    }
    expect(state.solved).toBe(true);
    expect(state.tiles.every((tile) => tile.rotation === 0)).toBe(true);
  });

  it('is a no-op once solved', () => {
    let state = createGravityFold(5);
    while (!state.solved) {
      const index = state.tiles.findIndex((tile) => tile.rotation !== 0);
      state = rotateGravityTile(state, index);
    }
    const solved = state;
    expect(rotateGravityTile(solved, 0)).toBe(solved);
  });

  it('ignores an out-of-range tile index', () => {
    const state = createGravityFold(9);
    expect(rotateGravityTile(state, -1)).toBe(state);
    expect(rotateGravityTile(state, state.tiles.length)).toBe(state);
  });
});

describe('remainingGravityTaps', () => {
  it('is zero once solved', () => {
    let state = createGravityFold(3);
    while (!state.solved) {
      const index = state.tiles.findIndex((tile) => tile.rotation !== 0);
      state = rotateGravityTile(state, index);
    }
    expect(remainingGravityTaps(state)).toBe(0);
  });
});
