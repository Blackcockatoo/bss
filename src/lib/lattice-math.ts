export type Vec3 = { x: number; y: number; z: number };

export type LatticeType = 'fcc' | 'bcc' | 'hcp' | 'icosahedral';

export interface LatticeNode {
  id: number;
  targetId: number;
  pos: Vec3;
  alive: boolean;
  generation: number;
  coordination: number;
  stress: number;
}

export interface LatticeEdge {
  a: number;
  b: number;
  load: number;
  reinforced: boolean;
}

export interface LatticeBlueprint {
  type: LatticeType;
  targetNodes: Vec3[];
  targetEdges: Array<[number, number]>;
}

export interface LatticeState {
  blueprint: LatticeBlueprint;
  nodes: LatticeNode[];
  edges: LatticeEdge[];
  generation: number;
  completion: number;
  integrity: number;
  collapsed: boolean;
}

export interface LatticeStats {
  nodeCount: number;
  edgeCount: number;
  avgCoord: number;
  integrity: number;
  completion: number;
  maxStress: number;
  symmetryOrder: number;
}

export interface DetectedShell {
  type: 'tetrahedron' | 'cube' | 'octahedron' | 'icosahedron' | 'dodecahedron';
  nodeIds: number[];
}

const TYPE_ORDER: LatticeType[] = ['fcc', 'bcc', 'hcp', 'icosahedral'];

const TARGET_SIZE_BY_TYPE: Record<LatticeType, number> = {
  fcc: 86,
  bcc: 74,
  hcp: 78,
  icosahedral: 92,
};

const IDEAL_COORD_BY_TYPE: Record<LatticeType, number> = {
  fcc: 12,
  bcc: 8,
  hcp: 12,
  icosahedral: 6,
};

const LAYER_SPACING_BY_TYPE: Record<LatticeType, number> = {
  fcc: 1.1,
  bcc: 1.0,
  hcp: 0.95,
  icosahedral: 1.15,
};

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const v3add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const v3scale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
export const v3len = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
export const v3dist = (a: Vec3, b: Vec3): number => v3len({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const v3norm = (a: Vec3): Vec3 => {
  const len = v3len(a);
  if (len === 0) return v3(0, 0, 0);
  return v3scale(a, 1 / len);
};

export function dnaSeed(dna: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dna.length; i++) {
    hash ^= dna.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRng(seed: string): () => number {
  let state = dnaSeed(seed) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function rotateX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

export function rotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

export function project(v: Vec3, cx: number, cy: number, fov: number, viewDist: number) {
  const z = v.z + viewDist;
  const scale = fov / Math.max(0.15, z);
  return {
    sx: cx + v.x * scale,
    sy: cy + v.y * scale,
    depth: z,
  };
}

const keyedNoise = (index: number, dna: string) => {
  const char = dna[index % dna.length] ?? '0';
  const n = Number.parseInt(char, 10) || 0;
  const a = Math.sin((index + 1) * 12.9898 + n * 78.233) * 43758.5453;
  return a - Math.floor(a);
};

export function deriveLatticeType(dna: string): LatticeType {
  const score = dna.split('').reduce((acc, c, i) => acc + ((Number.parseInt(c, 10) || 0) + i) % 7, 0);
  return TYPE_ORDER[score % TYPE_ORDER.length];
}

const dedupeEdge = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);

export function buildBlueprint(dna: string): LatticeBlueprint {
  const type = deriveLatticeType(dna);
  const targetCount = TARGET_SIZE_BY_TYPE[type];
  const spacing = LAYER_SPACING_BY_TYPE[type];

  const targetNodes: Vec3[] = [];
  const rings = Math.ceil(Math.cbrt(targetCount)) + 2;

  for (let layer = 0; layer < rings && targetNodes.length < targetCount; layer++) {
    const ringCount = Math.max(6, 6 + layer * 6);
    for (let i = 0; i < ringCount && targetNodes.length < targetCount; i++) {
      const theta = (i / ringCount) * Math.PI * 2;
      const phi = Math.acos(1 - 2 * ((i + 0.5) / ringCount));
      const jitter = (keyedNoise(i + layer * 17, dna) - 0.5) * 0.2;
      const radius = (0.6 + layer * 0.5 + jitter) * spacing;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      targetNodes.push({ x, y, z });
    }
  }

  if (targetNodes.length === 0) {
    targetNodes.push(v3(0, 0, 0));
  }
  targetNodes[0] = v3(0, 0, 0);

  const kByType: Record<LatticeType, number> = {
    fcc: 12,
    bcc: 8,
    hcp: 10,
    icosahedral: 6,
  };

  const targetEdgesSet = new Set<string>();
  const k = kByType[type];

  for (let i = 0; i < targetNodes.length; i++) {
    const dists: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < targetNodes.length; j++) {
      if (i === j) continue;
      const d = v3len({
        x: targetNodes[i].x - targetNodes[j].x,
        y: targetNodes[i].y - targetNodes[j].y,
        z: targetNodes[i].z - targetNodes[j].z,
      });
      dists.push({ j, d });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let n = 0; n < Math.min(k, dists.length); n++) {
      const [a, b] = dedupeEdge(i, dists[n].j);
      targetEdgesSet.add(`${a}-${b}`);
    }
  }

  const targetEdges = [...targetEdgesSet].map(edge => {
    const [a, b] = edge.split('-').map(Number);
    return [a, b] as [number, number];
  });

  return {
    type,
    targetNodes,
    targetEdges,
  };
}

export function initLattice(blueprint: LatticeBlueprint): LatticeState {
  const seed: LatticeNode = {
    id: 0,
    targetId: 0,
    pos: blueprint.targetNodes[0] ?? v3(0, 0, 0),
    alive: true,
    generation: 0,
    coordination: 0,
    stress: 0,
  };

  return {
    blueprint,
    nodes: [seed],
    edges: [],
    generation: 0,
    completion: blueprint.targetNodes.length > 0 ? 1 / blueprint.targetNodes.length : 1,
    integrity: 1,
    collapsed: false,
  };
}

const buildAdjacency = (edges: Array<[number, number]>) => {
  const adj = new Map<number, Set<number>>();
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)?.add(b);
    adj.get(b)?.add(a);
  }
  return adj;
};

export function growthTick(state: LatticeState, dna: string, tick: number): LatticeState {
  if (state.collapsed || state.completion >= 1) return state;

  const adj = buildAdjacency(state.blueprint.targetEdges);
  const aliveByTarget = new Map(state.nodes.filter(n => n.alive).map(n => [n.targetId, n]));
  const candidateScores: Array<{ targetId: number; score: number }> = [];

  for (const node of state.nodes) {
    if (!node.alive) continue;
    const neighbors = adj.get(node.targetId);
    if (!neighbors) continue;
    for (const targetId of neighbors) {
      if (aliveByTarget.has(targetId)) continue;
      const support = [...(adj.get(targetId) ?? new Set())].filter(n => aliveByTarget.has(n)).length;
      const dnaAffinity = 0.5 + keyedNoise(targetId + tick * 13, dna) * 0.5;
      const geometricFitness = 1 / (1 + Math.abs(v3len(state.blueprint.targetNodes[targetId]) - 2));
      const score = dnaAffinity * (0.4 + support * 0.3) * geometricFitness;
      candidateScores.push({ targetId, score });
    }
  }

  candidateScores.sort((a, b) => b.score - a.score);

  const maxGrow = Math.max(1, Math.min(4, 1 + Math.floor(tick / 50)));
  const chosen = new Set<number>();
  for (const candidate of candidateScores) {
    chosen.add(candidate.targetId);
    if (chosen.size >= maxGrow) break;
  }

  if (chosen.size === 0) {
    return {
      ...state,
      generation: state.generation + 1,
      integrity: Math.max(0, state.integrity - 0.002),
    };
  }

  const nextNodes = [...state.nodes];
  for (const targetId of chosen) {
    nextNodes.push({
      id: nextNodes.length,
      targetId,
      pos: state.blueprint.targetNodes[targetId],
      alive: true,
      generation: state.generation + 1,
      coordination: 0,
      stress: 0,
    });
  }

  const liveByTarget = new Map(nextNodes.filter(n => n.alive).map(n => [n.targetId, n.id]));
  const nextEdges: LatticeEdge[] = [];

  for (const [a, b] of state.blueprint.targetEdges) {
    const ia = liveByTarget.get(a);
    const ib = liveByTarget.get(b);
    if (ia === undefined || ib === undefined) continue;

    const loadSeed = keyedNoise((ia + 1) * 31 + (ib + 1) * 17 + tick, dna);
    const load = Math.min(1, loadSeed * (1 + tick / 850));

    nextEdges.push({
      a: ia,
      b: ib,
      load,
      reinforced: load > 0.84,
    });
  }

  const type = state.blueprint.type;
  const idealCoord = IDEAL_COORD_BY_TYPE[type];
  const degree = new Array(nextNodes.length).fill(0);

  for (const edge of nextEdges) {
    degree[edge.a]++;
    degree[edge.b]++;
  }

  let stressSum = 0;
  let maxStress = 0;
  for (let i = 0; i < nextNodes.length; i++) {
    const coord = degree[i];
    const stress = Math.min(1, Math.abs(idealCoord - coord) / idealCoord + Math.max(0, tick - 450) / 300);
    nextNodes[i] = { ...nextNodes[i], coordination: coord, stress };
    stressSum += stress;
    if (stress > maxStress) maxStress = stress;
  }

  const completion = nextNodes.length / Math.max(1, state.blueprint.targetNodes.length);
  const avgStress = stressSum / Math.max(1, nextNodes.length);
  const integrity = Math.max(0, Math.min(1, (1 - avgStress * 0.75) * (0.65 + completion * 0.35)));
  const collapsed = integrity < 0.08;

  return {
    ...state,
    nodes: nextNodes,
    edges: nextEdges,
    generation: state.generation + 1,
    completion: Math.min(1, completion),
    integrity,
    collapsed,
  };
}

export function detectPlatonicShells(state: LatticeState): DetectedShell[] {
  const liveNodes = state.nodes.filter(n => n.alive);
  if (liveNodes.length < 8) return [];

  const byCoord = [...liveNodes].sort((a, b) => b.coordination - a.coordination);
  const shells: DetectedShell[] = [];

  if (byCoord.length >= 4) {
    shells.push({ type: 'tetrahedron', nodeIds: byCoord.slice(0, 4).map(n => n.id) });
  }
  if (byCoord.length >= 6 && state.blueprint.type !== 'icosahedral') {
    shells.push({ type: 'octahedron', nodeIds: byCoord.slice(0, 6).map(n => n.id) });
  }
  if (byCoord.length >= 8 && state.completion > 0.45) {
    shells.push({ type: 'cube', nodeIds: byCoord.slice(0, 8).map(n => n.id) });
  }
  if (byCoord.length >= 12 && state.blueprint.type === 'icosahedral') {
    shells.push({ type: 'icosahedron', nodeIds: byCoord.slice(0, 12).map(n => n.id) });
  }

  return shells;
}

export function getLatticeStats(state: LatticeState): LatticeStats {
  const liveNodes = state.nodes.filter(n => n.alive);
  const nodeCount = liveNodes.length;
  const edgeCount = state.edges.length;
  const totalCoord = liveNodes.reduce((sum, n) => sum + n.coordination, 0);
  const avgCoord = nodeCount > 0 ? Number((totalCoord / nodeCount).toFixed(1)) : 0;
  const maxStress = Number(Math.max(0, ...liveNodes.map(n => n.stress)).toFixed(2));

  const symmetryOrderByType: Record<LatticeType, number> = {
    fcc: 48,
    bcc: 24,
    hcp: 12,
    icosahedral: 60,
  };

  return {
    nodeCount,
    edgeCount,
    avgCoord,
    integrity: state.integrity,
    completion: state.completion,
    maxStress,
    symmetryOrder: symmetryOrderByType[state.blueprint.type],
  };
}
