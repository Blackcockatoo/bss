import { describe, expect, it } from "vitest";

import {
  formatTeacherFeedbackExport,
  parseTeacherFeedbackList,
  sanitizeTeacherFeedback,
} from "./teacherFeedback";

describe("private teacher feedback", () => {
  it("keeps only teacher ratings and notes, not student fields", () => {
    const saved = sanitizeTeacherFeedback({
      id: "1",
      lessonId: "meet-the-system",
      rating: "worked-well",
      note: "  The script was clear. ",
      recordedAt: 1,
      studentName: "should not survive",
    });
    expect(saved).toMatchObject({
      lessonId: "meet-the-system",
      rating: "worked-well",
      note: "The script was clear.",
    });
    expect(JSON.stringify(saved)).not.toMatch(/studentName/);
    expect(sanitizeTeacherFeedback({ id: "2", rating: "fine" })).toBeNull();
    expect(parseTeacherFeedbackList("not-json")).toEqual([]);
  });

  it("exports a device-only text summary", () => {
    const text = formatTeacherFeedbackExport([
      {
        id: "1",
        lessonId: "meet-the-system",
        rating: "mixed",
        note: "Need a longer pause after the script.",
        recordedAt: Date.parse("2026-11-19T10:00:00+11:00"),
      },
    ]);
    expect(text).toContain("this device only");
    expect(text).toContain("Lesson 1: Meet the System");
    expect(text).toContain("Mixed");
    expect(text).toContain("Need a longer pause after the script.");
    expect(text).not.toMatch(/Sarah|student@|phone number/i);
  });
});
