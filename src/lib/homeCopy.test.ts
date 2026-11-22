import { describe, expect, it } from "vitest";

import { APP_COPY } from "@/lib/appCopy";
import { CHILD_SAFE_ROUTE_POLICIES } from "@/lib/childSafeBaseline";
import { ARCADE_GAMES } from "@/lib/games/arcade";
import { HOME_COPY, HOME_LOCALES, HOME_PATHS } from "@/lib/homeCopy";
import { homeMetadata } from "@/lib/homeMetadata";

const keysDeep = (value: unknown, prefix = ""): string[] =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value).flatMap(([key, child]) => keysDeep(child, `${prefix}${key}.`))
    : [prefix];

describe("MetaPet home translations", () => {
  it("translates every product card and every arcade tagline", () => {
    for (const locale of ["ja", "hi"] as const) {
      expect(HOME_COPY[locale].areas).toHaveLength(HOME_COPY.en.areas.length);
      for (const game of ARCADE_GAMES) {
        expect(HOME_COPY[locale].gameTaglines[game.id], `${locale} ${game.id}`).toBeTruthy();
      }
    }
  });

  it("keeps the in-app copy key-for-key with English", () => {
    const en = keysDeep(APP_COPY.en).sort();
    expect(keysDeep(APP_COPY.ja).sort()).toEqual(en);
    expect(keysDeep(APP_COPY.hi).sort()).toEqual(en);
  });

  it("publishes hreflang alternates for every language", () => {
    for (const locale of HOME_LOCALES) {
      const meta = homeMetadata(locale);
      expect(meta.alternates?.canonical).toBe(HOME_PATHS[locale]);
      expect(meta.alternates?.languages).toMatchObject({ en: "/", ja: "/ja", hi: "/hi", "x-default": "/" });
    }
  });

  it("approves the localized homes in the core child-safe policy only", () => {
    expect(CHILD_SAFE_ROUTE_POLICIES.core.allowedExact.has("/ja")).toBe(true);
    expect(CHILD_SAFE_ROUTE_POLICIES.core.allowedExact.has("/hi")).toBe(true);
    expect(CHILD_SAFE_ROUTE_POLICIES.schools.allowedExact.has("/ja")).toBe(false);
    expect(CHILD_SAFE_ROUTE_POLICIES.field.allowedExact.has("/ja")).toBe(false);
  });
});
