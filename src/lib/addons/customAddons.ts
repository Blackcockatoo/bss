import type { AddonTemplate } from "./catalog";

const creator = "Auralia Custom Workshop";
const previewAsset = (file: string) => `/addons/epic/${file}`;

const ACCESSORY_ATTACHMENT = {
  anchorPoint: "back" as const,
  offset: { x: 0, y: 0, z: -4 },
  scale: 1,
  rotation: 0,
  followAnimation: true,
};

const CUSTOM_ADDON_LIST: AddonTemplate[] = [
  {
    id: "custom-addon-1008",
    name: "Quantum Entanglement Scarf",
    description:
      "A scarf woven from entangled particles that shimmers with impossible geometries and links two points in space.",
    category: "accessory",
    rarity: "mythic",
    attachment: { ...ACCESSORY_ATTACHMENT, anchorPoint: "back" },
    visual: {
      // Flowing double-wave scarf with tails and mid-knot
      svgPath:
        "M 15 42 C 25 28 38 52 50 42 C 62 32 75 56 85 44 L 88 54 C 78 68 62 46 50 56 C 38 66 25 42 12 58 Z M 46 42 L 54 42 C 54 50 50 58 50 58 C 50 58 46 50 46 42 Z",
      previewAsset: previewAsset("1008-quantum-entanglement-scarf.svg"),
      colors: {
        primary: "#7C3AED",
        secondary: "#EC4899",
        accent: "#06B6D4",
        glow: "rgba(124, 58, 237, 0.6)",
      },
      animation: { type: "shimmer", duration: 1200, easing: "ease-in-out" },
      particles: { count: 28, color: "#A5F3FC", size: 2, behavior: "trail" },
    },
    modifiers: { luck: 25, curiosity: 20 },
    metadata: {
      creator,
      tags: ["quantum", "scarf", "entanglement"],
      maxEditions: 5,
    },
  },
  {
    id: "custom-addon-1009",
    name: "Gravity Well Gauntlet",
    description:
      "A gauntlet ringed with collapsing gravity fields — matter bends, momentum shifts, reality warps.",
    category: "weapon",
    rarity: "legendary",
    attachment: {
      anchorPoint: "right-hand",
      offset: { x: 15, y: 6, z: 0 },
      scale: 1.1,
      rotation: -18,
      followAnimation: true,
    },
    visual: {
      // Multi-ring vortex with central singularity
      svgPath:
        "M 50 50 A 28 28 0 1 1 50.01 50 Z M 50 50 A 18 18 0 1 0 50.01 50 Z M 50 50 A 8 8 0 1 1 50.01 50 Z M 35 20 L 50 10 L 65 20 M 50 10 L 50 5 M 20 35 L 10 50 L 20 65 M 10 50 L 5 50 M 80 35 L 90 50 L 80 65 M 90 50 L 95 50",
      previewAsset: previewAsset("1009-gravity-well-gauntlet.svg"),
      colors: {
        primary: "#1E1B4B",
        secondary: "#4338CA",
        accent: "#818CF8",
        glow: "rgba(99, 102, 241, 0.65)",
      },
      animation: { type: "rotate", duration: 800, easing: "linear" },
      particles: { count: 32, color: "#6366F1", size: 2.2, behavior: "orbit" },
    },
    modifiers: { energy: 15, bond: 10 },
    metadata: { creator, tags: ["gravity", "gauntlet"], maxEditions: 15 },
  },
  {
    id: "custom-addon-1010",
    name: "Chrono-Shift Goggles",
    description:
      "Goggles that overlay alternate timelines — you see past and future simultaneously through their fractured lenses.",
    category: "headwear",
    rarity: "mythic",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: -2, z: 0 },
      scale: 0.9,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Dual lenses with strap, internal iris rings, and temporal crack
      svgPath:
        "M 5 45 L 28 38 A 14 14 0 1 1 28 62 L 5 55 Z M 72 38 L 95 45 L 95 55 L 72 62 A 14 14 0 1 1 72 38 Z M 42 48 L 58 48 M 50 48 L 50 52 M 34 50 A 4 4 0 1 1 34.01 50 Z M 66 50 A 4 4 0 1 1 66.01 50 Z M 40 50 A 10 10 0 1 1 40.01 50 Z M 60 50 A 10 10 0 1 1 60.01 50 Z",
      previewAsset: previewAsset("1010-chrono-shift-goggles.svg"),
      colors: {
        primary: "#0369A1",
        secondary: "#FCD34D",
        accent: "#BAE6FD",
        glow: "rgba(14, 165, 233, 0.55)",
      },
      animation: { type: "sparkle", duration: 700, easing: "linear" },
      particles: { count: 24, color: "#7DD3FC", size: 1.8, behavior: "burst" },
    },
    modifiers: { curiosity: 30, luck: 10 },
    metadata: { creator, tags: ["chrono", "goggles"], maxEditions: 7 },
  },
  {
    id: "custom-addon-1011",
    name: "Echoing Void Orb",
    description:
      "An orb that absorbs ambient sound and releases ghostly echoes — layers of resonance ripple outward forever.",
    category: "companion",
    rarity: "epic",
    attachment: {
      anchorPoint: "floating",
      offset: { x: 32, y: -18, z: 0 },
      scale: 0.42,
      rotation: 0,
      followAnimation: false,
    },
    visual: {
      // Concentric echo rings with inner core and ghostly wisps
      svgPath:
        "M 50 50 A 30 30 0 1 1 50.01 50 Z M 50 50 A 20 20 0 1 0 50.01 50 Z M 50 50 A 10 10 0 1 1 50.01 50 Z M 50 20 Q 60 35 50 50 Q 40 35 50 20 M 80 50 Q 65 60 50 50 Q 65 40 80 50 M 50 80 Q 40 65 50 50 Q 60 65 50 80 M 20 50 Q 35 40 50 50 Q 35 60 20 50",
      previewAsset: previewAsset("1011-echoing-void-orb.svg"),
      colors: {
        primary: "#2E1065",
        secondary: "#7C3AED",
        accent: "#C084FC",
        glow: "rgba(139, 92, 246, 0.60)",
      },
      animation: { type: "pulse", duration: 1800, easing: "ease-in-out" },
      particles: { count: 22, color: "#E879F9", size: 2.0, behavior: "ambient" },
    },
    modifiers: { bond: 15, energy: 10 },
    metadata: { creator, tags: ["void", "orb"], maxEditions: 50 },
  },
  {
    id: "custom-addon-1012",
    name: "Reality Anchor Pin",
    description:
      "A crystalline anchor-pin that reinforces local spacetime, preventing reality drift and temporal distortion.",
    category: "accessory",
    rarity: "legendary",
    attachment: { ...ACCESSORY_ATTACHMENT },
    visual: {
      // Anchor shape with crystal facets and stabilising rays
      svgPath:
        "M 50 12 L 58 24 L 50 20 L 42 24 Z M 50 20 L 50 55 M 30 40 A 20 5 0 1 0 70 40 M 38 58 L 26 72 M 62 58 L 74 72 M 26 72 L 38 72 M 62 72 L 74 72 M 42 28 L 58 28 M 44 32 L 56 32 M 46 36 L 54 36",
      previewAsset: previewAsset("1012-reality-anchor-pin.svg"),
      colors: {
        primary: "#D97706",
        secondary: "#FDE68A",
        accent: "#FFFFFF",
        glow: "rgba(251, 191, 36, 0.60)",
      },
      animation: { type: "glow", duration: 900, easing: "ease-in-out" },
      particles: { count: 18, color: "#FEF9C3", size: 1.5, behavior: "ambient" },
    },
    modifiers: { energy: 20, luck: 15 },
    metadata: { creator, tags: ["anchor", "reality"], maxEditions: 20 },
  },
  {
    id: "custom-addon-1013",
    name: "Dream Weaver Circlet",
    description:
      "A circlet tuned to collective unconscious dream states — woven threads carry sleeping visions to waking mind.",
    category: "headwear",
    rarity: "epic",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: -14, z: 0 },
      scale: 0.95,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Circlet band with dream-thread weave and moonstone centrepiece
      svgPath:
        "M 20 50 A 30 12 0 1 1 80 50 A 30 12 0 1 1 20 50 Z M 25 47 C 35 38 45 56 50 47 C 55 38 65 56 75 47 M 25 53 C 35 44 45 62 50 53 C 55 44 65 62 75 53 M 46 38 A 4 5 0 1 1 54 38 A 4 5 0 1 1 46 38 Z",
      previewAsset: previewAsset("1013-dream-weaver-circlet.svg"),
      colors: {
        primary: "#6D28D9",
        secondary: "#A78BFA",
        accent: "#FDF4FF",
        glow: "rgba(167, 139, 250, 0.55)",
      },
      animation: { type: "shimmer", duration: 2200, easing: "ease-in-out" },
      particles: { count: 20, color: "#DDD6FE", size: 1.6, behavior: "ambient" },
    },
    modifiers: { curiosity: 18, bond: 12 },
    metadata: { creator, tags: ["dream", "circlet"], maxEditions: 40 },
  },
  {
    id: "custom-addon-1014",
    name: "Temporal Loop Charm",
    description:
      "A charm that creates tiny localised time loops — the same moment lives in two directions at once.",
    category: "accessory",
    rarity: "mythic",
    attachment: { ...ACCESSORY_ATTACHMENT },
    visual: {
      // Möbius-style loop with timeline markers and central diamond
      svgPath:
        "M 50 15 C 72 15 85 30 85 50 C 85 70 72 85 50 85 C 28 85 15 70 15 50 C 15 30 28 15 50 15 M 50 22 C 68 22 78 34 78 50 C 78 66 68 78 50 78 C 32 78 22 66 22 50 C 22 34 32 22 50 22 M 50 40 L 58 50 L 50 60 L 42 50 Z M 50 15 L 53 22 M 85 50 L 78 53 M 50 85 L 47 78 M 15 50 L 22 47",
      previewAsset: previewAsset("1014-temporal-loop-charm.svg"),
      colors: {
        primary: "#1D4ED8",
        secondary: "#93C5FD",
        accent: "#F97316",
        glow: "rgba(59, 130, 246, 0.58)",
      },
      animation: { type: "rotate", duration: 450, easing: "linear" },
      particles: { count: 20, color: "#FED7AA", size: 1.6, behavior: "orbit" },
    },
    modifiers: { luck: 20, energy: 15 },
    metadata: { creator, tags: ["temporal", "loop"], maxEditions: 8 },
  },
  {
    id: "custom-addon-1015",
    name: "Aetheric Blade",
    description:
      "A blade forged from pure aether that phases in and out of reality, trailing light that cuts thought itself.",
    category: "weapon",
    rarity: "legendary",
    attachment: {
      anchorPoint: "right-hand",
      offset: { x: 14, y: 10, z: 0 },
      scale: 1.35,
      rotation: -25,
      followAnimation: true,
    },
    visual: {
      // Double-edged tapered blade with fuller groove and crossguard
      svgPath:
        "M 50 8 L 44 18 L 44 72 L 50 85 L 56 72 L 56 18 Z M 44 18 L 56 18 M 46 20 L 54 20 M 47 25 L 53 25 M 47 30 L 53 30 M 44 65 L 56 65 M 34 72 L 66 72 L 64 78 L 36 78 Z M 49 8 L 49 85 M 51 8 L 51 85",
      previewAsset: previewAsset("1015-aetheric-blade.svg"),
      colors: {
        primary: "#0891B2",
        secondary: "#67E8F9",
        accent: "#F0FDFA",
        glow: "rgba(6, 182, 212, 0.60)",
      },
      animation: { type: "shimmer", duration: 1000, easing: "ease-in-out" },
      particles: { count: 30, color: "#CFFAFE", size: 1.8, behavior: "trail" },
    },
    modifiers: { energy: 22, curiosity: 10 },
    metadata: { creator, tags: ["aether", "blade"], maxEditions: 18 },
  },
  {
    id: "custom-addon-1016",
    name: "Illusionist's Veil",
    description:
      "A veil that dissolves identity boundaries — observer and observed merge, perception itself becomes fluid.",
    category: "headwear",
    rarity: "epic",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: -6, z: 0 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      // Layered translucent veil with distortion folds and mirage shimmer
      svgPath:
        "M 10 42 C 18 28 32 22 50 24 C 68 22 82 28 90 42 L 90 52 C 82 66 68 72 50 70 C 32 72 18 66 10 52 Z M 14 44 C 22 56 36 64 50 62 C 64 64 78 56 86 44 M 22 38 C 30 34 40 32 50 32 C 60 32 70 34 78 38 M 35 28 C 40 24 46 22 50 22 M 65 28 C 60 24 54 22 50 22 M 42 22 C 44 18 47 16 50 16 C 53 16 56 18 58 22",
      previewAsset: previewAsset("1016-illusionist-s-veil.svg"),
      colors: {
        primary: "#86198F",
        secondary: "#F0ABFC",
        accent: "#FEF08A",
        glow: "rgba(217, 70, 239, 0.55)",
      },
      animation: { type: "pulse", duration: 1600, easing: "ease-in-out" },
      particles: { count: 26, color: "#FAE8FF", size: 1.7, behavior: "ambient" },
    },
    modifiers: { curiosity: 15, bond: 10 },
    metadata: { creator, tags: ["illusion", "veil"], maxEditions: 35 },
  },
  {
    id: "custom-addon-1017",
    name: "Starlight Mantle",
    description:
      "A cloak woven from captured starlight and drifting cosmic dust — constellations shift with every breath.",
    category: "accessory",
    rarity: "mythic",
    attachment: { ...ACCESSORY_ATTACHMENT, scale: 1.2 },
    visual: {
      // Flowing mantle with star-field stitching and constellation lines
      svgPath:
        "M 22 18 C 30 12 42 10 50 10 C 58 10 70 12 78 18 L 88 82 C 74 90 60 94 50 92 C 40 94 26 90 12 82 Z M 22 18 C 28 28 32 40 30 55 C 35 70 44 82 50 88 M 78 18 C 72 28 68 40 70 55 C 65 70 56 82 50 88 M 32 30 L 40 26 L 38 34 L 44 28 M 58 22 L 64 18 L 62 26 L 68 20 M 24 50 L 30 46 L 28 54 M 72 44 L 78 48 L 72 52 M 42 68 L 48 64 L 44 72",
      previewAsset: previewAsset("1017-starlight-mantle.svg"),
      colors: {
        primary: "#0C0A20",
        secondary: "#6366F1",
        accent: "#FDE68A",
        glow: "rgba(99, 102, 241, 0.55)",
      },
      animation: { type: "sparkle", duration: 1800, easing: "linear" },
      particles: { count: 36, color: "#FEF3C7", size: 1.6, behavior: "ambient" },
    },
    modifiers: { luck: 28, energy: 20 },
    metadata: { creator, tags: ["starlight", "mantle"], maxEditions: 6 },
  },
  {
    id: "custom-addon-1018",
    name: "Resonance Amplifier",
    description:
      "An effect module that renders emotional resonance as visible aura rings — your feelings become light.",
    category: "effect",
    rarity: "legendary",
    attachment: {
      anchorPoint: "aura",
      offset: { x: 0, y: 0, z: 0 },
      scale: 1.7,
      rotation: 0,
      followAnimation: false,
    },
    visual: {
      // Expanding resonance rings with frequency nodes and amplitude peaks
      svgPath:
        "M 50 50 A 38 38 0 1 1 50.01 50 Z M 50 50 A 28 28 0 1 0 50.01 50 Z M 50 50 A 18 18 0 1 1 50.01 50 Z M 50 50 A 8 8 0 1 0 50.01 50 Z M 12 50 L 88 50 M 30 22 L 70 78 M 70 22 L 30 78 M 50 12 L 50 88 M 50 50 L 74 26 M 50 50 L 26 74",
      previewAsset: previewAsset("1018-resonance-amplifier.svg"),
      colors: {
        primary: "#DC2626",
        secondary: "#FBBF24",
        accent: "#86EFAC",
        glow: "rgba(239, 68, 68, 0.55)",
      },
      animation: { type: "pulse", duration: 900, easing: "ease-in-out" },
      particles: { count: 34, color: "#FEF9C3", size: 2.0, behavior: "ambient" },
    },
    modifiers: { bond: 25, curiosity: 15 },
    metadata: { creator, tags: ["resonance", "amplifier"], maxEditions: 12 },
  },
  {
    id: "custom-addon-1019",
    name: "Void Step Boots",
    description:
      "Boots threaded with pocket-dimension tunnels — each step phases through a fold of compressed space.",
    category: "accessory",
    rarity: "mythic",
    attachment: {
      ...ACCESSORY_ATTACHMENT,
      anchorPoint: "body",
      offset: { x: 0, y: 20, z: 0 },
    },
    visual: {
      // Phase-trail boots with dimensional rift lines and gravity ripple sole
      svgPath:
        "M 28 55 L 20 48 C 18 44 18 40 22 38 L 38 32 L 62 32 L 78 38 C 82 40 82 44 80 48 L 72 55 Z M 20 55 L 80 55 L 84 68 L 84 78 C 84 82 80 86 76 86 L 24 86 C 20 86 16 82 16 78 L 16 68 Z M 28 55 L 24 68 M 72 55 L 76 68 M 22 72 L 78 72 M 30 86 L 28 78 M 70 86 L 72 78 M 40 33 L 40 55 M 50 32 L 50 55 M 60 33 L 60 55",
      previewAsset: previewAsset("1019-void-step-boots.svg"),
      colors: {
        primary: "#134E4A",
        secondary: "#2DD4BF",
        accent: "#99F6E4",
        glow: "rgba(20, 184, 166, 0.55)",
      },
      animation: { type: "shimmer", duration: 750, easing: "ease-in-out" },
      particles: { count: 22, color: "#CCFBF1", size: 1.5, behavior: "trail" },
    },
    modifiers: { energy: 20, luck: 10 },
    metadata: { creator, tags: ["void", "boots"], maxEditions: 9 },
  },
  {
    id: "custom-addon-1020",
    name: "Reality Bending Ring",
    description:
      "A ring that warps local spacetime into a lens — improbable outcomes nudge toward the wearer.",
    category: "accessory",
    rarity: "mythic",
    attachment: {
      ...ACCESSORY_ATTACHMENT,
      anchorPoint: "left-hand",
      offset: { x: -12, y: 12, z: 0 },
      scale: 0.5,
    },
    visual: {
      // Torus ring with warp-lens distortion field and probability arc
      svgPath:
        "M 50 50 A 28 28 0 1 1 50.01 50 Z M 50 50 A 18 18 0 1 0 50.01 50 Z M 30 30 C 36 22 50 18 64 24 C 72 30 76 44 72 52 M 70 70 C 64 78 50 82 36 76 C 28 70 24 56 28 48 M 50 22 L 48 30 M 78 50 L 70 50 M 50 78 L 52 70 M 22 50 L 30 50",
      previewAsset: previewAsset("1020-reality-bending-ring.svg"),
      colors: {
        primary: "#C2410C",
        secondary: "#FB923C",
        accent: "#FFF7ED",
        glow: "rgba(249, 115, 22, 0.58)",
      },
      animation: { type: "rotate", duration: 1100, easing: "ease-in-out" },
      particles: { count: 16, color: "#FED7AA", size: 1.4, behavior: "orbit" },
    },
    modifiers: { luck: 30, curiosity: 20 },
    metadata: { creator, tags: ["reality", "ring"], maxEditions: 4 },
  },
  {
    id: "custom-addon-1021",
    name: "Chronal Compass",
    description:
      "A brass compass tuned to paradoxes — its needle points not north but toward temporal anomalies.",
    category: "accessory",
    rarity: "mythic",
    attachment: {
      ...ACCESSORY_ATTACHMENT,
      anchorPoint: "floating",
      offset: { x: -24, y: -20, z: 0 },
      scale: 0.7,
      followAnimation: false,
    },
    visual: {
      // Ornate compass with cardinal points, rotating needle, and engraved rim
      svgPath:
        "M 50 50 A 34 34 0 1 1 50.01 50 Z M 50 50 A 26 26 0 1 0 50.01 50 Z M 50 16 L 54 28 L 50 26 L 46 28 Z M 50 84 L 46 72 L 50 74 L 54 72 Z M 16 50 L 28 46 L 26 50 L 28 54 Z M 84 50 L 72 54 L 74 50 L 72 46 Z M 50 50 L 50 26 M 50 50 L 62 42 M 50 26 L 54 22 M 44 32 A 2 2 0 1 1 44.01 32 Z M 56 32 A 2 2 0 1 1 56.01 32 Z M 44 68 A 2 2 0 1 1 44.01 68 Z M 56 68 A 2 2 0 1 1 56.01 68 Z",
      previewAsset: previewAsset("1021-chronal-compass.svg"),
      colors: {
        primary: "#78350F",
        secondary: "#D97706",
        accent: "#FCD34D",
        glow: "rgba(217, 119, 6, 0.58)",
      },
      animation: { type: "rotate", duration: 2800, easing: "linear" },
      particles: { count: 16, color: "#FEF3C7", size: 1.4, behavior: "ambient" },
    },
    modifiers: { curiosity: 25, luck: 18 },
    metadata: { creator, tags: ["chrono", "compass"], maxEditions: 7 },
  },
  {
    id: "custom-addon-1022",
    name: "Dimensional Shard Brooch",
    description:
      "A brooch housing a fractured shard from a collapsed dimension — its edges refract light from places that no longer exist.",
    category: "accessory",
    rarity: "mythic",
    attachment: { ...ACCESSORY_ATTACHMENT },
    visual: {
      // Multi-facet crystal shard with internal fracture lines and prismatic edge
      svgPath:
        "M 50 8 L 68 28 L 74 50 L 62 78 L 50 88 L 38 78 L 26 50 L 32 28 Z M 50 8 L 50 88 M 32 28 L 68 28 M 26 50 L 74 50 M 38 78 L 62 78 M 50 8 L 74 50 M 50 8 L 26 50 M 68 28 L 62 78 M 32 28 L 38 78 M 50 28 L 62 50 L 50 72 L 38 50 Z",
      previewAsset: previewAsset("1022-dimensional-shard-brooch.svg"),
      colors: {
        primary: "#701A75",
        secondary: "#E879F9",
        accent: "#ECFEFF",
        glow: "rgba(217, 70, 239, 0.60)",
      },
      animation: { type: "shimmer", duration: 1600, easing: "ease-in-out" },
      particles: { count: 26, color: "#F0FDFA", size: 1.7, behavior: "burst" },
    },
    modifiers: { luck: 22, curiosity: 18 },
    metadata: { creator, tags: ["dimensional", "brooch"], maxEditions: 6 },
  },
  {
    id: "custom-addon-1023",
    name: "Aura of Sentience",
    description:
      "A sentient aura that perceives subtle truths through glyph-shimmer — the field watches, learns, and whispers back.",
    category: "aura",
    rarity: "mythic",
    attachment: {
      anchorPoint: "aura",
      offset: { x: 0, y: 0, z: 0 },
      scale: 1.9,
      rotation: 0,
      followAnimation: false,
    },
    visual: {
      // Layered aura rings with runic glyph markings and pulsing core halo
      svgPath:
        "M 50 8 A 42 42 0 1 1 50.01 8 Z M 50 16 A 34 34 0 1 0 50.01 16 Z M 50 24 A 26 26 0 1 1 50.01 24 Z M 26 36 L 34 28 L 42 36 L 50 28 L 58 36 L 66 28 L 74 36 M 26 64 L 34 72 L 42 64 L 50 72 L 58 64 L 66 72 L 74 64 M 18 50 L 22 44 M 18 50 L 22 56 M 82 50 L 78 44 M 82 50 L 78 56",
      previewAsset: previewAsset("1023-aura-of-sentience.svg"),
      colors: {
        primary: "#B45309",
        secondary: "#86EFAC",
        accent: "#67E8F9",
        glow: "rgba(234, 179, 8, 0.60)",
      },
      animation: { type: "shimmer", duration: 1900, easing: "ease-in-out" },
      particles: { count: 32, color: "#FEF9C3", size: 1.8, behavior: "ambient" },
    },
    modifiers: { curiosity: 30, energy: 20 },
    metadata: { creator, tags: ["aura", "sentience"], maxEditions: 5 },
  },
  {
    id: "custom-addon-1024",
    name: "Seraphic Pendant Field",
    description:
      "A living pendant lattice that projects a tesseract halo, helix strands, and oracle particles around Auralia's heart-field.",
    category: "accessory",
    rarity: "mythic",
    attachment: {
      anchorPoint: "body",
      offset: { x: 0, y: 16, z: 0 },
      scale: 0.9,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      svgPath:
        "M 50 8 C 34 8 20 15 8 31 C 22 22 33 18 50 18 C 67 18 78 22 92 31 C 80 15 66 8 50 8 Z M 50 33 C 33 33 20 46 20 63 C 20 82 34 94 50 94 C 66 94 80 82 80 63 C 80 46 67 33 50 33 Z M 50 41 L 59 55 L 76 58 L 64 70 L 67 87 L 50 78 L 33 87 L 36 70 L 24 58 L 41 55 Z",
      customRenderer: "seraphicPendantField",
      previewAsset: previewAsset("1024-seraphic-pendant-field.svg"),
      colors: {
        primary: "#101739",
        secondary: "#F3D87A",
        accent: "#7CF7FF",
        glow: "rgba(124, 247, 255, 0.45)",
      },
      animation: { type: "shimmer", duration: 1800, easing: "ease-in-out" },
      particles: { count: 20, color: "#7CF7FF", size: 1.6, behavior: "orbit" },
    },
    modifiers: { energy: 18, curiosity: 24, bond: 18, luck: 12 },
    metadata: {
      creator,
      tags: ["pendant", "tesseract", "helix", "oracle"],
      maxEditions: 3,
    },
  },
];

export const CUSTOM_ADDONS: Record<string, AddonTemplate> = Object.fromEntries(
  CUSTOM_ADDON_LIST.map((addon) => [addon.id, addon]),
);
