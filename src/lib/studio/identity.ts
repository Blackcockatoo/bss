/**
 * Who Blue $nake Studios is, in one place.
 *
 * The portal, the studio page and the metadata all pulled their own slightly
 * different version of the studio story out of inline JSX. This is the single
 * copy deck for studio-level identity: what B$S builds, why MetaPet School is
 * free, and who the studio sponsors.
 *
 * SAFETY CONTRACT: everything in this file is consumer-side copy for
 * bluesnakestudios.com. `/studio` is deliberately absent from every child-safe
 * route policy, and the roster below links to independent artist sites whose
 * content the studio does not control. None of it may surface on a classroom
 * screen. `identity.test.ts` enforces that.
 */

export const STUDIO_NAME = "Blue $nake Studios";
export const STUDIO_SHORT_NAME = "B$S";
export const STUDIO_HOME = "https://blkck2.com";
export const STUDIO_HANDLE = "@blkck2";

export const STUDIO_TAGLINE =
  "One studio, building living systems and the games that live inside them.";

export const STUDIO_STATEMENT = [
  "Blue $nake Studios makes software that behaves like something rather than something that just displays. A MetaPet is not a picture of a pet — it is a genome, a set of vitals, an evolution stage and a history, and every surface in the product is a different way of reading the same underlying record.",
  "The studio ships two products from one codebase. The full creative system lives here, unrestricted. The classroom edition lives at MetaPet.school with its own boundary, its own governance pack and none of the consumer surface area. Shared engineering underneath, deliberately separated above.",
  "Alongside that sits the arcade — smaller, louder, self-contained games that exist because they are fun, not because they demo a feature.",
] as const;

export interface StudioPillar {
  title: string;
  description: string;
  href: string;
}

export const STUDIO_PILLARS: readonly StudioPillar[] = [
  {
    title: "The living system",
    description:
      "MetaPet: a persistent companion driven by a real genome, with vitals, evolution stages, inherited bodies and a save that every other surface reads from.",
    href: "/pet",
  },
  {
    title: "The generative layer",
    description:
      "One seed rendered as visuals, music, geometry and symbol. The DNA Lab and MOSS60 studio are the same data seen through different instruments.",
    href: "/digital-dna",
  },
  {
    title: "The arcade",
    description:
      "Standalone games built to be played, not to be demonstrated. Banana-powered space nonsense included.",
    href: "/arcade",
  },
  {
    title: "The classroom edition",
    description:
      "MetaPet School: seven teacher-led sessions for Years 3-6, alias-only, local-first, free permanently.",
    href: "/schools",
  },
] as const;

/**
 * The MetaPet School pitch as it appears on the consumer portal.
 *
 * The funding language here must not drift from `@/lib/schools/contribution`,
 * which is the enforced source of truth: no licence, no per-student price, no
 * paid tier, and A$0 presented as the product rather than the cheapest option.
 */
export const SCHOOL_PITCH = {
  eyebrow: "MetaPet.school",
  headline: "The classroom edition is free, and that is the whole model.",
  body: [
    "MetaPet School is a teacher-led classroom product for Years 3-6. Seven short sessions, run on the school's own devices, with an alias-only roster and no student accounts to create, manage or delete at the end of term.",
    "There is no licence, no per-student price and no paid tier. Not a trial, not a freemium tier, not a pilot rate that changes later. The complete experience — every session, the printable fallback, the teacher pack and the full governance pack — is A$0 for every school, permanently.",
    "It gets its own domain because a classroom product should not have to explain which parts of a consumer site a ten-year-old is allowed to touch. The boundary is enforced in the routing layer, not in a policy document.",
  ],
  proofPoints: [
    "Alias-only rosters — no student accounts",
    "Local-first storage on the school's device",
    "No ads, no trackers, no third-party analytics on classroom screens",
    "Full governance pack: privacy impact, data flow, safeguarding, retention",
    "Teacher-led and time-bounded, not an always-on companion",
  ],
  href: "https://www.metapet.school",
  reviewHref: "/schools",
} as const;

export interface RosterMember {
  id: string;
  name: string;
  role: string;
  location: string;
  tagline: string;
  /** Quoted from the artist's own release. Do not paraphrase into studio voice. */
  quote: string;
  description: string;
  href: string;
  linkLabel: string;
}

/**
 * Sponsored personalities. These are independent artists the studio backs —
 * their sites are their own, their voice is their own, and the copy here quotes
 * rather than rewrites them.
 */
export const STUDIO_ROSTER: readonly RosterMember[] = [
  {
    id: "stompz",
    name: "STOMPZ",
    role: "Sponsored personality",
    location: "Frankston, Victoria",
    tagline: "Such Is Life",
    quote: "This is not borrowed danger. This is documented presence.",
    description:
      "A half-broke masterplan, written on walls and lived in. B$S sponsors the work without diluting the personality, rewriting the history or asking for a performance of toughness. Respect the work.",
    href: "https://bss-stompz-such-is-life.themossman.chatgpt.site",
    linkLabel: "Open the STOMPZ release",
  },
] as const;

export const STUDIO_ROUTE = "/studio";
