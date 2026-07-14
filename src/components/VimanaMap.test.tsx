import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VimanaNode, VimanaState } from '@/lib/vimana';

import { VimanaMap } from './VimanaMap';

const exploreCell = vi.fn();
const resolveAnomaly = vi.fn();

const baseNode: VimanaNode = {
  id: 'base',
  label: 'Base',
  coordinates: { x: 0, y: 0, z: 0 },
  fieldType: 'calm',
  intensity: 50,
  discoveryStage: 'detected',
  connections: [],
  scanQuality: 0,
  samples: 0,
  visits: 0,
  firstRewardClaimed: false,
  anomaly: null,
  discoveredAt: null,
  lastVisitedAt: null,
  masteredAt: null,
};

function makeNode(overrides: Partial<VimanaNode> & Pick<VimanaNode, 'id'>): VimanaNode {
  return {
    ...baseNode,
    ...overrides,
    coordinates: { ...baseNode.coordinates, ...overrides.coordinates },
  };
}

const nodes: VimanaNode[] = [
  makeNode({
    id: 'calm-1',
    label: 'Calm Glade',
    coordinates: { x: 0, y: 0, z: 0 },
    fieldType: 'calm',
    intensity: 60,
    discoveryStage: 'scanned',
    connections: ['neuro-1'],
    scanQuality: 60,
    samples: 1,
    visits: 1,
    firstRewardClaimed: true,
  }),
  makeNode({
    id: 'neuro-1',
    label: 'Neuro Bloom',
    coordinates: { x: 1, y: 1, z: 0 },
    fieldType: 'neuro',
    intensity: 72,
    discoveryStage: 'scanned',
    connections: ['calm-1'],
    scanQuality: 74,
    samples: 2,
    visits: 2,
    firstRewardClaimed: true,
    anomaly: { type: 'energy', severity: 'moderate', state: 'active' },
  }),
];

const vimana: VimanaState = {
  version: 2,
  nodes,
  activeNodeId: 'calm-1',
  anomaliesFound: 1,
  anomaliesResolved: 0,
  scansPerformed: 3,
  lastScanAt: 100,
};

vi.mock('@/lib/store', () => ({
  useStore: (
    selector: (state: {
      vimana: VimanaState;
      vitals: { mood: number };
      exploreCell: typeof exploreCell;
      resolveAnomaly: typeof resolveAnomaly;
    }) => unknown,
  ) =>
    selector({
      vimana,
      vitals: { mood: 81 },
      exploreCell,
      resolveAnomaly,
    }),
}));

beforeEach(() => {
  exploreCell.mockReset();
  resolveAnomaly.mockReset();
});

describe('VimanaMap', () => {
  it('renders the connected field atlas instead of a launcher-card grid', () => {
    render(<VimanaMap />);

    expect(screen.getByText('Vimana Field Atlas')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Interactive Vimana field atlas' }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('vimana-route')).toHaveLength(1);
    expect(screen.getByTestId('vimana-node-calm-1')).toBeInTheDocument();
    expect(screen.getByTestId('vimana-node-neuro-1')).toBeInTheDocument();
  });

  it('selects a mapped node and keeps scan and anomaly actions wired to the store', () => {
    render(<VimanaMap />);

    fireEvent.click(
      screen.getByRole('button', { name: /Select Neuro Bloom, Scanned/i }),
    );

    expect(screen.getByTestId('vimana-inspector-title')).toHaveTextContent(
      'Neuro Bloom',
    );
    expect(screen.getByText('moderate energy anomaly')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enter Field' }));
    expect(exploreCell).toHaveBeenCalledWith('neuro-1');

    fireEvent.click(screen.getByRole('button', { name: 'Resolve Anomaly' }));
    expect(resolveAnomaly).toHaveBeenCalledWith('neuro-1');
  });
});
