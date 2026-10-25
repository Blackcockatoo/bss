import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import * as engine from '@/lib/battle';
import { BattleArena } from './BattleArena';
import { useStore } from '@/lib/store';
import { createDefaultBattleStats } from '@/lib/progression/types';

const originalRecordBattle = useStore.getState().recordBattle;
const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => motion.reduced }));
vi.mock('./living-genome/LivingScene', () => ({ LivingCompanion: () => <div>Live companion</div> }));

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); motion.reduced = false; });

describe('BattleArena', () => {
  beforeEach(() => {
    useStore.setState({
      battle: createDefaultBattleStats(),
      systemState: 'active',
    });
  });

  it('renders standalone with no props, matching its existing dashboard usage', () => {
    render(<BattleArena />);
    expect(screen.getByText('Consciousness Arena')).toBeInTheDocument();
    expect(screen.queryByText('Return to field')).not.toBeInTheDocument();
  });

  it('shows a "Return to field" affordance only when onExit is provided, and calls it', () => {
    const onExit = vi.fn();
    render(<BattleArena onExit={onExit} />);
    const returnButton = screen.getByText('Return to field');
    fireEvent.click(returnButton);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

// Keep presentation-independent engine tests deterministic, including the cosmetic lock.

function enterBattle() {
  fireEvent.click(screen.getByRole('button', { name: 'Enter Arena' }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(engine.OPPONENTS[0]) }));
}

const turnOutcome = {
  playerHpAfter: 42, opponentHpAfter: 38,
  playerStatusAfter: null, opponentStatusAfter: 'Phased' as const,
  messages: ['The target became Phased!'], battleOver: false, winner: null,
};

describe('Battle turn presentation integrity', () => {
  beforeEach(() => useStore.setState({ battle: createDefaultBattleStats(), systemState: 'active', recordBattle: originalRecordBattle }));

  it('locks repeated taps and applies the exact engine health and status after feedback', () => {
    vi.useFakeTimers();
    const execute = vi.spyOn(engine, 'executeTurn').mockReturnValue(turnOutcome);
    render(<BattleArena />);
    enterBattle();
    const move = screen.getAllByRole('button', { pressed: false })[0];
    fireEvent.click(move);
    fireEvent.click(move);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(move).toBeDisabled();
    act(() => vi.advanceTimersByTime(650));
    expect(screen.getAllByRole('progressbar').map(bar => bar.getAttribute('aria-valuenow'))).toEqual(['38', '42']);
    expect(screen.getByText('Phased')).toBeInTheDocument();
    expect(move).not.toBeDisabled();
  });

  it.each(['player', 'opponent'] as const)('records a %s result once before navigation cancels animation', winner => {
    vi.useFakeTimers();
    vi.spyOn(engine, 'executeTurn').mockReturnValue({ ...turnOutcome, battleOver: true, winner });
    const record = vi.spyOn(useStore.getState(), 'recordBattle');
    const onWin = vi.fn();
    const { unmount } = render(<BattleArena onWin={onWin} />);
    enterBattle();
    fireEvent.click(screen.getAllByRole('button', { pressed: false })[0]);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(winner === 'player' ? 'win' : 'loss', engine.OPPONENTS[0]);
    expect(onWin).toHaveBeenCalledTimes(winner === 'player' ? 1 : 0);
    unmount();
    act(() => vi.runAllTimers());
    expect(record).toHaveBeenCalledTimes(1);
  });

  it.each(['player', 'opponent'] as const)('shows the %s result and allows a rematch', winner => {
    vi.useFakeTimers();
    vi.spyOn(engine, 'executeTurn').mockReturnValue({ ...turnOutcome, battleOver: true, winner });
    render(<BattleArena />);
    enterBattle();
    fireEvent.click(screen.getAllByRole('button', { pressed: false })[0]);
    act(() => vi.advanceTimersByTime(650));
    expect(screen.getByRole('button', { name: 'Rematch' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rematch' }));
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.getAllByRole('button', { pressed: false })[0]).not.toBeDisabled();
  });
});

it('resolves without an animation delay when reduced motion is requested', () => {
  motion.reduced = true;
  useStore.setState({ battle: createDefaultBattleStats(), recordBattle: originalRecordBattle });
  const execute = vi.spyOn(engine, 'executeTurn').mockReturnValue(turnOutcome);
  render(<BattleArena />);
  enterBattle();
  fireEvent.click(screen.getAllByRole('button', { pressed: false })[0]);
  expect(execute).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('progressbar').map(bar => bar.getAttribute('aria-valuenow'))).toEqual(['38', '42']);
  expect(screen.getAllByRole('button', { pressed: false })[0]).not.toBeDisabled();
});
