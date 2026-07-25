/**
 * The arcade registry.
 *
 * Blue Snake Studios ships more than one standalone game, and each one lives
 * in its own repository with its own deployment. This module is the single
 * place that records where each playable build actually is, so route guards,
 * the arcade hub and the sitemap can never drift apart.
 *
 * Arcade titles are deliberately *not* part of the child-safe route policy in
 * `childSafeBaseline.ts`. They stay off MetaPet.school; see the policy tests.
 */

export type ArcadeGameId = "monkey-invaders" | "bubble-hex";

/**
 * Where the playable build lives.
 *
 * `vendored` builds are checked into `public/` and served by this app.
 * `external` builds are deployed from their own repository, so we hand the
 * player off rather than trying to keep a copy in sync.
 */
export type ArcadeGameTarget =
  | { kind: "vendored"; path: string }
  | { kind: "external"; url: string };

export interface ArcadeGame {
  id: ArcadeGameId;
  title: string;
  tagline: string;
  /** The route on this site that opens the game. */
  route: string;
  target: ArcadeGameTarget;
  emoji: string;
  /** Gradient pair used by the arcade hub cards. */
  tone: string;
  /** Short plain-language control summary shown on the hub. */
  controls: string;
}

export const ARCADE_ROUTE = "/arcade";
export const MONKEY_INVADERS_ROUTE = "/monkey-invaders";
export const BUBBLE_HEX_ROUTE = "/bubblehex";

const DEFAULT_BUBBLE_HEX_URL = "https://bubblehex.vercel.app";

function readBubbleHexUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BUBBLE_HEX_URL;
  if (typeof configured !== "string") {
    return DEFAULT_BUBBLE_HEX_URL;
  }

  const trimmed = configured.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : DEFAULT_BUBBLE_HEX_URL;
}

export const ARCADE_GAMES: readonly ArcadeGame[] = [
  {
    id: "monkey-invaders",
    title: "Monkey Invaders",
    tagline:
      "Hold the line against descending invaders, then break the boss waves.",
    route: MONKEY_INVADERS_ROUTE,
    target: { kind: "vendored", path: "/monkey-invaders.html" },
    emoji: "\u{1F680}",
    tone: "from-orange-400/25 to-rose-500/10",
    controls: "Move with ◀ / ▶, fire with the banana. Touch friendly.",
  },
  {
    id: "bubble-hex",
    title: "Bubble Hex",
    tagline:
      "Trap enemies in bubbles, chain-pop for multipliers, and clear twelve gothic neon chambers.",
    route: BUBBLE_HEX_ROUTE,
    target: { kind: "external", url: readBubbleHexUrl() },
    emoji: "\u{1FAE7}",
    tone: "from-violet-400/25 to-fuchsia-500/10",
    controls: "Move with A / D, jump with Space, blow a bubble with X.",
  },
] as const;

export const ARCADE_GAME_ROUTES: readonly string[] = ARCADE_GAMES.map(
  (game) => game.route,
);

export function getArcadeGame(id: ArcadeGameId): ArcadeGame {
  const game = ARCADE_GAMES.find((candidate) => candidate.id === id);

  if (!game) {
    throw new Error(`Unknown arcade game: ${id}`);
  }

  return game;
}

export function getArcadeGameByRoute(route: string): ArcadeGame | null {
  return ARCADE_GAMES.find((candidate) => candidate.route === route) ?? null;
}

/** The URL a route handler should send the player to. */
export function getArcadeGameHref(game: ArcadeGame): string {
  return game.target.kind === "vendored" ? game.target.path : game.target.url;
}

/** External builds open in a new tab from the hub; vendored ones do not. */
export function isExternalArcadeGame(game: ArcadeGame): boolean {
  return game.target.kind === "external";
}
