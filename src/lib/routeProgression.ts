import type { OnboardingScope } from "@/lib/onboarding";

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

export const ROUTE_PROGRESSION_SEQUENCE: RouteProgressionKey[] = [
  "pet",
  "school",
  "identity",
  "dna",
];

export const ROUTE_PROGRESSION: Record<
  RouteProgressionKey,
  RouteProgressionStep
> = {
  pet: {
    key: "pet",
    step: 1,
    href: "/pet",
    tutorialScope: "pet",
    shortLabel: "Pet",
    title: "Care builds the bond",
    role: "This is the daily care layer: mood, comfort, trust, and presence.",
    summary:
      "Start here to care for the companion directly before climbing into pattern learning and identity layers.",
    entryCta: {
      href: "/pet",
      label: "Meet your companion",
      description:
        "Start with the pet so the rest of the ladder has an emotional anchor.",
    },
    next: {
      href: "/school-game",
      title: "Next layer: School",
      label: "Open School Quest",
      description:
        "Turn the bond into pattern learning, observation, and short reflection loops.",
    },
  },
  school: {
    key: "school",
    step: 2,
    href: "/school-game",
    tutorialScope: "school",
    shortLabel: "School",
    title: "Pattern learning earns the deeper view",
    role: "This is the pattern layer: shared reasoning, recognition, and calm classroom progression.",
    summary:
      "Students move from caring for the companion to noticing how its patterns behave and what they mean.",
    entryCta: {
      href: "/school-game",
      label: "Launch the classroom quest",
      description:
        "Use the bonded pet and lesson queue to turn care into a guided learning loop.",
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
    shortLabel: "Identity",
    title: "Ownership stays local-first",
    role: "This is the ownership layer: the person controls profile data, storage, and sharing boundaries.",
    summary:
      "Identity explains who controls the companion record before the DNA route reveals the hidden system underneath it.",
    entryCta: {
      href: "/identity",
      label: "Save the local owner profile",
      description:
        "Lock in a local identity so the DNA route has a clear owner and next step.",
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
    shortLabel: "DNA",
    title: "The hidden engine is now visible",
    role: "This is the decoded system layer: the structures, signal ownership, and resonant patterns behind the companion.",
    summary:
      "The DNA route turns the earlier promise into a visible mechanism instead of a loading ritual or a delayed explanation.",
    entryCta: {
      href: "/digital-dna",
      label: "Decode the genome engine",
      description:
        "Start with the guided journey, then branch into the helix, sound, and shape instruments.",
    },
    advanced: {
      href: "/app/moss60",
      title: "Beyond DNA: MOSS60",
      label: "Enter the Advanced Studio",
      description:
        "Carry the decoded genome into the proof-first studio for glyphs, network views, and security-oriented exports.",
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
