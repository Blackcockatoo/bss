/**
 * Starter Addons - Quick setup for testing
 *
 * This provides an easy way to initialize the addon system with some starter items
 */

import { mintAddon } from './mint';
import { useAddonStore } from './store';
import {
  WIZARD_HAT,
  WIZARD_STAFF,
  CELESTIAL_CROWN,
  SPACE_JEWBLES_BADGE,
  COSMIC_BANANA_WEAPON,
  MYTHIC_HUNTER_AURA,
} from './catalog';
import { generateAddonKeypair } from './crypto';

/**
 * Initialize addon system with starter items
 * Call this once to get some addons to play with
 */
export async function initializeStarterAddons(): Promise<{
  success: boolean;
  addonsCreated: number;
  error?: string;
}> {
  try {
    // Check if we already have keys
    let userKeys = localStorage.getItem('auralia_addon_user_keys');
    let issuerKeys = localStorage.getItem('auralia_addon_issuer_keys');

    if (!userKeys || !issuerKeys) {
      // Generate keys
      const newUserKeys = await generateAddonKeypair();
      const newIssuerKeys = await generateAddonKeypair();

      localStorage.setItem('auralia_addon_user_keys', JSON.stringify(newUserKeys));
      localStorage.setItem('auralia_addon_issuer_keys', JSON.stringify(newIssuerKeys));

      userKeys = JSON.stringify(newUserKeys);
      issuerKeys = JSON.stringify(newIssuerKeys);
    }

    const userKeysData = JSON.parse(userKeys);
    const issuerKeysData = JSON.parse(issuerKeys);

    // Initialize store
    const { setOwnerPublicKey, addAddon } = useAddonStore.getState();
    setOwnerPublicKey(userKeysData.publicKey);

    // Check if we already have addons
    const existingAddons = Object.keys(useAddonStore.getState().addons);
    if (existingAddons.length > 0) {
      return {
        success: true,
        addonsCreated: 0,
      };
    }

    // Create starter addons
    const starterTemplates = [WIZARD_HAT, WIZARD_STAFF, CELESTIAL_CROWN];
    let created = 0;

    for (const template of starterTemplates) {
      const addon = await mintAddon(
        {
          addonTypeId: template.id,
          recipientPublicKey: userKeysData.publicKey,
          edition: 1,
        },
        issuerKeysData.privateKey,
        issuerKeysData.publicKey,
        userKeysData.privateKey
      );

      const success = await addAddon(addon);
      if (success) created++;
    }

    return {
      success: true,
      addonsCreated: created,
    };
  } catch (error) {
    console.error('Failed to initialize starter addons:', error);
    return {
      success: false,
      addonsCreated: 0,
      error: String(error),
    };
  }
}

/**
 * Check if addon system is initialized
 */
export function isAddonSystemInitialized(): boolean {
  const userKeys = localStorage.getItem('auralia_addon_user_keys');
  const issuerKeys = localStorage.getItem('auralia_addon_issuer_keys');
  return !!(userKeys && issuerKeys);
}

/**
 * Reset addon system (for testing)
 */
export function resetAddonSystem(): void {
  localStorage.removeItem('auralia_addon_user_keys');
  localStorage.removeItem('auralia_addon_issuer_keys');
  localStorage.removeItem('auralia-addon-storage');
  useAddonStore.persist.clearStorage();
}

/**
 * Space Jewbles reward addon types
 */
export type SpaceJewblesRewardType = 'badge' | 'banana' | 'mythic-aura';

/**
 * Award a Space Jewbles addon based on achievement
 * Call this when a player earns a reward in Space Jewbles
 */
export async function awardSpaceJewblesAddon(
  rewardType: SpaceJewblesRewardType
): Promise<{ success: boolean; addonName?: string; error?: string }> {
  try {
    const userKeysRaw = localStorage.getItem('auralia_addon_user_keys');
    const issuerKeysRaw = localStorage.getItem('auralia_addon_issuer_keys');

    if (!userKeysRaw || !issuerKeysRaw) {
      // Initialize keys if not present
      await initializeStarterAddons();
      return awardSpaceJewblesAddon(rewardType);
    }

    const userKeys = JSON.parse(userKeysRaw);
    const issuerKeys = JSON.parse(issuerKeysRaw);

    // Select the template based on reward type
    const templateMap = {
      'badge': SPACE_JEWBLES_BADGE,
      'banana': COSMIC_BANANA_WEAPON,
      'mythic-aura': MYTHIC_HUNTER_AURA,
    };
    const template = templateMap[rewardType];

    if (!template) {
      return { success: false, error: 'Unknown reward type' };
    }

    // Check if player already has this addon
    const existingAddons = useAddonStore.getState().addons;
    const alreadyOwned = Object.values(existingAddons).some(
      (addon) => addon.id === template.id
    );

    if (alreadyOwned) {
      return { success: true, addonName: template.name }; // Already owned, no error
    }

    // Mint the new addon
    const addon = await mintAddon(
      {
        addonTypeId: template.id,
        recipientPublicKey: userKeys.publicKey,
        edition: Math.floor(Math.random() * 1000) + 1,
      },
      issuerKeys.privateKey,
      issuerKeys.publicKey,
      userKeys.privateKey
    );

    const { addAddon, setOwnerPublicKey } = useAddonStore.getState();
    setOwnerPublicKey(userKeys.publicKey);
    const added = await addAddon(addon);

    if (added) {
      console.log(`🎮 Space Jewbles reward unlocked: ${template.name}!`);
      return { success: true, addonName: template.name };
    }

    return { success: false, error: 'Failed to add addon to inventory' };
  } catch (error) {
    console.error('Failed to award Space Jewbles addon:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check and award Space Jewbles addons based on stats
 * Call this after each game run to check for new unlocks
 */
export async function checkSpaceJewblesRewards(stats: {
  maxWave: number;
  bossesDefeated: number;
  mythicDrops: number;
}): Promise<{ newUnlocks: string[] }> {
  const newUnlocks: string[] = [];

  // Badge: Reach wave 10+
  if (stats.maxWave >= 10) {
    const result = await awardSpaceJewblesAddon('badge');
    if (result.success && result.addonName) {
      newUnlocks.push(result.addonName);
    }
  }

  // Cosmic Banana: Defeat 5+ bosses total
  if (stats.bossesDefeated >= 5) {
    const result = await awardSpaceJewblesAddon('banana');
    if (result.success && result.addonName) {
      newUnlocks.push(result.addonName);
    }
  }

  // Mythic Hunter Aura: Collect 3+ mythic drops total
  if (stats.mythicDrops >= 3) {
    const result = await awardSpaceJewblesAddon('mythic-aura');
    if (result.success && result.addonName) {
      newUnlocks.push(result.addonName);
    }
  }

  return { newUnlocks };
}
