import { describe, expect, it } from "vitest";

import {
  DEMO_PET_CONFIG,
  LESSON_EMOTION_PRESETS,
  LESSON_GENES,
  applyEmotionPreset,
  buildDnaStrip,
  cloneLessonPetConfig,
  getEmotionPreset,
  getLessonGene,
  nudgeTowardCalm,
} from "./lessonPet";

describe("lesson pet helpers", () => {
  it("clones configs without sharing references", () => {
    const clone = cloneLessonPetConfig(DEMO_PET_CONFIG);
    clone.alias = "Changed";
    expect(DEMO_PET_CONFIG.alias).not.toBe("Changed");
  });

  it("every gene mutation produces a visible change", () => {
    for (const gene of LESSON_GENES) {
      const before = cloneLessonPetConfig(DEMO_PET_CONFIG);
      const after = gene.mutate(before);
      expect(JSON.stringify(after)).not.toBe(JSON.stringify(before));
    }
  });

  it("looks up genes by id", () => {
    expect(getLessonGene("gene-pattern")?.label).toBe("Pattern gene");
    expect(getLessonGene("nope")).toBeUndefined();
  });

  it("builds a deterministic DNA strip with one highlight", () => {
    const a = buildDnaStrip("seed-x", 12, 4);
    const b = buildDnaStrip("seed-x", 12, 4);
    expect(a).toEqual(b);
    expect(a).toHaveLength(12);
    expect(a.filter((c) => c.highlighted)).toHaveLength(1);
    expect(a[4].highlighted).toBe(true);
  });

  it("applies emotion presets over a base config", () => {
    const worried = applyEmotionPreset(DEMO_PET_CONFIG, "worried");
    expect(worried.expression).toBe(getEmotionPreset("worried")?.config.expression);
    // Unknown preset returns a copy unchanged.
    const unchanged = applyEmotionPreset(DEMO_PET_CONFIG, "nope");
    expect(unchanged.expression).toBe(DEMO_PET_CONFIG.expression);
  });

  it("nudges toward calm within valid bounds", () => {
    const excited = applyEmotionPreset(DEMO_PET_CONFIG, "excited");
    const calmer = nudgeTowardCalm(excited);
    expect(calmer.expression).toBe("calm");
    expect(calmer.breathing).toBeGreaterThanOrEqual(0);
    expect(calmer.breathing).toBeLessThanOrEqual(1);
    expect(calmer.brightness).toBeLessThanOrEqual(1);
  });

  it("exposes five emotion presets each with clues", () => {
    expect(LESSON_EMOTION_PRESETS).toHaveLength(5);
    for (const preset of LESSON_EMOTION_PRESETS) {
      expect(preset.clues.length).toBeGreaterThan(0);
      expect(preset.mayBeFeeling).toContain("may be feeling");
    }
  });
});
