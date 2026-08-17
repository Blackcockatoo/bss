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

/**
 * A second, separately deployed build of the same game.
 *
 * Some games exist twice: the copy committed to `public/` in this repo, and a
 * newer engine deployed on its own host. Modelling that explicitly beats
 * silently replacing the committed build, which would drop the touch hardening
 * and behaviour the smoke tests pin, and beats hiding the newer engine.
 */
export interface ArcadeAltBuild {
  label: string;
  href: string;
  /** Off-origin builds need `target`/`rel` handling and are never crawled as ours. */
  external: boolean;
  note: string;
}

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
  /**
   * True when `href` is another origin. External games open in a new tab with
   * noopener handling, are never claimed in our sitemap, and sit outside the
   * child-safe routing boundary this app enforces — the proxy cannot guard a
   * host it does not serve.
   */
  external: boolean;
  surface: ArcadeGameSurface;
  status: ArcadeGameStatus;
  /** How you play it, in the player's words. */
  controls: string;
  tags: readonly string[];
  altBuild?: ArcadeAltBuild;
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
    external: false,
    surface: "standalone",
    status: "live",
    controls: "Hold ◀ ▶ to move, hold 🍌 to fire. Arrow keys and space on desktop.",
    tags: ["Arcade shooter", "Boss levels", "Touch ready", "Local high scores"],
    altBuild: {
      label: "Enhanced build",
      href: "https://monkey-invaders-enhanced.vercel.app/",
      external: true,
      note: "A rebuilt engine on its own deployment. Opens in a new tab and keeps its own high scores.",
    },
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
    tagline: "A lost gothic arcade game",
    description:
      "Trap what is chasing you inside a bubble, then burst it. A single-player platformer of chambers, maps and chronicles, with a Ritual State display mode and multi-touch controls for landscape play.",
    href: "https://bubblehex.vercel.app/",
    external: true,
    surface: "standalone",
    status: "live",
    controls:
      "A/D or ◀ ▶ to move, Space/C to jump, X/Z to bubble. Enter starts, P pauses, M opens the chamber map.",
    tags: ["Platformer", "Bubble trapping", "Multi-touch ready", "Chamber map"],
    theme: {
      emoji: "\u{1FAE7}",
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
    external: false,
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
 * blocklist in `robots.ts`.
 *
 * Excluded: query-string surfaces and unbuilt games, which are not their own
 * indexable documents, and externally hosted games, which are somebody else's
 * origin — listing those in our sitemap would claim pages this app does not
 * serve, and blocking them in our robots.txt would do nothing.
 */
export function getArcadeCrawlRoutes(): readonly string[] {
  const routes = ARCADE_GAMES.flatMap((game) =>
    game.href && game.surface === "standalone" && !game.external
      ? [game.href]
      : [],
  );

  return [ARCADE_ROUTE, ...routes];
}

/**
 * Games served from another origin.
 *
 * Worth being able to enumerate: the child-safe proxy in `src/proxy.ts` only
 * governs requests this app handles, so an externally hosted game is outside
 * that boundary no matter what the registry says. Anything that needs to hold
 * the line for a classroom surface must treat these as unreachable rather than
 * merely blocked.
 */
export function getExternallyHostedGames(): readonly ArcadeGame[] {
  return ARCADE_GAMES.filter((game) => game.external);
}
