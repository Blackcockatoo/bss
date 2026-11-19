import { describe, expect, it } from "vitest";

import { SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY } from "@/lib/schools/storage";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import {
  clearRolloutPlan,
  emptyRolloutPlan,
  parseRolloutPlan,
  sanitizeRolloutPlan,
  saveRolloutPlan,
} from "./rolloutPlan";

describe("rollout plan", () => {
  it("starts with a row for every lesson and ignores unknown data", () => {
    const plan = emptyRolloutPlan();
    expect(plan.lessons.map((row) => row.lessonId)).toEqual(
      LESSON_DEFINITIONS.map((lesson) => lesson.id),
    );
    const cleaned = sanitizeRolloutPlan({
      schoolName: "  North Primary  ",
      yearLevels: "Years 3–4",
      extra: "drop this",
      lessons: [
        { lessonId: "meet-the-system", when: "Week 2", classes: "3A", lead: "A. Lee" },
      ],
    });
    expect(cleaned.schoolName).toBe("North Primary");
    expect(cleaned.lessons[0]?.when).toBe("Week 2");
    expect(cleaned.lessons).toHaveLength(7);
    expect(parseRolloutPlan("not-json").schoolName).toBe("");
  });

  it("writes only to the local rollout key", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    } as unknown as Storage;
    const plan = emptyRolloutPlan();
    plan.term = "Term 1";
    saveRolloutPlan(plan, storage);
    expect(store.has(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY)).toBe(true);
    expect(parseRolloutPlan(store.get(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY) ?? null).term).toBe(
      "Term 1",
    );
    clearRolloutPlan(storage);
    expect(store.has(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY)).toBe(false);
  });
});
