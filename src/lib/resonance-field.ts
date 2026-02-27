/**
 * Harmonic Resonance Field — Standing Wave Propagation Through Lattice
 *
 * Models the crystal lattice as a vibrating medium where standing waves
 * propagate through edges.  DNA digits set the natural frequency of each
 * node, creating resonance patterns unique to each genome.
 *
 * Physics model:
 *   Each node is a harmonic oscillator with:
 *     - Natural frequency ω₀ derived from its DNA digit
 *     - Amplitude A that oscillates over time
 *     - Phase φ that accumulates based on frequency
 *     - Damping γ that slowly reduces amplitude
 *
 *   Coupling between connected nodes:
 *     Adjacent nodes exchange energy via their edges.  When two nodes
 *     have similar frequencies, they resonate — energy builds up.  When
 *     frequencies clash, destructive interference dissipates energy.
 *
 *   Resonance detection:
 *     Nodes that sustain high amplitude for multiple cycles are "resonant".
 *     These become structural anchors — the lattice strengthens around them.
 *     Nodes that consistently lose energy are "dissonant" and may be pruned.
 *
 * DNA frequency mapping (base-7 → harmonic series):
 *   digit 0 → ω = 1.0    (fundamental)
 *   digit 1 → ω = 1.5    (perfect fifth / 3:2)
 *   digit 2 → ω = 2.0    (octave)
 *   digit 3 → ω = 2.5    (major third+octave / 5:2)
 *   digit 4 → ω = 3.0    (perfect twelfth / 3:1)
 *   digit 5 → ω = φ      (golden ratio — irrational, never repeats)
 *   digit 6 → ω = π/2    (transcendental — maximum complexity)
 *
 * This creates a musical lattice where the genome literally *sounds*
 * through the crystal structure.
 */

const PHI = (1 + Math.sqrt(5)) / 2;

// ── Types ────────────────────────────────────────────────────────────────────
export interface ResonanceNode {
  nodeId:       number;
  frequency:    number;       // natural frequency ω₀
  amplitude:    number;       // current oscillation amplitude (0-1)
  phase:        number;       // accumulated phase (radians)
  energy:       number;       // running average energy
  resonant:     boolean;      // true if sustaining resonance
  dissonant:    boolean;      // true if consistently losing energy
  harmonicRank: number;       // 0 = no special, 1+ = nth harmonic match
}

export interface ResonanceEdge {
  a: number;
  b: number;
  coupling:   number;         // coupling strength (0-1)
  flowRate:   number;         // current energy flow rate
  resonating: boolean;        // true if both ends are in resonance
}

export interface ResonanceFieldState {
  nodes:          ResonanceNode[];
  edges:          ResonanceEdge[];
  globalEnergy:   number;       // total energy in the system
  resonanceRatio: number;       // fraction of nodes in resonance (0-1)
  harmonicOrder:  number;       // detected harmonic pattern order
  tick:           number;
}

export interface StandingWavePattern {
  frequency:  number;
  nodeIds:    number[];         // nodes participating in this pattern
  amplitude:  number;           // pattern strength
  order:      number;           // harmonic order (1st, 2nd, 3rd...)
}

// ── Frequency mapping ────────────────────────────────────────────────────────
const DNA_FREQUENCIES: Record<number, number> = {
  0: 1.0,               // fundamental
  1: 1.5,               // perfect fifth
  2: 2.0,               // octave
  3: 2.5,               // major third + octave
  4: 3.0,               // perfect twelfth
  5: PHI,               // golden ratio (≈1.618)
  6: Math.PI / 2,       // transcendental (≈1.571)
};

function getFrequency(dnaDigit: number): number {
  return DNA_FREQUENCIES[Math.min(6, Math.max(0, dnaDigit))] || 1.0;
}

// ── Initialisation ───────────────────────────────────────────────────────────

/**
 * Initialise a resonance field over a set of lattice nodes.
 *
 * @param nodeIds     Array of node IDs in the lattice
 * @param dnaDigits   DNA digit for each node (index-matched to nodeIds)
 * @param edges       Pairs of node IDs that are connected
 */
export function initResonanceField(
  nodeIds: number[],
  dnaDigits: number[],
  edges: [number, number][],
): ResonanceFieldState {
  const nodes: ResonanceNode[] = nodeIds.map((id, i) => {
    const digit = dnaDigits[i] ?? 0;
    return {
      nodeId:       id,
      frequency:    getFrequency(digit),
      amplitude:    0.5 + Math.random() * 0.3,   // start with some energy
      phase:        Math.random() * Math.PI * 2,  // random initial phase
      energy:       0.4,
      resonant:     false,
      dissonant:    false,
      harmonicRank: 0,
    };
  });

  const nodeSet = new Set(nodeIds);
  const resEdges: ResonanceEdge[] = edges
    .filter(([a, b]) => nodeSet.has(a) && nodeSet.has(b))
    .map(([a, b]) => ({
      a, b,
      coupling:   0.5,
      flowRate:   0,
      resonating: false,
    }));

  return {
    nodes,
    edges: resEdges,
    globalEnergy: nodes.reduce((s, n) => s + n.energy, 0),
    resonanceRatio: 0,
    harmonicOrder: 0,
    tick: 0,
  };
}

// ── Simulation step ──────────────────────────────────────────────────────────

const DAMPING      = 0.005;    // energy loss per tick
const COUPLING_K   = 0.12;     // coupling strength between neighbours
const RESONANCE_TH = 0.6;      // amplitude threshold for resonance
const DISSONANCE_TH = 0.15;    // energy threshold for dissonance

/**
 * Advance the resonance field by one tick.
 *
 * Each tick:
 *   1. Update phase:  φ += ω × dt
 *   2. Compute instantaneous displacement:  x = A × sin(φ)
 *   3. Couple neighbours: energy flows from high to low amplitude
 *      - Same frequency → constructive → coupling amplifies
 *      - Different frequency → destructive → coupling dampens
 *   4. Apply damping
 *   5. Classify nodes as resonant / dissonant
 */
export function resonanceTick(state: ResonanceFieldState, dt: number = 0.1): ResonanceFieldState {
  const nodes = state.nodes.map(n => ({ ...n }));
  const edges = state.edges.map(e => ({ ...e }));

  // Index lookup
  const idxMap = new Map<number, number>();
  for (let i = 0; i < nodes.length; i++) idxMap.set(nodes[i].nodeId, i);

  // 1. Update phases
  for (const n of nodes) {
    n.phase += n.frequency * dt;
  }

  // 2. Coupling
  for (const edge of edges) {
    const iA = idxMap.get(edge.a);
    const iB = idxMap.get(edge.b);
    if (iA === undefined || iB === undefined) continue;

    const nA = nodes[iA];
    const nB = nodes[iB];

    // Displacement
    const xA = nA.amplitude * Math.sin(nA.phase);
    const xB = nB.amplitude * Math.sin(nB.phase);

    // Frequency ratio — closer to integer ratio = more resonance
    const ratio = nA.frequency / nB.frequency;
    const nearestHarmonic = Math.round(ratio * 2) / 2; // snap to nearest 0.5
    const harmonicDist = Math.abs(ratio - nearestHarmonic);
    const resonanceFactor = Math.exp(-harmonicDist * 8); // 0→1, sharp peak at harmonics

    // Energy transfer: flows from higher to lower amplitude, modulated by resonance
    const diff = xA - xB;
    const flow = COUPLING_K * diff * resonanceFactor;

    nA.amplitude -= flow * 0.5;
    nB.amplitude += flow * 0.5;

    // Constructive interference boosts both if they're in sync
    if (resonanceFactor > 0.7) {
      const boost = resonanceFactor * 0.008;
      nA.amplitude += boost;
      nB.amplitude += boost;
    }

    // Track edge state
    edge.flowRate = Math.abs(flow);
    edge.coupling = resonanceFactor;
    edge.resonating = resonanceFactor > 0.7 && nA.amplitude > 0.3 && nB.amplitude > 0.3;
  }

  // 3. Damping + clamping
  for (const n of nodes) {
    n.amplitude *= (1 - DAMPING);
    n.amplitude = Math.max(0, Math.min(1.5, n.amplitude));

    // Running energy average (exponential moving average)
    const instantEnergy = n.amplitude * n.amplitude * 0.5;
    n.energy = n.energy * 0.95 + instantEnergy * 0.05;
  }

  // 4. Classify resonance / dissonance
  let resonantCount = 0;
  for (const n of nodes) {
    n.resonant = n.energy > RESONANCE_TH * RESONANCE_TH * 0.5;
    n.dissonant = n.energy < DISSONANCE_TH * DISSONANCE_TH * 0.5;
    if (n.resonant) resonantCount++;
  }

  // 5. Detect harmonic patterns
  const harmonicOrder = detectHarmonicOrder(nodes);

  // 6. Assign harmonic ranks to resonant nodes
  assignHarmonicRanks(nodes, edges, idxMap);

  const globalEnergy = nodes.reduce((s, n) => s + n.energy, 0);
  const resonanceRatio = nodes.length > 0 ? resonantCount / nodes.length : 0;

  return {
    nodes,
    edges,
    globalEnergy,
    resonanceRatio,
    harmonicOrder,
    tick: state.tick + 1,
  };
}

/**
 * Detect the dominant harmonic order.
 * Counts how many distinct frequency clusters have multiple resonant nodes.
 */
function detectHarmonicOrder(nodes: ResonanceNode[]): number {
  const resonant = nodes.filter(n => n.resonant);
  if (resonant.length < 2) return 0;

  // Bucket frequencies (within 10% tolerance)
  const clusters: number[][] = [];
  for (const n of resonant) {
    let placed = false;
    for (const cluster of clusters) {
      const ref = nodes[cluster[0]]?.frequency ?? 1;
      if (Math.abs(n.frequency - ref) / ref < 0.1) {
        cluster.push(nodes.indexOf(n));
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([nodes.indexOf(n)]);
  }

  // Harmonic order = number of clusters with 2+ members
  return clusters.filter(c => c.length >= 2).length;
}

/**
 * Assign harmonic ranks: nodes connected to many resonating edges get
 * higher ranks, making them structural anchors.
 */
function assignHarmonicRanks(
  nodes: ResonanceNode[],
  edges: ResonanceEdge[],
  idxMap: Map<number, number>,
): void {
  const rankCount = new Map<number, number>();

  for (const edge of edges) {
    if (!edge.resonating) continue;
    const iA = idxMap.get(edge.a);
    const iB = idxMap.get(edge.b);
    if (iA !== undefined) rankCount.set(iA, (rankCount.get(iA) || 0) + 1);
    if (iB !== undefined) rankCount.set(iB, (rankCount.get(iB) || 0) + 1);
  }

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].harmonicRank = rankCount.get(i) || 0;
  }
}

// ── Standing wave detection ──────────────────────────────────────────────────

/**
 * Detect standing wave patterns in the current field state.
 *
 * A standing wave is a group of nodes oscillating at the same frequency
 * (within tolerance) with high sustained amplitude.  These represent
 * the stable vibrational modes of the crystal — the "notes" it plays.
 */
export function detectStandingWaves(state: ResonanceFieldState): StandingWavePattern[] {
  const patterns: StandingWavePattern[] = [];
  const used = new Set<number>();

  // Sort resonant nodes by energy (strongest first)
  const sorted = state.nodes
    .filter(n => n.resonant)
    .sort((a, b) => b.energy - a.energy);

  for (const seed of sorted) {
    if (used.has(seed.nodeId)) continue;

    // Find all nodes with similar frequency (within 5%)
    const cluster = [seed.nodeId];
    used.add(seed.nodeId);

    for (const other of sorted) {
      if (used.has(other.nodeId)) continue;
      const ratio = seed.frequency / other.frequency;
      if (Math.abs(ratio - Math.round(ratio)) < 0.05) {
        cluster.push(other.nodeId);
        used.add(other.nodeId);
      }
    }

    if (cluster.length >= 2) {
      const avgAmp = cluster.reduce((s, id) => {
        const n = state.nodes.find(n => n.nodeId === id);
        return s + (n?.amplitude ?? 0);
      }, 0) / cluster.length;

      patterns.push({
        frequency: seed.frequency,
        nodeIds: cluster,
        amplitude: avgAmp,
        order: patterns.length + 1,
      });
    }
  }

  return patterns;
}

/**
 * Get the resonance "color" for a node based on its current state.
 * Returns an HSL color string for visualization.
 *
 * Resonant nodes glow warm (amber/gold).
 * Dissonant nodes dim (dark blue).
 * Neutral nodes are cool cyan.
 */
export function getResonanceColor(node: ResonanceNode): string {
  if (node.resonant) {
    const brightness = 50 + node.energy * 30;
    const hue = 35 + node.harmonicRank * 15; // shift toward gold with rank
    return `hsl(${Math.min(hue, 60)}, 90%, ${brightness}%)`;
  }
  if (node.dissonant) {
    return `hsl(220, 40%, ${20 + node.energy * 20}%)`;
  }
  return `hsl(190, 60%, ${35 + node.amplitude * 25}%)`;
}

/**
 * Get the resonance intensity at a node (0-1 normalised).
 * Useful for sizing nodes or controlling glow.
 */
export function getResonanceIntensity(node: ResonanceNode): number {
  const displacement = Math.abs(Math.sin(node.phase)) * node.amplitude;
  return Math.min(1, displacement * 1.2);
}
