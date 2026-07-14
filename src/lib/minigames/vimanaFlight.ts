/**
 * Vimana flight sequence — pure engine for the brief travel animation played
 * between map nodes. Steering and gate outcomes live here so the component
 * only renders lanes, particles, and the craft; scoring stays testable
 * without a DOM.
 *
 * Flight never blocks arrival: missing every gate still completes the trip.
 * Gates only add a small bonus reward, so skill affects flavor, not progress.
 */

export const FLIGHT_DURATION_MS = 2200;
export const FLIGHT_GATE_COUNT = 3;
/** Steering slack: craft lane must land within this distance of a gate's lane. */
export const FLIGHT_LANE_TOLERANCE = 0.5;
/** Discrete steering lanes, left to right. */
export const FLIGHT_LANES = [-1, 0, 1] as const;

export interface FlightGate {
  id: number;
  /** Fraction of the flight (0..1) at which this gate resolves. */
  position: number;
  /** Target lane the craft must be in when the gate resolves. */
  lane: number;
  resolved: boolean;
  hit: boolean;
}

export interface FlightState {
  startedAt: number;
  durationMs: number;
  /** 0..1 progress along the route. */
  progress: number;
  /** Current craft lane, continuous in [-1, 1], set by drag steering. */
  lane: number;
  gates: FlightGate[];
  gatesHit: number;
  complete: boolean;
}

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

export function createFlight(
  seed: number,
  now: number,
  durationMs: number = FLIGHT_DURATION_MS,
): FlightState {
  const random = mulberry32(seed);
  const gates: FlightGate[] = Array.from({ length: FLIGHT_GATE_COUNT }, (_, index) => ({
    id: index,
    position: (index + 1) / (FLIGHT_GATE_COUNT + 1),
    lane: FLIGHT_LANES[Math.floor(random() * FLIGHT_LANES.length)],
    resolved: false,
    hit: false,
  }));
  return {
    startedAt: now,
    durationMs,
    progress: 0,
    lane: 0,
    gates,
    gatesHit: 0,
    complete: false,
  };
}

/** Drag steering: set the craft's current lane, clamped to [-1, 1]. */
export function steerFlight(state: FlightState, lane: number): FlightState {
  const clamped = Math.max(-1, Math.min(1, lane));
  if (clamped === state.lane) return state;
  return { ...state, lane: clamped };
}

/** Advance the flight clock, resolving any gates the craft has now reached. */
export function tickFlight(state: FlightState, now: number): FlightState {
  if (state.complete) return state;

  const progress = Math.min(1, (now - state.startedAt) / state.durationMs);
  let gatesHit = state.gatesHit;
  let changed = progress !== state.progress;

  const gates = state.gates.map((gate) => {
    if (gate.resolved || progress < gate.position) return gate;
    const hit = Math.abs(state.lane - gate.lane) <= FLIGHT_LANE_TOLERANCE;
    if (hit) gatesHit += 1;
    changed = true;
    return { ...gate, resolved: true, hit };
  });

  if (!changed) return state;
  return { ...state, progress, gates, gatesHit, complete: progress >= 1 };
}

/** Small, purely additive essence bonus for gates threaded during the flight. */
export function flightBonusEssence(gatesHit: number): number {
  return Math.max(0, Math.min(FLIGHT_GATE_COUNT, gatesHit));
}

// ===== Session-based expedition charge =====
//
// Rate-limits the flight flourish itself (not scanning in place, and never
// the underlying travel) so mobile play stays snappy without letting a
// player spam animations back-to-back. Charge lives in component/session
// state only — it is never persisted to the pet save.

export const EXPEDITION_CHARGE_MAX = 3;
export const EXPEDITION_CHARGE_REGEN_MS = 20_000;

export interface ExpeditionCharge {
  count: number;
  max: number;
  /** Timestamp the next charge regenerates at, or null when already full. */
  nextRegenAt: number | null;
}

export function createExpeditionCharge(
  max: number = EXPEDITION_CHARGE_MAX,
): ExpeditionCharge {
  return { count: max, max, nextRegenAt: null };
}

/** Catches the charge up to `now`, regenerating any charges that came due. */
export function regenExpeditionCharge(
  charge: ExpeditionCharge,
  now: number,
  regenMs: number = EXPEDITION_CHARGE_REGEN_MS,
): ExpeditionCharge {
  if (charge.nextRegenAt === null || now < charge.nextRegenAt || charge.count >= charge.max) {
    return charge;
  }
  let count = charge.count;
  let nextRegenAt: number | null = charge.nextRegenAt;
  while (nextRegenAt !== null && now >= nextRegenAt && count < charge.max) {
    count += 1;
    nextRegenAt = count < charge.max ? nextRegenAt + regenMs : null;
  }
  return { ...charge, count, nextRegenAt };
}

/**
 * Spend one charge if available. Returns the charge unchanged (count stays
 * at 0) when empty — callers decide what happens then; travel itself is
 * never gated by this, only the flight animation is.
 */
export function spendExpeditionCharge(
  charge: ExpeditionCharge,
  now: number,
  regenMs: number = EXPEDITION_CHARGE_REGEN_MS,
): ExpeditionCharge {
  const settled = regenExpeditionCharge(charge, now, regenMs);
  if (settled.count <= 0) return settled;
  return {
    ...settled,
    count: settled.count - 1,
    nextRegenAt: settled.nextRegenAt ?? now + regenMs,
  };
}
