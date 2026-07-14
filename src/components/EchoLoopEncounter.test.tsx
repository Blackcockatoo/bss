import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { EchoLoopEncounter } from './EchoLoopEncounter';
import { createEchoLoop } from '@/lib/minigames/echoLoop';

describe('EchoLoopEncounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays the sequence back then accepts taps, calling onComplete on a correct replay', () => {
    const onComplete = vi.fn();
    const seed = 12345;
    const sequence = createEchoLoop(seed).sequence;

    render(<EchoLoopEncounter seed={seed} accentHue={200} onComplete={onComplete} />);

    // Fast-forward through the whole playback phase.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText(/replay the pattern/)).toBeInTheDocument();

    for (const pad of sequence) {
      act(() => {
        fireEvent.pointerDown(screen.getByLabelText(`Resonance pad ${pad + 1}`));
      });
    }

    expect(screen.getByText('Echo resolved!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('never fails on a wrong tap — it resets input and stays solvable', () => {
    const onComplete = vi.fn();
    const seed = 777;
    const sequence = createEchoLoop(seed).sequence;
    const wrongFirstPad = (sequence[0] + 1) % 4;

    render(<EchoLoopEncounter seed={seed} accentHue={40} onComplete={onComplete} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText(/replay the pattern/)).toBeInTheDocument();

    act(() => {
      fireEvent.pointerDown(screen.getByLabelText(`Resonance pad ${wrongFirstPad + 1}`));
    });
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    for (const pad of sequence) {
      act(() => {
        fireEvent.pointerDown(screen.getByLabelText(`Resonance pad ${pad + 1}`));
      });
    }
    expect(screen.getByText('Echo resolved!')).toBeInTheDocument();
  });
});
