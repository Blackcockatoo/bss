import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { GravityFoldEncounter } from './GravityFoldEncounter';
import { createGravityFold, rotateGravityTile } from '@/lib/minigames/gravityFold';

describe('GravityFoldEncounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one rotatable tile button per route piece', () => {
    const seed = 42;
    const state = createGravityFold(seed);
    render(<GravityFoldEncounter seed={seed} accentHue={120} onComplete={vi.fn()} />);
    for (let i = 0; i < state.tiles.length; i++) {
      expect(screen.getByLabelText(`Route tile ${i + 1}, rotate`)).toBeInTheDocument();
    }
  });

  it('solves the route by rotating tiles and calls onComplete', () => {
    const onComplete = vi.fn();
    const seed = 5;
    render(<GravityFoldEncounter seed={seed} accentHue={200} onComplete={onComplete} />);

    // Solve exactly as the pure engine test does, driving the UI instead.
    let state = createGravityFold(seed);
    let guard = 0;
    while (!state.solved && guard < 1000) {
      const index = state.tiles.findIndex((tile) => tile.rotation !== 0);
      act(() => {
        fireEvent.pointerDown(screen.getByLabelText(`Route tile ${index + 1}, rotate`));
      });
      state = rotateGravityTile(state, index);
      guard += 1;
    }

    expect(screen.getByText('Path stabilized!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('disables the tiles once solved so no further rotation is possible', () => {
    const seed = 8;
    render(<GravityFoldEncounter seed={seed} accentHue={60} onComplete={vi.fn()} />);

    let state = createGravityFold(seed);
    while (!state.solved) {
      const index = state.tiles.findIndex((tile) => tile.rotation !== 0);
      act(() => {
        fireEvent.pointerDown(screen.getByLabelText(`Route tile ${index + 1}, rotate`));
      });
      state = rotateGravityTile(state, index);
    }

    const firstTile = screen.getByLabelText('Route tile 1, rotate');
    expect(firstTile).toBeDisabled();
  });
});
