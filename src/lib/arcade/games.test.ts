import { describe, expect, it } from "vitest";

import {
  ARCADE_GAMES,
  ARCADE_GAME_ROUTES,
  ARCADE_ROUTE,
  BUBBLE_HEX_ROUTE,
  MONKEY_INVADERS_ROUTE,
  getArcadeGame,
  getArcadeGameByRoute,
  getArcadeGameHref,
  isExternalArcadeGame,
} from "@/lib/arcade/games";
import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";

describe("arcade registry", () => {
  it("lists both cabinets on their published routes", () => {
    expect(ARCADE_GAME_ROUTES).toEqual([
      MONKEY_INVADERS_ROUTE,
      BUBBLE_HEX_ROUTE,
    ]);
  });

  it("keeps ids, routes and titles unique", () => {
    expect(new Set(ARCADE_GAMES.map((game) => game.id)).size).toBe(
      ARCADE_GAMES.length,
    );
    expect(new Set(ARCADE_GAMES.map((game) => game.route)).size).toBe(
      ARCADE_GAMES.length,
    );
    expect(new Set(ARCADE_GAMES.map((game) => game.title)).size).toBe(
      ARCADE_GAMES.length,
    );
  });

  it("serves Monkey Invaders from the build vendored into public/", () => {
    const game = getArcadeGame("monkey-invaders");

    expect(isExternalArcadeGame(game)).toBe(false);
    expect(getArcadeGameHref(game)).toBe("/monkey-invaders.html");
  });

  it("hands Bubble Hex off to its own deployment", () => {
    const game = getArcadeGame("bubble-hex");

    expect(isExternalArcadeGame(game)).toBe(true);
    expect(getArcadeGameHref(game)).toMatch(/^https:\/\//);
  });

  it("resolves games by route and returns null for anything else", () => {
    expect(getArcadeGameByRoute(BUBBLE_HEX_ROUTE)?.id).toBe("bubble-hex");
    expect(getArcadeGameByRoute(MONKEY_INVADERS_ROUTE)?.id).toBe(
      "monkey-invaders",
    );
    expect(getArcadeGameByRoute("/pet")).toBeNull();
  });

  it("throws on an unknown game id rather than returning a partial record", () => {
    // @ts-expect-error - guarding the runtime path for an unregistered id.
    expect(() => getArcadeGame("space-jewbles")).toThrow(/Unknown arcade game/);
  });

  it("never points a vendored build at an off-site URL", () => {
    for (const game of ARCADE_GAMES) {
      const href = getArcadeGameHref(game);

      if (game.target.kind === "vendored") {
        expect(href.startsWith("/"), game.id).toBe(true);
      } else {
        expect(href.startsWith("https://"), game.id).toBe(true);
      }
    }
  });
});

describe("arcade routes stay off the child-safe surfaces", () => {
  it("blocks every arcade route on the schools and field policies", () => {
    for (const pathname of [...ARCADE_GAME_ROUTES, ARCADE_ROUTE]) {
      expect(isPathnameAllowedByPolicy(pathname, "schools"), pathname).toBe(
        false,
      );
      expect(isPathnameAllowedByPolicy(pathname, "field"), pathname).toBe(
        false,
      );
    }
  });

  it("also keeps them out of the core child-safe baseline", () => {
    for (const pathname of [...ARCADE_GAME_ROUTES, ARCADE_ROUTE]) {
      expect(isPathnameAllowedByPolicy(pathname, "core"), pathname).toBe(false);
    }
  });
});
