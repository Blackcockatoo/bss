import { describe, expect, it } from "vitest";

import {
  DEFAULT_FIELD_SESSION,
  buildFieldLessonPath,
  fieldPresentationMode,
  fieldTimingMode,
  parseFieldSession,
  sanitizeFieldSession,
} from "@/lib/fieldMode/session";

describe("Field lesson session contract", () => {
  it("parses approved classroom choices", () => {
    const config = parseFieldSession({
      years: "years-5-6",
      minutes: "20",
      delivery: "pairs",
      support: "low-sensory",
      sound: "on",
    });
    expect(config).toEqual({
      yearBand: "years-5-6",
      durationMinutes: 20,
      deliveryMode: "pairs",
      supportMode: "low-sensory",
      soundEnabled: true,
    });
    expect(fieldTimingMode(config)).toBe("standard");
    expect(fieldPresentationMode(config)).toBe("support");
  });

  it("fails safely to the calm default for unapproved values", () => {
    expect(
      sanitizeFieldSession({
        yearBand: "international" as never,
        durationMinutes: 90 as never,
        deliveryMode: "solo-account" as never,
        supportMode: "advanced" as never,
        soundEnabled: false,
      }),
    ).toEqual(DEFAULT_FIELD_SESSION);
  });

  it("builds only a Field lesson route", () => {
    const path = buildFieldLessonPath("build-a-body", DEFAULT_FIELD_SESSION);
    expect(path).toMatch(/^\/schools\/field\/lessons\/build-a-body\?/);
    expect(path).toContain("minutes=20");
    expect(path).not.toContain("/teachers");
  });

  it("maps the 10-minute choice to Quick Spark (demo) timing", () => {
    expect(
      fieldTimingMode({ ...DEFAULT_FIELD_SESSION, durationMinutes: 10 }),
    ).toBe("demo");
  });

  it("maps the 20-minute choice to Core Lesson (standard) timing", () => {
    expect(
      fieldTimingMode({ ...DEFAULT_FIELD_SESSION, durationMinutes: 20 }),
    ).toBe("standard");
  });

  it("maps the 40-minute choice to Deep Dive (extended) timing", () => {
    expect(
      fieldTimingMode({ ...DEFAULT_FIELD_SESSION, durationMinutes: 40 }),
    ).toBe("extended");
  });
});
