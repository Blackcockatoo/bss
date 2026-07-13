import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { VimanaTetris } from './VimanaTetris';

async function renderGame(props: Parameters<typeof VimanaTetris>[0] = {}) {
  const utils = render(<VimanaTetris petName="Testling" genomeSeed={42} {...props} />);
  // The game initialises on the first animation frame.
  await waitFor(() => {
    expect(screen.getByText('Vimana Stack Field')).toBeInTheDocument();
  });
  return utils;
}

describe('VimanaTetris component', () => {
  it('renders the mobile control deck with dedicated rotate, drop and hold buttons', async () => {
    await renderGame();
    expect(screen.getByLabelText('Hold piece')).toBeInTheDocument();
    expect(screen.getByLabelText('Rotate')).toBeInTheDocument();
    expect(screen.getByLabelText('Hard drop')).toBeInTheDocument();
    expect(screen.getByLabelText('Soft drop')).toBeInTheDocument();
    expect(screen.getByLabelText('Move left')).toBeInTheDocument();
    expect(screen.getByLabelText('Move right')).toBeInTheDocument();
  });

  it('shows the hold slot and next-piece previews', async () => {
    await renderGame();
    // 'Hold' appears both as the slot label and on the hold button.
    expect(screen.getAllByText('Hold').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('pauses when the document becomes hidden', async () => {
    await renderGame();

    const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => {
      expect(screen.getAllByText('Resume').length).toBeGreaterThan(0);
    });
    hiddenSpy.mockRestore();
  });

  it('toggles pause from the keyboard', async () => {
    await renderGame();

    fireEvent.keyDown(window, { key: 'p' });
    await waitFor(() => {
      expect(screen.getAllByText('Resume').length).toBeGreaterThan(0);
    });

    fireEvent.keyDown(window, { key: 'p' });
    await waitFor(() => {
      expect(screen.queryAllByText('Resume')).toHaveLength(0);
    });
  });

  it('calls onExit when Escape is pressed', async () => {
    const onExit = vi.fn();
    await renderGame({ onExit });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
