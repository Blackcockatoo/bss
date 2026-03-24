export type MenuActionStatus = "live" | "coming-soon";

export interface TeacherHubMenuAction {
  id:
    | "teacher-guide"
    | "parent-note"
    | "staff-brief"
    | "lesson-cards"
    | "reflection-sheet"
    | "pilot-prospectus"
    | "minister-brief";
  label: string;
  description: string;
  href?: string;
  status: MenuActionStatus;
}

export const TEACHER_HUB_MENU_ACTIONS: TeacherHubMenuAction[] = [
  {
    id: "teacher-guide",
    label: "Teacher Guide",
    description:
      "Open the one-page teacher guide for setup, supervision, and lesson pacing.",
    href: "/docs/schools-au/teacher-pack/teacher-guide.docx",
    status: "live",
  },
  {
    id: "parent-note",
    label: "Parent Note",
    description:
      "Download the parent/carer note used before a classroom pilot begins.",
    href: "/docs/schools-au/teacher-pack/parent-note.docx",
    status: "live",
  },
  {
    id: "staff-brief",
    label: "Staff Briefing",
    description:
      "Use the one-slide staff briefing to explain the classroom use case and boundaries.",
    href: "/docs/schools-au/teacher-pack/staff-brief.docx",
    status: "live",
  },
  {
    id: "lesson-cards",
    label: "Lesson Cards",
    description:
      "Use the 7 lesson cards for low-prep teacher-led classroom delivery.",
    href: "/docs/schools-au/02-lesson-cards.docx",
    status: "live",
  },
  {
    id: "reflection-sheet",
    label: "Reflection Sheet",
    description:
      "Print the student reflection sheet and teacher observation checklist.",
    href: "/docs/schools-au/03-assessment-and-reflection.docx",
    status: "live",
  },
  {
    id: "pilot-prospectus",
    label: "Pilot Prospectus",
    description:
      "Share the pilot prospectus with school leadership before outreach.",
    href: "/docs/schools-au/pilot/pilot-prospectus.docx",
    status: "live",
  },
  {
    id: "minister-brief",
    label: "Minister Brief",
    description:
      "Coming soon after pilot evidence exists. This stays out of pre-pilot school conversations.",
    status: "coming-soon",
  },
];

export const PRIMARY_TEACHER_HUB_MENU_ACTIONS = TEACHER_HUB_MENU_ACTIONS.filter(
  (action) => action.status === "live",
);

export const PLANNED_TEACHER_HUB_MENU_ACTIONS = TEACHER_HUB_MENU_ACTIONS.filter(
  (action) => action.status === "coming-soon",
);

export function runTeacherHubMenuSmokeCheck(
  actions = TEACHER_HUB_MENU_ACTIONS,
): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const action of actions) {
    if (!action.label.trim()) {
      issues.push(`${action.id} is missing a label`);
    }

    if (action.status !== "live" && action.status !== "coming-soon") {
      issues.push(`${action.id} has invalid status ${String(action.status)}`);
    }

    if (action.status === "live" && !action.href) {
      issues.push(`${action.id} is live but missing a href`);
    }

    if (
      action.status === "coming-soon" &&
      !/coming soon/i.test(`${action.label} ${action.description}`)
    ) {
      issues.push(`${action.id} must clearly communicate Coming soon`);
    }
  }

  return { ok: issues.length === 0, issues };
}
