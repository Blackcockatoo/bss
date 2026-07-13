import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { VimanaMap } from './VimanaMap';
import { useStore } from '@/lib/store';
import { createDefaultVimanaState, isVimanaNodeDiscovered } from '@/lib/vimana';

describe('VimanaMap', () => {
  beforeEach(() => {
    useStore.setState({
      vimana: createDefaultVimanaState({ random: () => 0.4, genomeSeed: 21 }),
      essence: 0,
      achievements: [],
      rewardHistory: [],
      systemState: 'active',
    });
  });

  it('renders the pannable viewport with the craft at the active node', () => {
    render(<VimanaMap />);
    expect(screen.getByTestId('vimana-map-viewport')).toBeInTheDocument();
    expect(screen.getByLabelText('Vimana craft')).toBeInTheDocument();
  });

  it('keeps fogged nodes off the map and shows detected signals without details', () => {
    render(<VimanaMap />);
    const { vimana } = useStore.getState();
    const visible = vimana.nodes.filter((node) => node.discoveryStage !== 'unknown');
    expect(visible.length).toBeLessThan(vimana.nodes.length); // fog exists
    const buttons = screen.getAllByLabelText(/Signal Detected|Scanned|Explored|Mastered/);
    expect(buttons).toHaveLength(visible.length);

    // Detected-but-unscanned nodes must not leak their field name.
    const detected = vimana.nodes.filter((node) => node.discoveryStage === 'detected');
    expect(detected.length).toBeGreaterThan(0);
    expect(
      screen.getAllByLabelText('Unidentified Signal — Signal Detected'),
    ).toHaveLength(detected.length);
  });

  it('opens the bottom sheet on tap and travels + scans a detected signal', async () => {
    render(<VimanaMap />);
    const before = useStore.getState().vimana;
    const target = before.nodes.find((node) => node.discoveryStage === 'detected')!;

    fireEvent.click(screen.getAllByLabelText('Unidentified Signal — Signal Detected')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('vimana-bottom-sheet')).toBeInTheDocument();
    });
    // Progressive reveal: no field/intensity information before scanning.
    expect(screen.queryByText(/Intensity/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Travel & Scan/ }));
    await waitFor(() => {
      const after = useStore.getState().vimana;
      const scanned = after.nodes.find((node) => node.id === target.id)!;
      expect(isVimanaNodeDiscovered(scanned)).toBe(true);
      expect(after.activeNodeId).toBe(target.id);
    });
    // Once scanned, the sheet reveals field details.
    await waitFor(() => {
      expect(screen.getByText(/Intensity/)).toBeInTheDocument();
    });
  });

  it('shows scanned node details for the home field', async () => {
    render(<VimanaMap />);
    const { vimana } = useStore.getState();
    const home = vimana.nodes.find((node) => node.id === vimana.activeNodeId)!;

    fireEvent.click(
      screen.getByLabelText(`${home.label ?? home.id} — ${'Scanned'}`),
    );
    await waitFor(() => {
      expect(screen.getByTestId('vimana-bottom-sheet')).toBeInTheDocument();
      expect(screen.getByText(/Intensity/)).toBeInTheDocument();
      expect(screen.getByText('The craft is holding position here.')).toBeInTheDocument();
    });
  });
});
