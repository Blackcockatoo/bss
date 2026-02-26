export type WitnessPresence = 'present' | 'silent' | 'disappeared';
export type WitnessAgency = 'witness' | 'trace';
export type PetOntologyState = 'living' | 'unwitnessed' | 'enduring';

export interface WitnessMark {
  seed: string;
  signature: string;
  geometry: number[];
}

export interface WitnessState {
  presence: WitnessPresence;
  agency: WitnessAgency;
  lastSeenAt: number | null;
}

export interface TraceState {
  mark: WitnessMark;
  createdAt: number;
}

export interface WitnessRecord {
  mark: WitnessMark;
  state: WitnessState;
  trace: TraceState | null;
}

export function deriveWitnessMark(seed: string, points = 12): WitnessMark {
  const normalizedSeed = seed.trim();
  const hash = fnv1a(normalizedSeed);
  const signature = hash.toString(16).padStart(8, '0');
  const rng = mulberry32(hash ^ 0x9e3779b9);
  const geometry = Array.from({ length: points }, () =>
    Number(rng().toFixed(6))
  );

  return {
    seed: normalizedSeed,
    signature,
    geometry,
  };
}

export function createWitnessRecord(seed: string, timestamp = Date.now()): WitnessRecord {
  return {
    mark: deriveWitnessMark(seed),
    state: {
      presence: 'present',
      agency: 'witness',
      lastSeenAt: timestamp,
    },
    trace: null,
  };
}

export function createTraceFromWitness(
  witness: WitnessRecord,
  timestamp = Date.now()
): TraceState {
  return {
    mark: witness.mark,
    createdAt: timestamp,
  };
}

export function isValidWitnessMark(value: unknown): value is WitnessMark {
  if (!value || typeof value !== 'object') return false;
  const mark = value as WitnessMark;
  return (
    typeof mark.seed === 'string' &&
    typeof mark.signature === 'string' &&
    Array.isArray(mark.geometry) &&
    mark.geometry.every(point => typeof point === 'number' && Number.isFinite(point))
  );
}

export function isValidWitnessState(value: unknown): value is WitnessState {
  if (!value || typeof value !== 'object') return false;
  const state = value as WitnessState;
  const presenceOk =
    state.presence === 'present' ||
    state.presence === 'silent' ||
    state.presence === 'disappeared';
  const agencyOk = state.agency === 'witness' || state.agency === 'trace';
  return (
    presenceOk &&
    agencyOk &&
    (state.lastSeenAt === null || typeof state.lastSeenAt === 'number')
  );
}

export function isValidTraceState(value: unknown): value is TraceState {
  if (!value || typeof value !== 'object') return false;
  const trace = value as TraceState;
  return isValidWitnessMark(trace.mark) && typeof trace.createdAt === 'number';
}

export function isValidWitnessRecord(value: unknown): value is WitnessRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as WitnessRecord;
  const traceOk = record.trace === null || isValidTraceState(record.trace);
  return isValidWitnessMark(record.mark) && isValidWitnessState(record.state) && traceOk;
}

export function isDerivedWitnessMark(mark: WitnessMark): boolean {
  const derived = deriveWitnessMark(mark.seed, mark.geometry.length);
  if (derived.signature !== mark.signature) {
    return false;
  }

  return derived.geometry.every(
    (value, index) => Math.abs(value - mark.geometry[index]) < 1e-6
  );
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
