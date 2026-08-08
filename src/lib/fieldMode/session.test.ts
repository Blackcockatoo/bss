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
      motion: "reduced",
      contrast: "high",
      text: "large",
    });
    expect(config).toEqual({
      yearBand: "years-5-6",
      durationMinutes: 20,
      deliveryMode: "pairs",
      supportMode: "low-sensory",
      soundEnabled: true,
      reducedMotion: true,
      highContrast: true,
      largeText: true,
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
    expect(path).toContain("minutes=15");
    expect(path).not.toContain("/teachers");
  });

  it("maps the 10-minute choice to demo timing", () => {
    expect(
      fieldTimingMode({ ...DEFAULT_FIELD_SESSION, durationMinutes: 10 }),
    ).toBe("demo");
  });
});
