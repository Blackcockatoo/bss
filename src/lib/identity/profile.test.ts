import { beforeEach, describe, expect, it } from 'vitest';

import { useStore } from '@/lib/store';
import {
  MAX_AVATAR_BYTES,
  defaultIdentityProfile,
  getAvatarDataUrlError,
  loadIdentityProfile,
  saveIdentityProfile,
  useIdentityProfileStore,
} from '@/lib/identity/profile';

const VALID_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('identity avatar persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useIdentityProfileStore.setState({
      profile: defaultIdentityProfile,
      lastSavedAt: null,
      status: 'idle',
    });
  });

  it('writes a valid identity avatar and reloads it from local storage', () => {
    const saved = saveIdentityProfile({
      ...defaultIdentityProfile,
      username: 'Forge Keeper',
      avatarDataUrl: VALID_PNG,
    });

    expect(saved.avatarDataUrl).toBe(VALID_PNG);
    expect(saved.updatedAt).toEqual(expect.any(Number));
    expect(loadIdentityProfile()).toEqual(saved);
  });

  it('rejects invalid and oversized avatar data without replacing the saved profile', () => {
    const original = saveIdentityProfile({
      ...defaultIdentityProfile,
      avatarDataUrl: VALID_PNG,
    });
    const oversized = `data:image/png;base64,iVBORw0KGgo${'A'.repeat(
      Math.ceil((MAX_AVATAR_BYTES * 4) / 3) + 20,
    )}`;

    expect(getAvatarDataUrlError('data:text/html;base64,PGgxPm5vPC9oMT4=')).toMatch(
      /valid PNG/i,
    );
    expect(getAvatarDataUrlError('data:image/png;base64,bm90LXBuZw==')).toMatch(
      /invalid/i,
    );
    expect(getAvatarDataUrlError(oversized)).toMatch(/512 KB or smaller/i);
    expect(() =>
      saveIdentityProfile({ ...original, avatarDataUrl: oversized }),
    ).toThrow(/512 KB or smaller/i);
    expect(loadIdentityProfile()).toEqual(original);
  });

  it('does not mutate Vimana, games, rewards, or progression state', () => {
    const before = useStore.getState();
    const frozenState = structuredClone({
      vimana: before.vimana,
      miniGames: before.miniGames,
      achievements: before.achievements,
      rewardHistory: before.rewardHistory,
      essence: before.essence,
      evolution: before.evolution,
    });

    saveIdentityProfile({
      ...defaultIdentityProfile,
      avatarDataUrl: VALID_PNG,
    });

    const after = useStore.getState();
    expect({
      vimana: after.vimana,
      miniGames: after.miniGames,
      achievements: after.achievements,
      rewardHistory: after.rewardHistory,
      essence: after.essence,
      evolution: after.evolution,
    }).toEqual(frozenState);
    expect([...Array(window.localStorage.length)].map((_, index) => window.localStorage.key(index)))
      .toEqual(['metapet-identity-profile']);
  });
});
