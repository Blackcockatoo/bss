/**
 * MetaPet School's permanent funding model.
 *
 * There is no school licence, no per-student price and no paid tier of the
 * classroom experience. The complete core — all seven sessions, the printable
 * fallback, the teacher pack, the governance pack — is available at A$0, for
 * every school, permanently. Contribution is voluntary, adult-only, and has no
 * effect on what a class receives.
 *
 * The rules below are enforced by `contribution.test.ts` rather than left to
 * good intentions: no option may be preselected, no option may be badged as
 * popular or recommended, and the A$0 option must be presented as a first-class
 * choice rather than a fallback.
 */

export interface ContributionOption {
  id: string;
  /** Annual amount in AUD. `null` means the adult enters their own amount. */
  amount: number | null;
  label: string;
  /** What the money does. No emotional pressure, no scarcity, no urgency. */
  description: string;
}

/**
 * Suggested annual contributions, shown on adult-only pages only.
 *
 * A$0 is deliberately **not** in this list. It used to be the first entry,
 * which put free access into a row of amounts and made the complete product
 * read as the cheapest plan. A$0 is not a contribution and not a tier — it is
 * the product — so it is presented on its own, before this list, and these are
 * only the ways an adult can choose to help sustain it.
 */
export const CONTRIBUTION_OPTIONS: readonly ContributionOption[] = [
  {
    id: "sustain",
    amount: 250,
    label: "A$250",
    description: "Help keep MetaPet School running.",
  },
  {
    id: "accessibility",
    amount: 750,
    label: "A$750",
    description: "Support accessibility and new classroom resources.",
  },
  {
    id: "access",
    amount: 1500,
    label: "A$1,500+",
    description: "Help sustain free access for more schools.",
  },
  {
    id: "custom",
    amount: null,
    label: "Custom",
    description: "Contribute what your organisation can afford.",
  },
] as const;

/**
 * The free option, stated as a product fact rather than an entry in a price
 * list. Anything that renders contribution amounts must render this first and
 * more prominently.
 */
export const FREE_ACCESS = {
  action: "Use MetaPet School — A$0",
  /** Sits directly under the action. Body text, never microcopy. */
  assurance: "No explanation required. Nothing is removed. Nothing expires.",
} as const;

/** The promise that has to be readable without scrolling on the entry screen. */
export const FREE_PROMISE =
  "Complete Field Mode. Free for every school. Not a trial. No expiry. No reduced version.";

/** The primary entry action. The zero is visible, not implied by "free". */
export const START_TEACHING_ACTION = "Start teaching — A$0";

/**
 * Nothing is preselected. A default selection is a nudge, and a nudge toward
 * money is exactly what this model refuses to do.
 */
export const DEFAULT_CONTRIBUTION_SELECTION: string | null = null;

/** The lines the contribution section is required to carry. */
export const CONTRIBUTION_HEADLINE = "Use it free. Contribute if you can.";

export const CONTRIBUTION_SUPPORTING_COPY =
  "Every school receives the complete MetaPet School experience for A$0. Schools and organisations with available funding can voluntarily help support maintenance, accessibility work, teacher resources and continued free access for others.";

/**
 * The governing principle of the whole model.
 *
 * Not footer copy, not a disclaimer, not something to fold into the
 * contribution section. It gets its own full-width band directly after the
 * hero, at display size, in full-contrast text.
 */
export const GOVERNING_PRINCIPLE = [
  "No school is too poor to use it.",
  "No school is too wealthy to help sustain it.",
] as const;

export const CONTRIBUTION_RATIONALE =
  "Good educational software costs money. Children should not pay with their identity, attention or behavioural data.";

/** The plain-language version of why the model is shaped this way. */
export const CONTRIBUTION_EXPLANATION =
  "MetaPet School costs money to build and maintain. But children should not pay through exclusion, advertising, attention capture or behavioural data. So the complete classroom experience is free, and contributions from schools that can afford them help sustain it.";

/**
 * Paid work that genuinely exists, kept separate from access to Field Mode.
 * None of it is required to run the seven sessions.
 */
export const PAID_SERVICES: readonly { title: string; description: string }[] = [
  {
    title: "Staff training",
    description:
      "A facilitated session for a staff meeting or a professional learning block.",
  },
  {
    title: "Facilitated implementation",
    description:
      "Hands-on help planning a sequence across a year level or a network.",
  },
  {
    title: "Custom curriculum work",
    description:
      "Sessions written against a specific programme, unit or context.",
  },
  {
    title: "Council or network deployment",
    description:
      "Support for rolling out across several schools with shared governance review.",
  },
  {
    title: "Bespoke workshops",
    description: "One-off creative technology workshops for students or staff.",
  },
  {
    title: "Commissioned Blue $nake Studio work",
    description:
      "Design, software or creative work outside the school programme.",
  },
];

/**
 * Whether a payment processor is wired up.
 *
 * There is none. The contribution form therefore collects an intention and
 * hands the school a way to talk to a human — it does not pretend to take a
 * payment. When a real processor exists, this is the single flag and
 * {@link CONTRIBUTION_INTEGRATION_POINT} the single seam to change.
 */
export const CONTRIBUTION_PAYMENTS_ENABLED = false;

/**
 * The isolated integration point for a future payment processor.
 *
 * Deliberately a no-op that reports its own absence rather than a stub that
 * looks like it worked. A checkout that silently fails is worse than no
 * checkout at all when the payer is a public school.
 */
export interface ContributionIntent {
  optionId: string;
  /** Annual amount in AUD, or null when the adult chose "another amount". */
  amount: number | null;
}

export interface ContributionIntentResult {
  status: "no-payment-processor";
  /** Plain-language explanation to show the adult. */
  message: string;
  intent: ContributionIntent;
}

export function CONTRIBUTION_INTEGRATION_POINT(
  intent: ContributionIntent,
): ContributionIntentResult {
  return {
    status: "no-payment-processor",
    message:
      "There is no payment system connected yet. Nothing has been charged and no payment details were collected. Email the studio and we will arrange an invoice.",
    intent,
  };
}

/** Where a school arranges a contribution while payments are not connected. */
export const CONTRIBUTION_CONTACT_EMAIL = "bluesssnakestudio@gmail.com";

/** What a school gets at A$0 — which is everything. */
/**
 * What A$0 includes — which is everything.
 *
 * Kept as prose-length items rather than a feature checklist so it never gets
 * rendered as a comparison column beside contribution amounts.
 */
export const FREE_ACCESS_INCLUDES: readonly string[] = [
  "All seven sessions, complete",
  "The same child-facing Field Mode",
  "Printable fallback for every session",
  "Teacher guide and parent/carer materials",
  "Privacy, safeguarding and governance pack",
  "Local-data controls and deletion",
  "Australian Curriculum mapping",
];
