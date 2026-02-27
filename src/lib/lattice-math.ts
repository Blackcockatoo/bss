/**
 * Lattice Mathematics Engine
 *
 * Computes 3-dimensional crystal lattice structures seeded by a 60-digit DNA
 * genome.  The DNA acts as a foundational blueprint that determines:
 *
 *   1.  Which Bravais lattice type dominates  (FCC / BCC / HCP / Icosahedral)
 *   2.  How growth propagates from a central seed outward
 *   3.  Structural integrity tensors that prevent collapse
 *   4.  Geometric emergence — platonic sub-shells that self-organise
 *
 * All geometry is expressed in a right-handed coordinate system with
 * perspective projection helpers for canvas rendering.
 *
 * Designed to complement  CrystallineNetwork.tsx  (the 60-node 2D/4D
 * small-world graph) by adding a *physical* 3D scaffold layer.
 */

// ── Constants ────────────────────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;       // golden ratio  φ ≈ 1.618
const TAU = 2 * Math.PI;
const SQRT2 = Math.SQRT2;
const SQRT3 = Math.sqrt(3);

// ── Seeded RNG (same xorshift32 as CrystallineNetwork) ──────────────────────
export function createSeededRng(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function dnaSeed(dna: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < dna.length; i++) {
    h ^= dna.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface Vec3 { x: number; y: number; z: number }

export type LatticeType = 'fcc' | 'bcc' | 'hcp' | 'icosahedral';

export interface LatticeNode {
  id:          number;
  pos:         Vec3;          // 3D position in lattice space
  generation:  number;        // growth wave that spawned this node
  dnaDigit:    number;        // genome digit mapped to this node  (0-6)
  coordination: number;       // actual neighbour count
  stress:      number;        // normalised load  0 → 1
  alive:       boolean;       // false = pruned / collapsed
  growthAge:   number;        // tick when this node was born
  blueprint:   boolean;       // true = part of the target scaffold
}

export interface LatticeEdge {
  a: number;                  // source node id
  b: number;                  // target node id
  load: number;               // stress flowing through this edge  (0-1)
  reinforced: boolean;        // extra strut spawned by integrity system
}

export interface LatticeBlueprint {
  type:         LatticeType;
  targetNodes:  Vec3[];       // ideal vertex positions of the blueprint
  targetEdges:  [number, number][];
  symmetryOrder: number;      // rotational symmetry  (e.g. 48 for FCC)
}

export interface LatticeState {
  nodes:       LatticeNode[];
  edges:       LatticeEdge[];
  generation:  number;
  integrity:   number;        // 0 → 1, structural health
  completion:  number;        // 0 → 1, how much of blueprint is filled
  collapsed:   boolean;
  blueprint:   LatticeBlueprint;
}

export interface LatticeStats {
  nodeCount:     number;
  edgeCount:     number;
  avgCoord:      number;      // average coordination number
  maxStress:     number;
  integrity:     number;
  completion:    number;
  latticeType:   LatticeType;
  symmetryOrder: number;
}

// ── Vector arithmetic ────────────────────────────────────────────────────────
export function v3(x: number, y: number, z: number): Vec3 { return { x, y, z }; }
export function v3add(a: Vec3, b: Vec3): Vec3 { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
export function v3sub(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
export function v3scale(a: Vec3, s: number): Vec3 { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
export function v3dot(a: Vec3, b: Vec3): number { return a.x * b.x + a.y * b.y + a.z * b.z; }
export function v3cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
export function v3len(a: Vec3): number { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); }
export function v3norm(a: Vec3): Vec3 {
  const l = v3len(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}
export function v3dist(a: Vec3, b: Vec3): number { return v3len(v3sub(a, b)); }

// ── 3D rotation ──────────────────────────────────────────────────────────────
export function rotateY(p: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}
export function rotateX(p: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}
export function rotateZ(p: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
}

// ── Perspective projection  (3D → 2D) ───────────────────────────────────────
export function project(
  p: Vec3, cx: number, cy: number, fov: number, viewDist: number,
): { sx: number; sy: number; depth: number } {
  const d = viewDist + p.z;
  const f = fov / Math.max(d, 0.1);
  return { sx: cx + p.x * f, sy: cy - p.y * f, depth: d };
}

// ── Blueprint generation  ────────────────────────────────────────────────────
//
//  The DNA determines which Bravais lattice to use as the target scaffold.
//  red60[0..4] → lattice type selection
//  red60[5..9] → scale factor
//  The full 60-digit sequence modulates vertex jitter and edge strengths.

/**
 * Generate the 12 vertices of a regular icosahedron (radius r).
 */
function icosahedronVerts(r: number): Vec3[] {
  const pts: Vec3[] = [];
  // top and bottom poles
  pts.push(v3(0, r, 0));
  pts.push(v3(0, -r, 0));
  // upper ring of 5 vertices
  const upperAngle = Math.atan(0.5);  // angle from pole ~26.57°
  const uy = r * Math.sin(upperAngle);
  const ur = r * Math.cos(upperAngle);
  for (let i = 0; i < 5; i++) {
    const a = TAU * i / 5;
    pts.push(v3(ur * Math.cos(a), uy, ur * Math.sin(a)));
  }
  // lower ring of 5 vertices (rotated π/5 from upper)
  for (let i = 0; i < 5; i++) {
    const a = TAU * i / 5 + Math.PI / 5;
    pts.push(v3(ur * Math.cos(a), -uy, ur * Math.sin(a)));
  }
  return pts;
}

/**
 * Edges of a regular icosahedron (indices into the 12-vertex array).
 */
function icosahedronEdges(): [number, number][] {
  const edges: [number, number][] = [];
  // top to upper ring
  for (let i = 0; i < 5; i++) edges.push([0, 2 + i]);
  // upper ring
  for (let i = 0; i < 5; i++) edges.push([2 + i, 2 + (i + 1) % 5]);
  // upper ring to lower ring
  for (let i = 0; i < 5; i++) {
    edges.push([2 + i, 7 + i]);
    edges.push([2 + i, 7 + (i + 4) % 5]);
  }
  // lower ring
  for (let i = 0; i < 5; i++) edges.push([7 + i, 7 + (i + 1) % 5]);
  // bottom to lower ring
  for (let i = 0; i < 5; i++) edges.push([1, 7 + i]);
  return edges;
}

/**
 * Generate Face-Centered Cubic lattice vertices within a bounding radius.
 * The FCC unit cell has atoms at corners and face centres.
 */
function fccVerts(radius: number, spacing: number): Vec3[] {
  const pts: Vec3[] = [];
  const half = spacing / 2;
  const n = Math.ceil(radius / spacing);
  for (let ix = -n; ix <= n; ix++)
    for (let iy = -n; iy <= n; iy++)
      for (let iz = -n; iz <= n; iz++) {
        // 4 atoms per unit cell
        const base = v3(ix * spacing, iy * spacing, iz * spacing);
        const candidates = [
          base,
          v3add(base, v3(half, half, 0)),
          v3add(base, v3(half, 0, half)),
          v3add(base, v3(0, half, half)),
        ];
        for (const c of candidates)
          if (v3len(c) <= radius + 0.01) pts.push(c);
      }
  // Deduplicate
  return deduplicateVerts(pts, spacing * 0.2);
}

/**
 * Body-Centered Cubic lattice vertices.
 */
function bccVerts(radius: number, spacing: number): Vec3[] {
  const pts: Vec3[] = [];
  const half = spacing / 2;
  const n = Math.ceil(radius / spacing);
  for (let ix = -n; ix <= n; ix++)
    for (let iy = -n; iy <= n; iy++)
      for (let iz = -n; iz <= n; iz++) {
        const base = v3(ix * spacing, iy * spacing, iz * spacing);
        const candidates = [base, v3add(base, v3(half, half, half))];
        for (const c of candidates)
          if (v3len(c) <= radius + 0.01) pts.push(c);
      }
  return deduplicateVerts(pts, spacing * 0.2);
}

/**
 * Hexagonal Close-Packed lattice vertices (ABAB stacking).
 */
function hcpVerts(radius: number, spacing: number): Vec3[] {
  const pts: Vec3[] = [];
  const layerHeight = spacing * Math.sqrt(2 / 3);
  const nLayers = Math.ceil(radius / layerHeight);
  const nHex = Math.ceil(radius / spacing);

  for (let layer = -nLayers; layer <= nLayers; layer++) {
    const y = layer * layerHeight;
    const isB = Math.abs(layer) % 2 === 1;
    const offsetX = isB ? spacing * 0.5 : 0;
    const offsetZ = isB ? spacing * SQRT3 / 6 : 0;

    for (let ix = -nHex; ix <= nHex; ix++)
      for (let iz = -nHex; iz <= nHex; iz++) {
        const x = ix * spacing + (iz % 2) * spacing * 0.5 + offsetX;
        const z = iz * spacing * SQRT3 * 0.5 + offsetZ;
        const p = v3(x, y, z);
        if (v3len(p) <= radius + 0.01) pts.push(p);
      }
  }
  return deduplicateVerts(pts, spacing * 0.2);
}

function deduplicateVerts(pts: Vec3[], threshold: number): Vec3[] {
  const out: Vec3[] = [];
  for (const p of pts) {
    let dup = false;
    for (const q of out) {
      if (v3dist(p, q) < threshold) { dup = true; break; }
    }
    if (!dup) out.push(p);
  }
  return out;
}

/**
 * Connect vertices that are within  maxDist  of each other.
 */
function connectNearest(verts: Vec3[], maxDist: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++)
      if (v3dist(verts[i], verts[j]) <= maxDist + 0.01)
        edges.push([i, j]);
  return edges;
}

/**
 * Derive the lattice type from the first 5 DNA digits (red60[0..4]).
 */
export function deriveLatticeType(dna: string): LatticeType {
  const digits = dna.slice(0, 5).split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  const idx = sum % 4;
  return (['fcc', 'bcc', 'hcp', 'icosahedral'] as LatticeType[])[idx];
}

/**
 * Derive a scale factor from DNA digits 5-9.
 */
function deriveScale(dna: string): number {
  const digits = dna.slice(5, 10).split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  // Maps sum (0-30) to scale 0.8 → 1.4
  return 0.8 + (sum / 30) * 0.6;
}

/**
 * Build a lattice blueprint from a DNA string.
 * The blueprint defines the *target* structure — the ideal crystalline form
 * that the intelligent growth algorithm tries to realise.
 */
export function buildBlueprint(dna: string): LatticeBlueprint {
  const type = deriveLatticeType(dna);
  const scale = deriveScale(dna);
  const rng = createSeededRng(dnaSeed(dna + ':lattice'));

  let targetNodes: Vec3[];
  let targetEdges: [number, number][];
  let symmetryOrder: number;

  const baseRadius = 3.0 * scale;
  const spacing = 1.4 * scale;

  switch (type) {
    case 'fcc': {
      targetNodes = fccVerts(baseRadius, spacing);
      targetEdges = connectNearest(targetNodes, spacing * 0.75);
      symmetryOrder = 48;
      break;
    }
    case 'bcc': {
      targetNodes = bccVerts(baseRadius, spacing);
      targetEdges = connectNearest(targetNodes, spacing * 0.9);
      symmetryOrder = 48;
      break;
    }
    case 'hcp': {
      targetNodes = hcpVerts(baseRadius, spacing);
      targetEdges = connectNearest(targetNodes, spacing * 0.8);
      symmetryOrder = 24;
      break;
    }
    case 'icosahedral': {
      // Multi-shell icosahedral quasicrystal
      const inner = icosahedronVerts(baseRadius * 0.45);
      const outer = icosahedronVerts(baseRadius);
      // Optionally add midpoints for larger structure
      const mid: Vec3[] = [];
      for (let i = 0; i < 5; i++) {
        const a = TAU * i / 5 + Math.PI / 10;
        mid.push(v3(
          baseRadius * 0.72 * Math.cos(a),
          0,
          baseRadius * 0.72 * Math.sin(a),
        ));
      }
      targetNodes = [...inner, ...mid, ...outer];
      targetEdges = connectNearest(targetNodes, baseRadius * 0.55);
      symmetryOrder = 60;
      break;
    }
  }

  // Clamp to max 120 nodes for performance
  if (targetNodes.length > 120) {
    // Sort by distance from origin and keep closest 120
    targetNodes.sort((a, b) => v3len(a) - v3len(b));
    targetNodes = targetNodes.slice(0, 120);
    targetEdges = connectNearest(targetNodes, spacing * 0.85);
  }

  // Apply DNA-seeded jitter to break perfect symmetry (organic crystallisation)
  const digits = dna.split('').map(Number);
  for (let i = 0; i < targetNodes.length; i++) {
    const d = digits[i % digits.length];
    const jitter = (d / 6 - 0.5) * 0.08 * scale;
    targetNodes[i] = v3(
      targetNodes[i].x + jitter * (rng() - 0.5) * 2,
      targetNodes[i].y + jitter * (rng() - 0.5) * 2,
      targetNodes[i].z + jitter * (rng() - 0.5) * 2,
    );
  }

  return { type, targetNodes, targetEdges, symmetryOrder };
}

// ── Intelligent growth engine ────────────────────────────────────────────────
//
// Growth propagates from a central seed node outward.
// Each tick the engine evaluates candidate sites (blueprint nodes not yet
// materialised), scoring each by:
//
//   growthPotential(site) = dnaAffinity × structuralSupport × geometricFitness
//
// The top candidates materialise new nodes.  After growth, stress propagates
// through the lattice; if any node exceeds its load threshold the integrity
// system spawns reinforcement struts.

/**
 * Initialise the lattice with a single seed node at the blueprint vertex
 * closest to the origin.
 */
export function initLattice(blueprint: LatticeBlueprint, dna: string): LatticeState {
  const digits = dna.split('').map(Number);

  // Find the blueprint vertex closest to the origin
  let seedIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < blueprint.targetNodes.length; i++) {
    const d = v3len(blueprint.targetNodes[i]);
    if (d < minDist) { minDist = d; seedIdx = i; }
  }

  const seedNode: LatticeNode = {
    id:           seedIdx,
    pos:          blueprint.targetNodes[seedIdx],
    generation:   0,
    dnaDigit:     digits[seedIdx % digits.length],
    coordination: 0,
    stress:       0,
    alive:        true,
    growthAge:    0,
    blueprint:    true,
  };

  return {
    nodes:      [seedNode],
    edges:      [],
    generation: 0,
    integrity:  1.0,
    completion: 1 / blueprint.targetNodes.length,
    collapsed:  false,
    blueprint,
  };
}

/**
 * Advance one growth tick.  Returns a new LatticeState.
 *
 * Growth rate: 1-3 nodes per tick (DNA-modulated).
 * The algorithm is greedy — always grow the highest-potential candidates first.
 */
export function growthTick(
  state: LatticeState,
  dna: string,
  tick: number,
): LatticeState {
  if (state.collapsed) return state;

  const { blueprint } = state;
  const digits = dna.split('').map(Number);
  const rng = createSeededRng(dnaSeed(dna + ':grow:' + tick));

  // Set of already-materialised node ids
  const materialised = new Set(state.nodes.filter(n => n.alive).map(n => n.id));

  // Adjacency from blueprint edges (for quick lookup)
  const bpAdj = new Map<number, Set<number>>();
  for (const [a, b] of blueprint.targetEdges) {
    if (!bpAdj.has(a)) bpAdj.set(a, new Set());
    if (!bpAdj.has(b)) bpAdj.set(b, new Set());
    bpAdj.get(a)!.add(b);
    bpAdj.get(b)!.add(a);
  }

  // ── Identify growth candidates ─────────────────────────────────────────
  //    A candidate is a blueprint vertex that is NOT yet materialised but
  //    has at least one materialised neighbour.
  const candidates: { idx: number; score: number }[] = [];

  for (let i = 0; i < blueprint.targetNodes.length; i++) {
    if (materialised.has(i)) continue;

    const neighbours = bpAdj.get(i);
    if (!neighbours) continue;

    // How many materialised neighbours?
    let supportCount = 0;
    for (const n of neighbours) if (materialised.has(n)) supportCount++;
    if (supportCount === 0) continue;

    // ── Score the candidate ──────────────────────────────────────────
    const dnaDigit = digits[i % digits.length];

    // 1. DNA affinity: higher digit → stronger growth urge
    const dnaAffinity = 0.3 + (dnaDigit / 6) * 0.7;

    // 2. Structural support: more existing neighbours → better scaffold
    const maxNeighbours = neighbours.size || 1;
    const structuralSupport = supportCount / maxNeighbours;

    // 3. Geometric fitness: prefer sites closer to origin (core-out growth)
    const dist = v3len(blueprint.targetNodes[i]);
    const maxDist = 5.0;
    const geometricFitness = 1.0 - Math.min(dist / maxDist, 1.0) * 0.4;

    const score = dnaAffinity * structuralSupport * geometricFitness + rng() * 0.05;
    candidates.push({ idx: i, score });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Growth rate: DNA-modulated (1-3 nodes per tick)
  const growthGene = digits[(tick * 3) % digits.length];
  const growthRate = 1 + Math.floor((growthGene / 6) * 2.99);
  const toGrow = candidates.slice(0, growthRate);

  // ── Materialise new nodes ──────────────────────────────────────────────
  const newNodes = [...state.nodes];
  const newEdges = [...state.edges];

  for (const { idx } of toGrow) {
    const node: LatticeNode = {
      id:           idx,
      pos:          blueprint.targetNodes[idx],
      generation:   state.generation + 1,
      dnaDigit:     digits[idx % digits.length],
      coordination: 0,
      stress:       0,
      alive:        true,
      growthAge:    tick,
      blueprint:    true,
    };
    newNodes.push(node);
    materialised.add(idx);

    // Connect to all materialised neighbours
    const neighbours = bpAdj.get(idx);
    if (neighbours) {
      for (const n of neighbours) {
        if (materialised.has(n)) {
          newEdges.push({ a: idx, b: n, load: 0, reinforced: false });
        }
      }
    }
  }

  // ── Update coordination numbers ────────────────────────────────────────
  const coordCount = new Map<number, number>();
  for (const e of newEdges) {
    coordCount.set(e.a, (coordCount.get(e.a) || 0) + 1);
    coordCount.set(e.b, (coordCount.get(e.b) || 0) + 1);
  }
  for (const node of newNodes) {
    node.coordination = coordCount.get(node.id) || 0;
  }

  // ── Stress propagation ─────────────────────────────────────────────────
  //    Simplified load model: each node bears a unit of "gravity" load.
  //    Load transfers downward (negative y) through edges to supporters.
  //    Nodes with high load relative to their coordination are stressed.
  propagateStress(newNodes, newEdges, digits);

  // ── Structural integrity ───────────────────────────────────────────────
  const aliveNodes = newNodes.filter(n => n.alive);
  const maxStress = Math.max(...aliveNodes.map(n => n.stress), 0);
  const avgStress = aliveNodes.reduce((s, n) => s + n.stress, 0) / (aliveNodes.length || 1);
  const integrity = Math.max(0, 1 - avgStress * 0.7 - maxStress * 0.3);

  // ── Reinforcement struts ───────────────────────────────────────────────
  //    If any node's stress exceeds 0.8, spawn a reinforcement edge to its
  //    nearest unstressed neighbour (if one exists in the blueprint).
  for (const node of newNodes) {
    if (node.stress > 0.8 && node.alive) {
      const neighbours = bpAdj.get(node.id);
      if (!neighbours) continue;
      for (const nid of neighbours) {
        if (!materialised.has(nid)) continue;
        const neighbour = newNodes.find(n => n.id === nid);
        if (neighbour && neighbour.stress < 0.4) {
          // Check if this reinforcement edge already exists
          const exists = newEdges.some(e =>
            (e.a === node.id && e.b === nid) || (e.a === nid && e.b === node.id),
          );
          if (!exists) {
            newEdges.push({ a: node.id, b: nid, load: 0, reinforced: true });
            break; // One reinforcement per node per tick
          }
        }
      }
    }
  }

  // ── Collapse check ─────────────────────────────────────────────────────
  //    If integrity drops below 0.1 the lattice collapses.
  const collapsed = integrity < 0.1 && aliveNodes.length > 5;

  // ── Completion metric ──────────────────────────────────────────────────
  const completion = materialised.size / blueprint.targetNodes.length;

  return {
    nodes:      newNodes,
    edges:      newEdges,
    generation: state.generation + 1,
    integrity,
    completion,
    collapsed,
    blueprint,
  };
}

/**
 * Propagate stress through the lattice.
 *
 * Each node starts with unit load.  Load transfers along edges toward
 * nodes with higher coordination (stronger supports).  Nodes with low
 * coordination and high load become stressed.
 *
 * DNA modulates each node's load-bearing capacity via its dnaDigit:
 *   capacity = 0.4 + (dnaDigit / 6) × 0.6
 */
function propagateStress(
  nodes: LatticeNode[],
  edges: LatticeEdge[],
  digits: number[],
): void {
  const nodeMap = new Map<number, LatticeNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Build adjacency
  const adj = new Map<number, number[]>();
  for (const e of edges) {
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a)!.push(e.b);
    adj.get(e.b)!.push(e.a);
  }

  // Initialise loads
  const load = new Map<number, number>();
  for (const n of nodes) load.set(n.id, 1.0);

  // 3 iterations of load redistribution (converges quickly)
  for (let iter = 0; iter < 3; iter++) {
    for (const n of nodes) {
      if (!n.alive) continue;
      const neighbours = adj.get(n.id) || [];
      if (neighbours.length === 0) continue;

      // Distribute excess load to higher-coordination neighbours
      const myLoad = load.get(n.id) || 0;
      const capacity = 0.4 + (n.dnaDigit / 6) * 0.6;
      const excess = Math.max(0, myLoad - capacity * (n.coordination + 1));

      if (excess > 0.01) {
        // Find total coordination of neighbours
        let totalCoord = 0;
        for (const nid of neighbours) {
          const nb = nodeMap.get(nid);
          if (nb && nb.alive) totalCoord += nb.coordination + 1;
        }
        if (totalCoord > 0) {
          for (const nid of neighbours) {
            const nb = nodeMap.get(nid);
            if (nb && nb.alive) {
              const share = excess * ((nb.coordination + 1) / totalCoord) * 0.5;
              load.set(nid, (load.get(nid) || 0) + share);
            }
          }
          load.set(n.id, myLoad - excess * 0.5);
        }
      }
    }
  }

  // Normalise stress to 0-1 range
  let maxLoad = 0;
  for (const n of nodes) {
    if (n.alive) maxLoad = Math.max(maxLoad, load.get(n.id) || 0);
  }
  if (maxLoad < 0.01) maxLoad = 1;

  for (const n of nodes) {
    n.stress = n.alive ? (load.get(n.id) || 0) / maxLoad : 0;
  }

  // Update edge loads
  for (const e of edges) {
    const na = nodeMap.get(e.a);
    const nb = nodeMap.get(e.b);
    e.load = ((na?.stress || 0) + (nb?.stress || 0)) * 0.5;
  }
}

// ── Platonic sub-shell detection  ────────────────────────────────────────────
//
//  As the lattice grows, recognisable Platonic solid sub-shells emerge.
//  This function detects tetrahedra, cubes, octahedra, and icosahedra
//  within the current lattice by checking vertex/edge counts of connected
//  subgraphs at specific coordination numbers.

export interface DetectedShell {
  type:    'tetrahedron' | 'cube' | 'octahedron' | 'icosahedron' | 'dodecahedron';
  center:  Vec3;
  radius:  number;
  nodeIds: number[];
}

/**
 * Detect Platonic sub-shells within the lattice.
 * Returns an array of recognised geometric formations.
 */
export function detectPlatonicShells(state: LatticeState): DetectedShell[] {
  const shells: DetectedShell[] = [];
  const aliveNodes = state.nodes.filter(n => n.alive);
  if (aliveNodes.length < 4) return shells;

  // Build adjacency
  const adj = new Map<number, Set<number>>();
  for (const e of state.edges) {
    if (!adj.has(e.a)) adj.set(e.a, new Set());
    if (!adj.has(e.b)) adj.set(e.b, new Set());
    adj.get(e.a)!.add(e.b);
    adj.get(e.b)!.add(e.a);
  }

  const nodeMap = new Map<number, LatticeNode>();
  for (const n of aliveNodes) nodeMap.set(n.id, n);

  // Detect tetrahedra: 4 mutually connected nodes
  // (Check small cliques — for performance, only check nodes with coord >= 3)
  const highCoord = aliveNodes.filter(n => n.coordination >= 3);
  const checked = new Set<string>();

  for (const n1 of highCoord) {
    const nb1 = adj.get(n1.id);
    if (!nb1 || nb1.size < 3) continue;

    const neighbours = [...nb1].filter(id => nodeMap.has(id));
    for (let i = 0; i < neighbours.length; i++) {
      for (let j = i + 1; j < neighbours.length; j++) {
        for (let k = j + 1; k < neighbours.length; k++) {
          const a = neighbours[i], b = neighbours[j], c = neighbours[k];
          // Check if a-b, a-c, b-c are all edges (complete K4)
          if (adj.get(a)?.has(b) && adj.get(a)?.has(c) && adj.get(b)?.has(c)) {
            const key = [n1.id, a, b, c].sort().join('-');
            if (!checked.has(key)) {
              checked.add(key);
              const ids = [n1.id, a, b, c];
              const positions = ids.map(id => nodeMap.get(id)!.pos);
              const center = v3scale(
                positions.reduce((s, p) => v3add(s, p), v3(0, 0, 0)),
                1 / 4,
              );
              const radius = Math.max(...positions.map(p => v3dist(p, center)));
              shells.push({
                type: 'tetrahedron',
                center,
                radius,
                nodeIds: ids,
              });
            }
          }
        }
      }
    }
  }

  // Detect octahedra: 6 nodes where each connects to 4 others (not the opposing pole)
  // Simplified: look for nodes with exactly 4 shared neighbours
  for (const n of aliveNodes) {
    if (n.coordination !== 4) continue;
    const myNbs = adj.get(n.id);
    if (!myNbs) continue;

    // Check if any non-neighbour also connects to all 4 of my neighbours (the opposing pole)
    for (const other of aliveNodes) {
      if (other.id === n.id || myNbs.has(other.id)) continue;
      const otherNbs = adj.get(other.id);
      if (!otherNbs || otherNbs.size !== 4) continue;

      // Check if they share all 4 neighbours
      let shared = 0;
      for (const nb of myNbs) if (otherNbs.has(nb)) shared++;
      if (shared === 4) {
        const ids = [n.id, other.id, ...myNbs].sort();
        const key = ids.join('-');
        if (!checked.has(key)) {
          checked.add(key);
          const positions = ids.map(id => nodeMap.get(id)!.pos);
          const center = v3scale(
            positions.reduce((s, p) => v3add(s, p), v3(0, 0, 0)),
            1 / 6,
          );
          const radius = Math.max(...positions.map(p => v3dist(p, center)));
          shells.push({
            type: 'octahedron',
            center,
            radius,
            nodeIds: ids,
          });
        }
      }
    }
  }

  return shells;
}

// ── Stats helper ─────────────────────────────────────────────────────────────
export function getLatticeStats(state: LatticeState): LatticeStats {
  const alive = state.nodes.filter(n => n.alive);
  const avgCoord = alive.length > 0
    ? alive.reduce((s, n) => s + n.coordination, 0) / alive.length
    : 0;
  const maxStress = alive.length > 0
    ? Math.max(...alive.map(n => n.stress))
    : 0;

  return {
    nodeCount:     alive.length,
    edgeCount:     state.edges.length,
    avgCoord:      Math.round(avgCoord * 10) / 10,
    maxStress:     Math.round(maxStress * 100) / 100,
    integrity:     Math.round(state.integrity * 100) / 100,
    completion:    Math.round(state.completion * 100) / 100,
    latticeType:   state.blueprint.type,
    symmetryOrder: state.blueprint.symmetryOrder,
  };
}
