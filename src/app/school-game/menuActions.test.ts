import { describe, expect, it } from 'vitest';
import {
  PLANNED_TEACHER_HUB_MENU_ACTIONS,
  PRIMARY_TEACHER_HUB_MENU_ACTIONS,
  runTeacherHubMenuSmokeCheck,
  TEACHER_HUB_MENU_ACTIONS,
} from './menuActions';

describe('teacher hub menu smoke navigation', () => {
  it('ensures every menu item is live or explicitly coming soon', () => {
    const result = runTeacherHubMenuSmokeCheck(TEACHER_HUB_MENU_ACTIONS);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('separates live actions from planned extensions', () => {
    expect(
      PRIMARY_TEACHER_HUB_MENU_ACTIONS.every((action) => action.status === 'live'),
    ).toBe(true);
    expect(
      PLANNED_TEACHER_HUB_MENU_ACTIONS.every(
        (action) => action.status === 'coming-soon',
      ),
    ).toBe(true);
  });

  it('requires hrefs for live school runtime actions', () => {
    expect(
      PRIMARY_TEACHER_HUB_MENU_ACTIONS.every((action) => Boolean(action.href)),
    ).toBe(true);
  });
});
