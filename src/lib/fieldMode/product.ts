/**
 * Public-interest product constitution for the school runtime.
 *
 * School-facing pages import these values instead of inventing names, privacy
 * promises or commercial terms independently. The consumer MetaPet product is
 * intentionally outside this contract.
 */
export const METAPET_PRODUCT = {
  studio: "Blue $nake Studio",
  legalOperatingName: process.env.NEXT_PUBLIC_LEGAL_OPERATING_NAME?.trim() || null,
  legalOperatingNameNeedsConfirmation:
    !process.env.NEXT_PUBLIC_LEGAL_OPERATING_NAME?.trim(),
  initiative: "MetaPet Mission",
  school: "MetaPet School",
  runtime: "Field Mode",
  consumer: "Complete MetaPet",
  productLine: "An education initiative of Blue $nake Studio",
  positioning: "Creative technology that gives attention back.",
} as const;

export const FIELD_PRIVACY_EXPLANATION =
  "No student accounts. No routine cloud collection. If a teacher chooses to use classroom records, MetaPet School stores teacher-created aliases, lesson setup and light progress information on the current device. Local school records can be deleted by the teacher and expire after 35 days without use.";

export const FIELD_CHILD_PRIVACY_EXPLANATION =
  "MetaPet School does not need your real name or your own account. Your teacher may use a pretend classroom name to remember lesson progress on this device. Your teacher can erase it.";

export const FIELD_NEVER_DOES = [
  "Advertising or behavioural tracking",
  "Student accounts or student email collection",
  "Public profiles, chat or a social feed",
  "Sale of student information",
  "Automatic wellbeing diagnosis or behavioural surveillance",
  "Child-facing payment or commercial prompts",
  "Consumer identity, wallet, marketplace or sharing routes during Field Mode",
] as const;

export const FIELD_CONTRIBUTIONS = [
  {
    amount: "$0",
    meaning: "Use MetaPet School. No explanation required.",
  },
  {
    amount: "$250 per year",
    meaning: "Help sustain your school’s access and routine maintenance.",
  },
  {
    amount: "$750 per year",
    meaning: "Support development, accessibility and teacher resources.",
  },
  {
    amount: "$1,500+ per year",
    meaning:
      "Sustain MetaPet School and help keep access free for another school.",
  },
  {
    amount: "Custom agreement",
    meaning:
      "Councils, school networks, tailored implementation, training or specialised work.",
  },
] as const;

export const FIELD_CONTRIBUTION_HEADLINE =
  "Use it free. Contribute what your school can.";

export const FIELD_GOVERNING_LINE =
  "No school is too poor to use it. No school is too wealthy to help sustain it.";

export const FIELD_CONTRIBUTION_COPY =
  "MetaPet Field Mode is free to use. If your school has the capacity, it may choose an annual contribution that reflects what it can reasonably afford. Contributions support maintenance, accessibility, teacher resources and continued free access for schools with fewer resources. Every school receives the same complete classroom experience.";

export const FIELD_ENQUIRY_EMAIL = "bluesssnakestudio@gmail.com";

export function buildFieldContributionEnquiryHref(
  level = "$0 — use MetaPet School",
): string {
  const subject = "MetaPet School contribution or implementation enquiry";
  const body = [
    "School or organisation:",
    "Adult contact name:",
    `Contribution level or enquiry: ${level}`,
    "Anything we should know:",
    "",
    "Do not include student names or student information.",
  ].join("\n");
  return `mailto:${FIELD_ENQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
