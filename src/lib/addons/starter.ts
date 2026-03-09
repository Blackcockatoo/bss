/**
 * Starter Addons - Quick setup for testing
 *
 * This provides an easy way to initialize the addon system with some starter items
 */

import { CELESTIAL_CROWN, WIZARD_HAT, WIZARD_STAFF } from "./catalog";
import { generateAddonKeypair } from "./crypto";
import { CUSTOM_ADDONS } from "./customAddons";
import { mintAddon } from "./mint";
import { useAddonStore } from "./store";

const STARTER_TEMPLATE_IDS = [
  WIZARD_HAT.id,
  WIZARD_STAFF.id,
  CELESTIAL_CROWN.id,
  "custom-addon-1008",
  "custom-addon-1009",
  "custom-addon-1010",
  "custom-addon-1024",
] as const;

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
    let userKeys = localStorage.getItem("auralia_addon_user_keys");
    let issuerKeys = localStorage.getItem("auralia_addon_issuer_keys");

    if (!userKeys || !issuerKeys) {
      // Generate keys
      const newUserKeys = await generateAddonKeypair();
      const newIssuerKeys = await generateAddonKeypair();

      localStorage.setItem(
        "auralia_addon_user_keys",
        JSON.stringify(newUserKeys),
      );
      localStorage.setItem(
        "auralia_addon_issuer_keys",
        JSON.stringify(newIssuerKeys),
      );

      userKeys = JSON.stringify(newUserKeys);
      issuerKeys = JSON.stringify(newIssuerKeys);
    }

    const userKeysData = JSON.parse(userKeys);
    const issuerKeysData = JSON.parse(issuerKeys);

    // Initialize store
    const { setOwnerPublicKey, addAddon, addons } = useAddonStore.getState();
    setOwnerPublicKey(userKeysData.publicKey);

    const starterTemplates = STARTER_TEMPLATE_IDS.map((id) => {
      if (id.startsWith("custom-addon-")) {
        return CUSTOM_ADDONS[id];
      }

      if (id === WIZARD_HAT.id) return WIZARD_HAT;
      if (id === WIZARD_STAFF.id) return WIZARD_STAFF;
      return CELESTIAL_CROWN;
    }).filter(Boolean);

    let created = 0;

    for (const template of starterTemplates) {
      // idempotent: only mint if user doesn't already own this template id
      if (addons[template.id]) {
        continue;
      }

      const addon = await mintAddon(
        {
          addonTypeId: template.id,
          recipientPublicKey: userKeysData.publicKey,
          edition: 1,
        },
        issuerKeysData.privateKey,
        issuerKeysData.publicKey,
        userKeysData.privateKey,
      );

      const success = await addAddon(addon);
      if (success) created++;
    }

    return {
      success: true,
      addonsCreated: created,
    };
  } catch (error) {
    console.error("Failed to initialize starter addons:", error);
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
  const userKeys = localStorage.getItem("auralia_addon_user_keys");
  const issuerKeys = localStorage.getItem("auralia_addon_issuer_keys");
  return !!(userKeys && issuerKeys);
}

/**
 * Reset addon system (for testing)
 */
export function resetAddonSystem(): void {
  localStorage.removeItem("auralia_addon_user_keys");
  localStorage.removeItem("auralia_addon_issuer_keys");
  localStorage.removeItem("auralia-addon-storage");
  useAddonStore.persist.clearStorage();
}
