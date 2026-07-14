import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { VimanaTetris } from './VimanaTetris';

async function renderMenu(props: Parameters<typeof VimanaTetris>[0] = {}) {
  const utils = render(<VimanaTetris petName="Testling" genomeSeed={42} {...props} />);
  await waitFor(() => {
    expect(screen.getByText('Choose a flight plan')).toBeInTheDocument();
  });
  return utils;
}

async function renderGame(props: Parameters<typeof VimanaTetris>[0] = {}) {
  const utils = await renderMenu(props);
  fireEvent.pointerDown(screen.getByText('Endless Flight'));
  await waitFor(() => {
    expect(screen.queryByText('Choose a flight plan')).not.toBeInTheDocument();
  });
  return utils;
}

describe('VimanaTetris component', () => {
  it('offers endless and 60s expedition modes from the menu', async () => {
    await renderMenu();
    expect(screen.getByText('Endless Flight')).toBeInTheDocument();
    expect(screen.getByText('Expedition Repair · 60s')).toBeInTheDocument();
  });

  it('shows the expedition countdown when starting a 60s repair run', async () => {
    await renderMenu();
    fireEvent.pointerDown(screen.getByText('Expedition Repair · 60s'));
    await waitFor(() => {
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('60s')).toBeInTheDocument();
    });
  });

  it('renders the mobile control deck with dedicated rotate, drop and hold buttons', async () => {
    await renderGame();
    expect(screen.getByLabelText('Hold piece')).toBeInTheDocument();
    expect(screen.getByLabelText('Rotate')).toBeInTheDocument();
    expect(screen.getByLabelText('Hard drop')).toBeInTheDocument();
    expect(screen.getByLabelText('Soft drop')).toBeInTheDocument();
    expect(screen.getByLabelText('Move left')).toBeInTheDocument();
    expect(screen.getByLabelText('Move right')).toBeInTheDocument();
  });

  it('shows hold slot, previews, resonance meter and dosha power buttons', async () => {
    await renderGame();
    // 'Hold' appears both as the slot label and on the hold button.
    expect(screen.getAllByText('Hold').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Resonance' })).toBeInTheDocument();
    expect(screen.getByLabelText('Forge power')).toBeInTheDocument();
    expect(screen.getByLabelText('Flux power')).toBeInTheDocument();
    expect(screen.getByLabelText('Anchor power')).toBeInTheDocument();
  });

  it('disables powers until resonance is earned', async () => {
    await renderGame();
    expect(screen.getByLabelText('Forge power')).toBeDisabled();
    expect(screen.getByLabelText('Flux power')).toBeDisabled();
    expect(screen.getByLabelText('Anchor power')).toBeDisabled();
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

  it('calls onExit when Escape is pressed in game and in the menu', async () => {
    const onExit = vi.fn();
    await renderGame({ onExit });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledTimes(1);

    const menuExit = vi.fn();
    await renderMenu({ onExit: menuExit });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(menuExit).toHaveBeenCalledTimes(1);
  });

  it('has a vibration toggle', async () => {
    await renderGame();
    const toggle = screen.getByLabelText('Disable vibration');
    fireEvent.pointerDown(toggle);
    await waitFor(() => {
      expect(screen.getByLabelText('Enable vibration')).toBeInTheDocument();
    });
  });
});
