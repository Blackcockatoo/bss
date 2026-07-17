/**
 * Turns the static addon catalog into wardrobe-browsable entries, merging
 * in the player's owned copy where one exists so the browse grid always
 * reflects real ownership/equipment/position data instead of the template.
 */

import { ADDON_CATALOG, type AddonTemplate } from "./catalog";
import { normalizeAddon } from "./normalize";
import type { Addon, AddonOwnershipProof } from "./types";

/** Never a real proof — only used to satisfy `Addon`'s shape for display-
 * only, not-yet-owned catalog entries. Never passed to `addAddon`/mint/
 * verify, and never rendered as ownership info. */
const PREVIEW_ONLY_OWNERSHIP: AddonOwnershipProof = Object.freeze({
  ownerPublicKey: "",
  signature: "",
  issuedAt: 0,
  issuerPublicKey: "",
  issuerSignature: "",
  nonce: "",
});

export function templateToDisplayAddon(template: AddonTemplate): Addon {
  return normalizeAddon({
    ...template,
    ownership: PREVIEW_ONLY_OWNERSHIP,
    metadata: { ...template.metadata, createdAt: 0 },
  });
}

export interface WardrobeCatalogEntry {
  addon: Addon;
  owned: boolean;
}

export function buildWardrobeCatalog(
  ownedAddons: Record<string, Addon>,
): WardrobeCatalogEntry[] {
  return Object.values(ADDON_CATALOG).map((template) => {
    const owned = ownedAddons[template.id];
    return owned ? { addon: owned, owned: true } : { addon: templateToDisplayAddon(template), owned: false };
  });
}
