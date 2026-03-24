// Build-time inlined curriculum docs via Vite ?raw imports
import doc00 from "../../public/package/00_Package_Index.md?raw";
import doc01 from "../../public/package/01_KPPS_Teacher_Hub_Welcome.md?raw";
import doc02 from "../../public/package/02_KPPS_Implementation_Guide.md?raw";
import doc03 from "../../public/package/03_KPPS_Facilitation_Scripts.md?raw";
import doc04 from "../../public/package/04_KPPS_Reflection_Prompts.md?raw";
import doc05 from "../../public/package/05_KPPS_Values_Integration_Map.md?raw";
import doc06 from "../../public/package/06_KPPS_Parent_Communication_Kit.md?raw";
import doc07 from "../../public/package/07_KPPS_Privacy_Safety_Brief.md?raw";

export type Audience = "teacher" | "leadership" | "ict" | "parent";

export interface CurriculumSection {
  id: string;
  label: string;
}

export interface CurriculumDoc {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  audience: Audience[];
  readTime: number; // minutes
  content: string;
  sections: CurriculumSection[];
  href: string;
}

export const SESSION_DATA = [
  { id: 1, title: "Getting Started", focus: "Introducing the classroom companion and shared routines", values: "Respect" },
  { id: 2, title: "Routines and Care", focus: "Reading signals and choosing helpful actions", values: "Responsibility" },
  { id: 3, title: "Feelings and Signals", focus: "Noticing mood changes and recovery actions", values: "Resilience" },
  { id: 4, title: "Feedback and Change", focus: "Understanding cause, effect, and repair", values: "Resilience" },
  { id: 5, title: "Data and Patterns", focus: "Recording observations and testing predictions", values: "Excellence" },
  { id: 6, title: "Working Together", focus: "Comparing evidence and solving problems as a class", values: "Cooperation" },
  { id: 7, title: "Reflection and Showcase", focus: "Explaining patterns and reflecting on learning", values: "Community" },
] as const;

export const CURRICULUM_DOCS: CurriculumDoc[] = [
  {
    id: "welcome",
    num: 1,
    title: "School Overview & Pilot Scope",
    subtitle: "Overview of the classroom pilot, boundaries, and review path",
    audience: ["teacher", "leadership"],
    readTime: 4,
    content: doc01,
    href: "/welcome",
    sections: [
      { id: "what-this-is", label: "What this package is" },
      { id: "why-the-veil", label: "Why the original framing?" },
      { id: "the-kpps-way", label: "How this fits KPPS" },
      { id: "pilot-proposal", label: "The pilot proposal" },
      { id: "who-this-is-for", label: "Who this is for" },
      { id: "what-next", label: "What happens next" },
    ],
  },
  {
    id: "implementation",
    num: 2,
    title: "Teacher Guide",
    subtitle: "7 guided classroom sessions with I Do / We Do / You Do structure",
    audience: ["teacher"],
    readTime: 12,
    content: doc02,
    href: "/implementation",
    sections: [
      { id: "session-1", label: "Session 1 — Onboarding" },
      { id: "session-2", label: "Session 2 — Care Loop" },
      { id: "session-3", label: "Session 3 — Emotions" },
      { id: "session-4", label: "Session 4 — Feedback Loops" },
      { id: "session-5", label: "Session 5 — Data Literacy" },
      { id: "session-6", label: "Session 6 — Collaborative" },
      { id: "session-7", label: "Session 7 — Showcase" },
    ],
  },
  {
    id: "scripts",
    num: 3,
    title: "Facilitation Scripts",
    subtitle: "Teacher prompts for each guided classroom session",
    audience: ["teacher"],
    readTime: 15,
    content: doc03,
    href: "/scripts",
    sections: [
      { id: "how-to-use", label: "How to use these scripts" },
      { id: "session-1-script", label: "Session 1 script" },
      { id: "session-2-script", label: "Session 2 script" },
      { id: "session-3-script", label: "Session 3 script" },
      { id: "session-4-script", label: "Session 4 script" },
      { id: "session-5-script", label: "Session 5 script" },
      { id: "session-6-script", label: "Session 6 script" },
      { id: "session-7-script", label: "Session 7 script" },
    ],
  },
  {
    id: "reflection-prompts",
    num: 4,
    title: "Reflection Prompts",
    subtitle: "Printable student reflection prompts organised by lesson phase",
    audience: ["teacher"],
    readTime: 6,
    content: doc04,
    href: "/reflection-prompts",
    sections: [
      { id: "observation", label: "Observation (Blue)" },
      { id: "wellbeing", label: "Wellbeing (Green)" },
      { id: "systems", label: "Systems Thinking (Yellow)" },
      { id: "data", label: "Data & Evidence (Orange)" },
      { id: "metacognition", label: "Metacognition (Red)" },
      { id: "values", label: "KPPS Values (Purple)" },
    ],
  },
  {
    id: "values-map",
    num: 5,
    title: "Curriculum & School Fit",
    subtitle: "Curriculum alignment, capability links, and classroom outcomes",
    audience: ["teacher", "leadership"],
    readTime: 17,
    content: doc05,
    href: "/values-map",
    sections: [
      { id: "overview", label: "Overview" },
      { id: "respect", label: "Respect" },
      { id: "resilience", label: "Resilience" },
      { id: "excellence", label: "Excellence" },
      { id: "cooperation", label: "Cooperation" },
      { id: "community", label: "Community" },
    ],
  },
  {
    id: "parent-kit",
    num: 6,
    title: "Parent/Carer Note",
    subtitle: "Ready-to-send family communication for the classroom pilot",
    audience: ["teacher", "parent"],
    readTime: 13,
    content: doc06,
    href: "/parent-kit",
    sections: [
      { id: "when-to-use", label: "When to send" },
      { id: "message-1", label: "Opt-in introduction" },
      { id: "message-2", label: "Week 1 update" },
      { id: "message-3", label: "Week 2 update" },
      { id: "message-4", label: "FAQ response" },
      { id: "message-5", label: "Post-pilot summary" },
    ],
  },
  {
    id: "privacy-brief",
    num: 7,
    title: "Governance, Privacy & Safety Pack",
    subtitle: "Leadership and ICT review materials for the school pilot",
    audience: ["ict", "leadership"],
    readTime: 17,
    content: doc07,
    href: "/privacy-brief",
    sections: [
      { id: "executive-summary", label: "Executive Summary" },
      { id: "offline-architecture", label: "Offline Architecture" },
      { id: "zero-account", label: "Zero Account Model" },
      { id: "dna-privacy", label: "DNA Privacy" },
      { id: "compliance", label: "Compliance" },
      { id: "ict-checklist", label: "ICT Checklist" },
    ],
  },
];

export const RAW_DOCS = {
  index: doc00,
  welcome: doc01,
  implementation: doc02,
  scripts: doc03,
  reflections: doc04,
  values: doc05,
  parents: doc06,
  privacy: doc07,
};

export function getDoc(id: string): CurriculumDoc | undefined {
  return CURRICULUM_DOCS.find((d) => d.id === id);
}

export function getSessionData(sessionId: number) {
  return SESSION_DATA.find((s) => s.id === sessionId);
}
