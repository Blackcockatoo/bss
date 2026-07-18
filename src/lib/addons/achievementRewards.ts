/**
 * Achievement Rewards - real, gameplay-earned wardrobe unlocks.
 *
 * Reuses catalog templates that already existed but were never granted to
 * anyone (not part of the starter set, not sold in the shop): once a
 * player's live game state satisfies a reward's condition, it is minted
 * into their addon inventory exactly like any purchased or starter addon —
 * same ownership, same equip flow, same renderer.
 */

'use client';

import { useEffect } from 'react';
import type { AddonTemplate } from './catalog';
import { FLOATING_FAMILIAR, PRISMATIC_AURA, SHADOW_CLOAK } from './catalog';
import { mintAddon } from './mint';
import { useAddonStore } from './store';
import { useStore } from '@/lib/store';
import type { MetaPetState } from '@/lib/store';

type ProgressSlice = Pick<MetaPetState, 'vimana' | 'evolution' | 'battle'>;

export interface AchievementReward {
  template: AddonTemplate;
  /** Player-facing description of how to earn this item. */
  condition: string;
  isEarned: (state: ProgressSlice) => boolean;
}

export const ACHIEVEMENT_REWARDS: AchievementReward[] = [
  {
    template: SHADOW_CLOAK,
    condition: 'Complete 25 Vimana scans',
    isEarned: (state) => state.vimana.scansPerformed >= 25,
  },
  {
    template: PRISMATIC_AURA,
    condition: 'Reach the Speciation evolution stage',
    isEarned: (state) => state.evolution.state === 'SPECIATION',
  },
  {
    template: FLOATING_FAMILIAR,
    condition: 'Win 10 battles',
    isEarned: (state) => state.battle.wins >= 10,
  },
];

const USER_KEYS_STORAGE_KEY = 'auralia_addon_user_keys';
const ISSUER_KEYS_STORAGE_KEY = 'auralia_addon_issuer_keys';

/**
 * Grant any newly-earned achievement rewards into the addon inventory.
 * Idempotent: templates already owned are skipped. Requires the addon
 * keypairs to already exist (see `initializeStarterAddons`) — if they don't
 * yet, this is a no-op and the next call (after init) will catch up.
 */
export async function checkAndGrantAchievementRewards(
  state: ProgressSlice,
): Promise<void> {
  const earned = ACHIEVEMENT_REWARDS.filter((reward) => reward.isEarned(state));
  if (earned.length === 0) return;

  const { addons: owned, addAddon } = useAddonStore.getState();
  const ownedIds = Object.values(owned).map((addon) => addon.id);
  // mintAddon composes ids as `${templateId}-${edition}`, not the bare
  // template id, so ownership is checked by prefix.
  const stillLocked = earned.filter(
    (reward) => !ownedIds.some((id) => id.startsWith(reward.template.id)),
  );
  if (stillLocked.length === 0) return;

  const userKeysRaw = window.localStorage.getItem(USER_KEYS_STORAGE_KEY);
  const issuerKeysRaw = window.localStorage.getItem(ISSUER_KEYS_STORAGE_KEY);
  if (!userKeysRaw || !issuerKeysRaw) return;

  const userKeys = JSON.parse(userKeysRaw);
  const issuerKeys = JSON.parse(issuerKeysRaw);

  for (const reward of stillLocked) {
    const addon = await mintAddon(
      { addonTypeId: reward.template.id, recipientPublicKey: userKeys.publicKey, edition: 1 },
      issuerKeys.privateKey,
      issuerKeys.publicKey,
      userKeys.privateKey,
    );
    await addAddon(addon);
  }
}

/** Mount once on the pet route: grants rewards on load and as progress changes. */
export function useAchievementRewardsSync(): void {
  useEffect(() => {
    const check = () => {
      const { vimana, evolution, battle } = useStore.getState();
      void checkAndGrantAchievementRewards({ vimana, evolution, battle });
    };

    check();

    const unsubscribe = useStore.subscribe((state, previous) => {
      if (
        state.vimana !== previous.vimana ||
        state.evolution !== previous.evolution ||
        state.battle !== previous.battle
      ) {
        check();
      }
    });

    return unsubscribe;
  }, []);
}
