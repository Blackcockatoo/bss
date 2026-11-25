import type { AddonTemplate } from "./catalog";

export const OLD_VIC_MANTLE_ID = "old-vic-state-mantle";

export const OLD_VIC_MANTLE: AddonTemplate = {
  id: OLD_VIC_MANTLE_ID,
  name: "Old Vic State Mantle",
  description: "Midnight velvet and antique gold. Try it on to see the ceremonial bow.",
  category: "accessory",
  rarity: "epic",
  compatibleForms: ["auralia", "evolved", "geometry"],
  renderLayer: "behind-body",
  attachment: {
    anchorPoint: "back",
    offset: { x: 0, y: 8, z: -4 },
    scale: 1.2,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    svgPath: "M40 19 Q18 19 14 42 L6 85 Q24 78 39 89 L50 81 L61 89 Q76 78 94 85 L86 42 Q82 19 60 19 L50 30 Z M19 44 L14 73 Q24 68 34 76 M81 44 L86 73 Q76 68 66 76 M39 34 L50 45 L61 34 M50 50 L55 58 L50 66 L45 58 Z",
    colors: { primary: "#20213b", secondary: "#c89e5a", accent: "#f5dca3" },
  },
  metadata: { creator: "Blue $nake Studio", tags: ["old-vic-state", "mantle"] },
};
