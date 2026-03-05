import { afterEach, describe, expect, it, vi } from "vitest";
import type { EvolutionData } from "../evolution";
import {
  DECAY_RATES,
  DEFAULT_VITALS,
  type Vitals,
  applyDecay,
  applyInteraction,
  calculateElapsedTicks,
  checkDeath,
  checkSickness,
  clamp,
  getVitalStatus,
  getVitalsAverage,
  getVitalsStatus,
  multiTick,
  resetAfterDeath,
  tick,
  treatSickness,
} from "./index";

const createVitals = (overrides: Partial<Vitals> = {}): Vitals => ({
  ...DEFAULT_VITALS,
  ...overrides,
});

const createEvolution = (
  overrides: Partial<EvolutionData> = {},
): EvolutionData => ({
  state: "GENETICS",
  birthTime: 0,
  lastEvolutionTime: Date.now() - 60 * 60 * 1000 - 1000,
  experience: 0,
  level: 5,
  currentLevelXp: 0,
  totalXp: 0,
  totalInteractions: 12,
  canEvolve: false,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("vitals utilities", () => {
  it("clamps values to the provided range", () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(15, 10, 20)).toBe(15);
  });

  it("computes average and aggregate status", () => {
    const vitals = createVitals({
      hunger: 10,
      hygiene: 20,
      mood: 30,
      energy: 40,
    });

    expect(getVitalsAverage(vitals)).toBe(25);
    expect(getVitalsStatus(vitals)).toBe("low");
    expect(
      getVitalsStatus(
        createVitals({ hunger: 5, hygiene: 5, mood: 5, energy: 5 }),
      ),
    ).toBe("critical");
    expect(
      getVitalsStatus(
        createVitals({ hunger: 55, hygiene: 55, mood: 55, energy: 55 }),
      ),
    ).toBe("good");
    expect(
      getVitalsStatus(
        createVitals({ hunger: 90, hygiene: 90, mood: 90, energy: 90 }),
      ),
    ).toBe("excellent");
  });

  it("computes per-vital status", () => {
    expect(getVitalStatus(5)).toBe("critical");
    expect(getVitalStatus(30)).toBe("low");
    expect(getVitalStatus(60)).toBe("good");
    expect(getVitalStatus(90)).toBe("excellent");
  });
});

describe("sickness and recovery", () => {
  it("detects each sickness type at threshold", () => {
    expect(checkSickness(createVitals({ hunger: 90 }))).toMatchObject({
      isSick: true,
      sicknessType: "hungry",
    });
    expect(checkSickness(createVitals({ hygiene: 10 }))).toMatchObject({
      isSick: true,
      sicknessType: "dirty",
    });
    expect(checkSickness(createVitals({ energy: 5 }))).toMatchObject({
      isSick: true,
      sicknessType: "exhausted",
    });
    expect(checkSickness(createVitals({ mood: 10 }))).toMatchObject({
      isSick: true,
      sicknessType: "depressed",
    });
    expect(checkSickness(createVitals())).toEqual({
      isSick: false,
      sicknessType: "none",
      severity: 0,
    });
  });

  it("flags death only when sickness reaches max severity", () => {
    expect(
      checkDeath(createVitals({ isSick: true, sicknessSeverity: 100 })),
    ).toBe(true);
    expect(
      checkDeath(createVitals({ isSick: true, sicknessSeverity: 99 })),
    ).toBe(false);
    expect(
      checkDeath(createVitals({ isSick: false, sicknessSeverity: 100 })),
    ).toBe(false);
  });

  it("returns the same object when treatment is not needed", () => {
    const healthy = createVitals();

    expect(treatSickness(healthy)).toBe(healthy);
  });

  it("treats mild sickness and clears the status", () => {
    const sick = createVitals({
      isSick: true,
      sicknessType: "dirty",
      sicknessSeverity: 20,
      hygiene: 0,
    });

    const treated = treatSickness(sick);

    expect(treated.hygiene).toBe(20);
    expect(treated.sicknessSeverity).toBe(0);
    expect(treated.isSick).toBe(false);
    expect(treated.sicknessType).toBe("none");
  });

  it("resets to defaults after death and increments death count", () => {
    const reset = resetAfterDeath(
      createVitals({
        deathCount: 2,
        hunger: 99,
        isSick: true,
        sicknessSeverity: 100,
      }),
    );

    expect(reset).toEqual({
      ...DEFAULT_VITALS,
      deathCount: 3,
    });
  });
});

describe("decay and interactions", () => {
  it("applies healthy decay rates when not sick", () => {
    const result = applyDecay(createVitals());

    expect(result.hunger).toBeCloseTo(
      DEFAULT_VITALS.hunger + DECAY_RATES.hunger,
      5,
    );
    expect(result.hygiene).toBeCloseTo(
      DEFAULT_VITALS.hygiene + DECAY_RATES.hygiene,
      5,
    );
    expect(result.energy).toBeCloseTo(
      DEFAULT_VITALS.energy + DECAY_RATES.energy,
      5,
    );
    expect(result.mood).toBeCloseTo(DEFAULT_VITALS.mood + DECAY_RATES.mood, 5);
  });

  it("reduces mood when energy is low", () => {
    const result = applyDecay(createVitals({ energy: 40, mood: 50 }));

    expect(result.mood).toBeCloseTo(49.95, 5);
  });

  it("increases severity over time when sickness condition persists", () => {
    const result = applyDecay(
      createVitals({
        isSick: true,
        sicknessSeverity: 50,
        sicknessType: "hungry",
        hunger: 95,
      }),
    );

    expect(result.isSick).toBe(true);
    expect(result.sicknessType).toBe("hungry");
    expect(result.sicknessSeverity).toBe(52);
  });

  it("fully clears lingering sickness after recovery", () => {
    const recovered = applyDecay(
      createVitals({
        isSick: true,
        sicknessSeverity: 1,
        sicknessType: "dirty",
      }),
    );

    expect(recovered.sicknessSeverity).toBe(0);
    expect(recovered.isSick).toBe(false);
    expect(recovered.sicknessType).toBe("none");
  });

  it("applies interaction effects and targeted sickness relief", () => {
    const played = applyInteraction(
      createVitals({ mood: 80, energy: 20, hygiene: 50 }),
      "play",
    );
    expect(played.mood).toBe(95);
    expect(played.energy).toBe(10);
    expect(played.hygiene).toBe(45);

    const recovered = applyInteraction(
      createVitals({
        isSick: true,
        sicknessType: "hungry",
        sicknessSeverity: 15,
      }),
      "feed",
    );
    expect(recovered.sicknessSeverity).toBe(0);
    expect(recovered.isSick).toBe(false);
    expect(recovered.sicknessType).toBe("none");
  });
});

describe("tick orchestration", () => {
  it("updates vitals and sets evolution eligibility each tick", () => {
    const evolution = createEvolution();

    const result = tick(createVitals(), evolution);

    expect(result.vitals.hunger).toBeGreaterThan(DEFAULT_VITALS.hunger);
    expect(result.evolution.canEvolve).toBe(true);
  });

  it("applies multiple ticks sequentially", () => {
    const evolution = createEvolution({
      level: 1,
      totalInteractions: 0,
      lastEvolutionTime: Date.now(),
    });

    const result = multiTick(createVitals(), evolution, 3);

    expect(result.vitals.hunger).toBeCloseTo(
      DEFAULT_VITALS.hunger + DECAY_RATES.hunger * 3,
      5,
    );
    expect(result.vitals.energy).toBeCloseTo(
      DEFAULT_VITALS.energy + DECAY_RATES.energy * 3,
      5,
    );
    expect(result.evolution.canEvolve).toBe(false);
  });

  it("calculates elapsed ticks using floor division", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_500);

    expect(calculateElapsedTicks(500, 1_000)).toBe(10);
  });
});
