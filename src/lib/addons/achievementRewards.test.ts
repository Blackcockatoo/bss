import { beforeEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENT_REWARDS, checkAndGrantAchievementRewards } from './achievementRewards';
import { generateAddonKeypair } from './crypto';
import { useAddonStore } from './store';
import { createDefaultBattleStats } from '@/progression/types';
import { createDefaultVimanaState } from '@/progression/vimana';
import { initializeEvolution } from '@/evolution';

const emptyState = () => ({
  vimana: createDefaultVimanaState(),
  evolution: initializeEvolution(),
  battle: createDefaultBattleStats(),
});

async function seedKeys() {
  const userKeys = await generateAddonKeypair();
  const issuerKeys = await generateAddonKeypair();
  window.localStorage.setItem('auralia_addon_user_keys', JSON.stringify(userKeys));
  window.localStorage.setItem('auralia_addon_issuer_keys', JSON.stringify(issuerKeys));
  useAddonStore.getState().setOwnerPublicKey(userKeys.publicKey);
}

describe('ACHIEVEMENT_REWARDS predicates', () => {
  it('are all unearned from a fresh game state', () => {
    const state = emptyState();
    for (const reward of ACHIEVEMENT_REWARDS) {
      expect(reward.isEarned(state)).toBe(false);
    }
  });

  it('shadow cloak unlocks at 25 Vimana scans', () => {
    const reward = ACHIEVEMENT_REWARDS.find((r) => r.template.id === 'shadow-cloak-001')!;
    const state = emptyState();
    state.vimana.scansPerformed = 24;
    expect(reward.isEarned(state)).toBe(false);
    state.vimana.scansPerformed = 25;
    expect(reward.isEarned(state)).toBe(true);
  });

  it('prismatic aura unlocks at the Speciation evolution stage', () => {
    const reward = ACHIEVEMENT_REWARDS.find((r) => r.template.id === 'prismatic-aura-001')!;
    const state = emptyState();
    state.evolution.state = 'SPECIATION';
    expect(reward.isEarned(state)).toBe(true);
  });

  it('floating familiar unlocks at 10 battle wins', () => {
    const reward = ACHIEVEMENT_REWARDS.find((r) => r.template.id === 'floating-familiar-001')!;
    const state = emptyState();
    state.battle.wins = 10;
    expect(reward.isEarned(state)).toBe(true);
  });
});

describe('checkAndGrantAchievementRewards', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAddonStore.setState({ addons: {}, equipped: {}, ownerPublicKey: '', positionOverrides: {} });
  });

  it('does nothing when no reward condition is met', async () => {
    await seedKeys();
    await checkAndGrantAchievementRewards(emptyState());
    expect(Object.keys(useAddonStore.getState().addons)).toHaveLength(0);
  });

  it('is a no-op when the addon keypairs are not yet initialized', async () => {
    const state = emptyState();
    state.battle.wins = 10;
    await checkAndGrantAchievementRewards(state);
    expect(Object.keys(useAddonStore.getState().addons)).toHaveLength(0);
  });

  it('mints and grants an owned, equippable addon once a condition is met', async () => {
    await seedKeys();
    const state = emptyState();
    state.battle.wins = 10;
    await checkAndGrantAchievementRewards(state);

    const owned = useAddonStore.getState().addons['floating-familiar-001-1'];
    expect(owned).toBeDefined();
    expect(owned.name).toBe('Ethereal Familiar');

    const equipped = useAddonStore.getState().equipAddon('floating-familiar-001-1');
    expect(equipped).toBe(true);
  });

  it('never mints the same reward twice', async () => {
    await seedKeys();
    const state = emptyState();
    state.battle.wins = 10;
    await checkAndGrantAchievementRewards(state);
    const firstIssuedAt =
      useAddonStore.getState().addons['floating-familiar-001-1'].ownership.issuedAt;
    await checkAndGrantAchievementRewards(state);
    const secondIssuedAt =
      useAddonStore.getState().addons['floating-familiar-001-1'].ownership.issuedAt;

    expect(secondIssuedAt).toBe(firstIssuedAt);
    expect(Object.keys(useAddonStore.getState().addons)).toHaveLength(1);
  });
});
