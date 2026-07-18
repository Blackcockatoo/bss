/**
 * Crypto-Secured Addon System for Auralia
 *
 * This system provides cryptographically-signed cosmetic addons that are tied to specific
 * ownership keys, making them non-copyable and verifiable.
 */

import type { BodyShape } from "@/components/body-forge/PetBodyRenderer";
import type { PetType } from "@/lib/store";

/** Mirrors `PetType`; kept local so the wardrobe compatibility rules read
 * clearly next to the addon schema they gate. */
export type PetForm = PetType;

export type AddonCategory =
  | "headwear"
  | "weapon"
  | "accessory"
  | "aura"
  | "companion"
  | "effect";

export type AddonRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

/**
 * Position and attachment data for rendering the addon
 */
export interface AddonAttachment {
  /** Where the addon attaches to the pet */
  anchorPoint:
    | "head"
    | "body"
    | "left-hand"
    | "right-hand"
    | "back"
    | "floating"
    | "aura";
  /** Offset from anchor point */
  offset: { x: number; y: number; z?: number };
  /** Scale relative to pet size */
  scale: number;
  /** Rotation in degrees */
  rotation: number;
  /** Whether to follow pet animations */
  followAnimation: boolean;
}

/**
 * Visual representation of the addon
 */
export interface AddonVisual {
  /** SVG path data or component reference */
  svgPath?: string;
  /** Optional custom equipped renderer */
  customRenderer?: "seraphicPendantField" | "wizardStaffSoulEngine";
  /** Optional full preview asset for inventory/shop cards */
  previewAsset?: string;
  /** Color palette for the addon */
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    glow?: string;
  };
  /** Animation effects */
  animation?: {
    type: "float" | "rotate" | "pulse" | "shimmer" | "sparkle" | "glow";
    duration: number;
    easing?: string;
  };
  /** Particle effects */
  particles?: {
    count: number;
    color: string;
    size: number;
    behavior: "orbit" | "trail" | "burst" | "ambient";
  };
}

/**
 * Cryptographic ownership proof
 * This makes the addon non-copyable and verifiable
 */
export interface AddonOwnershipProof {
  /** Public key of the owner (derived from their wallet or identity) */
  ownerPublicKey: string;
  /** Signature of the addon data signed with owner's private key */
  signature: string;
  /** Timestamp when the addon was issued */
  issuedAt: number;
  /** Optional expiration timestamp (for time-limited addons) */
  expiresAt?: number;
  /** Issuer's public key (the entity that created/sold the addon) */
  issuerPublicKey: string;
  /** Issuer's signature (proves authenticity) */
  issuerSignature: string;
  /** Nonce to prevent replay attacks */
  nonce: string;
}

/**
 * Core addon definition
 */
export interface Addon {
  /** Unique identifier for this addon type */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the addon */
  description: string;
  /** Category classification */
  category: AddonCategory;
  /** Rarity tier */
  rarity: AddonRarity;
  /** Attachment and positioning data */
  attachment: AddonAttachment;
  /** Visual representation */
  visual: AddonVisual;
  /** Stat modifiers (optional gameplay effects) */
  modifiers?: {
    energy?: number;
    curiosity?: number;
    bond?: number;
    luck?: number;
  };
  /** Ownership proof */
  ownership: AddonOwnershipProof;
  /** Metadata */
  metadata: {
    creator: string;
    createdAt: number;
    edition?: number; // For limited editions
    maxEditions?: number;
    tags?: string[];
  };

  // ── Living Wardrobe fields (v2) ──────────────────────────────────────
  // All optional and backward-compatible: `normalizeAddon()` fills a safe
  // default for any item minted before this uplift, so existing IDs,
  // ownership proofs and equipment state keep loading unchanged.

  /** Equipment slot this item occupies. Defaults to `category`. */
  equipSlot?: AddonCategory;
  /** Pet forms this item can render on. Defaults to `["auralia", "evolved"]`
   * — Geometry/Sri Yantra has no compatible anchor system yet. */
  compatibleForms?: PetForm[];
  /** Anchor points this item can attach to. Defaults to `[attachment.anchorPoint]`. */
  compatibleAnchors?: AddonAttachment["anchorPoint"][];
  /** Body Forge shapes this item was authored to fit. Undefined = fits all shapes. */
  compatibleBodyShapes?: BodyShape[];
  /** Draw order relative to the body silhouette. Defaults to `"front"`. */
  renderLayer?: "behind-body" | "front";
  /** How this item responds to direct pet interaction outside Arrange Mode. */
  interactionProfile?: {
    reactiveOnTouch?: boolean;
    reactiveOnStroke?: boolean;
  };
  /** Named reaction played on tap when `interactionProfile.reactiveOnTouch`. */
  reactiveBehaviour?: "shimmer" | "bounce" | "glow-pulse" | "none";
  /** Groups items into a themed collection (e.g. "lunar-set"). */
  family?: string;
  /** Set bonus/collection id, distinct from `family` (cosmetic grouping only). */
  setId?: string;
  /** Alternate colour presets a player can switch between once equipped. */
  colourways?: Array<{
    id: string;
    label: string;
    colors: AddonVisual["colors"];
  }>;
  /** Whether the Living Wardrobe may preview this item before it's owned. Defaults to `true`. */
  tryOnSupported?: boolean;
  /** How this item is obtained. Purely descriptive — no purchase flow. */
  unlockMethod?: {
    type: "starter" | "achievement" | "seasonal" | "gift" | "unknown";
    description?: string;
  };
}

/**
 * Custom position override for addon (user-defined via drag)
 */
export interface AddonPositionOverride {
  x: number;
  y: number;
  locked: boolean;
}

/**
 * User's addon inventory
 */
export interface AddonInventory {
  /** All owned addons, keyed by addon ID */
  addons: Record<string, Addon>;
  /** Currently equipped addon IDs per slot */
  equipped: {
    headwear?: string;
    weapon?: string;
    accessory?: string;
    aura?: string;
    companion?: string;
    effect?: string;
  };
  /** User's public key for ownership verification */
  ownerPublicKey: string;
  /** Custom position overrides per addon (user-set via dragging) */
  positionOverrides?: Record<string, AddonPositionOverride>;
}

/**
 * Addon verification result
 */
export interface AddonVerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    ownershipValid: boolean;
    issuerValid: boolean;
    notExpired: boolean;
    signatureValid: boolean;
  };
}

/**
 * Addon mint request (for creating new addons)
 */
export interface AddonMintRequest {
  addonTypeId: string;
  recipientPublicKey: string;
  edition?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Addon transfer data
 */
export interface AddonTransfer {
  addonId: string;
  fromPublicKey: string;
  toPublicKey: string;
  signature: string;
  timestamp: number;
  nonce: string;
}
