import { describe, expect, it } from 'vitest';
import { runTeacherHubMenuSmokeCheck, TEACHER_HUB_MENU_ACTIONS } from './menuActions';

describe('teacher hub menu smoke navigation', () => {
  it('ensures every menu item is live or explicitly coming soon', () => {
    const result = runTeacherHubMenuSmokeCheck(TEACHER_HUB_MENU_ACTIONS);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
