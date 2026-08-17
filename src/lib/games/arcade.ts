/**
 * Single source of truth for the Blue Snake Studios arcade.
 *
 * Before this registry existed, each standalone game was wired up by hand in a
 * different place: `monkey-invaders` was reachable only from one spoke of the
 * SteeringWheel, it was listed in `sitemap.ts` and `robots.ts` from separate
 * literals, and the portal did not mention the arcade at all. Adding a game
 * meant editing four unrelated files and remembering the child-safe rules.
 *
 * Everything that needs to know "which arcade games exist" now reads this list.
 *
 * SAFETY CONTRACT: no route in this registry may appear in a child-safe route
 * policy (`src/lib/childSafeBaseline.ts`). These are consumer arcade surfaces
 * on bluesnakestudios.com. The classroom product (MetaPet.school / Field Mode)
 * uses the curated `MiniGamesPanel` tracks instead, which carry evolution
 * scaling, mastery stars and teacher-visible progression. `arcade.test.ts`
 * enforces that separation so a future game cannot leak into a classroom
 * screen by being added here.
 */

export type ArcadeGameStatus =
  /** The build is committed and the route resolves. */
  | "live"
  /** Registered and designed for, but the build has not landed in the repo. */
  | "awaiting-build";

export type ArcadeGameSurface =
  /** Standalone full-screen canvas game served from `public/`. */
  | "standalone"
  /** Rendered inside the in-app mini-game panel with rank + mastery scaling. */
  | "panel";

export interface ArcadeGame {
  id: string;
  title: string;
  /** Short hook shown on cards. One line, no trailing period. */
  tagline: string;
  description: string;
  /**
   * Where the game opens. `null` while `status` is `awaiting-build`, so the
   * arcade renders an honest placeholder instead of a dead link.
   */
  href: string | null;
  surface: ArcadeGameSurface;
  status: ArcadeGameStatus;
  /** How you play it, in the player's words. */
  controls: string;
  tags: readonly string[];
  /** Static Tailwind classes — these must not be built by interpolation. */
  theme: {
    emoji: string;
    border: string;
    glow: string;
    text: string;
  };
}

export const ARCADE_GAMES: readonly ArcadeGame[] = [
  {
    id: "monkey-invaders",
    title: "Monkey Invaders",
    tagline: "Banana-powered space nonsense",
    description:
      "The full-screen B$S arcade shooter. Waves, difficulty modes, boss levels, local high scores, and touch controls built for a phone held sideways.",
    href: "/monkey-invaders",
    surface: "standalone",
    status: "live",
    controls: "Hold ◀ ▶ to move, hold 🍌 to fire. Arrow keys and space on desktop.",
    tags: ["Arcade shooter", "Boss levels", "Touch ready", "Local high scores"],
    theme: {
      emoji: "\u{1F680}",
      border: "border-orange-400/25",
      glow: "from-orange-400/20 via-rose-500/10 to-transparent",
      text: "text-orange-200",
    },
  },
  {
    id: "bubblehex",
    title: "Bubble Hex",
    tagline: "Hex-grid bubble matching",
    description:
      "Colour-matching on a hexagonal grid. Registered in the arcade so the portal, sitemap and crawl rules are already correct — the playable build has not been committed to this repo yet.",
    href: null,
    surface: "standalone",
    status: "awaiting-build",
    controls: "Aim and shoot to match three or more.",
    tags: ["Puzzle", "Hex grid", "Colour matching"],
    theme: {
      emoji: "\u{1F52E}",
      border: "border-fuchsia-400/25",
      glow: "from-fuchsia-400/20 via-violet-500/10 to-transparent",
      text: "text-fuchsia-200",
    },
  },
  {
    id: "mini-game-tracks",
    title: "Mini-Game Tracks",
    tagline: "Memory, Rhythm, Sigil and Vimana",
    description:
      "The four progression-linked games. Difficulty scales with your companion's evolution stage, and results feed rank unlocks and mastery stars back into the pet.",
    href: "/app/activities?tab=games",
    surface: "panel",
    status: "live",
    controls: "Tap, tempo and sequence play. Ranks unlock as you clear them.",
    tags: ["Progression linked", "Ranks", "Mastery stars"],
    theme: {
      emoji: "\u{1F3AE}",
      border: "border-cyan-400/25",
      glow: "from-cyan-400/20 via-sky-500/10 to-transparent",
      text: "text-cyan-200",
    },
  },
] as const;

export const ARCADE_ROUTE = "/arcade";

export function getArcadeGame(id: string): ArcadeGame | null {
  return ARCADE_GAMES.find((game) => game.id === id) ?? null;
}

export function getPlayableArcadeGames(): readonly ArcadeGame[] {
  return ARCADE_GAMES.filter(
    (game): game is ArcadeGame & { href: string } =>
      game.status === "live" && game.href !== null,
  );
}

/**
 * Routes the arcade owns, for `sitemap.ts` and the metapet.school crawl
 * blocklist in `robots.ts`. Query-string surfaces and unbuilt games are
 * excluded: they are not their own indexable documents.
 */
export function getArcadeCrawlRoutes(): readonly string[] {
  const routes = ARCADE_GAMES.flatMap((game) =>
    game.href && game.surface === "standalone" ? [game.href] : [],
  );

  return [ARCADE_ROUTE, ...routes];
}
