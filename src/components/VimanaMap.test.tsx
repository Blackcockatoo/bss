import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

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

  it(
    'travels through a flight sequence then a resonance-ring scan to reach a detected signal',
    async () => {
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

      // The flight sequence plays first (a brief travel animation) — the
      // destination is not yet reached, so the store must be untouched.
      await waitFor(() => {
        expect(screen.getByText('In flight')).toBeInTheDocument();
      });
      expect(useStore.getState().vimana.activeNodeId).toBe(before.activeNodeId);

      // It completes on its own; the resonance-ring scan follows.
      await waitFor(
        () => {
          expect(screen.getByLabelText('Tap to time the resonance ring')).toBeInTheDocument();
        },
        { timeout: 4000 },
      );

      // Tap through all three rings — exact timing doesn't matter here.
      const tapZone = screen.getByLabelText('Tap to time the resonance ring');
      fireEvent.pointerDown(tapZone);
      fireEvent.pointerDown(tapZone);
      fireEvent.pointerDown(tapZone);

      await waitFor(
        () => {
          const after = useStore.getState().vimana;
          const scanned = after.nodes.find((node) => node.id === target.id)!;
          expect(isVimanaNodeDiscovered(scanned)).toBe(true);
          expect(after.activeNodeId).toBe(target.id);
        },
        { timeout: 2000 },
      );

      // Once scanned, the sheet (visible again) reveals at least the field
      // type — exactly how much more depends on the scan's timing tier,
      // covered separately below.
      await waitFor(() => {
        expect(screen.getByText(/Field:/)).toBeInTheDocument();
        // Exact match: the field-type span's own text, not a map pin label
        // that happens to contain the same word (e.g. "Calm Glade").
        expect(screen.getByText(target.fieldType)).toBeInTheDocument();
      });
    },
    10_000,
  );

  it('reveals more node detail as the banked scan quality rises', async () => {
    render(<VimanaMap />);
    const { vimana } = useStore.getState();
    const home = vimana.nodes.find((node) => node.id === vimana.activeNodeId)!;

    fireEvent.click(screen.getByLabelText(`${home.label ?? home.id} — Scanned`));
    // The default preset home node banks a 'clean' quality (60) at genesis.
    await waitFor(() => {
      expect(screen.getByText(/Intensity/)).toBeInTheDocument();
      expect(screen.getByText(/Visits/)).toBeInTheDocument();
    });

    act(() => {
      useStore.setState({
        vimana: {
          ...useStore.getState().vimana,
          nodes: useStore
            .getState()
            .vimana.nodes.map((node) =>
              node.id === home.id ? { ...node, scanQuality: 20 } : node,
            ),
        },
      });
    });

    // A rough scanQuality hides intensity/visit detail behind a hint instead.
    await waitFor(() => {
      expect(screen.queryByText(/Intensity/)).not.toBeInTheDocument();
      expect(
        screen.getByText('A sharper scan would read this field more clearly.'),
      ).toBeInTheDocument();
    });
  });

  it(
    'scanning at the current node skips the flight sequence and goes straight to the scan ring',
    async () => {
      render(<VimanaMap />);
      const { vimana } = useStore.getState();
      const home = vimana.nodes.find((node) => node.id === vimana.activeNodeId)!;

      fireEvent.click(screen.getByLabelText(`${home.label ?? home.id} — Scanned`));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Deep Scan/ })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Deep Scan/ }));
      expect(screen.queryByText('In flight')).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByLabelText('Tap to time the resonance ring')).toBeInTheDocument();
      });

      const tapZone = screen.getByLabelText('Tap to time the resonance ring');
      fireEvent.pointerDown(tapZone);
      fireEvent.pointerDown(tapZone);
      fireEvent.pointerDown(tapZone);

      await waitFor(
        () => {
          expect(useStore.getState().vimana.nodes.find((n) => n.id === home.id)!.visits).toBe(
            home.visits + 1,
          );
        },
        { timeout: 2000 },
      );
    },
    10_000,
  );

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
