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
  ADDON_CATALOG,
  getAddonTemplate,
  getAddonsByCategory,
  getAddonsByRarity,
} from './catalog';
export { CUSTOM_ADDONS } from './customAddons';

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
