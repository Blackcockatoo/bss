export type MenuActionStatus = 'live' | 'coming-soon';

export interface TeacherHubMenuAction {
  id: 'pair-qr' | 'confirm-crest' | 'launch-quest' | 'dna-hub' | 'blessings';
  label: string;
  description: string;
  status: MenuActionStatus;
}

export const TEACHER_HUB_MENU_ACTIONS: TeacherHubMenuAction[] = [
  {
    id: 'pair-qr',
    label: 'Pair with Pet via QR',
    description: 'Scan or paste a QR payload to pair a classroom pet profile.',
    status: 'live',
  },
  {
    id: 'confirm-crest',
    label: 'Confirm Bonded Crest',
    description: 'Verify the crest signature before a classroom session begins.',
    status: 'live',
  },
  {
    id: 'launch-quest',
    label: 'Launch Classroom Quest',
    description: 'Start a guided classroom quest once pairing and crest verification are complete.',
    status: 'live',
  },
  {
    id: 'dna-hub',
    label: 'DNA Hub',
    description: 'Coming soon: advanced DNA visualizations for lesson extension.',
    status: 'coming-soon',
  },
  {
    id: 'blessings',
    label: 'Blessings',
    description: 'Coming soon: class blessings wall for non-comparative affirmations.',
    status: 'coming-soon',
  },
];

export function runTeacherHubMenuSmokeCheck(actions = TEACHER_HUB_MENU_ACTIONS): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const action of actions) {
    if (!action.label.trim()) {
      issues.push(`${action.id} is missing a label`);
    }

    if (action.status !== 'live' && action.status !== 'coming-soon') {
      issues.push(`${action.id} has invalid status ${String(action.status)}`);
    }

    if (action.status === 'coming-soon' && !/coming soon/i.test(`${action.label} ${action.description}`)) {
      issues.push(`${action.id} must clearly communicate Coming soon`);
    }
  }

  return { ok: issues.length === 0, issues };
}
