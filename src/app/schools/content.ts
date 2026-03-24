export interface SchoolPackageDoc {
  slug: string;
  title: string;
  description: string;
  audience: string;
  href: string;
  category:
    | "Core Pack"
    | "Teacher Pack"
    | "Governance Pack"
    | "Pilot Pack";
}

export interface CurriculumRow {
  band: "Years 3-4" | "Years 5-6";
  learningArea: "Digital Technologies" | "Health and Physical Education";
  code: string;
  focus: string;
  metapetUse: string;
}

export interface LearningOutcome {
  statement: string;
  lessons: string;
  codes: string[];
}

export interface LessonCard {
  session: string;
  title: string;
  outcome: string;
  activity: string;
  prompt: string;
  evidence: string;
  bestFit: string;
}

export interface ExternalResourceLink {
  label: string;
  href: string;
}

export const schoolPackageDocCategories: SchoolPackageDoc["category"][] = [
  "Core Pack",
  "Teacher Pack",
  "Governance Pack",
  "Pilot Pack",
];

export const schoolPackageDocs: SchoolPackageDoc[] = [
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
    slug: "pilot-prospectus",
    title: "Pilot Prospectus",
    description:
      "Pilot-ready scope, success criteria, stop conditions, evidence plan, and school ask.",
    audience: "Leadership and pilot partners",
    href: "/docs/schools-au/pilot/pilot-prospectus.md",
    category: "Pilot Pack",
  },
];

export const curriculumRows: CurriculumRow[] = [
  {
    band: "Years 3-4",
    learningArea: "Digital Technologies",
    code: "AC9TDI4K01",
    focus: "Digital systems and their purposes",
    metapetUse:
      "Students identify the device as a digital system that receives input and displays pet state.",
  },
  {
    band: "Years 3-4",
    learningArea: "Digital Technologies",
    code: "AC9TDI4K03",
    focus: "Data representation",
    metapetUse:
      "Students read colour, icon, text and mood as different representations of the same state.",
  },
  {
    band: "Years 3-4",
    learningArea: "Digital Technologies",
    code: "AC9TDI4P02",
    focus: "Branching and iteration",
    metapetUse:
      "Students describe simple if-then decisions and repeat care loops to test what works.",
  },
  {
    band: "Years 3-4",
    learningArea: "Digital Technologies",
    code: "AC9TDI4P04",
    focus: "Input and simple visual programs",
    metapetUse:
      "Students observe how one action changes the pet state and visible outputs.",
  },
  {
    band: "Years 5-6",
    learningArea: "Digital Technologies",
    code: "AC9TDI6K03",
    focus: "How systems represent data using numbers",
    metapetUse:
      "Students connect visible pet state to tracked values and explain why outputs change over time.",
  },
  {
    band: "Years 5-6",
    learningArea: "Digital Technologies",
    code: "AC9TDI6P02",
    focus: "Algorithm design with branching and iteration",
    metapetUse:
      "Students predict and explain which action sequence should stabilise a state.",
  },
  {
    band: "Years 5-6",
    learningArea: "Digital Technologies",
    code: "AC9TDI6P05",
    focus: "Control structures, variables and input",
    metapetUse:
      "Students test how repeated inputs and changing state values affect outcomes.",
  },
  {
    band: "Years 5-6",
    learningArea: "Digital Technologies",
    code: "AC9TDI6P06",
    focus: "Evaluation and broader impact",
    metapetUse:
      "Students evaluate whether the companion is calm, useful and fit for classroom learning.",
  },
  {
    band: "Years 3-4",
    learningArea: "Health and Physical Education",
    code: "AC9HP4P03",
    focus: "Personal and social skills",
    metapetUse:
      "Students work in pairs, listen to each other and compare observations respectfully.",
  },
  {
    band: "Years 3-4",
    learningArea: "Health and Physical Education",
    code: "AC9HP4P05",
    focus: "Emotional responses and regulation",
    metapetUse:
      "Students name a feeling and match it with a helpful calming or recovery action.",
  },
  {
    band: "Years 3-4",
    learningArea: "Health and Physical Education",
    code: "AC9HP4P08",
    focus: "Health-enhancing behaviours for wellbeing",
    metapetUse:
      "Students discuss routines, balance and actions that support calm and recovery.",
  },
  {
    band: "Years 5-6",
    learningArea: "Health and Physical Education",
    code: "AC9HP6P03",
    focus: "Refining personal and social skills",
    metapetUse:
      "Students collaborate on explanations, negotiate action choices and present findings.",
  },
  {
    band: "Years 5-6",
    learningArea: "Health and Physical Education",
    code: "AC9HP6P05",
    focus: "Managing emotions and relationships",
    metapetUse:
      "Students analyse how responses affect behaviour and suggest strategies to regulate emotions.",
  },
  {
    band: "Years 5-6",
    learningArea: "Health and Physical Education",
    code: "AC9HP6P08",
    focus: "Health-enhancing behaviours and wellbeing",
    metapetUse:
      "Students reflect on how routines, balance and reflection support individual and group wellbeing.",
  },
];

export const learningOutcomes: LearningOutcome[] = [
  {
    statement:
      "Explain that a digital system responds to inputs and changes state over time.",
    lessons: "Sessions 1, 2 and 5",
    codes: ["AC9TDI4K01", "AC9TDI4P02", "AC9TDI6P02"],
  },
  {
    statement:
      "Read pet-state information and use it to make a reasoned action choice.",
    lessons: "Sessions 1, 2 and 4",
    codes: ["AC9TDI4K03", "AC9TDI4P04", "AC9TDI6K03"],
  },
  {
    statement:
      "Describe simple feedback loops, cause and effect, and patterns in a system.",
    lessons: "Sessions 4, 5 and 6",
    codes: ["AC9TDI4P02", "AC9TDI6P05", "AC9TDI6P06"],
  },
  {
    statement:
      "Use classroom wellbeing language to identify feelings, responses and regulation strategies.",
    lessons: "Sessions 3, 4 and 7",
    codes: ["AC9HP4P05", "AC9HP6P05", "AC9HP4P08"],
  },
  {
    statement:
      "Work with others to compare observations, share explanations and reflect on respectful digital use.",
    lessons: "Sessions 2, 6 and 7",
    codes: ["AC9HP4P03", "AC9HP6P03", "AC9HP6P08"],
  },
];

export const lessonCards: LessonCard[] = [
  {
    session: "Session 1",
    title: "Meet the Digital Companion",
    outcome:
      "Students explain that a digital system changes when a user gives it input.",
    activity:
      "Open the companion, check its pet state, try one action, and describe what changed.",
    prompt: "What changed after your action, and how do you know?",
    evidence:
      'One sentence: "I chose __ and the pet state changed to __."',
    bestFit: "Digital Technologies mini-lesson",
  },
  {
    session: "Session 2",
    title: "Read the Pet State",
    outcome:
      "Students read visible state information and make a reasoned action choice.",
    activity:
      "Check each state indicator, identify the most urgent state, and choose one response.",
    prompt: "What does the pet state tell you to do next?",
    evidence: "Quick partner explanation using cause-and-effect language.",
    bestFit: "Digital Technologies mini-lesson",
  },
  {
    session: "Session 3",
    title: "Feelings, Signals and Regulation",
    outcome:
      "Students connect visible feelings or moods to a simple regulation strategy.",
    activity:
      "Identify a mood, discuss what that mood might signal, and match it with a calming action.",
    prompt: "If the companion looks overwhelmed, what would help it settle?",
    evidence: "One reflection line about a feeling and a helpful response.",
    bestFit: "Wellbeing session",
  },
  {
    session: "Session 4",
    title: "Repair and Reset",
    outcome:
      "Students explain that recovery in a system is a skill, not a punishment.",
    activity:
      "Start from an unstable pet state, test a repair sequence, and compare which order works best.",
    prompt: "What helped the system recover, and why did that order matter?",
    evidence: "Short verbal explanation or checklist note about the recovery sequence.",
    bestFit: "Relief lesson",
  },
  {
    session: "Session 5",
    title: "Systems and Feedback Loops",
    outcome: "Students describe a simple feedback loop using system language.",
    activity:
      "Track one input, one state change, and one resulting mood or output.",
    prompt: "What signal did the system give you after your first action?",
    evidence: "Input -> state -> output summary.",
    bestFit: "STEM block",
  },
  {
    session: "Session 6",
    title: "Patterns Over Time",
    outcome:
      "Students identify a pattern in how the companion responds across multiple actions.",
    activity:
      "Review notes from earlier sessions, compare with a partner, and identify one reliable pattern.",
    prompt: "What usually works, and what evidence supports that?",
    evidence: "One pattern statement supported by an example.",
    bestFit: "STEM block",
  },
  {
    session: "Session 7",
    title: "Explain Your Thinking",
    outcome:
      "Students explain what they learned about systems, regulation and collaboration.",
    activity:
      "Share one pattern, one useful strategy, and one thing they now understand more clearly.",
    prompt:
      "What did this digital companion help you notice about systems or behaviour?",
    evidence: "One short student reflection or teacher observation note.",
    bestFit: "STEM block",
  },
];

export const weeklyFitOptions = [
  {
    label: "Digital Technologies mini-lesson",
    description:
      "Use Sessions 1, 2 and 5 when you want explicit system and algorithm language in short bursts.",
  },
  {
    label: "STEM block",
    description:
      "Use Sessions 5, 6 and 7 when you want to emphasise systems thinking, feedback loops and explanation.",
  },
  {
    label: "Wellbeing session",
    description:
      "Use Sessions 3 and 4 when the goal is feelings language, regulation and repair without blame.",
  },
  {
    label: "Relief lesson",
    description:
      "Use Session 1 or Session 4 as a low-prep standalone option with clear teacher prompts.",
  },
];

export const evidenceTools = [
  {
    title: "One-page student reflection sheet",
    description:
      "A single written snapshot that captures cause/effect reasoning, systems vocabulary, regulation strategy and collaborative reflection.",
  },
  {
    title: "Teacher observation checklist",
    description:
      "A quick circulation tool for noting whether students read pet state, explain patterns, suggest strategies and work collaboratively.",
  },
];

export const assuranceItems = [
  {
    title: "No student accounts",
    description:
      "The school deployment is built for alias-only classroom use with no student sign-up flow.",
  },
  {
    title: "Local classroom records",
    description:
      "Routine use keeps roster, lesson, and progress records on the current device during the pilot window.",
  },
  {
    title: "Teacher-led and time-bounded",
    description:
      "The classroom version is designed for supervised lessons, not always-on companion behaviour.",
  },
  {
    title: "Bounded product contract",
    description:
      "The school profile excludes chat, social features, identity shaping, public sharing, and retention pressure loops.",
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
