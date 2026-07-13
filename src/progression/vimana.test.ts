import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VIMANA_SEED,
  VIMANA_STATE_VERSION,
  computeVimanaGenomeSeed,
  createDefaultVimanaState,
  createVimanaNode,
  deriveVimanaConnections,
  isCanonicalVimanaState,
  isVimanaNodeDiscovered,
  migrateVimanaState,
  scanVimanaNode,
} from './vimana';

describe('createDefaultVimanaState', () => {
  it('creates a canonical v2 state with a discovered home node', () => {
    const state = createDefaultVimanaState({ random: () => 0.99 });

    expect(state.version).toBe(VIMANA_STATE_VERSION);
    expect(state.nodes.length).toBeGreaterThan(0);
    expect(isCanonicalVimanaState(state)).toBe(true);

    const home = state.nodes.find((node) => node.id === state.activeNodeId);
    expect(home).toBeDefined();
    expect(isVimanaNodeDiscovered(home!)).toBe(true);
    expect(home!.firstRewardClaimed).toBe(true);

    // Every other node is a visible signal, not fully revealed.
    for (const node of state.nodes) {
      if (node.id === home!.id) continue;
      expect(node.discoveryStage).toBe('detected');
      expect(node.firstRewardClaimed).toBe(false);
    }
  });

  it('gives every node routes and keeps the graph symmetric', () => {
    const state = createDefaultVimanaState({ random: () => 0.5 });
    const byId = new Map(state.nodes.map((node) => [node.id, node]));

    for (const node of state.nodes) {
      expect(node.connections.length).toBeGreaterThan(0);
      for (const neighbourId of node.connections) {
        const neighbour = byId.get(neighbourId);
        expect(neighbour).toBeDefined();
        expect(neighbour!.connections).toContain(node.id);
      }
    }
  });
});

describe('deriveVimanaConnections', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('is deterministic for the same seed', () => {
    const first = deriveVimanaConnections(ids, 1234);
    const second = deriveVimanaConnections(ids, 1234);
    expect(Object.fromEntries(first)).toEqual(Object.fromEntries(second));
  });

  it('differs for different seeds', () => {
    const first = deriveVimanaConnections(ids, 1);
    const second = deriveVimanaConnections(ids, 987654);
    expect(Object.fromEntries(first)).not.toEqual(Object.fromEntries(second));
  });

  it('connects every node into one reachable graph', () => {
    const routes = deriveVimanaConnections(ids, 42);
    const visited = new Set<string>();
    const queue = [ids[0]];
    while (queue.length > 0) {
      const current = queue.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      queue.push(...(routes.get(current) ?? []));
    }
    expect(visited.size).toBe(ids.length);
  });

  it('derives a stable seed from a genome', () => {
    const genome = {
      red60: Array.from({ length: 60 }, (_, i) => i % 7),
      blue60: Array.from({ length: 60 }, (_, i) => (i + 1) % 7),
      black60: Array.from({ length: 60 }, (_, i) => (i + 2) % 7),
    };
    expect(computeVimanaGenomeSeed(genome)).toBe(computeVimanaGenomeSeed(genome));
    expect(computeVimanaGenomeSeed(null)).toBe(DEFAULT_VIMANA_SEED);
    expect(computeVimanaGenomeSeed(genome)).not.toBe(DEFAULT_VIMANA_SEED);
  });
});

describe('migrateVimanaState', () => {
  it('migrates a legacy preset save and preserves discovered cells', () => {
    const legacy = {
      cells: [
        { id: 'calm-1', label: 'Calm Glade', field: 'calm', discovered: true, anomaly: false, energy: 60, reward: 'mood', visitedAt: 111 },
        { id: 'neuro-1', label: 'Neuro Bloom', field: 'neuro', discovered: true, anomaly: true, energy: 65, reward: 'mystery', visitedAt: 222 },
        { id: 'quantum-1', label: 'Quantum Pool', field: 'quantum', discovered: false, anomaly: true, energy: 80, reward: 'mood' },
        { id: 'earth-1', label: 'Earth Anchor', field: 'earth', discovered: false, anomaly: false, energy: 50, reward: 'energy' },
      ],
      activeCellId: 'neuro-1',
      anomaliesFound: 1,
      anomaliesResolved: 2,
      scansPerformed: 7,
      lastScanAt: 333,
    };

    const state = migrateVimanaState(legacy, { genomeSeed: 99, now: 1000 });

    expect(state.version).toBe(VIMANA_STATE_VERSION);
    expect(state.nodes).toHaveLength(4);
    expect(state.activeNodeId).toBe('neuro-1');
    expect(state.scansPerformed).toBe(7);
    expect(state.anomaliesResolved).toBe(2);
    expect(state.lastScanAt).toBe(333);

    const calm = state.nodes.find((node) => node.id === 'calm-1')!;
    expect(isVimanaNodeDiscovered(calm)).toBe(true);
    expect(calm.discoveryStage).toBe('explored');
    expect(calm.fieldType).toBe('calm');
    expect(calm.label).toBe('Calm Glade');
    expect(calm.discoveredAt).toBe(111);
    expect(calm.lastVisitedAt).toBe(111);
    // Discovered legacy cells must never re-grant the first-discovery reward.
    expect(calm.firstRewardClaimed).toBe(true);

    const neuro = state.nodes.find((node) => node.id === 'neuro-1')!;
    expect(neuro.anomaly).not.toBeNull();
    expect(neuro.anomaly!.state).toBe('active');

    const quantum = state.nodes.find((node) => node.id === 'quantum-1')!;
    expect(quantum.discoveryStage).toBe('detected');
    expect(quantum.firstRewardClaimed).toBe(false);
    expect(quantum.anomaly!.state).toBe('dormant');

    // Routes were derived for the migrated nodes.
    for (const node of state.nodes) {
      expect(node.connections.length).toBeGreaterThan(0);
    }
  });

  it('migrates a legacy grid save with coordinates', () => {
    const legacy = {
      cells: [
        { id: '0,0,0', coordinates: { x: 0, y: 0, z: 0 }, discovered: true, anomaly: false, reward: 'mood', visitedAt: 5 },
        { id: '1,0,0', coordinates: { x: 1, y: 0, z: 0 }, discovered: false, anomaly: true, reward: 'mystery' },
      ],
      activeCellId: '0,0,0',
      anomaliesFound: 0,
      anomaliesResolved: 0,
      scansPerformed: 1,
      lastScanAt: 5,
    };

    const state = migrateVimanaState(legacy, { genomeSeed: 7 });
    const center = state.nodes.find((node) => node.id === '0,0,0')!;
    expect(center.coordinates).toEqual({ x: 0, y: 0, z: 0 });
    expect(isVimanaNodeDiscovered(center)).toBe(true);

    const edge = state.nodes.find((node) => node.id === '1,0,0')!;
    expect(edge.coordinates).toEqual({ x: 1, y: 0, z: 0 });
    expect(edge.discoveryStage).toBe('detected');
  });

  it('migrates the old lib/vimana explored-cell shape', () => {
    const legacy = {
      cells: [
        { id: 'cell-0-0', x: 0, y: 0, fieldType: 'quantum', intensity: 70, explored: true, hasAnomaly: true, anomalyType: 'rare', samples: 4 },
        { id: 'cell-1-0', x: 1, y: 0, fieldType: 'calm', intensity: 30, explored: false, hasAnomaly: false, samples: 0 },
      ],
      activeCellId: 'cell-0-0',
      totalSamples: 4,
      anomaliesResolved: 1,
      lastScanTime: 88,
    };

    const state = migrateVimanaState(legacy, { genomeSeed: 3 });
    const explored = state.nodes.find((node) => node.id === 'cell-0-0')!;
    expect(explored.discoveryStage).toBe('explored');
    expect(explored.fieldType).toBe('quantum');
    expect(explored.samples).toBe(4);
    expect(explored.firstRewardClaimed).toBe(true);
    expect(explored.anomaly).toEqual({ type: 'rare', severity: 'moderate', state: 'active' });
    expect(state.anomaliesResolved).toBe(1);
    expect(state.lastScanAt).toBe(88);
  });

  it('passes canonical state through idempotently', () => {
    const original = createDefaultVimanaState({ random: () => 0.4, genomeSeed: 11 });
    const roundTripped = migrateVimanaState(JSON.parse(JSON.stringify(original)), {
      genomeSeed: 11,
    });
    expect(roundTripped).toEqual(original);
  });

  it('falls back to a fresh default state for unrecognisable input', () => {
    for (const junk of [null, undefined, 42, 'vimana', { cells: 'nope' }, { cells: [{}] }]) {
      const state = migrateVimanaState(junk, { genomeSeed: 5 });
      expect(isCanonicalVimanaState(state)).toBe(true);
      expect(state.nodes.length).toBeGreaterThan(0);
    }
  });
});

describe('scanVimanaNode', () => {
  it('grants first discovery exactly once and advances stages', () => {
    const node = createVimanaNode({ id: 'n1', discoveryStage: 'detected', intensity: 60 });

    const first = scanVimanaNode(node, 100);
    expect(first.firstDiscovery).toBe(true);
    expect(first.node.discoveryStage).toBe('scanned');
    expect(first.node.firstRewardClaimed).toBe(true);
    expect(first.node.discoveredAt).toBe(100);
    expect(first.node.visits).toBe(1);

    const second = scanVimanaNode(first.node, 200);
    expect(second.firstDiscovery).toBe(false);
    expect(second.node.discoveryStage).toBe('explored');

    const third = scanVimanaNode(second.node, 300);
    expect(third.firstDiscovery).toBe(false);
    expect(third.node.visits).toBe(3);
    expect(third.node.discoveryStage).toBe('mastered');
    expect(third.mastered).toBe(true);
    expect(third.node.masteredAt).toBe(300);

    const fourth = scanVimanaNode(third.node, 400);
    expect(fourth.mastered).toBe(false);
    expect(fourth.node.masteredAt).toBe(300);
  });

  it('never re-grants first discovery on migrated discovered nodes', () => {
    const migrated = createVimanaNode({
      id: 'n2',
      discoveryStage: 'explored',
      firstRewardClaimed: true,
      visits: 1,
    });
    const outcome = scanVimanaNode(migrated, 500);
    expect(outcome.firstDiscovery).toBe(false);
  });

  it('reveals a dormant anomaly and blocks mastery until it is resolved', () => {
    const node = createVimanaNode({
      id: 'n3',
      discoveryStage: 'detected',
      anomaly: { type: 'energy', severity: 'minor', state: 'dormant' },
    });

    const scanned = scanVimanaNode(node, 100);
    expect(scanned.anomalyRevealed).toBe(true);
    expect(scanned.node.anomaly!.state).toBe('active');

    let current = scanned.node;
    for (const at of [200, 300, 400]) {
      current = scanVimanaNode(current, at).node;
    }
    expect(current.visits).toBeGreaterThanOrEqual(3);
    expect(current.discoveryStage).toBe('explored');

    const resolved = { ...current, anomaly: { ...current.anomaly!, state: 'resolved' as const } };
    const mastery = scanVimanaNode(resolved, 500);
    expect(mastery.node.discoveryStage).toBe('mastered');
  });
});
