import { describe, expect, it } from "vitest";

import {
  MOVEMENT_CLIPS,
  SECRET_MOVE_IDS,
  STAGE_SIGNATURE_CLIPS,
} from "./movementVocabulary";
import {
  blinkIntervalSeconds,
  decideAmbientClip,
  hashSeed,
  isCelebratoryClip,
  seededUnit,
  type SchedulerGates,
} from "./movementScheduler";

const GATES: SchedulerGates = {
  mood: "happy",
  evolutionState: "SPECIATION",
  reduceMotion: false,
  critical: false,
  careActionActive: false,
  equippedAddonCount: 0,
  secretMoveChance: 0.02,
};

function sequence(seed: number, ticks: number, gates: SchedulerGates) {
  return Array.from({ length: ticks }, (_, index) =>
    decideAmbientClip(seed, index + 1, gates),
  );
}

describe("deterministic movement scheduler", () => {
  it("replays the exact same behavioural rhythm for the same pet", () => {
    const seed = hashSeed("ABCD12-EF3456-789ABC");
    expect(sequence(seed, 200, GATES)).toEqual(sequence(seed, 200, GATES));
  });

  it("gives different pets different rhythms", () => {
    const a = sequence(hashSeed("pet-alpha"), 120, GATES);
    const b = sequence(hashSeed("pet-beta"), 120, GATES);
    expect(a).not.toEqual(b);
  });

  it("keeps secret moves genuinely rare at the default chance", () => {
    const picks = sequence(hashSeed("rarity-check"), 2_000, GATES);
    const secrets = picks.filter(
      (pick) => pick !== null && SECRET_MOVE_IDS.includes(pick),
    );
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets.length).toBeLessThan(120);
  });

  it("suppresses celebratory moves in critical states", () => {
    const picks = sequence(hashSeed("crisis"), 600, {
      ...GATES,
      critical: true,
    });
    for (const pick of picks) {
      if (pick) expect(isCelebratoryClip(pick), pick).toBe(false);
    }
  });

  it("stays silent while a care action is reacting", () => {
    const picks = sequence(hashSeed("care"), 100, {
      ...GATES,
      careActionActive: true,
    });
    expect(picks.every((pick) => pick === null)).toBe(true);
  });

  it("only picks reduced-motion-safe clips under reduced motion", () => {
    const picks = sequence(hashSeed("reduced"), 800, {
      ...GATES,
      reduceMotion: true,
      secretMoveChance: 0.4,
    });
    for (const pick of picks) {
      if (pick) expect(MOVEMENT_CLIPS[pick].reducedMotionSafe, pick).toBe(true);
    }
  });

  it("honours mood and evolution gates", () => {
    const picks = sequence(hashSeed("gates"), 1_000, {
      ...GATES,
      mood: "tired",
      evolutionState: "GENETICS",
      secretMoveChance: 0.5,
    });
    for (const pick of picks) {
      if (!pick) continue;
      const clip = MOVEMENT_CLIPS[pick];
      if (clip.allowedMoods) expect(clip.allowedMoods).toContain("tired");
      if (clip.allowedEvolutionStates) {
        expect(clip.allowedEvolutionStates).toContain("GENETICS");
      }
    }
  });

  it("makes an evolved pet idle differently from a hatchling", () => {
    const seed = hashSeed("stage-signature");
    const genetics = new Set(
      sequence(seed, 400, { ...GATES, evolutionState: "GENETICS" }).filter(
        (pick): pick is string => pick !== null,
      ),
    );
    const apex = new Set(
      sequence(seed, 400, { ...GATES, evolutionState: "SPECIATION" }).filter(
        (pick): pick is string => pick !== null,
      ),
    );

    expect(genetics.has("genesis_shimmer")).toBe(true);
    expect(genetics.has("crown_ascend")).toBe(false);
    expect(genetics.has("phase_drift")).toBe(false);

    expect(apex.has("genesis_shimmer")).toBe(false);
    expect(
      apex.has("crown_ascend") ||
        apex.has("phase_drift") ||
        apex.has("neuro_lattice_ripple"),
    ).toBe(true);
  });

  it("keeps stage signatures at full rate under reduced motion", () => {
    // Two of the apex's three signature moves are not reduced-motion-safe.
    // Picking one blindly and giving up when it is rejected cut the stage's
    // ambient character to roughly a third for those players; the pick must
    // walk on to a safe option instead. Asserting the RATE (not mere
    // presence) is what makes this test able to fail — the safe option still
    // shows up occasionally either way.
    const countSignatures = (gates: SchedulerGates) =>
      sequence(hashSeed("reduced-signature"), 2_000, gates).filter(
        (pick) =>
          pick !== null &&
          STAGE_SIGNATURE_CLIPS[gates.evolutionState].includes(pick),
      ).length;

    const apex = { ...GATES, evolutionState: "SPECIATION" as const };
    const fullMotion = countSignatures(apex);
    const reduced = countSignatures({ ...apex, reduceMotion: true });

    expect(fullMotion).toBeGreaterThan(0);
    expect(reduced).toBeGreaterThan(fullMotion * 0.7);

    // ...and every one of them is still a safe clip.
    for (const pick of sequence(hashSeed("reduced-signature"), 2_000, {
      ...apex,
      reduceMotion: true,
    })) {
      if (pick) expect(MOVEMENT_CLIPS[pick].reducedMotionSafe, pick).toBe(true);
    }
  });

  it("produces uniform-ish seeded units with no shared-state drift", () => {
    const first = seededUnit(42, 7, 3);
    expect(seededUnit(42, 7, 3)).toBe(first);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(1);
  });

  it("derives deterministic, bounded blink cadence", () => {
    for (let index = 0; index < 50; index += 1) {
      const interval = blinkIntervalSeconds(hashSeed("blinky"), index, 0.5);
      expect(interval).toBe(blinkIntervalSeconds(hashSeed("blinky"), index, 0.5));
      expect(interval).toBeGreaterThan(1);
      expect(interval).toBeLessThan(7);
    }
  });
});
