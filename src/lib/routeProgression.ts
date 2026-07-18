import type { OnboardingScope } from "@/lib/onboarding";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export type RouteProgressionKey = "pet" | "school" | "identity" | "dna";

type RouteStepLink = {
  href: string;
  title: string;
  label: string;
  description: string;
};

type RouteEntryCta = {
  href: string;
  label: string;
  description: string;
};

export type RouteProgressionStep = {
  key: RouteProgressionKey;
  step: number;
  href: string;
  tutorialScope: OnboardingScope;
  shortLabel: string;
  title: string;
  role: string;
  summary: string;
  entryCta: RouteEntryCta;
  next?: RouteStepLink;
  advanced?: RouteStepLink;
};

export const ROUTE_PROGRESSION_SEQUENCE: RouteProgressionKey[] = IS_SCHOOLS_PROFILE
  ? ["school"]
  : ["pet", "school", "identity", "dna"];

export const ROUTE_PROGRESSION: Record<
  RouteProgressionKey,
  RouteProgressionStep
> = {
  pet: {
    key: "pet",
    step: 1,
    href: "/pet",
    tutorialScope: "pet",
    shortLabel: "Try Demo",
    title: "Try the companion first",
    role: "This is the safe demo layer: meet the companion, care for it, and see the learning loop without needing an account.",
    summary:
      "Start here to try Meta-Pet on this device before reviewing the school pilot pack.",
    entryCta: {
      href: "/pet",
      label: "Try the pet demo",
      description:
        "Open the companion demo in the browser. No account, no ad tracking, and local-first storage.",
    },
    next: {
      href: "/schools",
      title: "Next layer: School pilot",
      label: "Review School Pilot Pack",
      description:
        "See the classroom fit, privacy summary, parent note, safeguarding material, and pilot pathway.",
    },
  },
  school: {
    key: "school",
    step: 2,
    href: "/school-game",
    tutorialScope: "school",
    shortLabel: "School Pilot",
    title: "Teacher-led classroom path",
    role: "This is the school layer: short guided sessions, alias-only classroom use, and clear adult review materials.",
    summary:
      "Teachers and school leaders can review safety, lessons, governance, and pilot readiness before trying it with students.",
    entryCta: {
      href: "/schools",
      label: "Review school pilot pack",
      description:
        "Understand what it is, why it is safe, how to try it, and how to ask about a pilot.",
    },
    next: {
      href: "/identity",
      title: "Next layer: Identity",
      label: "Open Identity Vault",
      description:
        "Translate pattern learning into local-first ownership, profile control, and consent-aware identity.",
    },
  },
  identity: {
    key: "identity",
    step: 3,
    href: "/identity",
    tutorialScope: "identity",
    shortLabel: "Privacy",
    title: "Ownership stays local-first",
    role: "This is the privacy layer: adults can see how profile data, storage, and sharing boundaries are controlled locally.",
    summary:
      "Identity explains who controls the companion record before the DNA route reveals the hidden system underneath it.",
    entryCta: {
      href: "/identity",
      label: "Review local identity controls",
      description:
        "See how local storage, device ownership, export, and deletion are meant to work.",
    },
    next: {
      href: "/digital-dna",
      title: "Next layer: DNA",
      label: "Reveal the DNA Engine",
      description:
        "See the hidden genome system that drives traits, rhythm, and structural behavior across the companion.",
    },
    advanced: {
      href: "/app/moss60",
      title: "Advanced studio: MOSS60",
      label: "Open MOSS60 Studio",
      description:
        "Go deeper into proof layers, glyph exports, geometry projections, and security braids after the main ladder.",
    },
  },
  dna: {
    key: "dna",
    step: 4,
    href: "/digital-dna",
    tutorialScope: "dna",
    shortLabel: "DNA Play Lab",
    title: "Your pet's secret pattern is ready",
    role: "Discover how your pet's number recipe becomes colours, shapes, and musical notes.",
    summary:
      "Spot the brightest numbers, then use the same pattern to draw pictures and make music.",
    entryCta: {
      href: "/digital-dna",
      label: "Explore the DNA pattern",
      description:
        "Start with an easy tour, then try the spinning helix, music, and shape games.",
    },
    advanced: {
      href: "/app/moss60",
      title: "Ready for a bigger challenge?",
      label: "Try the Advanced Studio",
      description:
        "Explore extra shapes, maps, and pattern tools when you want to go deeper.",
    },
  },
};

export function getRouteProgression(
  key: RouteProgressionKey,
): RouteProgressionStep {
  return ROUTE_PROGRESSION[key];
}

export function getRouteProgressionKeyByPathname(pathname: string) {
  const match = ROUTE_PROGRESSION_SEQUENCE.find(
    (routeKey) => ROUTE_PROGRESSION[routeKey].href === pathname,
  );

  return match ?? null;
}
