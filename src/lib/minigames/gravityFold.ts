/**
 * Gravity Fold — pure engine for the rotate-path anomaly encounter.
 *
 * A strip of route tiles is generated once per node (seeded); each tile
 * starts rotated away from its aligned position. Tapping a tile cycles it
 * 90° at a time. The route is solved once every tile is aligned — always
 * reachable by rotation alone, so there is no dead end to get stuck in.
 */

export const GRAVITY_FOLD_TILE_COUNT = 5;
export const GRAVITY_FOLD_ROTATIONS = 4;

export type GravityTileKind = 'straight' | 'elbow';

export interface GravityTile {
  kind: GravityTileKind;
  /** Current rotation step, 0-3 (90° each). Aligned when it equals 0. */
  rotation: number;
}

export interface GravityFoldState {
  tiles: GravityTile[];
  solved: boolean;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isSolved(tiles: GravityTile[]): boolean {
  return tiles.every((tile) => tile.rotation === 0);
}

export function createGravityFold(
  seed: number,
  tileCount: number = GRAVITY_FOLD_TILE_COUNT,
): GravityFoldState {
  const random = mulberry32(seed);
  const tiles: GravityTile[] = Array.from({ length: tileCount }, () => ({
    kind: random() < 0.5 ? 'straight' : 'elbow',
    rotation: Math.floor(random() * GRAVITY_FOLD_ROTATIONS),
  }));

  // Guarantee the puzzle isn't already solved by construction.
  if (isSolved(tiles) && tiles.length > 0) {
    tiles[0] = { ...tiles[0], rotation: 1 };
  }

  return { tiles, solved: false };
}

/** Rotate one tile a quarter turn; recomputes whether the route is solved. */
export function rotateGravityTile(state: GravityFoldState, tileIndex: number): GravityFoldState {
  if (state.solved) return state;
  if (tileIndex < 0 || tileIndex >= state.tiles.length) return state;

  const tiles = state.tiles.map((tile, index) =>
    index === tileIndex
      ? { ...tile, rotation: (tile.rotation + 1) % GRAVITY_FOLD_ROTATIONS }
      : tile,
  );

  return { tiles, solved: isSolved(tiles) };
}

/** Fewest taps left to solve — used only for a subtle progress hint. */
export function remainingGravityTaps(state: GravityFoldState): number {
  return state.tiles.reduce(
    (total, tile) => total + (GRAVITY_FOLD_ROTATIONS - tile.rotation) % GRAVITY_FOLD_ROTATIONS,
    0,
  );
}
