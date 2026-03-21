/**
 * Girl-Themed Addon Collection
 *
 * Simple, elegant cosmetic addons — lips, hair, purse, earrings, etc.
 * All paths are centered on (0,0) and pre-positioned to fit the Auralia pet
 * without any manual repositioning needed.
 */

import type { AddonTemplate } from "./catalog";

const creator = "Auralia Girl Collection";

export const GIRL_ADDON_LIST: AddonTemplate[] = [
  // ── 1. ROSE LIPS ────────────────────────────────────────────────────────────
  {
    id: "girl-rose-lips-001",
    name: "Rose Lips",
    description:
      "Soft, rosy lips in a classic cupid's bow shape. A delicate touch of colour for your pet.",
    category: "accessory",
    rarity: "uncommon",
    attachment: {
      anchorPoint: "head",
      // head anchor is at SVG (100, 35); offset.y=60 → places at (100, 95) — mouth level
      offset: { x: 0, y: 60, z: 0 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Upper lip: M-curve cupid's bow; lower lip: rounded arc. Centered on (0,0).
      svgPath: `
        M -9 0 Q -6 -4 -3 -3 Q 0 -5 3 -3 Q 6 -4 9 0
        Q 6 4 0 5 Q -6 4 -9 0 Z
      `,
      colors: {
        primary: "#E8527A",
        secondary: "#C2185B",
        accent: "#F8BBD9",
        glow: "rgba(232, 82, 122, 0.4)",
      },
      animation: {
        type: "shimmer",
        duration: 3000,
        easing: "ease-in-out",
      },
    },
    modifiers: { bond: 8, luck: 5 },
    metadata: {
      creator,
      tags: ["lips", "makeup", "girly", "face"],
      maxEditions: 500,
    },
  },

  // ── 2. HAIR BOW ─────────────────────────────────────────────────────────────
  {
    id: "girl-hair-bow-001",
    name: "Hair Bow",
    description:
      "A perky ribbon bow perched on top of the head. Sweet and instantly recognisable.",
    category: "headwear",
    rarity: "common",
    attachment: {
      anchorPoint: "head",
      // offset.y=38 → places at (100, 73) — top of head
      offset: { x: 0, y: 38, z: 0 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Left loop, right loop, centre knot — all centred on (0,0)
      svgPath: `
        M 0 0 Q -5 -7 -13 -5 Q -16 -2 -13 2 Q -8 5 0 0 Z
        M 0 0 Q 5 -7 13 -5 Q 16 -2 13 2 Q 8 5 0 0 Z
        M -3 -2 Q 0 -4 3 -2 Q 3 2 0 3 Q -3 2 -3 -2 Z
      `,
      colors: {
        primary: "#F06292",
        secondary: "#C2185B",
        accent: "#FFFFFF",
        glow: "rgba(240, 98, 146, 0.5)",
      },
      animation: {
        type: "float",
        duration: 2800,
        easing: "ease-in-out",
      },
      particles: {
        count: 5,
        color: "#F8BBD9",
        size: 1.5,
        behavior: "ambient",
      },
    },
    modifiers: { bond: 6, luck: 4 },
    metadata: {
      creator,
      tags: ["bow", "hair", "ribbon", "cute"],
      maxEditions: 1000,
    },
  },

  // ── 3. DIAMOND TIARA ────────────────────────────────────────────────────────
  {
    id: "girl-diamond-tiara-001",
    name: "Diamond Tiara",
    description:
      "A slender silver tiara set with three brilliant diamonds. Regal and refined.",
    category: "headwear",
    rarity: "rare",
    attachment: {
      anchorPoint: "head",
      // offset.y=32 → places at (100, 67) — just above head
      offset: { x: 0, y: 32, z: 0 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Curved band with 3 upward diamond spires — centred on (0,0)
      svgPath: `
        M -16 4 Q 0 0 16 4
        M -16 4 L -14 4
        M 14 4 L 16 4
        M -10 4 L -11 -2 L -8 -6 L -5 -2 L -6 4
        M 0 4 L -2 -4 L 0 -9 L 2 -4 L 0 4
        M 10 4 L 11 -2 L 8 -6 L 5 -2 L 6 4
        M -16 4 L -16 6 Q 0 8 16 6 L 16 4
      `,
      colors: {
        primary: "#E8EAF6",
        secondary: "#9FA8DA",
        accent: "#90CAF9",
        glow: "rgba(144, 202, 249, 0.6)",
      },
      animation: {
        type: "shimmer",
        duration: 2000,
        easing: "ease-in-out",
      },
      particles: {
        count: 8,
        color: "#FFFFFF",
        size: 1,
        behavior: "burst",
      },
    },
    modifiers: { bond: 12, luck: 10, curiosity: 5 },
    metadata: {
      creator,
      tags: ["tiara", "crown", "diamond", "princess", "elegant"],
      maxEditions: 200,
    },
  },

  // ── 4. FLORAL CROWN ─────────────────────────────────────────────────────────
  {
    id: "girl-floral-crown-001",
    name: "Floral Crown",
    description:
      "A garland of tiny flowers woven into a delicate crown. Fresh and whimsical.",
    category: "headwear",
    rarity: "uncommon",
    attachment: {
      anchorPoint: "head",
      // offset.y=30 → places at (100, 65) — resting on head
      offset: { x: 0, y: 30, z: 0 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Curved vine band with 5 flower blossoms along its arc — centred on (0,0)
      svgPath: `
        M -17 5 Q 0 -2 17 5
        M -14 2 A 3 3 0 1 1 -14.01 2
        M -7 -1 A 3 3 0 1 1 -7.01 -1
        M 0 -3 A 3 3 0 1 1 0.01 -3
        M 7 -1 A 3 3 0 1 1 7.01 -1
        M 14 2 A 3 3 0 1 1 14.01 2
      `,
      colors: {
        primary: "#A5D6A7",
        secondary: "#F48FB1",
        accent: "#FFF176",
        glow: "rgba(165, 214, 167, 0.4)",
      },
      animation: {
        type: "float",
        duration: 3500,
        easing: "ease-in-out",
      },
      particles: {
        count: 6,
        color: "#FFF176",
        size: 1.2,
        behavior: "ambient",
      },
    },
    modifiers: { bond: 8, energy: 5 },
    metadata: {
      creator,
      tags: ["floral", "crown", "flowers", "nature", "wreath"],
      maxEditions: 400,
    },
  },

  // ── 5. PEARL EARRINGS ───────────────────────────────────────────────────────
  {
    id: "girl-pearl-earrings-001",
    name: "Pearl Earrings",
    description:
      "Classic pearl drop earrings on each side. Timeless and quietly glamorous.",
    category: "accessory",
    rarity: "uncommon",
    attachment: {
      anchorPoint: "head",
      // offset.y=53 → places at (100, 88) — ear level; path places drops symmetrically at x ±17
      offset: { x: 0, y: 53, z: 0 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Two small stud + drop pearls, left ear at x=-17, right at x=17
      svgPath: `
        M -17 -2 L -17 2
        M -17 -3 A 1.5 1.5 0 1 1 -17.01 -3
        M -17 4 A 2.5 2.5 0 1 1 -17.01 4
        M 17 -2 L 17 2
        M 17 -3 A 1.5 1.5 0 1 1 17.01 -3
        M 17 4 A 2.5 2.5 0 1 1 17.01 4
      `,
      colors: {
        primary: "#FFF8E1",
        secondary: "#FFECB3",
        accent: "#FFFFFF",
        glow: "rgba(255, 248, 225, 0.7)",
      },
      animation: {
        type: "shimmer",
        duration: 2500,
        easing: "ease-in-out",
      },
    },
    modifiers: { bond: 7, luck: 6 },
    metadata: {
      creator,
      tags: ["earrings", "pearl", "jewellery", "elegant"],
      maxEditions: 400,
    },
  },

  // ── 6. GOLD HOOP EARRINGS ───────────────────────────────────────────────────
  {
    id: "girl-hoop-earrings-001",
    name: "Gold Hoop Earrings",
    description:
      "Sleek gold hoops that catch the light. Bold yet effortlessly chic.",
    category: "accessory",
    rarity: "common",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: 53, z: 0 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Two open-circle hoops, left at x=-17, right at x=17
      svgPath: `
        M -17 -3 A 4 4 0 0 1 -13 1
        M -17 -3 A 4 4 0 0 0 -21 1
        M 17 -3 A 4 4 0 0 0 21 1
        M 17 -3 A 4 4 0 0 1 13 1
      `,
      colors: {
        primary: "#FFD54F",
        secondary: "#FFB300",
        accent: "#FFF8E1",
        glow: "rgba(255, 213, 79, 0.5)",
      },
      animation: {
        type: "shimmer",
        duration: 2000,
        easing: "ease-in-out",
      },
    },
    modifiers: { bond: 5, luck: 7 },
    metadata: {
      creator,
      tags: ["earrings", "hoop", "gold", "jewellery"],
      maxEditions: 600,
    },
  },

  // ── 7. MINI CLUTCH PURSE ────────────────────────────────────────────────────
  {
    id: "girl-clutch-purse-001",
    name: "Mini Clutch Purse",
    description:
      "A tiny blush-pink clutch with a gold clasp. The perfect fashionable accessory.",
    category: "companion",
    rarity: "rare",
    attachment: {
      anchorPoint: "floating",
      // floating anchor is (100, 70); offset → places at (135, 105) beside the body
      offset: { x: 35, y: 35, z: 0 },
      scale: 1.0,
      rotation: -8,
      followAnimation: false,
    },
    visual: {
      // Rectangular clutch body + handle loop + clasp bar — centred on (0,0)
      svgPath: `
        M -10 -7 Q -10 -9 -8 -9 L -3 -9 Q 0 -13 3 -9 L 8 -9 Q 10 -9 10 -7
        L 10 7 Q 10 9 8 9 L -8 9 Q -10 9 -10 7 Z
        M -7 0 L 7 0
        M -3 0 A 3 2 0 0 0 3 0
      `,
      colors: {
        primary: "#F8BBD9",
        secondary: "#CE93D8",
        accent: "#FFD54F",
        glow: "rgba(248, 187, 217, 0.4)",
      },
      animation: {
        type: "float",
        duration: 3200,
        easing: "ease-in-out",
      },
      particles: {
        count: 4,
        color: "#FFD54F",
        size: 1,
        behavior: "ambient",
      },
    },
    modifiers: { luck: 12, bond: 8 },
    metadata: {
      creator,
      tags: ["purse", "bag", "clutch", "fashion", "accessory"],
      maxEditions: 150,
    },
  },

  // ── 8. PEARL NECKLACE ───────────────────────────────────────────────────────
  {
    id: "girl-pearl-necklace-001",
    name: "Pearl Necklace",
    description:
      "A single strand of lustrous pearls draped around the neck. Classic elegance.",
    category: "accessory",
    rarity: "rare",
    attachment: {
      anchorPoint: "body",
      // body anchor is (100, 100); offset.y=-15 → places at (100, 85) — neck/collar
      offset: { x: 0, y: -15, z: 0 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Curved string of 9 evenly spaced pearl circles — centred on (0,0)
      svgPath: `
        M -13 3 Q 0 -5 13 3
        M -13 3 A 1.8 1.8 0 1 1 -13.01 3
        M -9.5 0 A 1.8 1.8 0 1 1 -9.51 0
        M -6 -2 A 1.8 1.8 0 1 1 -6.01 -2
        M -3 -4 A 1.8 1.8 0 1 1 -3.01 -4
        M 0 -5 A 1.8 1.8 0 1 1 0.01 -5
        M 3 -4 A 1.8 1.8 0 1 1 3.01 -4
        M 6 -2 A 1.8 1.8 0 1 1 6.01 -2
        M 9.5 0 A 1.8 1.8 0 1 1 9.51 0
        M 13 3 A 1.8 1.8 0 1 1 13.01 3
      `,
      colors: {
        primary: "#FFF8E1",
        secondary: "#FFECB3",
        accent: "#FFFFFF",
        glow: "rgba(255, 248, 225, 0.5)",
      },
      animation: {
        type: "shimmer",
        duration: 3000,
        easing: "ease-in-out",
      },
    },
    modifiers: { bond: 10, luck: 8 },
    metadata: {
      creator,
      tags: ["necklace", "pearl", "jewellery", "elegant", "classic"],
      maxEditions: 200,
    },
  },

  // ── 9. LONG FLOWING HAIR ────────────────────────────────────────────────────
  {
    id: "girl-long-hair-001",
    name: "Long Flowing Hair",
    description:
      "Cascading golden waves that flow down the back. Lush, silky and full of movement.",
    category: "accessory",
    rarity: "epic",
    attachment: {
      anchorPoint: "back",
      // back anchor is (100, 100); offset.y=-18 → originates at (100, 82) behind head
      offset: { x: 0, y: -18, z: -5 },
      scale: 1.0,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Three flowing strands from the crown, descending with gentle waves
      svgPath: `
        M -8 -10 Q -12 5 -10 20 Q -14 30 -11 42 Q -15 50 -12 58
        M 0 -12 Q -2 5 0 22 Q -3 35 0 48 Q -2 56 0 65
        M 8 -10 Q 12 5 10 20 Q 14 30 11 42 Q 15 50 12 58
        M -8 -10 Q -4 -13 0 -12 Q 4 -13 8 -10
      `,
      colors: {
        primary: "#FFD54F",
        secondary: "#FFCC02",
        accent: "#FFF9C4",
        glow: "rgba(255, 213, 79, 0.3)",
      },
      animation: {
        type: "float",
        duration: 4000,
        easing: "ease-in-out",
      },
    },
    modifiers: { bond: 15, energy: 8 },
    metadata: {
      creator,
      tags: ["hair", "long", "flowing", "golden", "waves"],
      maxEditions: 100,
    },
  },

  // ── 10. BUTTERFLY HAIR CLIP ─────────────────────────────────────────────────
  {
    id: "girl-butterfly-clip-001",
    name: "Butterfly Hair Clip",
    description:
      "A dainty lavender butterfly clipped to the side of the head. Light as a whisper.",
    category: "headwear",
    rarity: "uncommon",
    attachment: {
      anchorPoint: "head",
      // offset places it at the right side of head: (114, 78)
      offset: { x: 14, y: 43, z: 0 },
      scale: 1.0,
      rotation: 15,
      followAnimation: true,
    },
    visual: {
      // Two upper wings, two lower wings, small body — centred on (0,0)
      svgPath: `
        M 0 0 Q -3 -6 -9 -5 Q -12 -2 -9 1 Q -5 4 0 0 Z
        M 0 0 Q 3 -6 9 -5 Q 12 -2 9 1 Q 5 4 0 0 Z
        M 0 0 Q -2 4 -6 6 Q -8 8 -5 9 Q -2 8 0 5 Z
        M 0 0 Q 2 4 6 6 Q 8 8 5 9 Q 2 8 0 5 Z
        M 0 -1 L 0 6
      `,
      colors: {
        primary: "#CE93D8",
        secondary: "#AB47BC",
        accent: "#F3E5F5",
        glow: "rgba(206, 147, 216, 0.5)",
      },
      animation: {
        type: "float",
        duration: 2200,
        easing: "ease-in-out",
      },
      particles: {
        count: 4,
        color: "#F3E5F5",
        size: 1,
        behavior: "ambient",
      },
    },
    modifiers: { luck: 9, bond: 6 },
    metadata: {
      creator,
      tags: ["butterfly", "clip", "hair", "lavender", "delicate"],
      maxEditions: 300,
    },
  },
];

export const GIRL_ADDONS: Record<string, AddonTemplate> = Object.fromEntries(
  GIRL_ADDON_LIST.map((a) => [a.id, a]),
);
