import { CANONICAL_SESSIONS } from "@/lib/schools/canonicalSequence";

export interface SchoolPackageDoc {
  slug: string;
  title: string;
  description: string;
  audience: string;
  href: string;
  inAppHref: string;
  category:
    | "Core Pack"
    | "Teacher Pack"
    | "Governance Pack"
    | "Pilot Ops Pack"
    | "Evidence Pack";
}

export interface LearningOutcome {
  statement: string;
  lessons: string;
  codes: string[];
}

export interface LessonCard {
  session: string;
  title: string;
  minutes: number;
  outcome: string;
  activity: string;
  prompt: string;
  evidence: string;
  movement: string;
  stoppingPoint: string;
  bestFit: string;
}

export interface ExternalResourceLink {
  label: string;
  href: string;
}

export interface ReviewerPathway {
  title: string;
  description: string;
  docSlugs: string[];
}

function withInAppHref(
  doc: Omit<SchoolPackageDoc, "inAppHref">,
): SchoolPackageDoc {
  return { ...doc, inAppHref: `/schools/docs/${doc.slug}` };
}

export const schoolPackageDocCategories: SchoolPackageDoc["category"][] = [
  "Core Pack",
  "Teacher Pack",
  "Governance Pack",
  "Pilot Ops Pack",
  "Evidence Pack",
];

export const schoolPackageDocs: SchoolPackageDoc[] = ([
  {
    slug: "01-overview-and-alignment",
    title: "Overview and Alignment",
    description:
      "Leadership-ready summary with Years 3-6 fit, learning outcomes and Australian Curriculum V9.0 mapping.",
    audience: "Teachers and school leaders",
    href: "/docs/schools-au/01-overview-and-alignment.md",
    category: "Core Pack",
  },
  {
    slug: "02-lesson-cards",
    title: "7 Lesson Cards",
    description:
      "Seven 20-minute lesson snapshots with one clear outcome, one activity, one prompt and light evidence.",
    audience: "Classroom teachers",
    href: "/docs/schools-au/02-lesson-cards.md",
    category: "Core Pack",
  },
  {
    slug: "03-assessment-and-reflection",
    title: "Assessment and Reflection",
    description:
      "No-marking guidance with one student reflection sheet and one teacher observation checklist.",
    audience: "Classroom teachers",
    href: "/docs/schools-au/03-assessment-and-reflection.md",
    category: "Core Pack",
  },
  {
    slug: "04-privacy-and-implementation",
    title: "Privacy and Implementation Note",
    description:
      "Plain-language implementation note for ICT, leadership and family reassurance.",
    audience: "ICT and leadership",
    href: "/docs/schools-au/04-privacy-and-implementation.md",
    category: "Core Pack",
  },
  {
    slug: "teacher-guide",
    title: "Teacher Guide",
    description:
      "One-page setup, supervision, lesson pacing, and deletion guidance for classroom delivery.",
    audience: "Classroom teachers",
    href: "/docs/schools-au/teacher-pack/teacher-guide.md",
    category: "Teacher Pack",
  },
  {
    slug: "parent-note",
    title: "Parent Note",
    description:
      "Plain-language parent/carer note for pilot communication and family questions.",
    audience: "Parents and carers",
    href: "/docs/schools-au/teacher-pack/parent-note.md",
    category: "Teacher Pack",
  },
  {
    slug: "staff-brief",
    title: "Staff Briefing",
    description:
      "One-slide briefing for leadership, staff meetings, and internal pilot sign-off.",
    audience: "Leadership and staff",
    href: "/docs/schools-au/teacher-pack/staff-brief.md",
    category: "Teacher Pack",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description:
      "Plain-English privacy position for school leaders, ICT reviewers, and families.",
    audience: "Leadership and ICT",
    href: "/docs/schools-au/governance/privacy-policy.md",
    category: "Governance Pack",
  },
  {
    slug: "child-privacy-notice",
    title: "Child Privacy Notice",
    description:
      "Short child-friendly explanation of what the school deployment stores and why.",
    audience: "Students",
    href: "/docs/schools-au/governance/child-privacy-notice.md",
    category: "Governance Pack",
  },
  {
    slug: "parent-carer-privacy-notice",
    title: "Parent/Carer Privacy Notice",
    description:
      "Family-facing notice explaining aliases, local storage, and teacher-controlled exports.",
    audience: "Parents and carers",
    href: "/docs/schools-au/governance/parent-carer-privacy-notice.md",
    category: "Governance Pack",
  },
  {
    slug: "data-flow-diagram",
    title: "Data Flow Diagram",
    description:
      "Simple map of local classroom data, optional exports, and adult-controlled review points.",
    audience: "ICT and privacy reviewers",
    href: "/docs/schools-au/governance/data-flow-diagram.md",
    category: "Governance Pack",
  },
  {
    slug: "data-inventory",
    title: "Data Inventory",
    description:
      "Inventory of alias roster data, lesson queue data, local progress, and pilot summaries.",
    audience: "ICT and privacy reviewers",
    href: "/docs/schools-au/governance/data-inventory.md",
    category: "Governance Pack",
  },
  {
    slug: "retention-and-deletion-schedule",
    title: "Retention and Deletion Schedule",
    description:
      "Short retention rules, automatic expiry window, and teacher-triggered deletion controls.",
    audience: "ICT and leadership",
    href: "/docs/schools-au/governance/retention-and-deletion-schedule.md",
    category: "Governance Pack",
  },
  {
    slug: "third-party-services-register",
    title: "Third-Party Services Register",
    description:
      "Register of any services that may receive school-related traffic outside routine classroom use.",
    audience: "ICT and procurement",
    href: "/docs/schools-au/governance/third-party-services-register.md",
    category: "Governance Pack",
  },
  {
    slug: "security-controls-summary",
    title: "Security Controls Summary",
    description:
      "Summary of local storage, route restrictions, deletion controls, and operational checks.",
    audience: "ICT and privacy reviewers",
    href: "/docs/schools-au/governance/security-controls-summary.md",
    category: "Governance Pack",
  },
  {
    slug: "privacy-impact-assessment",
    title: "Privacy Impact Assessment",
    description:
      "Pilot-stage privacy impact assessment with risks, mitigations, and residual review points.",
    audience: "Leadership and ICT",
    href: "/docs/schools-au/governance/privacy-impact-assessment.md",
    category: "Governance Pack",
  },
  {
    slug: "child-safety-risk-assessment",
    title: "Child-Safety Risk Assessment",
    description:
      "Risk register for supervised classroom use, family communication, and device-sharing contexts.",
    audience: "Leadership and wellbeing teams",
    href: "/docs/schools-au/governance/child-safety-risk-assessment.md",
    category: "Governance Pack",
  },
  {
    slug: "misuse-and-overengagement-risk-assessment",
    title: "Misuse and Over-engagement Risk Assessment",
    description:
      "Controls for time-bounded use, no retention pressure, and teacher-led session limits.",
    audience: "Leadership and wellbeing teams",
    href: "/docs/schools-au/governance/misuse-and-overengagement-risk-assessment.md",
    category: "Governance Pack",
  },
  {
    slug: "wellbeing-escalation-pathway",
    title: "Wellbeing Escalation Pathway",
    description:
      "Escalation steps if a classroom interaction raises a wellbeing or safety concern.",
    audience: "Teachers and wellbeing teams",
    href: "/docs/schools-au/governance/wellbeing-escalation-pathway.md",
    category: "Governance Pack",
  },
  {
    slug: "teacher-supervision-model",
    title: "Teacher Supervision Model",
    description:
      "Default supervision expectations for setup, runtime use, evidence review, and deletion.",
    audience: "Teachers and leadership",
    href: "/docs/schools-au/governance/teacher-supervision-model.md",
    category: "Governance Pack",
  },
  {
    slug: "accessibility-and-inclusion-review",
    title: "Accessibility and Inclusion Review",
    description:
      "Pilot-stage review of readability, participation options, and classroom inclusion risks.",
    audience: "Teachers and inclusion teams",
    href: "/docs/schools-au/governance/accessibility-and-inclusion-review.md",
    category: "Governance Pack",
  },
  {
    slug: "what-metapet-schools-is-is-not",
    title: "What MetaPet Schools Is / Is Not",
    description:
      "Boundary statement covering therapy, surveillance, social, and AI expectations.",
    audience: "Leadership, teachers, and families",
    href: "/docs/schools-au/governance/what-metapet-schools-is-is-not.md",
    category: "Governance Pack",
  },
  {
    slug: "pilot-readiness-verdict-v2",
    title: "Pilot Readiness Verdict v2",
    description:
      "Principal-facing decision memo with the updated score, constrained pilot recommendation, and required proof checks.",
    audience: "Principals and pilot leads",
    href: "/docs/schools-au/pilot/pilot-readiness-verdict-v2.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "pilot-prospectus",
    title: "Pilot Prospectus",
    description:
      "Constrained pilot scope, success criteria, stop conditions, evidence plan, and school ask.",
    audience: "Leadership and pilot partners",
    href: "/docs/schools-au/pilot/pilot-prospectus.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "acceptance-runbook",
    title: "Acceptance Runbook",
    description:
      "Ordered acceptance gate for browser checks, dry runs, reviews, and final pre-pilot signoff.",
    audience: "Pilot leads and reviewers",
    href: "/docs/schools-au/pilot/acceptance-runbook.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "pilot-runbook",
    title: "Pilot Runbook",
    description:
      "One-page pilot timeline, owners, weekly cadence, and stop-condition handling for the first school trial.",
    audience: "Pilot leads and teachers",
    href: "/docs/schools-au/pilot/pilot-runbook.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "school-partner-checklist",
    title: "School Partner Checklist",
    description:
      "Principal and pilot-lead checklist for devices, staffing, family communication, and launch readiness.",
    audience: "Principals and pilot leads",
    href: "/docs/schools-au/pilot/school-partner-checklist.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "outreach-pack",
    title: "Outreach Pack",
    description:
      "Principal email template, first-meeting agenda, and recommended review order for school conversations.",
    audience: "Principals and pilot leads",
    href: "/docs/schools-au/pilot/outreach-pack.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "teacher-dry-run-checklist",
    title: "Teacher Dry-Run Checklist",
    description:
      "Timed rehearsal checklist for setup, classroom flow, deletion controls, and teacher workload.",
    audience: "Classroom teachers",
    href: "/docs/schools-au/pilot/teacher-dry-run-checklist.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "ict-privacy-review-checklist",
    title: "ICT/Privacy Review Checklist",
    description:
      "Artifact-by-artifact ICT review checklist mapped to the governance pack and route boundary.",
    audience: "ICT and privacy reviewers",
    href: "/docs/schools-au/pilot/ict-privacy-review-checklist.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "parent-readability-checklist",
    title: "Parent Readability Checklist",
    description:
      "Readability review tool for the parent note, privacy notice, and participation explanation.",
    audience: "Parents and carers",
    href: "/docs/schools-au/pilot/parent-readability-checklist.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "family-participation-protocol",
    title: "Family Participation Protocol",
    description:
      "Recommended opt-in flow, opt-out handling, shared-device guidance, and teacher language for the pilot.",
    audience: "Teachers and families",
    href: "/docs/schools-au/pilot/family-participation-protocol.md",
    category: "Pilot Ops Pack",
  },
  {
    slug: "teacher-interview-guide",
    title: "Teacher Interview Guide",
    description:
      "Semi-structured interview guide covering setup time, workload, clarity, and classroom impact.",
    audience: "Pilot leads and researchers",
    href: "/docs/schools-au/pilot/teacher-interview-guide.md",
    category: "Evidence Pack",
  },
  {
    slug: "student-exit-feedback",
    title: "Student Exit Feedback",
    description:
      "Anonymous student feedback sheet with age-appropriate questions about clarity, safety, and learning.",
    audience: "Students",
    href: "/docs/schools-au/pilot/student-exit-feedback.md",
    category: "Evidence Pack",
  },
  {
    slug: "parent-feedback-form",
    title: "Parent/Carer Feedback Form",
    description:
      "Short family feedback template for clarity, participation process, concerns, and perceived value.",
    audience: "Parents and carers",
    href: "/docs/schools-au/pilot/parent-feedback-form.md",
    category: "Evidence Pack",
  },
  {
    slug: "pre-post-measure",
    title: "Pre/Post Measure",
    description:
      "Short before-and-after classroom measure for systems thinking, online safety, and regulation language.",
    audience: "Teachers and pilot leads",
    href: "/docs/schools-au/pilot/pre-post-measure.md",
    category: "Evidence Pack",
  },
  {
    slug: "incident-log",
    title: "Incident Log",
    description:
      "Structured log for safeguarding, privacy, inclusion, workload, and over-engagement incidents.",
    audience: "Teachers and pilot leads",
    href: "/docs/schools-au/pilot/incident-log.md",
    category: "Evidence Pack",
  },
  {
    slug: "implementation-fidelity-notes",
    title: "Implementation Fidelity Notes",
    description:
      "Template for recording what was delivered, what changed, and what barriers appeared during the pilot.",
    audience: "Teachers and pilot leads",
    href: "/docs/schools-au/pilot/implementation-fidelity-notes.md",
    category: "Evidence Pack",
  },
  {
    slug: "end-of-pilot-summary",
    title: "End-of-Pilot Summary",
    description:
      "Final summary template for evidence, incidents, findings, and next-step recommendation.",
    audience: "Leadership and pilot partners",
    href: "/docs/schools-au/pilot/end-of-pilot-summary.md",
    category: "Evidence Pack",
  },
] as Omit<SchoolPackageDoc, "inAppHref">[]).map(withInAppHref);

export const learningOutcomes: LearningOutcome[] = [
  {
    statement:
      "Explain that a digital system responds to inputs and changes state over time.",
    lessons: "Sessions 1, 2 and 4",
    codes: ["AC9TDI4K01", "AC9TDI4P02", "AC9TDI6P02"],
  },
  {
    statement:
      "Read the signals a system shows and use them to make a reasoned choice.",
    lessons: "Sessions 1, 2 and 3",
    codes: ["AC9TDI4K03", "AC9TDI4P04", "AC9TDI6K03"],
  },
  {
    statement:
      "Describe simple if-then rules, cause and effect, and patterns in a system.",
    lessons: "Sessions 4 and 7",
    codes: ["AC9TDI4P02", "AC9TDI6P05", "AC9TDI6P06"],
  },
  {
    statement:
      "Use classroom wellbeing language to name a signal, a response and a settling strategy.",
    lessons: "Sessions 2 and 5",
    codes: ["AC9HP4P05", "AC9HP6P05", "AC9HP4P08"],
  },
  {
    statement:
      "Work with others to compare observations, justify a design choice and reflect on responsible digital use.",
    lessons: "Sessions 3, 5, 6 and 7",
    codes: ["AC9HP4P03", "AC9HP6P03", "AC9HP6P08"],
  },
];

/**
 * The public lesson snapshot. Derived from {@link CANONICAL_SESSIONS} so the
 * marketing page, the runner and the printable pack can never advertise three
 * different seven-session sequences again.
 */
export const lessonCards: LessonCard[] = CANONICAL_SESSIONS.map((session) => ({
  session: `Session ${session.number}`,
  title: session.title,
  minutes: session.minutes,
  outcome: session.learningIntention,
  activity: session.childActivity,
  prompt: session.reflectionPrompt,
  evidence: session.lightEvidence,
  movement: session.movementMoment,
  stoppingPoint: session.stoppingPoint,
  bestFit: session.bestFit,
}));


/**
 * The hero. One headline, one supporting statement, one trust line — kept here
 * so the page and its test read from the same words.
 */
export const SCHOOL_HEADLINE = "Creative technology that gives attention back.";

export const SCHOOL_SUPPORTING_STATEMENT =
  "Seven short, teacher-led lessons for Years 3-6 - without student accounts, advertising or another permanent digital profile.";

export const SCHOOL_PROOF_LINE =
  "Open the lesson. Guide the activity. Capture light evidence. Get back to teaching.";

export const SCHOOL_ATTRIBUTION =
  "An education initiative of Blue $nake Studio";

/**
 * How MetaPet School relates to the software a school already runs. This is
 * the sentence that stops the product being mistaken for a Compass or Sentral
 * replacement, which it is not and does not try to be.
 */
export const SCHOOL_POSITIONING_STATEMENT =
  "Keep your existing school platform for attendance, payments, timetables and communication. MetaPet School performs a different job: it gives children a bounded learning experience without requiring another student identity system.";

/** What a teacher needs before Session One. Deliberately short. */
export const whatYouNeed: readonly string[] = [
  "Years 3-6 class",
  "About 20 minutes",
  "A teacher to lead it",
  "A browser - nothing to install",
  "No student accounts to create",
  "A printer if you want the paper fallback",
  "One class is enough to start",
];

/**
 * The local-data lifecycle in the order an adult asks about it. Wording here is
 * checked against the implementation - see `@/lib/schools/storage`.
 */
export const dataLifecycle: readonly { question: string; answer: string }[] = [
  {
    question: "What is stored?",
    answer:
      "Teacher-chosen aliases, lesson progress, classroom setup choices and any light evidence a teacher records.",
  },
  {
    question: "Where is it stored?",
    answer:
      "In this browser, on this device, using local storage. Routine classroom use does not sync it to a server.",
  },
  {
    question: "Why is it needed?",
    answer:
      "So a class can pause and resume a session, and so a teacher can review evidence without re-running the lesson.",
  },
  {
    question: "Who can see it?",
    answer:
      "Anyone using this browser profile on this device. That is why it belongs on a teacher-controlled device.",
  },
  {
    question: "When does it disappear?",
    answer:
      "35 days after the last activity, automatically. Clearing site data removes it immediately.",
  },
  {
    question: "How does a teacher delete it?",
    answer:
      "From the local-data controls, with an explicit confirmation. No request to the studio is needed.",
  },
  {
    question: "What is never required?",
    answer:
      "A student account, a student email, a real name, a photo, a login, or a payment.",
  },
];

export const reviewerPathways: ReviewerPathway[] = [
  {
    title: "Principals and pilot leads",
    description:
      "Start with the updated verdict, then move into the positioning, staff brief, pilot scope, and product boundaries before discussing rollout.",
    docSlugs: [
      "pilot-readiness-verdict-v2",
      "01-overview-and-alignment",
      "staff-brief",
      "pilot-prospectus",
      "school-partner-checklist",
      "outreach-pack",
      "what-metapet-schools-is-is-not",
    ],
  },
  {
    title: "ICT and privacy reviewers",
    description:
      "Start with the privacy and implementation note, then move through the privacy pack and controls documentation.",
    docSlugs: [
      "04-privacy-and-implementation",
      "privacy-policy",
      "data-flow-diagram",
      "data-inventory",
      "retention-and-deletion-schedule",
      "security-controls-summary",
      "privacy-impact-assessment",
      "ict-privacy-review-checklist",
    ],
  },
  {
    title: "Classroom teachers",
    description:
      "Start with setup, lesson pacing, reflection materials, and the supervision model for classroom use.",
    docSlugs: [
      "teacher-guide",
      "02-lesson-cards",
      "03-assessment-and-reflection",
      "teacher-supervision-model",
      "teacher-dry-run-checklist",
      "pilot-runbook",
    ],
  },
  {
    title: "Families and wellbeing teams",
    description:
      "Start with the family note, privacy notice, safety assessment, and wellbeing escalation pathway.",
    docSlugs: [
      "parent-note",
      "parent-carer-privacy-notice",
      "family-participation-protocol",
      "parent-readability-checklist",
      "child-safety-risk-assessment",
      "wellbeing-escalation-pathway",
      "accessibility-and-inclusion-review",
    ],
  },
];

export const curriculumSourceLinks: ExternalResourceLink[] = [
  {
    label: "Digital Technologies Years F-6 overview",
    href: "https://v9.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/digital-technologies-in-focus/resources/planning/v9-years-f-6-australian-curriculum-digital-technologies-achievement-standards-and-aligned-content-descriptions-on-a-page-a3.pdf",
  },
  {
    label: "Mental health and wellbeing curriculum connection",
    href: "https://www.australiancurriculum.edu.au/curriculum-information/understand-this-curriculum-connection/mental-health-and-wellbeing",
  },
  {
    label: "HPE Years 3-4 scope and sequence",
    href: "https://www.australiancurriculum.edu.au/media/7160/primary_scope_and_sequence_years_3-4.pdf",
  },
  {
    label: "HPE Years 5-6 scope and sequence",
    href: "https://www.australiancurriculum.edu.au/media/7163/primary_scope_and_sequence_years_5-6.pdf",
  },
];
