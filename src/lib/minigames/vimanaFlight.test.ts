import { describe, expect, it } from 'vitest';

import {
  EXPEDITION_CHARGE_MAX,
  FLIGHT_GATE_COUNT,
  FLIGHT_LANE_TOLERANCE,
  createExpeditionCharge,
  createFlight,
  flightBonusEssence,
  regenExpeditionCharge,
  spendExpeditionCharge,
  steerFlight,
  tickFlight,
} from './vimanaFlight';

describe('createFlight', () => {
  it('is deterministic for the same seed', () => {
    const a = createFlight(7, 0);
    const b = createFlight(7, 0);
    expect(a.gates).toEqual(b.gates);
  });

  it('lays out gates spaced through the flight with valid lanes', () => {
    const flight = createFlight(11, 0);
    expect(flight.gates).toHaveLength(FLIGHT_GATE_COUNT);
    const positions = flight.gates.map((gate) => gate.position);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (const gate of flight.gates) {
      expect(gate.position).toBeGreaterThan(0);
      expect(gate.position).toBeLessThan(1);
      expect([-1, 0, 1]).toContain(gate.lane);
    }
  });
});

describe('steerFlight', () => {
  it('clamps the lane to [-1, 1]', () => {
    const flight = createFlight(1, 0);
    expect(steerFlight(flight, 5).lane).toBe(1);
    expect(steerFlight(flight, -5).lane).toBe(-1);
    expect(steerFlight(flight, 0.3).lane).toBe(0.3);
  });
});

describe('tickFlight', () => {
  it('resolves a gate as hit when the craft is steered into its lane', () => {
    let flight = createFlight(1, 0);
    const gate = flight.gates[0];
    flight = steerFlight(flight, gate.lane);
    const at = gate.position * flight.durationMs;
    flight = tickFlight(flight, at);
    expect(flight.gates[0].resolved).toBe(true);
    expect(flight.gates[0].hit).toBe(true);
    expect(flight.gatesHit).toBe(1);
  });

  it('resolves a gate as missed when the craft is in the wrong lane', () => {
    let flight = createFlight(1, 0);
    const gate = flight.gates[0];
    const wrongLane = gate.lane === 1 ? -1 : 1;
    // Two full lanes apart always exceeds the tolerance.
    expect(Math.abs(wrongLane - gate.lane)).toBeGreaterThan(FLIGHT_LANE_TOLERANCE);
    flight = steerFlight(flight, wrongLane);
    flight = tickFlight(flight, gate.position * flight.durationMs);
    expect(flight.gates[0].resolved).toBe(true);
    expect(flight.gates[0].hit).toBe(false);
    expect(flight.gatesHit).toBe(0);
  });

  it('completes at full duration and always reaches the destination regardless of gates', () => {
    let flight = createFlight(1, 0);
    // Steer into the worst possible lane for every gate on purpose.
    for (const gate of flight.gates) {
      flight = steerFlight(flight, gate.lane === 1 ? -1 : 1);
      flight = tickFlight(flight, gate.position * flight.durationMs);
    }
    flight = tickFlight(flight, flight.durationMs);
    expect(flight.complete).toBe(true);
    expect(flight.gatesHit).toBe(0); // missed every gate...
    // ...but the flight still finished (arrival is never gated by skill).
  });

  it('does not re-resolve gates or advance past completion', () => {
    let flight = createFlight(1, 0);
    flight = tickFlight(flight, flight.durationMs * 2);
    expect(flight.complete).toBe(true);
    const resolvedGates = flight.gates;
    const again = tickFlight(flight, flight.durationMs * 3);
    expect(again).toBe(flight);
    expect(again.gates).toBe(resolvedGates);
  });
});

describe('flightBonusEssence', () => {
  it('is purely additive and capped at the gate count', () => {
    expect(flightBonusEssence(0)).toBe(0);
    expect(flightBonusEssence(2)).toBe(2);
    expect(flightBonusEssence(99)).toBe(FLIGHT_GATE_COUNT);
    expect(flightBonusEssence(-1)).toBe(0);
  });
});

describe('expedition charge', () => {
  it('starts full and spends down to zero without going negative', () => {
    let charge = createExpeditionCharge(2);
    expect(charge.count).toBe(2);
    charge = spendExpeditionCharge(charge, 0);
    expect(charge.count).toBe(1);
    charge = spendExpeditionCharge(charge, 1);
    expect(charge.count).toBe(0);
    charge = spendExpeditionCharge(charge, 2);
    expect(charge.count).toBe(0); // never blocks the caller, just stays at 0
  });

  it('regenerates one charge after the regen window elapses', () => {
    let charge = createExpeditionCharge(2);
    charge = spendExpeditionCharge(charge, 1000, 5000);
    expect(charge.count).toBe(1);
    expect(charge.nextRegenAt).toBe(6000);

    const tooSoon = regenExpeditionCharge(charge, 5999, 5000);
    expect(tooSoon.count).toBe(1);

    const regenerated = regenExpeditionCharge(charge, 6000, 5000);
    expect(regenerated.count).toBe(2);
    expect(regenerated.nextRegenAt).toBeNull(); // full again
  });

  it('catches up multiple missed regen ticks at once', () => {
    let charge = createExpeditionCharge(3);
    charge = spendExpeditionCharge(charge, 0, 1000);
    charge = spendExpeditionCharge(charge, 0, 1000);
    expect(charge.count).toBe(1);

    const later = regenExpeditionCharge(charge, 10_000, 1000);
    expect(later.count).toBe(EXPEDITION_CHARGE_MAX);
    expect(later.nextRegenAt).toBeNull();
  });
});
