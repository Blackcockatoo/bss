import { describe, expect, it } from "vitest";

import {
  ARCADE_GAMES,
  ARCADE_ROUTE,
  getArcadeCrawlRoutes,
  getArcadeGame,
  getPlayableArcadeGames,
} from "./arcade";
import {
  CHILD_SAFE_ROUTE_POLICIES,
  isPathnameAllowedByPolicy,
} from "@/lib/childSafeBaseline";

describe("arcade registry", () => {
  it("gives every game a unique id", () => {
    const ids = ARCADE_GAMES.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only exposes an href for games whose build has landed", () => {
    for (const game of ARCADE_GAMES) {
      if (game.status === "live") {
        expect(game.href, `${game.id} is live but has no route`).toBeTruthy();
      } else {
        expect(
          game.href,
          `${game.id} is not built yet and must not link anywhere`,
        ).toBeNull();
      }
    }
  });

  it("keeps unbuilt games out of the playable list and the crawl routes", () => {
    const playableIds = getPlayableArcadeGames().map((game) => game.id);
    const crawlRoutes = getArcadeCrawlRoutes();

    for (const game of ARCADE_GAMES) {
      if (game.status !== "awaiting-build") continue;

      expect(playableIds).not.toContain(game.id);
      expect(crawlRoutes).not.toContain(`/${game.id}`);
    }
  });

  it("advertises the hub and every standalone build to crawlers", () => {
    const crawlRoutes = getArcadeCrawlRoutes();

    expect(crawlRoutes).toContain(ARCADE_ROUTE);
    expect(crawlRoutes).toContain("/monkey-invaders");

    // Query-string surfaces are not their own documents.
    for (const route of crawlRoutes) {
      expect(route).not.toContain("?");
    }
  });

  /**
   * The load-bearing test. Arcade games are consumer surfaces on
   * bluesnakestudios.com. If one ever becomes reachable under a child-safe
   * policy it would appear on a classroom screen without going through the
   * teacher-led lesson design, so the registry and the policies must stay
   * disjoint.
   */
  it("keeps every arcade route outside the child-safe route policies", () => {
    const policyIds = Object.keys(
      CHILD_SAFE_ROUTE_POLICIES,
    ) as (keyof typeof CHILD_SAFE_ROUTE_POLICIES)[];

    const arcadeRoutes = [
      ARCADE_ROUTE,
      ...ARCADE_GAMES.flatMap((game) =>
        game.href && game.surface === "standalone" ? [game.href] : [],
      ),
    ];

    for (const policyId of policyIds) {
      for (const route of arcadeRoutes) {
        expect(
          isPathnameAllowedByPolicy(route, policyId),
          `${route} must not be allowed by the "${policyId}" policy`,
        ).toBe(false);
      }
    }
  });

  it("looks games up by id", () => {
    expect(getArcadeGame("monkey-invaders")?.title).toBe("Monkey Invaders");
    expect(getArcadeGame("not-a-game")).toBeNull();
  });
});
