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
 * Order is smallest-first and starts at A$0 deliberately: the free option is
 * the first thing a principal reads, not the last.
 */
export const CONTRIBUTION_OPTIONS: readonly ContributionOption[] = [
  {
    id: "zero",
    amount: 0,
    label: "A$0",
    description:
      "Use MetaPet School completely free. Same seven sessions, same materials, same support. No explanation needed.",
  },
  {
    id: "sustain",
    amount: 250,
    label: "A$250",
    description: "Help keep the project running.",
  },
  {
    id: "accessibility",
    amount: 750,
    label: "A$750",
    description:
      "Support accessibility work and new classroom resources.",
  },
  {
    id: "access",
    amount: 1500,
    label: "A$1,500+",
    description:
      "Help sustain the project and support access for more schools.",
  },
  {
    id: "custom",
    amount: null,
    label: "Another amount",
    description:
      "Contribute what your school, organisation or network can afford.",
  },
] as const;

/**
 * Nothing is preselected. A default selection is a nudge, and a nudge toward
 * money is exactly what this model refuses to do.
 */
export const DEFAULT_CONTRIBUTION_SELECTION: string | null = null;

/** The lines the contribution page is required to carry. */
export const CONTRIBUTION_HEADLINE =
  "Use it free. Contribute what your school can.";

export const CONTRIBUTION_TRUST_LINE =
  "Free to use. Contribute if you can. No child priced out.";

export const CONTRIBUTION_CLOSING_LINE =
  "No school is too poor to use it. No school is too wealthy to help sustain it.";

export const CONTRIBUTION_RATIONALE =
  "Good educational software costs money. Children should not pay with their identity, attention or behavioural data.";

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
export const FREE_TIER_INCLUDES: readonly string[] = [
  "All seven sessions, complete",
  "The same child-facing Field Mode",
  "Printable fallback for every session",
  "Teacher guide and parent/carer materials",
  "Privacy, safeguarding and governance pack",
  "Local-data controls and deletion",
  "Australian Curriculum mapping",
];
