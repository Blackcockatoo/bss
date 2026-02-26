/**
 * Addon Catalog - Predefined addon templates
 *
 * These are the base definitions for addons. Actual instances will be minted
 * with crypto signatures tied to specific owners.
 */

import type { Addon, AddonCategory, AddonRarity, AddonAttachment, AddonVisual } from './types';

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
  id: 'wizard-hat-001',
  name: 'Mystical Wizard Hat',
  description:
    'A legendary pointed hat imbued with ancient wisdom. Grants increased curiosity and bond with mystical energies.',
  category: 'headwear',
  rarity: 'epic',
  attachment: {
    anchorPoint: 'head',
    offset: { x: 0, y: -25, z: 0 },
    scale: 1.2,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
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
      primary: '#2D1B69', // Deep purple
      secondary: '#4A2F8A', // Medium purple
      accent: '#FFD700', // Gold
      glow: 'rgba(138, 43, 226, 0.4)', // Purple glow
    },
    animation: {
      type: 'float',
      duration: 3000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 8,
      color: '#FFD700',
      size: 2,
      behavior: 'ambient',
    },
  },
  modifiers: {
    curiosity: 15,
    bond: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['magic', 'wisdom', 'mystical', 'headwear'],
    maxEditions: 100,
  },
};

/**
 * Wizard Staff - Legendary weapon addon
 */
export const WIZARD_STAFF: AddonTemplate = {
  id: 'wizard-staff-001',
  name: 'Staff of Eternal Wisdom',
  description:
    'A powerful staff carved from ancient wood and topped with a glowing crystal. Channels mystical energies and enhances all stats.',
  category: 'weapon',
  rarity: 'legendary',
  attachment: {
    anchorPoint: 'right-hand',
    offset: { x: 15, y: 10, z: 0 },
    scale: 1.5,
    rotation: -30,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 48 5 L 52 5 L 52 85 L 48 85 Z
      M 50 2 A 5 5 0 1 1 50 8 A 5 5 0 1 1 50 2
    `,
    colors: {
      primary: '#4A2F1A', // Dark wood
      secondary: '#8B4513', // Medium wood
      accent: '#00FFFF', // Cyan crystal
      glow: 'rgba(0, 255, 255, 0.6)', // Cyan glow
    },
    animation: {
      type: 'glow',
      duration: 2000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 12,
      color: '#00FFFF',
      size: 3,
      behavior: 'orbit',
    },
  },
  modifiers: {
    energy: 20,
    curiosity: 20,
    bond: 15,
    luck: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['magic', 'power', 'legendary', 'weapon'],
    maxEditions: 50,
  },
};

/**
 * Celestial Crown - Mythic headwear addon
 */
export const CELESTIAL_CROWN: AddonTemplate = {
  id: 'celestial-crown-001',
  name: 'Crown of the Celestials',
  description:
    'A radiant crown worn by the most enlightened beings. Pulses with cosmic energy and grants transcendent wisdom.',
  category: 'headwear',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'head',
    offset: { x: 0, y: -20, z: 0 },
    scale: 1.0,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 20 40 L 25 30 L 30 40 L 35 25 L 40 40 L 45 30 L 50 20 L 55 30 L 60 40 L 65 25 L 70 40 L 75 30 L 80 40
      L 80 45 L 20 45 Z
    `,
    colors: {
      primary: '#FFD700', // Gold
      secondary: '#FFA500', // Orange gold
      accent: '#FFFFFF', // White
      glow: 'rgba(255, 215, 0, 0.8)', // Gold glow
    },
    animation: {
      type: 'shimmer',
      duration: 1500,
      easing: 'ease-in-out',
    },
    particles: {
      count: 20,
      color: '#FFFFFF',
      size: 2,
      behavior: 'burst',
    },
  },
  modifiers: {
    energy: 25,
    curiosity: 25,
    bond: 25,
    luck: 20,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['celestial', 'divine', 'mythic', 'crown'],
    maxEditions: 10,
  },
};

/**
 * Shadow Cloak - Rare accessory addon
 */
export const SHADOW_CLOAK: AddonTemplate = {
  id: 'shadow-cloak-001',
  name: 'Cloak of Shadows',
  description:
    'A mysterious cloak that shifts and flows like living darkness. Enhances stealth and mystique.',
  category: 'accessory',
  rarity: 'rare',
  attachment: {
    anchorPoint: 'back',
    offset: { x: 0, y: 5, z: -10 },
    scale: 1.3,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 30 20 Q 50 10 70 20 L 75 80 Q 50 90 25 80 Z
    `,
    colors: {
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#4a4e69',
      glow: 'rgba(74, 78, 105, 0.3)',
    },
    animation: {
      type: 'float',
      duration: 4000,
      easing: 'ease-in-out',
    },
  },
  modifiers: {
    energy: 5,
    bond: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['shadow', 'stealth', 'mysterious', 'accessory'],
    maxEditions: 200,
  },
};

/**
 * Prismatic Aura - Epic aura addon
 */
export const PRISMATIC_AURA: AddonTemplate = {
  id: 'prismatic-aura-001',
  name: 'Prismatic Aura',
  description: 'A shimmering aura that cycles through all colors of the spectrum.',
  category: 'aura',
  rarity: 'epic',
  attachment: {
    anchorPoint: 'aura',
    offset: { x: 0, y: 0, z: 0 },
    scale: 1.5,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    colors: {
      primary: '#FF0080',
      secondary: '#00FFFF',
      accent: '#FFD700',
      glow: 'rgba(255, 0, 128, 0.3)',
    },
    animation: {
      type: 'shimmer',
      duration: 3000,
      easing: 'linear',
    },
    particles: {
      count: 30,
      color: '#FFFFFF',
      size: 2,
      behavior: 'ambient',
    },
  },
  modifiers: {
    energy: 10,
    curiosity: 10,
    bond: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['aura', 'rainbow', 'prismatic', 'colorful'],
    maxEditions: 150,
  },
};

/**
 * Floating Familiar - Legendary companion addon
 */
export const FLOATING_FAMILIAR: AddonTemplate = {
  id: 'floating-familiar-001',
  name: 'Ethereal Familiar',
  description: 'A small ethereal companion that floats beside your Auralia.',
  category: 'companion',
  rarity: 'legendary',
  attachment: {
    anchorPoint: 'floating',
    offset: { x: 30, y: -15, z: 0 },
    scale: 0.3,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    svgPath: `
      M 50 20 A 20 20 0 1 1 50 60 A 20 20 0 1 1 50 20
      M 45 35 A 3 3 0 1 1 45 41 A 3 3 0 1 1 45 35
      M 55 35 A 3 3 0 1 1 55 41 A 3 3 0 1 1 55 35
    `,
    colors: {
      primary: '#E0BBE4',
      secondary: '#D4A5D8',
      accent: '#FFDFD3',
      glow: 'rgba(224, 187, 228, 0.5)',
    },
    animation: {
      type: 'float',
      duration: 2500,
      easing: 'ease-in-out',
    },
    particles: {
      count: 5,
      color: '#FFDFD3',
      size: 1.5,
      behavior: 'trail',
    },
  },
  modifiers: {
    bond: 20,
    luck: 15,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['companion', 'familiar', 'ethereal', 'cute'],
    maxEditions: 75,
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
  id: 'holographic-vault-001',
  name: 'Holographic Vault',
  description: 'A secure, gesture-controlled 3D storage interface with cryptographic authentication.',
  category: 'effect',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'floating',
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
      primary: '#4f46e5',
      secondary: '#7c3aed',
      accent: '#22d3ee',
      glow: 'rgba(79, 70, 229, 0.5)',
    },
    animation: {
      type: 'shimmer',
      duration: 2000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 10,
      color: '#22d3ee',
      size: 1.5,
      behavior: 'ambient',
    },
  },
  modifiers: {
    bond: 25,
    luck: 20,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'vault', 'holographic', '3d', 'secure'],
    maxEditions: 25,
  },
};

/**
 * Ethereal Background - Mythic effect addon (Premium)
 * A flowing ethereal aura that surrounds the pet
 */
export const ETHEREAL_BACKGROUND: AddonTemplate = {
  id: 'ethereal-background-001',
  name: 'Ethereal Background Engine',
  description: 'Reactive, generative background patterns with mouse-tracking spring physics.',
  category: 'effect',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'aura',
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
      primary: '#d946ef',
      secondary: '#3b82f6',
      accent: '#06b6d4',
      glow: 'rgba(217, 70, 239, 0.4)',
    },
    animation: {
      type: 'shimmer',
      duration: 3000,
      easing: 'linear',
    },
    particles: {
      count: 25,
      color: '#d946ef',
      size: 2,
      behavior: 'ambient',
    },
  },
  modifiers: {
    energy: 30,
    curiosity: 25,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'background', 'ethereal', 'reactive', 'generative'],
    maxEditions: 25,
  },
};

/**
 * Quantum Data Flow - Mythic effect addon (Premium)
 * Orbiting data streams with quantum particle effects
 */
export const QUANTUM_DATA_FLOW: AddonTemplate = {
  id: 'quantum-data-flow-001',
  name: 'Quantum Data Flow',
  description: 'Real-time multi-dimensional data stream visualization with particle-based flow.',
  category: 'effect',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'floating',
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
      primary: '#06b6d4',
      secondary: '#3b82f6',
      accent: '#22d3ee',
      glow: 'rgba(6, 182, 212, 0.5)',
    },
    animation: {
      type: 'rotate',
      duration: 8000,
      easing: 'linear',
    },
    particles: {
      count: 16,
      color: '#22d3ee',
      size: 2,
      behavior: 'orbit',
    },
  },
  modifiers: {
    energy: 25,
    curiosity: 30,
    luck: 15,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'quantum', 'data', 'particles', 'visualization'],
    maxEditions: 25,
  },
};

/**
 * Phoenix Wings - Legendary accessory addon (Premium)
 * Majestic fiery wings that trail embers
 */
export const PHOENIX_WINGS: AddonTemplate = {
  id: 'phoenix-wings-001',
  name: 'Phoenix Wings',
  description: 'Majestic wings of living flame, leaving trails of glowing embers.',
  category: 'accessory',
  rarity: 'legendary',
  attachment: {
    anchorPoint: 'back',
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
      primary: '#ff6b35',
      secondary: '#f72585',
      accent: '#ffd23f',
      glow: 'rgba(255, 107, 53, 0.6)',
    },
    animation: {
      type: 'float',
      duration: 2000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 15,
      color: '#ffd23f',
      size: 2,
      behavior: 'trail',
    },
  },
  modifiers: {
    energy: 30,
    curiosity: 15,
    luck: 20,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'wings', 'phoenix', 'fire', 'legendary'],
    maxEditions: 30,
  },
};

/**
 * Crystal Heart - Epic companion addon (Premium)
 * A floating crystalline heart that pulses with energy
 */
export const CRYSTAL_HEART: AddonTemplate = {
  id: 'crystal-heart-001',
  name: 'Crystal Heart',
  description: 'A sentient crystal heart that resonates with your pet\'s emotions.',
  category: 'companion',
  rarity: 'epic',
  attachment: {
    anchorPoint: 'floating',
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
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#fdf2f8',
      glow: 'rgba(236, 72, 153, 0.5)',
    },
    animation: {
      type: 'pulse',
      duration: 1500,
      easing: 'ease-in-out',
    },
    particles: {
      count: 8,
      color: '#fdf2f8',
      size: 1.5,
      behavior: 'ambient',
    },
  },
  modifiers: {
    bond: 35,
    energy: 10,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'crystal', 'heart', 'companion', 'emotional'],
    maxEditions: 50,
  },
};

/**
 * Void Mask - Mythic headwear addon (Premium)
 * A mysterious mask that peers into the void
 */
export const VOID_MASK: AddonTemplate = {
  id: 'void-mask-001',
  name: 'Mask of the Void',
  description: 'An ancient mask that grants sight beyond the veil of reality.',
  category: 'headwear',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'head',
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
      primary: '#0f0f23',
      secondary: '#1e1b4b',
      accent: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.4)',
    },
    animation: {
      type: 'shimmer',
      duration: 4000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 12,
      color: '#a855f7',
      size: 1,
      behavior: 'ambient',
    },
  },
  modifiers: {
    curiosity: 40,
    bond: 15,
    luck: 25,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'void', 'mask', 'mysterious', 'mythic'],
    maxEditions: 15,
  },
};

// ============================================
// EARNABLE ADDONS (Game Rewards)
// ============================================

/**
 * Space Jewbles Champion Badge - Epic accessory (Earned)
 * Awarded for reaching wave 10+ in Space Jewbles
 */
export const SPACE_JEWBLES_BADGE: AddonTemplate = {
  id: 'space-jewbles-badge-001',
  name: 'Jewbles Champion Badge',
  description: 'A glowing badge awarded to those who survived wave 10 in Space Jewbles. Radiates cosmic banana energy.',
  category: 'accessory',
  rarity: 'epic',
  attachment: {
    anchorPoint: 'floating',
    offset: { x: -35, y: -30, z: 0 },
    scale: 0.4,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    svgPath: `
      M 50 15 L 61 40 L 88 40 L 67 55 L 76 82 L 50 67 L 24 82 L 33 55 L 12 40 L 39 40 Z
      M 50 30 A 8 8 0 1 1 50 46 A 8 8 0 1 1 50 30
    `,
    colors: {
      primary: '#FFD700',
      secondary: '#FFA500',
      accent: '#00FFFF',
      glow: 'rgba(255, 215, 0, 0.6)',
    },
    animation: {
      type: 'shimmer',
      duration: 2000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 6,
      color: '#FFD700',
      size: 2,
      behavior: 'ambient',
    },
  },
  modifiers: {
    energy: 15,
    luck: 20,
    bond: 10,
  },
  metadata: {
    creator: 'Space Jewbles',
    tags: ['earned', 'minigame', 'champion', 'space', 'jewbles'],
    maxEditions: 1000,
  },
};

/**
 * Cosmic Banana Weapon - Legendary weapon (Earned)
 * Awarded for defeating 5+ bosses in Space Jewbles
 */
export const COSMIC_BANANA_WEAPON: AddonTemplate = {
  id: 'cosmic-banana-001',
  name: 'Cosmic Banana of Doom',
  description: 'The ultimate banana weapon, infused with the power of defeated Space Jewbles bosses. It slips through dimensions.',
  category: 'weapon',
  rarity: 'legendary',
  attachment: {
    anchorPoint: 'right-hand',
    offset: { x: 20, y: 5, z: 0 },
    scale: 0.8,
    rotation: -15,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 30 70 Q 25 50 35 35 Q 50 20 70 25 Q 80 30 75 40 Q 65 35 55 40 Q 40 50 35 70 Z
      M 70 25 Q 75 20 80 22
    `,
    colors: {
      primary: '#FFE135',
      secondary: '#F4D03F',
      accent: '#00FFFF',
      glow: 'rgba(255, 225, 53, 0.5)',
    },
    animation: {
      type: 'float',
      duration: 1500,
      easing: 'ease-in-out',
    },
    particles: {
      count: 8,
      color: '#00FFFF',
      size: 2,
      behavior: 'trail',
    },
  },
  modifiers: {
    energy: 25,
    curiosity: 20,
    luck: 30,
  },
  metadata: {
    creator: 'Space Jewbles',
    tags: ['earned', 'minigame', 'boss', 'weapon', 'banana', 'cosmic'],
    maxEditions: 500,
  },
};

/**
 * Mythic Hunter Aura - Mythic aura (Earned)
 * Awarded for collecting 3+ mythic drops in Space Jewbles
 */
export const MYTHIC_HUNTER_AURA: AddonTemplate = {
  id: 'mythic-hunter-aura-001',
  name: 'Mythic Hunter\'s Aura',
  description: 'A shimmering aura that pulses with the essence of collected mythic items. Only the luckiest earn this.',
  category: 'aura',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'aura',
    offset: { x: 0, y: 0, z: 0 },
    scale: 1.8,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    colors: {
      primary: '#FF00FF',
      secondary: '#00FFFF',
      accent: '#FFD700',
      glow: 'rgba(255, 0, 255, 0.4)',
    },
    animation: {
      type: 'shimmer',
      duration: 2500,
      easing: 'linear',
    },
    particles: {
      count: 20,
      color: '#FFD700',
      size: 3,
      behavior: 'burst',
    },
  },
  modifiers: {
    luck: 40,
    bond: 20,
    curiosity: 15,
  },
  metadata: {
    creator: 'Space Jewbles',
    tags: ['earned', 'minigame', 'mythic', 'hunter', 'aura', 'rare'],
    maxEditions: 100,
  },
};

/**
 * All available addon templates
 */
export const ADDON_CATALOG: Record<string, AddonTemplate> = {
  'wizard-hat-001': WIZARD_HAT,
  'wizard-staff-001': WIZARD_STAFF,
  'celestial-crown-001': CELESTIAL_CROWN,
  'shadow-cloak-001': SHADOW_CLOAK,
  'prismatic-aura-001': PRISMATIC_AURA,
  'floating-familiar-001': FLOATING_FAMILIAR,
  // Earnable addons (from minigames)
  'space-jewbles-badge-001': SPACE_JEWBLES_BADGE,
  'cosmic-banana-001': COSMIC_BANANA_WEAPON,
  'mythic-hunter-aura-001': MYTHIC_HUNTER_AURA,
  // Premium addons
  'holographic-vault-001': HOLOGRAPHIC_VAULT,
  'ethereal-background-001': ETHEREAL_BACKGROUND,
  'quantum-data-flow-001': QUANTUM_DATA_FLOW,
  'phoenix-wings-001': PHOENIX_WINGS,
  'crystal-heart-001': CRYSTAL_HEART,
  'void-mask-001': VOID_MASK,
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
  return Object.values(ADDON_CATALOG).filter(addon => addon.category === category);
}

/**
 * Get all addon templates by rarity
 */
export function getAddonsByRarity(rarity: AddonRarity): AddonTemplate[] {
  return Object.values(ADDON_CATALOG).filter(addon => addon.rarity === rarity);
}
