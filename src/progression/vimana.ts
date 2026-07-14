/**
 * Canonical Vimana overworld model.
 *
 * This replaces the two previous, incompatible cell models
 * (`progression/types` VimanaCell and `lib/vimana` VimanaCell) with a single
 * `VimanaNode` shape shared by the store, persistence, and UI. Legacy saves in
 * either shape are converted with {@link migrateVimanaState}.
 */

export type VimanaFieldType = 'calm' | 'neuro' | 'quantum' | 'earth';

export type VimanaDiscoveryStage =
  | 'unknown'
  | 'detected'
  | 'scanned'
  | 'explored'
  | 'mastered';

export type VimanaAnomalyType = 'energy' | 'mood' | 'rare';
export type VimanaAnomalySeverity = 'minor' | 'moderate' | 'severe';
export type VimanaAnomalyState = 'dormant' | 'active' | 'resolved';

export interface VimanaAnomaly {
  type: VimanaAnomalyType;
  severity: VimanaAnomalySeverity;
  state: VimanaAnomalyState;
}

export interface VimanaCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface VimanaNode {
  id: string;
  label?: string;
  coordinates: VimanaCoordinates;
  fieldType: VimanaFieldType;
  /** Field strength 0-100; drives scan sample yield and anomaly severity. */
  intensity: number;
  discoveryStage: VimanaDiscoveryStage;
  /** Ids of nodes reachable by route from this node. Symmetric. */
  connections: string[];
  /** Best scan quality achieved on this node, 0-100. */
  scanQuality: number;
  samples: number;
  visits: number;
  /** Guards the full first-discovery reward so it is never granted twice. */
  firstRewardClaimed: boolean;
  anomaly: VimanaAnomaly | null;
  discoveredAt: number | null;
  lastVisitedAt: number | null;
  masteredAt: number | null;
}

export const VIMANA_STATE_VERSION = 2 as const;

export interface VimanaState {
  version: typeof VIMANA_STATE_VERSION;
  nodes: VimanaNode[];
  activeNodeId: string | null;
  anomaliesFound: number;
  anomaliesResolved: number;
  scansPerformed: number;
  lastScanAt: number | null;
}

// Kept in sync with ACHIEVEMENT_TARGETS['explorer-anomaly-hunter'] (see
// types.ts); asserted by tests to avoid a circular import here.
export const MIN_VIMANA_ANOMALIES = 3;

export const VIMANA_ESSENCE_REWARDS = {
  discovery: 4,
  anomalyResolved: 6,
} as const;

/** Number of scans a node needs (post-discovery) before it can be mastered. */
export const VIMANA_MASTERY_VISITS = 3;

/** Numeric scanQuality achieved by each resonance-ring tap-timing tier. */
export const SCAN_TIER_SCORES = {
  rough: 45,
  clean: 75,
  perfect: 100,
} as const;

export type VimanaScanTier = keyof typeof SCAN_TIER_SCORES;

/** scanQuality reached before a node's info reveals more than the basics. */
export const SCAN_QUALITY_CLEAN_MIN = 55;
export const SCAN_QUALITY_PERFECT_MIN = 85;

/**
 * How much of a node's data a stored scanQuality has actually earned.
 * Ties the resonance-ring result to what the bottom sheet is allowed to show:
 * a rough scan only confirms the field type, a clean scan adds intensity and
 * anomaly presence, a perfect scan reveals full anomaly detail.
 */
export function vimanaInfoLevel(scanQuality: number): VimanaScanTier {
  if (scanQuality >= SCAN_QUALITY_PERFECT_MIN) return 'perfect';
  if (scanQuality >= SCAN_QUALITY_CLEAN_MIN) return 'clean';
  return 'rough';
}

const DISCOVERY_STAGES: VimanaDiscoveryStage[] = [
  'unknown',
  'detected',
  'scanned',
  'explored',
  'mastered',
];

const FIELD_TYPES: VimanaFieldType[] = ['calm', 'neuro', 'quantum', 'earth'];
const ANOMALY_TYPES: VimanaAnomalyType[] = ['energy', 'mood', 'rare'];

export function discoveryStageRank(stage: VimanaDiscoveryStage): number {
  return DISCOVERY_STAGES.indexOf(stage);
}

/** A node counts as discovered once it has been scanned at least once. */
export function isVimanaNodeDiscovered(node: Pick<VimanaNode, 'discoveryStage'>): boolean {
  return discoveryStageRank(node.discoveryStage) >= discoveryStageRank('scanned');
}

/** Vitals granted by a node's field on first discovery. */
export function getVimanaFieldRewardDelta(fieldType: VimanaFieldType): Record<string, number> {
  switch (fieldType) {
    case 'calm':
      return { mood: 10 };
    case 'neuro':
      return { energy: 10 };
    case 'earth':
      return { hygiene: 12 };
    case 'quantum':
      return { mood: 5, energy: 5 };
    default:
      return {};
  }
}

// ===== Deterministic seeding =====

/** Small deterministic PRNG (mulberry32) so routes are stable per genome. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface GenomeLike {
  red60: number[];
  blue60: number[];
  black60: number[];
}

export const DEFAULT_VIMANA_SEED = 60;

/** Derive a stable numeric seed from a pet genome for route generation. */
export function computeVimanaGenomeSeed(genome: GenomeLike | null | undefined): number {
  if (!genome) return DEFAULT_VIMANA_SEED;
  const strands: Array<[number[], number]> = [
    [genome.red60 ?? [], 1],
    [genome.blue60 ?? [], 7],
    [genome.black60 ?? [], 13],
  ];
  let seed = 0;
  for (const [digits, weight] of strands) {
    for (let i = 0; i < digits.length; i++) {
      seed = (seed + (digits[i] ?? 0) * (i + 1) * weight) % 2147483647;
    }
  }
  return seed === 0 ? DEFAULT_VIMANA_SEED : seed;
}

/**
 * Deterministic, symmetric route connections for a set of node ids.
 * The same ids and seed always produce the same connected graph.
 */
export function deriveVimanaConnections(
  nodeIds: string[],
  seed: number,
): Map<string, string[]> {
  const adjacency = new Map<string, Set<string>>();
  for (const id of nodeIds) {
    adjacency.set(id, new Set());
  }
  if (nodeIds.length < 2) {
    return new Map(nodeIds.map((id) => [id, []]));
  }

  const random = mulberry32((seed >>> 0) ^ hashString(nodeIds.join('|')));

  // Seeded shuffle -> spanning path guarantees every node is reachable.
  const order = [...nodeIds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const connect = (a: string, b: string) => {
    if (a === b) return;
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  };
  for (let i = 0; i < order.length - 1; i++) {
    connect(order[i], order[i + 1]);
  }

  // A few extra seeded shortcuts so the map is a graph, not a corridor.
  const extraEdges = Math.floor(nodeIds.length / 3);
  for (let i = 0; i < extraEdges; i++) {
    const a = nodeIds[Math.floor(random() * nodeIds.length)];
    const b = nodeIds[Math.floor(random() * nodeIds.length)];
    connect(a, b);
  }

  return new Map(
    nodeIds.map((id) => [id, [...(adjacency.get(id) ?? [])].sort()]),
  );
}

function applyConnections(nodes: VimanaNode[], seed: number): VimanaNode[] {
  const routes = deriveVimanaConnections(nodes.map((node) => node.id), seed);
  return nodes.map((node) => ({
    ...node,
    connections: routes.get(node.id) ?? [],
  }));
}

// ===== Node construction =====

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function severityForIntensity(intensity: number): VimanaAnomalySeverity {
  if (intensity >= 75) return 'severe';
  if (intensity >= 55) return 'moderate';
  return 'minor';
}

export function createVimanaNode(
  overrides: Partial<VimanaNode> & Pick<VimanaNode, 'id'>,
): VimanaNode {
  return {
    label: undefined,
    fieldType: 'calm',
    intensity: 50,
    discoveryStage: 'unknown',
    connections: [],
    scanQuality: 0,
    samples: 0,
    visits: 0,
    firstRewardClaimed: false,
    anomaly: null,
    discoveredAt: null,
    lastVisitedAt: null,
    masteredAt: null,
    ...overrides,
    coordinates: { x: 0, y: 0, z: 0, ...overrides.coordinates },
  };
}

function countAnomaliesFound(nodes: VimanaNode[]): number {
  return nodes.filter(
    (node) => node.anomaly !== null && node.anomaly.state !== 'dormant',
  ).length;
}

function ensureMinimumAnomalies(
  nodes: VimanaNode[],
  minimum: number,
  random: () => number,
): VimanaNode[] {
  const active = nodes.filter((node) => node.anomaly !== null).length;
  if (active >= minimum) return nodes;

  const candidates = nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.anomaly === null && !isVimanaNodeDiscovered(node));
  const required = Math.min(minimum - active, candidates.length);
  if (required <= 0) return nodes;

  const pool = [...candidates];
  const picks = new Set<number>();
  while (picks.size < required && pool.length > 0) {
    const poolIndex = Math.floor(random() * pool.length);
    const [picked] = pool.splice(poolIndex, 1);
    if (picked) picks.add(picked.index);
  }

  return nodes.map((node, index) =>
    picks.has(index)
      ? {
          ...node,
          anomaly: {
            type: ANOMALY_TYPES[hashString(node.id) % ANOMALY_TYPES.length],
            severity: severityForIntensity(node.intensity),
            state: 'dormant' as const,
          },
        }
      : node,
  );
}

// ===== Default state =====

export interface CreateVimanaStateOptions {
  layout?: 'preset' | 'grid';
  random?: () => number;
  genomeSeed?: number;
}

interface PresetNodeSpec {
  id: string;
  label: string;
  fieldType: VimanaFieldType;
  intensity: number;
  coordinates: VimanaCoordinates;
  anomalyChance: number;
}

const PRESET_NODES: PresetNodeSpec[] = [
  { id: 'calm-1', label: 'Calm Glade', fieldType: 'calm', intensity: 60, coordinates: { x: 0, y: 0, z: 0 }, anomalyChance: 0 },
  { id: 'calm-2', label: 'Harmonic Springs', fieldType: 'calm', intensity: 55, coordinates: { x: -1, y: 1, z: 0 }, anomalyChance: 0 },
  { id: 'neuro-1', label: 'Neuro Bloom', fieldType: 'neuro', intensity: 65, coordinates: { x: 1, y: 1, z: 0 }, anomalyChance: 0.5 },
  { id: 'neuro-2', label: 'Synapse Ridge', fieldType: 'neuro', intensity: 70, coordinates: { x: 2, y: 0, z: 0 }, anomalyChance: 0.25 },
  { id: 'quantum-1', label: 'Quantum Pool', fieldType: 'quantum', intensity: 80, coordinates: { x: 1, y: -1, z: 1 }, anomalyChance: 0.4 },
  { id: 'quantum-2', label: 'Phase Garden', fieldType: 'quantum', intensity: 75, coordinates: { x: -1, y: -1, z: 1 }, anomalyChance: 0.3 },
  { id: 'earth-1', label: 'Earth Anchor', fieldType: 'earth', intensity: 50, coordinates: { x: -2, y: 0, z: -1 }, anomalyChance: 0.2 },
  { id: 'earth-2', label: 'Crystal Vale', fieldType: 'earth', intensity: 85, coordinates: { x: 0, y: -2, z: -1 }, anomalyChance: 0.35 },
];

function createPresetNodes(random: () => number, now: number): VimanaNode[] {
  return PRESET_NODES.map((spec, index) => {
    const isHome = index === 0;
    const hasAnomaly = spec.anomalyChance > 0 && random() < spec.anomalyChance;
    return createVimanaNode({
      id: spec.id,
      label: spec.label,
      coordinates: spec.coordinates,
      fieldType: spec.fieldType,
      intensity: spec.intensity,
      // The home node starts scanned; everything else begins fogged and is
      // revealed to 'detected' hop by hop as neighbouring fields are scanned.
      discoveryStage: isHome ? 'scanned' : 'unknown',
      scanQuality: isHome ? 60 : 0,
      samples: isHome ? 1 : 0,
      visits: isHome ? 1 : 0,
      firstRewardClaimed: isHome,
      anomaly: hasAnomaly
        ? {
            type: ANOMALY_TYPES[hashString(spec.id) % ANOMALY_TYPES.length],
            severity: severityForIntensity(spec.intensity),
            state: 'dormant',
          }
        : null,
      discoveredAt: isHome ? now : null,
      lastVisitedAt: isHome ? now : null,
    });
  });
}

function createGridNodes(random: () => number, now: number): VimanaNode[] {
  const nodes: VimanaNode[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const isCenter = x === 0 && y === 0 && z === 0;
        const id = `${x},${y},${z}`;
        const intensity = 20 + (hashString(id) % 80);
        const hasAnomaly = !isCenter && random() < 0.15;
        nodes.push(
          createVimanaNode({
            id,
            coordinates: { x, y, z },
            fieldType: FIELD_TYPES[hashString(id) % FIELD_TYPES.length],
            intensity,
            discoveryStage: isCenter ? 'scanned' : 'unknown',
            scanQuality: isCenter ? 60 : 0,
            samples: isCenter ? 1 : 0,
            visits: isCenter ? 1 : 0,
            firstRewardClaimed: isCenter,
            anomaly: hasAnomaly
              ? {
                  type: ANOMALY_TYPES[hashString(id) % ANOMALY_TYPES.length],
                  severity: severityForIntensity(intensity),
                  state: 'dormant',
                }
              : null,
            discoveredAt: isCenter ? now : null,
            lastVisitedAt: isCenter ? now : null,
          }),
        );
      }
    }
  }
  return nodes;
}

export function createDefaultVimanaState(
  options: CreateVimanaStateOptions = {},
): VimanaState {
  const random = options.random ?? Math.random;
  const layout = options.layout ?? 'preset';
  const seed = options.genomeSeed ?? DEFAULT_VIMANA_SEED;
  const now = Date.now();

  const baseNodes =
    layout === 'grid' ? createGridNodes(random, now) : createPresetNodes(random, now);
  const connected = applyConnections(
    ensureMinimumAnomalies(baseNodes, MIN_VIMANA_ANOMALIES, random),
    seed,
  );
  const homeId = layout === 'grid' ? '0,0,0' : connected[0]?.id ?? null;
  // Signals one hop from home start detected; the rest of the map is fog.
  const nodes = homeId ? revealVimanaNeighbors(connected, homeId) : connected;

  return {
    version: VIMANA_STATE_VERSION,
    nodes,
    activeNodeId: homeId,
    anomaliesFound: countAnomaliesFound(nodes),
    anomaliesResolved: 0,
    scansPerformed: 0,
    lastScanAt: now,
  };
}

// ===== Migration from legacy saves =====

/** Legacy shape from progression/types (pre-consolidation). */
interface LegacyProgressionCell {
  id: string;
  label?: string;
  field?: VimanaFieldType;
  coordinates?: Partial<VimanaCoordinates>;
  discovered: boolean;
  anomaly: boolean;
  energy?: number;
  reward?: 'mood' | 'energy' | 'hygiene' | 'mystery';
  visitedAt?: number;
}

/** Legacy shape from lib/vimana (pre-consolidation). */
interface LegacyLibCell {
  id: string;
  x?: number;
  y?: number;
  fieldType?: VimanaFieldType;
  intensity?: number;
  explored: boolean;
  hasAnomaly?: boolean;
  anomalyType?: VimanaAnomalyType;
  discoveredAt?: number;
  samples?: number;
}

const REWARD_TO_FIELD: Record<string, VimanaFieldType> = {
  mood: 'calm',
  energy: 'neuro',
  hygiene: 'earth',
  mystery: 'quantum',
};

function isFieldType(value: unknown): value is VimanaFieldType {
  return typeof value === 'string' && (FIELD_TYPES as string[]).includes(value);
}

function isAnomalyType(value: unknown): value is VimanaAnomalyType {
  return typeof value === 'string' && (ANOMALY_TYPES as string[]).includes(value);
}

function isDiscoveryStage(value: unknown): value is VimanaDiscoveryStage {
  return typeof value === 'string' && (DISCOVERY_STAGES as string[]).includes(value);
}

function coordinatesFromId(id: string): VimanaCoordinates {
  const parts = id.split(',').map((part) => Number.parseInt(part, 10));
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    return { x: parts[0], y: parts[1], z: parts[2] };
  }
  const preset = PRESET_NODES.find((spec) => spec.id === id);
  if (preset) return { ...preset.coordinates };
  const hash = hashString(id);
  return { x: (hash % 7) - 3, y: (Math.floor(hash / 7) % 7) - 3, z: 0 };
}

function migrateProgressionCell(cell: LegacyProgressionCell, now: number): VimanaNode {
  const fieldType = isFieldType(cell.field)
    ? cell.field
    : REWARD_TO_FIELD[cell.reward ?? ''] ?? FIELD_TYPES[hashString(cell.id) % FIELD_TYPES.length];
  const intensity = clampNumber(cell.energy, 0, 100, 20 + (hashString(cell.id) % 80));
  const discovered = cell.discovered === true;
  const visitedAt = typeof cell.visitedAt === 'number' ? cell.visitedAt : discovered ? now : null;

  return createVimanaNode({
    id: cell.id,
    label: typeof cell.label === 'string' ? cell.label : undefined,
    coordinates:
      cell.coordinates &&
      typeof cell.coordinates.x === 'number' &&
      typeof cell.coordinates.y === 'number'
        ? { x: cell.coordinates.x, y: cell.coordinates.y, z: cell.coordinates.z ?? 0 }
        : coordinatesFromId(cell.id),
    fieldType,
    intensity,
    // Discovered legacy cells were fully visited and already granted their
    // reward, so they land on 'explored' with the first reward locked out.
    discoveryStage: discovered ? 'explored' : 'detected',
    scanQuality: discovered ? 60 : 0,
    samples: discovered ? 1 : 0,
    visits: discovered ? 1 : 0,
    firstRewardClaimed: discovered,
    anomaly:
      cell.anomaly === true
        ? {
            type: ANOMALY_TYPES[hashString(cell.id) % ANOMALY_TYPES.length],
            severity: severityForIntensity(intensity),
            state: discovered ? 'active' : 'dormant',
          }
        : null,
    discoveredAt: discovered ? visitedAt : null,
    lastVisitedAt: visitedAt,
  });
}

function migrateLibCell(cell: LegacyLibCell, now: number): VimanaNode {
  const explored = cell.explored === true;
  const intensity = clampNumber(cell.intensity, 0, 100, 50);
  return createVimanaNode({
    id: cell.id,
    coordinates: { x: cell.x ?? 0, y: cell.y ?? 0, z: 0 },
    fieldType: isFieldType(cell.fieldType)
      ? cell.fieldType
      : FIELD_TYPES[hashString(cell.id) % FIELD_TYPES.length],
    intensity,
    discoveryStage: explored ? 'explored' : 'detected',
    scanQuality: explored ? 60 : 0,
    samples: clampNumber(cell.samples, 0, Number.MAX_SAFE_INTEGER, 0),
    visits: explored ? 1 : 0,
    firstRewardClaimed: explored,
    anomaly:
      cell.hasAnomaly === true
        ? {
            type: isAnomalyType(cell.anomalyType)
              ? cell.anomalyType
              : ANOMALY_TYPES[hashString(cell.id) % ANOMALY_TYPES.length],
            severity: severityForIntensity(intensity),
            state: explored ? 'active' : 'dormant',
          }
        : null,
    discoveredAt: typeof cell.discoveredAt === 'number' ? cell.discoveredAt : explored ? now : null,
    lastVisitedAt: explored ? now : null,
  });
}

function normalizeCanonicalNode(raw: VimanaNode): VimanaNode {
  const anomaly = raw.anomaly;
  return createVimanaNode({
    id: raw.id,
    label: typeof raw.label === 'string' ? raw.label : undefined,
    coordinates: {
      x: clampNumber(raw.coordinates?.x, -1000, 1000, 0),
      y: clampNumber(raw.coordinates?.y, -1000, 1000, 0),
      z: clampNumber(raw.coordinates?.z, -1000, 1000, 0),
    },
    fieldType: isFieldType(raw.fieldType) ? raw.fieldType : 'calm',
    intensity: clampNumber(raw.intensity, 0, 100, 50),
    discoveryStage: isDiscoveryStage(raw.discoveryStage) ? raw.discoveryStage : 'unknown',
    connections: Array.isArray(raw.connections)
      ? raw.connections.filter((id): id is string => typeof id === 'string')
      : [],
    scanQuality: clampNumber(raw.scanQuality, 0, 100, 0),
    samples: clampNumber(raw.samples, 0, Number.MAX_SAFE_INTEGER, 0),
    visits: clampNumber(raw.visits, 0, Number.MAX_SAFE_INTEGER, 0),
    firstRewardClaimed: raw.firstRewardClaimed === true,
    anomaly:
      anomaly && typeof anomaly === 'object' && isAnomalyType(anomaly.type)
        ? {
            type: anomaly.type,
            severity:
              anomaly.severity === 'minor' ||
              anomaly.severity === 'moderate' ||
              anomaly.severity === 'severe'
                ? anomaly.severity
                : 'minor',
            state:
              anomaly.state === 'dormant' ||
              anomaly.state === 'active' ||
              anomaly.state === 'resolved'
                ? anomaly.state
                : 'dormant',
          }
        : null,
    discoveredAt: typeof raw.discoveredAt === 'number' ? raw.discoveredAt : null,
    lastVisitedAt: typeof raw.lastVisitedAt === 'number' ? raw.lastVisitedAt : null,
    masteredAt: typeof raw.masteredAt === 'number' ? raw.masteredAt : null,
  });
}

export function isCanonicalVimanaState(value: unknown): value is VimanaState {
  if (!value || typeof value !== 'object') return false;
  const state = value as VimanaState;
  return (
    state.version === VIMANA_STATE_VERSION &&
    Array.isArray(state.nodes) &&
    state.nodes.every(
      (node) =>
        node !== null &&
        typeof node === 'object' &&
        typeof node.id === 'string' &&
        isDiscoveryStage(node.discoveryStage),
    )
  );
}

interface MigrateVimanaOptions {
  genomeSeed?: number;
  now?: number;
}

/**
 * Convert any historical Vimana save shape into the canonical v2 state.
 * Never throws: unrecognisable input falls back to a fresh default state.
 */
export function migrateVimanaState(
  value: unknown,
  options: MigrateVimanaOptions = {},
): VimanaState {
  const seed = options.genomeSeed ?? DEFAULT_VIMANA_SEED;
  const now = options.now ?? Date.now();

  if (isCanonicalVimanaState(value)) {
    let nodes = value.nodes.map(normalizeCanonicalNode);
    if (nodes.some((node) => node.connections.length === 0) && nodes.length > 1) {
      nodes = applyConnections(nodes, seed);
    }
    return {
      version: VIMANA_STATE_VERSION,
      nodes,
      activeNodeId:
        typeof value.activeNodeId === 'string' &&
        nodes.some((node) => node.id === value.activeNodeId)
          ? value.activeNodeId
          : nodes[0]?.id ?? null,
      anomaliesFound: countAnomaliesFound(nodes),
      anomaliesResolved: clampNumber(value.anomaliesResolved, 0, Number.MAX_SAFE_INTEGER, 0),
      scansPerformed: clampNumber(value.scansPerformed, 0, Number.MAX_SAFE_INTEGER, 0),
      lastScanAt: typeof value.lastScanAt === 'number' ? value.lastScanAt : null,
    };
  }

  if (value && typeof value === 'object' && Array.isArray((value as { cells?: unknown }).cells)) {
    const legacy = value as {
      cells: unknown[];
      activeCellId?: unknown;
      anomaliesFound?: unknown;
      anomaliesResolved?: unknown;
      scansPerformed?: unknown;
      lastScanAt?: unknown;
      lastScanTime?: unknown;
    };

    const nodes: VimanaNode[] = [];
    for (const rawCell of legacy.cells) {
      if (!rawCell || typeof rawCell !== 'object') continue;
      const cell = rawCell as Record<string, unknown>;
      if (typeof cell.id !== 'string') continue;
      if (typeof cell.discovered === 'boolean') {
        nodes.push(migrateProgressionCell(cell as unknown as LegacyProgressionCell, now));
      } else if (typeof cell.explored === 'boolean') {
        nodes.push(migrateLibCell(cell as unknown as LegacyLibCell, now));
      }
    }

    if (nodes.length > 0) {
      const connected = applyConnections(nodes, seed);
      const activeCellId =
        typeof legacy.activeCellId === 'string' &&
        connected.some((node) => node.id === legacy.activeCellId)
          ? legacy.activeCellId
          : connected[0]?.id ?? null;
      const lastScanAt =
        typeof legacy.lastScanAt === 'number'
          ? legacy.lastScanAt
          : typeof legacy.lastScanTime === 'number'
            ? legacy.lastScanTime
            : null;
      return {
        version: VIMANA_STATE_VERSION,
        nodes: connected,
        activeNodeId: activeCellId,
        anomaliesFound: countAnomaliesFound(connected),
        anomaliesResolved: clampNumber(legacy.anomaliesResolved, 0, Number.MAX_SAFE_INTEGER, 0),
        scansPerformed: clampNumber(legacy.scansPerformed, 0, Number.MAX_SAFE_INTEGER, 0),
        lastScanAt,
      };
    }
  }

  return createDefaultVimanaState({ genomeSeed: seed });
}

// ===== Map navigation =====

/**
 * Promote unknown neighbours of a node to 'detected' — scanning a field
 * surfaces the signals of everything up to `hops` routes away, which is how
 * the fog of war recedes. A perfect resonance-ring scan reaches two hops
 * instead of the usual one, rewarding precision with a wider picture.
 */
export function revealVimanaNeighbors(
  nodes: VimanaNode[],
  nodeId: string,
  hops: number = 1,
): VimanaNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (!byId.has(nodeId)) return nodes;

  let frontier = new Set<string>([nodeId]);
  const toReveal = new Set<string>();
  for (let hop = 0; hop < hops; hop++) {
    const nextFrontier = new Set<string>();
    for (const id of frontier) {
      const node = byId.get(id);
      if (!node) continue;
      for (const neighbourId of node.connections) {
        if (!byId.has(neighbourId)) continue;
        nextFrontier.add(neighbourId);
        if (byId.get(neighbourId)!.discoveryStage === 'unknown') {
          toReveal.add(neighbourId);
        }
      }
    }
    frontier = nextFrontier;
  }

  if (toReveal.size === 0) return nodes;
  return nodes.map((node) =>
    toReveal.has(node.id) ? { ...node, discoveryStage: 'detected' as const } : node,
  );
}

/**
 * Shortest route between two nodes travelling only through revealed
 * (non-unknown) space. Returns the node id path including both endpoints,
 * or null when the destination cannot be reached through known signals.
 */
export function findVimanaRoute(
  nodes: VimanaNode[],
  fromId: string,
  toId: string,
): string[] | null {
  if (fromId === toId) return [fromId];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const from = byId.get(fromId);
  const to = byId.get(toId);
  if (!from || !to || to.discoveryStage === 'unknown') return null;

  const previous = new Map<string, string>();
  const visited = new Set<string>([fromId]);
  const queue: string[] = [fromId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = byId.get(currentId);
    if (!current) continue;
    for (const neighbourId of current.connections) {
      if (visited.has(neighbourId)) continue;
      const neighbour = byId.get(neighbourId);
      if (!neighbour || neighbour.discoveryStage === 'unknown') continue;
      visited.add(neighbourId);
      previous.set(neighbourId, currentId);
      if (neighbourId === toId) {
        const path = [toId];
        let step = toId;
        while (step !== fromId) {
          step = previous.get(step)!;
          path.unshift(step);
        }
        return path;
      }
      queue.push(neighbourId);
    }
  }

  return null;
}

// ===== Scan / visit progression =====

export interface VimanaScanOutcome {
  node: VimanaNode;
  /** True when this scan performed the node's one-time first discovery. */
  firstDiscovery: boolean;
  /** True when the scan surfaced a dormant anomaly. */
  anomalyRevealed: boolean;
  mastered: boolean;
}

/**
 * Advance a node one discovery step for a scan/visit. Pure; returns the next
 * node plus flags for the store to translate into rewards exactly once.
 *
 * `qualityScore` (0-100) is the result of the resonance-ring tap-timing
 * minigame for this attempt; the node keeps the best score it has ever
 * earned, which in turn gates how much detail the UI reveals (see
 * {@link vimanaInfoLevel}). Callers that don't run the minigame (tests,
 * migrations) get the previous flat baseline.
 */
export function scanVimanaNode(
  node: VimanaNode,
  now: number = Date.now(),
  qualityScore: number = 60,
): VimanaScanOutcome {
  const rank = discoveryStageRank(node.discoveryStage);
  const scannedRank = discoveryStageRank('scanned');

  let nextStage: VimanaDiscoveryStage;
  if (rank < scannedRank) {
    nextStage = 'scanned';
  } else if (node.discoveryStage === 'scanned') {
    nextStage = 'explored';
  } else {
    nextStage = node.discoveryStage;
  }

  const firstDiscovery = !node.firstRewardClaimed && rank < scannedRank;
  const anomalyRevealed = node.anomaly?.state === 'dormant';
  const anomaly: VimanaAnomaly | null = node.anomaly
    ? { ...node.anomaly, state: node.anomaly.state === 'dormant' ? 'active' : node.anomaly.state }
    : null;

  const visits = node.visits + 1;
  const samples = node.samples + Math.max(1, Math.floor(node.intensity / 40));
  const anomalyClear = anomaly === null || anomaly.state === 'resolved';
  const mastered =
    nextStage === 'explored' || nextStage === 'mastered'
      ? visits >= VIMANA_MASTERY_VISITS && anomalyClear
      : false;

  const next: VimanaNode = {
    ...node,
    discoveryStage: mastered ? 'mastered' : nextStage,
    scanQuality: Math.max(node.scanQuality, clampNumber(qualityScore, 0, 100, 60)),
    samples,
    visits,
    firstRewardClaimed: node.firstRewardClaimed || firstDiscovery,
    anomaly,
    discoveredAt: node.discoveredAt ?? now,
    lastVisitedAt: now,
    masteredAt: node.masteredAt ?? (mastered ? now : null),
  };

  return {
    node: next,
    firstDiscovery,
    anomalyRevealed,
    mastered: mastered && node.masteredAt === null,
  };
}
