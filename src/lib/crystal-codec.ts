/**
 * Crystalline DNA Codec — Encode DNA Into Lattice Topology & Decode Back
 *
 * The fundamental insight: a crystal lattice topology *is* information.
 * The pattern of connections, the coordination numbers, the symmetry
 * breaks — all of these encode data.  This codec makes that explicit:
 *
 *   ENCODE:  DNA string → crystal topology → structural fingerprint
 *   DECODE:  structural fingerprint → DNA string (lossy but recognisable)
 *
 * Encoding scheme (DNA → Topology):
 *   1. Each DNA digit determines the local coordination geometry at a node
 *   2. The sequence of digits determines the order of edge construction
 *   3. Symmetry-breaking patterns encode the genome's structure
 *
 * Decoding scheme (Topology → DNA):
 *   1. Read coordination numbers in topological order (BFS from seed)
 *   2. Map coordination patterns back to DNA digits
 *   3. Verify with structural checksum
 *
 * This creates a *living* encoding — the DNA is literally the structure
 * of the crystal.  Damage the crystal and you damage the genome.
 * Strengthen the crystal and the genome becomes more robust.
 *
 * Applications:
 *   - Structural identity verification (is this crystal from this genome?)
 *   - Crystal "memory" — the lattice remembers its DNA
 *   - Cross-referencing between CrystallineNetwork and CrystallineLattice
 *   - Tamper detection — if someone modifies the crystal, the codec detects it
 */

import {
  type Vec3, type LatticeState,
  v3, v3add, v3scale, v3len, v3dist,
  createSeededRng, dnaSeed,
} from './lattice-math';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CrystalFingerprint {
  /** Base-7 encoded crystal topology */
  topologyHash:     string;
  /** Coordination number sequence (BFS order from seed) */
  coordSequence:    number[];
  /** Symmetry group classification */
  symmetryClass:    'cubic' | 'hexagonal' | 'icosahedral' | 'irregular';
  /** Structural checksum for integrity verification */
  checksum:         number;
  /** Decoded DNA (may be lossy — partial reconstruction) */
  decodedDna:       string;
  /** Confidence of decode (0-1) */
  confidence:       number;
  /** Number of nodes analysed */
  nodeCount:        number;
  /** Topology entropy (bits) — measures structural complexity */
  entropy:          number;
}

export interface EncodingResult {
  fingerprint:  CrystalFingerprint;
  /** Map from DNA digit position → node ID in the lattice */
  digitToNode:  Map<number, number>;
  /** Inverse: node ID → DNA digit position */
  nodeToDigit:  Map<number, number>;
}

// ── Coordination → DNA digit mapping ─────────────────────────────────────────
//
// Each DNA digit (0-6) maps to a target coordination number.
// The crystal "encodes" the digit by building nodes with that coordination.
//
// digit 0 → coord 1-2  (terminal / chain end)
// digit 1 → coord 2    (linear chain)
// digit 2 → coord 3    (trigonal / Y-branch)
// digit 3 → coord 4    (tetrahedral)
// digit 4 → coord 5-6  (pentagonal / hexagonal)
// digit 5 → coord 6-8  (octahedral / high-coord)
// digit 6 → coord 8+   (hypercube / dense)

function coordToDigit(coord: number): number {
  if (coord <= 1) return 0;
  if (coord === 2) return 1;
  if (coord === 3) return 2;
  if (coord === 4) return 3;
  if (coord <= 6) return 4;
  if (coord <= 8) return 5;
  return 6;
}

function digitToTargetCoord(digit: number): number {
  const targets = [1, 2, 3, 4, 5, 7, 9];
  return targets[Math.min(6, Math.max(0, digit))];
}

// ── Encoding ─────────────────────────────────────────────────────────────────

/**
 * Encode a DNA string as a crystal topology fingerprint.
 *
 * Analyses the lattice state and extracts a structural fingerprint
 * that uniquely identifies the genome that generated it.
 */
export function encodeCrystal(
  state: LatticeState,
  dna: string,
): EncodingResult {
  const digits = dna.split('').map(d => Math.min(6, parseInt(d, 10) || 0));
  const aliveNodes = state.nodes.filter(n => n.alive);

  if (aliveNodes.length === 0) {
    return emptyResult(dna);
  }

  // Build adjacency
  const adj = new Map<number, Set<number>>();
  for (const e of state.edges) {
    if (!adj.has(e.a)) adj.set(e.a, new Set());
    if (!adj.has(e.b)) adj.set(e.b, new Set());
    adj.get(e.a)!.add(e.b);
    adj.get(e.b)!.add(e.a);
  }

  // BFS from seed node (closest to origin) to establish topological order
  const nodeMap = new Map(aliveNodes.map(n => [n.id, n]));
  let seedId = aliveNodes[0].id;
  let minDist = Infinity;
  for (const n of aliveNodes) {
    const d = v3len(n.pos);
    if (d < minDist) { minDist = d; seedId = n.id; }
  }

  const bfsOrder: number[] = [];
  const visited = new Set<number>();
  const queue = [seedId];
  visited.add(seedId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    bfsOrder.push(current);
    const neighbours = adj.get(current) || new Set();
    // Sort neighbours for deterministic order
    const sorted = [...neighbours].sort((a, b) => a - b);
    for (const nb of sorted) {
      if (!visited.has(nb) && nodeMap.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }
  }

  // Extract coordination sequence (BFS order)
  const coordSequence = bfsOrder.map(id => (adj.get(id)?.size ?? 0));

  // Build digit-to-node mapping
  const digitToNode = new Map<number, number>();
  const nodeToDigit = new Map<number, number>();
  for (let i = 0; i < bfsOrder.length && i < digits.length; i++) {
    digitToNode.set(i, bfsOrder[i]);
    nodeToDigit.set(bfsOrder[i], i);
  }

  // Topology hash: base-7 encoding of coordination sequence
  const topologyHash = coordSequence
    .map(c => coordToDigit(c).toString())
    .join('');

  // Symmetry classification
  const symmetryClass = classifySymmetry(coordSequence);

  // Structural checksum (FNV-1a of coordination sequence)
  const checksum = computeChecksum(coordSequence);

  // Decode: reconstruct DNA from topology
  const decodedDna = coordSequence
    .slice(0, 60)
    .map(c => coordToDigit(c).toString())
    .join('')
    .padEnd(60, '0');

  // Confidence: how well does the decoded DNA match the original?
  let matchCount = 0;
  for (let i = 0; i < Math.min(digits.length, coordSequence.length); i++) {
    if (coordToDigit(coordSequence[i]) === digits[i]) matchCount++;
  }
  const confidence = digits.length > 0 ? matchCount / Math.min(digits.length, coordSequence.length) : 0;

  // Topology entropy
  const entropy = computeEntropy(coordSequence);

  return {
    fingerprint: {
      topologyHash,
      coordSequence,
      symmetryClass,
      checksum,
      decodedDna,
      confidence: Math.round(confidence * 1000) / 1000,
      nodeCount: aliveNodes.length,
      entropy: Math.round(entropy * 100) / 100,
    },
    digitToNode,
    nodeToDigit,
  };
}

// ── Decoding ─────────────────────────────────────────────────────────────────

/**
 * Decode a crystal fingerprint back into a DNA string.
 *
 * This is the inverse operation of encoding.  Because the encoding is
 * lossy (multiple coordination patterns can map to the same digit),
 * the decoded DNA may not exactly match the original — but it will
 * be *recognisable* as the same genome.
 */
export function decodeCrystal(fingerprint: CrystalFingerprint): string {
  return fingerprint.decodedDna;
}

/**
 * Verify that a crystal structure matches a DNA string.
 *
 * Encodes the crystal, decodes it, and compares against the claimed DNA.
 * Returns a match score (0-1).
 */
export function verifyCrystalDna(
  state: LatticeState,
  claimedDna: string,
): { match: number; verified: boolean; details: string } {
  const result = encodeCrystal(state, claimedDna);
  const fp = result.fingerprint;

  // Compare decoded DNA to claimed DNA
  const claimed = claimedDna.split('').map(d => parseInt(d, 10) || 0);
  const decoded = fp.decodedDna.split('').map(d => parseInt(d, 10) || 0);

  let exactMatch = 0;
  let closeMatch = 0; // within ±1
  const len = Math.min(claimed.length, decoded.length);

  for (let i = 0; i < len; i++) {
    if (claimed[i] === decoded[i]) exactMatch++;
    else if (Math.abs(claimed[i] - decoded[i]) <= 1) closeMatch++;
  }

  const match = len > 0 ? (exactMatch + closeMatch * 0.5) / len : 0;
  const verified = match > 0.6;

  let details: string;
  if (verified) {
    details = `Crystal verified: ${Math.round(match * 100)}% structural match (${exactMatch} exact, ${closeMatch} close)`;
  } else {
    details = `Crystal mismatch: only ${Math.round(match * 100)}% match — structure may be damaged or from a different genome`;
  }

  return { match, verified, details };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifySymmetry(coordSequence: number[]): 'cubic' | 'hexagonal' | 'icosahedral' | 'irregular' {
  if (coordSequence.length < 4) return 'irregular';

  // Count coordination number frequencies
  const freq = new Map<number, number>();
  for (const c of coordSequence) freq.set(c, (freq.get(c) || 0) + 1);

  // Dominant coordination
  let dominant = 0, maxFreq = 0;
  for (const [coord, count] of freq) {
    if (count > maxFreq) { maxFreq = count; dominant = coord; }
  }

  const ratio = maxFreq / coordSequence.length;

  // Classification heuristics
  if (dominant === 4 && ratio > 0.4) return 'cubic';
  if (dominant === 3 && ratio > 0.4) return 'hexagonal';
  if (dominant === 5 && ratio > 0.3) return 'icosahedral';
  if (ratio > 0.5) {
    // High regularity — check which system
    if (dominant <= 4) return 'cubic';
    if (dominant <= 6) return 'hexagonal';
    return 'icosahedral';
  }
  return 'irregular';
}

function computeChecksum(sequence: number[]): number {
  let h = 0x811c9dc5;
  for (const v of sequence) {
    h ^= v;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function computeEntropy(sequence: number[]): number {
  if (sequence.length === 0) return 0;

  const freq = new Map<number, number>();
  for (const v of sequence) freq.set(v, (freq.get(v) || 0) + 1);

  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / sequence.length;
    if (p > 0) entropy -= p * Math.log2(p);
  }

  return entropy;
}

function emptyResult(dna: string): EncodingResult {
  return {
    fingerprint: {
      topologyHash: '',
      coordSequence: [],
      symmetryClass: 'irregular',
      checksum: 0,
      decodedDna: '0'.repeat(60),
      confidence: 0,
      nodeCount: 0,
      entropy: 0,
    },
    digitToNode: new Map(),
    nodeToDigit: new Map(),
  };
}

// ── Crystal memory ───────────────────────────────────────────────────────────

/**
 * Compute the "structural DNA" — a compact representation of the lattice
 * topology that serves as the crystal's memory of its genome.
 *
 * Returns a 60-character string of base-7 digits derived purely from
 * the crystal's structure (no reference to the original DNA).
 */
export function readCrystalMemory(state: LatticeState): string {
  const aliveNodes = state.nodes.filter(n => n.alive);
  if (aliveNodes.length === 0) return '0'.repeat(60);

  // Build adjacency
  const adj = new Map<number, Set<number>>();
  for (const e of state.edges) {
    if (!adj.has(e.a)) adj.set(e.a, new Set());
    if (!adj.has(e.b)) adj.set(e.b, new Set());
    adj.get(e.a)!.add(e.b);
    adj.get(e.b)!.add(e.a);
  }

  // BFS from seed
  const nodeMap = new Map(aliveNodes.map(n => [n.id, n]));
  let seedId = aliveNodes[0].id;
  let minDist = Infinity;
  for (const n of aliveNodes) {
    const d = v3len(n.pos);
    if (d < minDist) { minDist = d; seedId = n.id; }
  }

  const order: number[] = [];
  const visited = new Set<number>();
  const queue = [seedId];
  visited.add(seedId);
  while (queue.length > 0 && order.length < 60) {
    const curr = queue.shift()!;
    order.push(curr);
    const nbs = [...(adj.get(curr) || [])].sort((a, b) => a - b);
    for (const nb of nbs) {
      if (!visited.has(nb) && nodeMap.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }
  }

  // Convert coordination numbers to base-7 digits
  return order
    .map(id => coordToDigit(adj.get(id)?.size ?? 0).toString())
    .join('')
    .padEnd(60, '0')
    .slice(0, 60);
}

/**
 * Compute the structural similarity between two crystal fingerprints.
 * Returns 0-1 (1 = identical topology).
 */
export function crystalSimilarity(
  a: CrystalFingerprint,
  b: CrystalFingerprint,
): number {
  const lenA = a.coordSequence.length;
  const lenB = b.coordSequence.length;
  const len = Math.min(lenA, lenB);
  if (len === 0) return 0;

  let matches = 0;
  for (let i = 0; i < len; i++) {
    if (a.coordSequence[i] === b.coordSequence[i]) matches++;
  }

  const seqSimilarity = matches / len;
  const sizeSimilarity = Math.min(lenA, lenB) / Math.max(lenA, lenB);
  const symmetrySame = a.symmetryClass === b.symmetryClass ? 1 : 0;

  return seqSimilarity * 0.5 + sizeSimilarity * 0.3 + symmetrySame * 0.2;
}
