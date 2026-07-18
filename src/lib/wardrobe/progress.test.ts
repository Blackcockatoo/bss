import { describe, expect, it } from "vitest";
import {
  applyObservation,
  createDefaultProgress,
  deriveUniqueGamesCompleted,
  highestStage,
  normalizeProgress,
  observeEnergy,
  type ProgressObservation,
} from "./progress";
import {
  SUSTAINED_ENERGY_MINIMUM,
  SUSTAINED_OBSERVATION_GAP_MS,
} from "./types";
import { createDefaultMiniGameProgress } from "@/progression/types";

function makeObservation(overrides: Partial<ProgressObservation> = {}): ProgressObservation {
  return {
    stage: "GENETICS",
    battleWins: 0,
    battleLosses: 0,
    vimanaSamples: 0,
    vimanaCellsExplored: 0,
    vimanaAnomaliesResolved: 0,
    vimanaTotalCells: 0,
    minigamesCompleted: 0,
    uniqueGamesCompleted: [],
    achievementIds: [],
    discoveredIds: [],
    ...overrides,
  };
}

describe("highestStage", () => {
  it("ratchets forward and never backward", () => {
    expect(highestStage("GENETICS", "QUANTUM")).toBe("QUANTUM");
    expect(highestStage("SPECIATION", "NEURO")).toBe("SPECIATION");
  });
});

describe("applyObservation", () => {
  it("ratchets counters up and never down", () => {
    let progress = createDefaultProgress();
    progress = applyObservation(progress, makeObservation({ battleWins: 10, vimanaSamples: 40 }));
    expect(progress.battle.wins).toBe(10);
    expect(progress.vimana.samplesCollected).toBe(40);

    // A session reset (live store back to zero) must not erase progress.
    progress = applyObservation(progress, makeObservation({ battleWins: 0, vimanaSamples: 0 }));
    expect(progress.battle.wins).toBe(10);
    expect(progress.vimana.samplesCollected).toBe(40);
  });

  it("tracks highest stage reached even if the current stage moves back", () => {
    let progress = createDefaultProgress();
    progress = applyObservation(progress, makeObservation({ stage: "SPECIATION" }));
    progress = applyObservation(progress, makeObservation({ stage: "NEURO" }));
    expect(progress.evolution.currentStage).toBe("NEURO");
    expect(progress.evolution.highestStageReached).toBe("SPECIATION");
  });

  it("unions achievements and unique games without duplicates", () => {
    let progress = createDefaultProgress();
    progress = applyObservation(
      progress,
      makeObservation({ achievementIds: ["a", "b"], uniqueGamesCompleted: ["memory"] }),
    );
    progress = applyObservation(
      progress,
      makeObservation({ achievementIds: ["b", "c"], uniqueGamesCompleted: ["memory", "rhythm"] }),
    );
    expect(progress.achievements.unlockedIds.sort()).toEqual(["a", "b", "c"]);
    expect(progress.miniGames.uniqueGamesCompleted.sort()).toEqual(["memory", "rhythm"]);
  });

  it("takes the live grid's cell total as authoritative when present", () => {
    let progress = createDefaultProgress();
    progress = applyObservation(progress, makeObservation({ vimanaTotalCells: 24 }));
    expect(progress.vimana.totalCells).toBe(24);
    // An empty observation (state not yet generated) keeps the known total.
    progress = applyObservation(progress, makeObservation({ vimanaTotalCells: 0 }));
    expect(progress.vimana.totalCells).toBe(24);
  });

  it("returns the same object when nothing changed", () => {
    const progress = createDefaultProgress();
    expect(applyObservation(progress, makeObservation())).toBe(progress);
  });
});

describe("observeEnergy (sustained-condition timer)", () => {
  const T0 = 1_000_000;
  const base = { longestHighEnergyDurationMs: 0 };

  it("starts a run when energy first reaches the minimum", () => {
    const next = observeEnergy(base, SUSTAINED_ENERGY_MINIMUM, T0);
    expect(next.highEnergyStartedAt).toBe(T0);
    expect(next.longestHighEnergyDurationMs).toBe(0);
  });

  it("accumulates duration across continuous observations", () => {
    let sustained = observeEnergy(base, 95, T0);
    sustained = observeEnergy(sustained, 95, T0 + 30_000);
    sustained = observeEnergy(sustained, 92, T0 + 60_000);
    expect(sustained.highEnergyStartedAt).toBe(T0);
    expect(sustained.longestHighEnergyDurationMs).toBe(60_000);
  });

  it("a dip below the minimum resets the active run but keeps the best duration", () => {
    let sustained = observeEnergy(base, 95, T0);
    sustained = observeEnergy(sustained, 95, T0 + 45_000);
    sustained = observeEnergy(sustained, 80, T0 + 46_000); // interruption
    expect(sustained.highEnergyStartedAt).toBeUndefined();
    expect(sustained.longestHighEnergyDurationMs).toBe(45_000);

    sustained = observeEnergy(sustained, 95, T0 + 50_000);
    expect(sustained.highEnergyStartedAt).toBe(T0 + 50_000);
    expect(sustained.longestHighEnergyDurationMs).toBe(45_000);
  });

  it("an observation gap (refresh/closure) restarts the run instead of crediting the gap", () => {
    let sustained = observeEnergy(base, 95, T0);
    const afterGap = T0 + SUSTAINED_OBSERVATION_GAP_MS + 60_000;
    sustained = observeEnergy(sustained, 95, afterGap);
    expect(sustained.highEnergyStartedAt).toBe(afterGap);
    expect(sustained.longestHighEnergyDurationMs).toBe(0);
  });

  it("a clock jump backwards restarts the run defensively", () => {
    let sustained = observeEnergy(base, 95, T0);
    sustained = observeEnergy(sustained, 95, T0 - 5_000);
    expect(sustained.highEnergyStartedAt).toBe(T0 - 5_000);
    expect(sustained.longestHighEnergyDurationMs).toBe(0);
  });

  it("a single snapshot above the minimum never awards the full duration", () => {
    const sustained = observeEnergy(base, 100, T0);
    expect(sustained.longestHighEnergyDurationMs).toBe(0);
  });

  it("non-finite energy readings are treated as below the minimum", () => {
    let sustained = observeEnergy(base, 95, T0);
    sustained = observeEnergy(sustained, Number.NaN, T0 + 1_000);
    expect(sustained.highEnergyStartedAt).toBeUndefined();
  });
});

describe("deriveUniqueGamesCompleted", () => {
  it("reads per-game lifetime evidence, not a separate counter", () => {
    const games = deriveUniqueGamesCompleted(
      createDefaultMiniGameProgress({ memoryHighScore: 5, companionWins: 2 }),
    );
    expect(games.sort()).toEqual(["companion", "memory"]);
  });
});

describe("normalizeProgress", () => {
  it("returns defaults for junk input", () => {
    expect(normalizeProgress(null)).toEqual(createDefaultProgress());
    expect(normalizeProgress("corrupted")).toEqual(createDefaultProgress());
  });

  it("clamps malformed values and keeps valid ones", () => {
    const normalized = normalizeProgress({
      battle: { wins: -5, losses: 3, totalBattles: Number.NaN },
      evolution: { currentStage: "NEURO", highestStageReached: "bogus" },
      achievements: { unlockedIds: ["a", 42, "b", "a"] },
    });
    expect(normalized.battle.wins).toBe(0);
    expect(normalized.battle.losses).toBe(3);
    expect(normalized.battle.totalBattles).toBe(0);
    expect(normalized.evolution.currentStage).toBe("NEURO");
    // highestStageReached can never be below the current stage.
    expect(normalized.evolution.highestStageReached).toBe("NEURO");
    expect(normalized.achievements.unlockedIds).toEqual(["a", "b"]);
  });
});
