import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EvolutionCeremony } from './EvolutionCeremony';
import { MiniGamesPanel } from './MiniGamesPanel';

// Test actual layout ownership: a transformed activity/pet ancestor must not
// capture a fixed overlay or let the persistent nav sit on top of gameplay.
describe('full-screen overlays', () => {
  it('portals the evolution ceremony to the viewport and keeps Skip working', () => {
    const onComplete = vi.fn();
    render(<div style={{ transform: 'translateZ(0)' }}><EvolutionCeremony stage="NEURO" onComplete={onComplete} reduceMotion /></div>);
    expect(screen.getByRole('status').parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('opens the minigame above the page shell and Close restores the arcade', () => {
    render(<div style={{ transform: 'translateZ(0)' }}><MiniGamesPanel petName="Test pet" /></div>);
    fireEvent.click(screen.getAllByRole('button', { name: /^Play$/ })[3]);
    const dialog = screen.getByRole('dialog', { name: 'Vimana Tetris Field' });
    expect(dialog.parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole('button', { name: /^Close$/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
