import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { BattleArena } from './BattleArena';
import { useStore } from '@/lib/store';
import { createDefaultBattleStats } from '@/lib/progression/types';

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
