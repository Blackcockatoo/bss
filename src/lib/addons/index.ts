/**
 * Addon System - Main exports
 */

// Types
export type {
  Addon,
  AddonCategory,
  AddonRarity,
  AddonAttachment,
  AddonVisual,
  AddonOwnershipProof,
  AddonInventory,
  AddonVerificationResult,
  AddonMintRequest,
  AddonTransfer,
  AddonPositionOverride,
} from './types';

export type { AddonTemplate } from './catalog';

// Catalog
export {
  WIZARD_HAT,
  WIZARD_STAFF,
  CELESTIAL_CROWN,
  SHADOW_CLOAK,
  PRISMATIC_AURA,
  FLOATING_FAMILIAR,
  ADDON_CATALOG,
  getAddonTemplate,
  getAddonsByCategory,
  getAddonsByRarity,
} from './catalog';

// Crypto functions
export {
  generateAddonKeypair,
  verifyAddon,
  verifyAddonSignature,
  generateNonce,
  signTransfer,
  verifyTransfer,
  hashAddon,
} from './crypto';

// Minting functions
export {
  mintAddon,
  mintTimeLimitedAddon,
  batchMintAddons,
  createGiftAddon,
  validateClaimCode,
} from './mint';

// Store
export {
  useAddonStore,
  initializeAddonStore,
  exportAddonInventory,
  importAddonInventory,
} from './store';
