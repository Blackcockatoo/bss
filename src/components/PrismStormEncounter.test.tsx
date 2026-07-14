import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { PrismStormEncounter } from './PrismStormEncounter';
import { createPrismStorm } from '@/lib/minigames/prismStorm';

describe('PrismStormEncounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one signal button per prism', () => {
    const seed = 3;
    const state = createPrismStorm(seed);
    render(<PrismStormEncounter seed={seed} accentHue={90} onComplete={vi.fn()} />);
    for (const signal of state.signals) {
      expect(screen.getByLabelText(`Signal ${signal.id + 1}`)).toBeInTheDocument();
    }
  });

  it('a wrong guess never fails the encounter — the correct guess still resolves it', () => {
    const onComplete = vi.fn();
    const seed = 11;
    const state = createPrismStorm(seed);
    const wrongIndex = (state.stableIndex + 1) % state.signals.length;

    render(<PrismStormEncounter seed={seed} accentHue={200} onComplete={onComplete} />);

    act(() => {
      fireEvent.pointerDown(screen.getByLabelText(`Signal ${wrongIndex + 1}`));
    });
    expect(screen.queryByText('Signal isolated!')).not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      fireEvent.pointerDown(screen.getByLabelText(`Signal ${state.stableIndex + 1}`));
    });
    expect(screen.getByText('Signal isolated!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('disables every signal once resolved', () => {
    const seed = 22;
    const state = createPrismStorm(seed);
    render(<PrismStormEncounter seed={seed} accentHue={10} onComplete={vi.fn()} />);

    act(() => {
      fireEvent.pointerDown(screen.getByLabelText(`Signal ${state.stableIndex + 1}`));
    });

    for (const signal of state.signals) {
      expect(screen.getByLabelText(`Signal ${signal.id + 1}`)).toBeDisabled();
    }
  });
});
