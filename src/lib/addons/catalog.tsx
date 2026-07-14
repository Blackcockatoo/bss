/**
 * Addon Catalog - Predefined addon templates
 *
 * These are the base definitions for addons. Actual instances will be minted
 * with crypto signatures tied to specific owners.
 */

import { CUSTOM_ADDONS } from "./customAddons";
import { GIRL_ADDONS } from "./girlAddons";
import type {
  Addon,
  AddonAttachment,
  AddonCategory,
  AddonRarity,
  AddonVisual,
} from "./types";

export interface AddonTemplate {
  id: string;
  name: string;
  description: string;
  category: AddonCategory;
  rarity: AddonRarity;
  attachment: AddonAttachment;
  visual: AddonVisual;
  modifiers?: {
    energy?: number;
    curiosity?: number;
    bond?: number;
    luck?: number;
  };
  metadata: {
    creator: string;
    tags?: string[];
    maxEditions?: number;
  };
}

/**
 * Wizard Hat - Epic headwear addon
 */
export const WIZARD_HAT: AddonTemplate = {
  id: "wizard-hat-001",
  name: "Mystical Wizard Hat",
  description:
    "A legendary pointed hat imbued with ancient wisdom. Grants increased curiosity and bond with mystical energies.",
  category: "headwear",
  rarity: "epic",
  attachment: {
    anchorPoint: "head",
    offset: { x: 0, y: -25, z: 0 },
    scale: 1.2,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    previewAsset: "/addons/epic/wizard-hat-001.svg",
    svgPath: `
      M 50 10
      L 35 50
      L 10 50
      L 15 55
      L 85 55
      L 90 50
      L 65 50
      Z
    `,
    colors: {
      primary: "#2D1B69", // Deep purple
      secondary: "#4A2F8A", // Medium purple
      accent: "#FFD700", // Gold
      glow: "rgba(138, 43, 226, 0.4)", // Purple glow
    },
    animation: {
      type: "float",
      duration: 3000,
      easing: "ease-in-out",
    },
    particles: {
      count: 8,
      color: "#FFD700",
      size: 2,
      behavior: "ambient",
    },
  },
  modifiers: {
    curiosity: 15,
    bond: 10,
  },
  metadata: {
    creator: "Auralia Workshop",
    tags: ["magic", "wisdom", "mystical", "headwear"],
    maxEditions: 100,
  },
};

/**
 * Wizard Staff - Legendary weapon addon
 */
export const WIZARD_STAFF: AddonTemplate = {
  id: "wizard-staff-001",
  name: "Staff of Eternal Wisdom",
  description:
    "A powerful staff carved from ancient wood and topped with a glowing crystal. Channels mystical energies and enhances all stats.",
  category: "weapon",
  rarity: "legendary",
  attachment: {
    anchorPoint: "right-hand",
    offset: { x: 12, y: 6, z: 0 },
    scale: 1.3,
    rotation: -18,
    followAnimation: true,
  },
  visual: {
    customRenderer: "wizardStaffSoulEngine",
    previewAsset: "/addons/epic/wizard-staff-001.svg",
    svgPath: `
      M 48 5 L 52 5 L 52 85 L 48 85 Z
      M 50 2 A 5 5 0 1 1 50 8 A 5 5 0 1 1 50 2
    `,
    colors: {
      primary: "#4A2F1A", // Dark wood
      secondary: "#8B4513", // Medium wood
      accent: "#00FFFF", // Cyan crystal
      glow: "rgba(0, 255, 255, 0.6)", // Cyan glow
    },
    animation: {
      type: "glow",
      duration: 2000,
      easing: "ease-in-out",
    },
    particles: {
      count: 12,
      color: "#00FFFF",
      size: 3,
      behavior: "orbit",
    },
  },
  modifiers: {
    energy: 20,
    curiosity: 20,
    bond: 15,
    luck: 10,
  },
  metadata: {
    creator: "Auralia Workshop",
    tags: ["magic", "power", "legendary", "weapon"],
    maxEditions: 50,
  },
};

// ============================================
// PREMIUM ADDONS
// ============================================

/**
 * Holographic Vault - Mythic effect addon (Premium)
 * A floating 3D cube vault with holographic interface
 */
export const HOLOGRAPHIC_VAULT: AddonTemplate = {
  id: "holographic-vault-001",
  name: "Holographic Vault",
  description:
    "A secure, gesture-controlled 3D storage interface with cryptographic authentication.",
  category: "effect",
  rarity: "mythic",
  attachment: {
    anchorPoint: "floating",
    offset: { x: 50, y: -20, z: 0 },
    scale: 0.6,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    // 3D cube vault with holographic display panels
    svgPath: `
      M 40 30 L 60 20 L 80 30 L 80 60 L 60 70 L 40 60 Z
      M 40 30 L 60 40 L 80 30
      M 60 40 L 60 70
      M 45 35 L 55 30 L 55 50 L 45 55 Z
      M 65 35 L 75 30 L 75 50 L 65 55 Z
      M 50 25 L 70 15 L 70 25 L 50 35 Z
    `,
    colors: {
      primary: "#4f46e5",
      secondary: "#7c3aed",
      accent: "#22d3ee",
      glow: "rgba(79, 70, 229, 0.5)",
    },
    animation: {
      type: "shimmer",
      duration: 2000,
      easing: "ease-in-out",
    },
    particles: {
      count: 10,
      color: "#22d3ee",
      size: 1.5,
      behavior: "ambient",
    },
  },
  modifiers: {
    bond: 25,
    luck: 20,
  },
  metadata: {
    creator: "Auralia Premium Workshop",
    tags: ["premium", "vault", "holographic", "3d", "secure"],
    maxEditions: 25,
  },
};

/**
 * Ethereal Background - Mythic effect addon (Premium)
 * A flowing ethereal aura that surrounds the pet
 */
export const ETHEREAL_BACKGROUND: AddonTemplate = {
  id: "ethereal-background-001",
  name: "Ethereal Background Engine",
  description:
    "Reactive, generative background patterns with mouse-tracking spring physics.",
  category: "effect",
  rarity: "mythic",
  attachment: {
    anchorPoint: "aura",
    offset: { x: 0, y: 0, z: 0 },
    scale: 2.0,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    // Flowing ethereal waves pattern
    svgPath: `
      M 20 50 Q 35 30 50 50 Q 65 70 80 50
      M 15 40 Q 30 20 50 40 Q 70 60 85 40
      M 25 60 Q 40 40 50 60 Q 60 80 75 60
      M 50 25 Q 60 35 50 45 Q 40 35 50 25
      M 30 55 Q 40 45 50 55 Q 60 65 70 55
    `,
    colors: {
      primary: "#d946ef",
      secondary: "#3b82f6",
      accent: "#06b6d4",
      glow: "rgba(217, 70, 239, 0.4)",
    },
    animation: {
      type: "shimmer",
      duration: 3000,
      easing: "linear",
    },
    particles: {
      count: 25,
      color: "#d946ef",
      size: 2,
      behavior: "ambient",
    },
  },
  modifiers: {
    energy: 30,
    curiosity: 25,
  },
  metadata: {
    creator: "Auralia Premium Workshop",
    tags: ["premium", "background", "ethereal", "reactive", "generative"],
    maxEditions: 25,
  },
};

/**
 * Quantum Data Flow - Mythic effect addon (Premium)
 * Orbiting data streams with quantum particle effects
 */
export const QUANTUM_DATA_FLOW: AddonTemplate = {
  id: "quantum-data-flow-001",
  name: "Quantum Data Flow",
  description:
    "Real-time multi-dimensional data stream visualization with particle-based flow.",
  category: "effect",
  rarity: "mythic",
  attachment: {
    anchorPoint: "floating",
    offset: { x: -50, y: -10, z: 0 },
    scale: 0.7,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    // Data stream visualization with orbital rings and nodes
    svgPath: `
      M 50 10 A 40 40 0 0 1 90 50 A 40 40 0 0 1 50 90 A 40 40 0 0 1 10 50 A 40 40 0 0 1 50 10
      M 50 25 A 25 25 0 0 1 75 50 A 25 25 0 0 1 50 75 A 25 25 0 0 1 25 50 A 25 25 0 0 1 50 25
      M 50 40 A 10 10 0 0 1 60 50 A 10 10 0 0 1 50 60 A 10 10 0 0 1 40 50 A 10 10 0 0 1 50 40
      M 50 50 L 90 50 M 50 50 L 50 10 M 50 50 L 10 50 M 50 50 L 50 90
      M 50 50 L 78 22 M 50 50 L 22 78 M 50 50 L 78 78 M 50 50 L 22 22
    `,
    colors: {
      primary: "#06b6d4",
      secondary: "#3b82f6",
      accent: "#22d3ee",
      glow: "rgba(6, 182, 212, 0.5)",
    },
    animation: {
      type: "rotate",
      duration: 8000,
      easing: "linear",
    },
    particles: {
      count: 16,
      color: "#22d3ee",
      size: 2,
      behavior: "orbit",
    },
  },
  modifiers: {
    energy: 25,
    curiosity: 30,
    luck: 15,
  },
  metadata: {
    creator: "Auralia Premium Workshop",
    tags: ["premium", "quantum", "data", "particles", "visualization"],
    maxEditions: 25,
  },
};

/**
 * Phoenix Wings - Legendary accessory addon (Premium)
 * Majestic fiery wings that trail embers
 */
export const PHOENIX_WINGS: AddonTemplate = {
  id: "phoenix-wings-001",
  name: "Phoenix Wings",
  description:
    "Majestic wings of living flame, leaving trails of glowing embers.",
  category: "accessory",
  rarity: "legendary",
  attachment: {
    anchorPoint: "back",
    offset: { x: 0, y: -10, z: -5 },
    scale: 1.4,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    // Detailed wing shapes with feather patterns
    svgPath: `
      M 50 50 Q 20 30 10 60 Q 15 50 25 55 Q 20 45 30 50 Q 25 40 35 45 Q 30 35 40 40 Q 35 30 50 35
      M 50 50 Q 80 30 90 60 Q 85 50 75 55 Q 80 45 70 50 Q 75 40 65 45 Q 70 35 60 40 Q 65 30 50 35
      M 50 50 Q 30 55 20 75 Q 25 65 35 70 Q 30 60 40 65
      M 50 50 Q 70 55 80 75 Q 75 65 65 70 Q 70 60 60 65
    `,
    colors: {
      primary: "#ff6b35",
      secondary: "#f72585",
      accent: "#ffd23f",
      glow: "rgba(255, 107, 53, 0.6)",
    },
    animation: {
      type: "float",
      duration: 2000,
      easing: "ease-in-out",
    },
    particles: {
      count: 15,
      color: "#ffd23f",
      size: 2,
      behavior: "trail",
    },
  },
  modifiers: {
    energy: 30,
    curiosity: 15,
    luck: 20,
  },
  metadata: {
    creator: "Auralia Premium Workshop",
    tags: ["premium", "wings", "phoenix", "fire", "legendary"],
    maxEditions: 30,
  },
};

/**
 * Crystal Heart - Epic companion addon (Premium)
 * A floating crystalline heart that pulses with energy
 */
export const CRYSTAL_HEART: AddonTemplate = {
  id: "crystal-heart-001",
  name: "Crystal Heart",
  description:
    "A sentient crystal heart that resonates with your pet's emotions.",
  category: "companion",
  rarity: "epic",
  attachment: {
    anchorPoint: "floating",
    offset: { x: -40, y: -25, z: 0 },
    scale: 0.5,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    // Heart shape with crystalline facets
    svgPath: `
      M 50 75 Q 20 50 20 35 Q 20 15 35 15 Q 50 15 50 30 Q 50 15 65 15 Q 80 15 80 35 Q 80 50 50 75
      M 35 25 L 45 35 L 35 45
      M 65 25 L 55 35 L 65 45
      M 50 40 L 50 60
      M 40 50 L 60 50
    `,
    colors: {
      primary: "#ec4899",
      secondary: "#f472b6",
      accent: "#fdf2f8",
      glow: "rgba(236, 72, 153, 0.5)",
    },
    animation: {
      type: "pulse",
      duration: 1500,
      easing: "ease-in-out",
    },
    particles: {
      count: 8,
      color: "#fdf2f8",
      size: 1.5,
      behavior: "ambient",
    },
  },
  modifiers: {
    bond: 35,
    energy: 10,
  },
  metadata: {
    creator: "Auralia Premium Workshop",
    tags: ["premium", "crystal", "heart", "companion", "emotional"],
    maxEditions: 50,
  },
};

/**
 * Void Mask - Mythic headwear addon (Premium)
 * A mysterious mask that peers into the void
 */
export const VOID_MASK: AddonTemplate = {
  id: "void-mask-001",
  name: "Mask of the Void",
  description: "An ancient mask that grants sight beyond the veil of reality.",
  category: "headwear",
  rarity: "mythic",
  attachment: {
    anchorPoint: "head",
    offset: { x: 0, y: 5, z: 0 },
    scale: 0.8,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    // Ornate mask with eye holes and decorative patterns
    svgPath: `
      M 25 40 Q 25 25 50 20 Q 75 25 75 40 Q 75 60 50 70 Q 25 60 25 40
      M 35 35 A 5 7 0 1 1 35 49 A 5 7 0 1 1 35 35
      M 65 35 A 5 7 0 1 1 65 49 A 5 7 0 1 1 65 35
      M 50 50 L 50 60 L 45 65 L 55 65 L 50 60
      M 30 30 L 25 25 M 70 30 L 75 25
      M 50 20 L 50 10 L 45 15 L 50 10 L 55 15
    `,
    colors: {
      primary: "#0f0f23",
      secondary: "#1e1b4b",
      accent: "#a855f7",
      glow: "rgba(168, 85, 247, 0.4)",
    },
    animation: {
      type: "shimmer",
      duration: 4000,
      easing: "ease-in-out",
    },
    particles: {
      count: 12,
      color: "#a855f7",
      size: 1,
      behavior: "ambient",
    },
  },
  modifiers: {
    curiosity: 40,
    bond: 15,
    luck: 25,
  },
  metadata: {
    creator: "Auralia Premium Workshop",
    tags: ["premium", "void", "mask", "mysterious", "mythic"],
    maxEditions: 15,
  },
};

/**
 * All available addon templates
 */
export const ADDON_CATALOG: Record<string, AddonTemplate> = {
  "wizard-hat-001": WIZARD_HAT,
  "wizard-staff-001": WIZARD_STAFF,
  // Premium addons
  "holographic-vault-001": HOLOGRAPHIC_VAULT,
  "ethereal-background-001": ETHEREAL_BACKGROUND,
  "quantum-data-flow-001": QUANTUM_DATA_FLOW,
  "phoenix-wings-001": PHOENIX_WINGS,
  "crystal-heart-001": CRYSTAL_HEART,
  "void-mask-001": VOID_MASK,
  ...CUSTOM_ADDONS,
  ...GIRL_ADDONS,
};

/**
 * Get addon template by ID
 */
export function getAddonTemplate(id: string): AddonTemplate | undefined {
  return ADDON_CATALOG[id];
}

/**
 * Get all addon templates by category
 */
export function getAddonsByCategory(category: AddonCategory): AddonTemplate[] {
  return Object.values(ADDON_CATALOG).filter(
    (addon) => addon.category === category,
  );
}

/**
 * Get all addon templates by rarity
 */
export function getAddonsByRarity(rarity: AddonRarity): AddonTemplate[] {
  return Object.values(ADDON_CATALOG).filter(
    (addon) => addon.rarity === rarity,
  );
}
