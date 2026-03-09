import type { AddonTemplate } from './catalog';

const creator = 'Auralia Custom Workshop';

const ACCESSORY_ATTACHMENT = {
  anchorPoint: 'back' as const,
  offset: { x: 0, y: 0, z: -4 },
  scale: 1,
  rotation: 0,
  followAnimation: true,
};

const CUSTOM_ADDON_LIST: AddonTemplate[] = [
  {
    id: 'custom-addon-1008',
    name: 'Quantum Entanglement Scarf',
    description: 'A scarf woven from entangled particles that shimmers with impossible geometries.',
    category: 'accessory',
    rarity: 'mythic',
    attachment: { ...ACCESSORY_ATTACHMENT, anchorPoint: 'back' },
    visual: { colors: { primary: '#6A5ACD', secondary: '#FF69B4', accent: '#00FFFF', glow: 'rgba(106, 90, 205, 0.45)' }, animation: { type: 'shimmer', duration: 1500, easing: 'ease-in-out' }, particles: { count: 15, color: '#FFFFFF', size: 2, behavior: 'burst' } },
    modifiers: { luck: 25, curiosity: 20 },
    metadata: { creator, tags: ['quantum', 'scarf', 'entanglement'], maxEditions: 5 },
  },
  {
    id: 'custom-addon-1009', name: 'Gravity Well Gauntlet', description: 'A gauntlet that manipulates local gravity and shifts momentum.', category: 'weapon', rarity: 'legendary',
    attachment: { anchorPoint: 'right-hand', offset: { x: 15, y: 6, z: 0 }, scale: 1.1, rotation: -18, followAnimation: true },
    visual: { colors: { primary: '#444444', secondary: '#2F2F2F', accent: '#8A8A8A', glow: 'rgba(68, 68, 68, 0.45)' }, animation: { type: 'pulse', duration: 1000, easing: 'ease-in-out' }, particles: { count: 10, color: '#36454F', size: 1.8, behavior: 'orbit' } },
    modifiers: { energy: 15, bond: 10 }, metadata: { creator, tags: ['gravity', 'gauntlet'], maxEditions: 15 },
  },
  {
    id: 'custom-addon-1010', name: 'Chrono-Shift Goggles', description: 'Goggles that reveal alternate timelines with temporal desync effects.', category: 'headwear', rarity: 'mythic',
    attachment: { anchorPoint: 'head', offset: { x: 0, y: -2, z: 0 }, scale: 0.9, rotation: 0, followAnimation: true },
    visual: { colors: { primary: '#1E90FF', secondary: '#FFD700', accent: '#87CEFA', glow: 'rgba(30, 144, 255, 0.4)' }, animation: { type: 'sparkle', duration: 800, easing: 'linear' }, particles: { count: 20, color: '#ADD8E6', size: 1.5, behavior: 'burst' } },
    modifiers: { curiosity: 30, luck: 10 }, metadata: { creator, tags: ['chrono', 'goggles'], maxEditions: 7 },
  },
  {
    id: 'custom-addon-1011', name: 'Echoing Void Orb', description: 'An orb that absorbs ambient sound and releases ghostly echoes.', category: 'companion', rarity: 'epic',
    attachment: { anchorPoint: 'floating', offset: { x: 32, y: -18, z: 0 }, scale: 0.42, rotation: 0, followAnimation: false },
    visual: { colors: { primary: '#191970', secondary: '#4B0082', accent: '#8E4585', glow: 'rgba(25, 25, 112, 0.5)' }, animation: { type: 'pulse', duration: 2000, easing: 'ease-in-out' }, particles: { count: 10, color: '#DDA0DD', size: 1.8, behavior: 'ambient' } },
    modifiers: { bond: 15, energy: 10 }, metadata: { creator, tags: ['void', 'orb'], maxEditions: 50 },
  },
  {
    id: 'custom-addon-1012', name: 'Reality Anchor Pin', description: 'A small pin that reinforces stability against temporal or spatial distortion.', category: 'accessory', rarity: 'legendary', attachment: { ...ACCESSORY_ATTACHMENT },
    visual: { colors: { primary: '#FFD700', secondary: '#DAA520', accent: '#FFFFFF', glow: 'rgba(255, 215, 0, 0.35)' }, animation: { type: 'glow', duration: 1000, easing: 'linear' }, particles: { count: 5, color: '#FFFFFF', size: 1.2, behavior: 'ambient' } },
    modifiers: { energy: 20, luck: 15 }, metadata: { creator, tags: ['anchor', 'reality'], maxEditions: 20 },
  },
  {
    id: 'custom-addon-1013', name: 'Dream Weaver Circlet', description: 'A circlet tuned to collective unconscious dream states.', category: 'headwear', rarity: 'epic',
    attachment: { anchorPoint: 'head', offset: { x: 0, y: -14, z: 0 }, scale: 0.95, rotation: 0, followAnimation: true },
    visual: { colors: { primary: '#9370DB', secondary: '#BA55D3', accent: '#FFC0CB', glow: 'rgba(147, 112, 219, 0.35)' }, animation: { type: 'shimmer', duration: 2500, easing: 'ease-in-out' }, particles: { count: 12, color: '#ADD8E6', size: 1.5, behavior: 'ambient' } },
    modifiers: { curiosity: 18, bond: 12 }, metadata: { creator, tags: ['dream', 'circlet'], maxEditions: 40 },
  },
  {
    id: 'custom-addon-1014', name: 'Temporal Loop Charm', description: 'A charm that causes tiny localized time loops.', category: 'accessory', rarity: 'mythic', attachment: { ...ACCESSORY_ATTACHMENT },
    visual: { colors: { primary: '#4682B4', secondary: '#B0C4DE', accent: '#FF4500', glow: 'rgba(70, 130, 180, 0.45)' }, animation: { type: 'rotate', duration: 500, easing: 'linear' }, particles: { count: 8, color: '#FFD700', size: 1.4, behavior: 'burst' } },
    modifiers: { luck: 20, energy: 15 }, metadata: { creator, tags: ['temporal', 'loop'], maxEditions: 8 },
  },
  {
    id: 'custom-addon-1015', name: 'Aetheric Blade', description: 'A blade forged from pure aether that phases in and out of reality.', category: 'weapon', rarity: 'legendary',
    attachment: { anchorPoint: 'right-hand', offset: { x: 14, y: 10, z: 0 }, scale: 1.35, rotation: -25, followAnimation: true },
    visual: { colors: { primary: '#00CED1', secondary: '#40E0D0', accent: '#FFFFFF', glow: 'rgba(0, 206, 209, 0.45)' }, animation: { type: 'shimmer', duration: 1200, easing: 'ease-in-out' }, particles: { count: 18, color: '#E0FFFF', size: 1.7, behavior: 'trail' } },
    modifiers: { energy: 22, curiosity: 10 }, metadata: { creator, tags: ['aether', 'blade'], maxEditions: 18 },
  },
  {
    id: 'custom-addon-1016', name: "Illusionist's Veil", description: 'A veil that distorts perception and blurs identity.', category: 'headwear', rarity: 'epic',
    attachment: { anchorPoint: 'head', offset: { x: 0, y: -6, z: 0 }, scale: 1, rotation: 0, followAnimation: true },
    visual: { colors: { primary: '#800080', secondary: '#FF00FF', accent: '#FFFF00', glow: 'rgba(128, 0, 128, 0.4)' }, animation: { type: 'pulse', duration: 1800, easing: 'ease-in-out' }, particles: { count: 15, color: '#FFC0CB', size: 1.6, behavior: 'ambient' } },
    modifiers: { curiosity: 15, bond: 10 }, metadata: { creator, tags: ['illusion', 'veil'], maxEditions: 35 },
  },
  {
    id: 'custom-addon-1017', name: 'Starlight Mantle', description: 'A cloak woven from captured starlight and drifting cosmic dust.', category: 'accessory', rarity: 'mythic', attachment: { ...ACCESSORY_ATTACHMENT, scale: 1.2 },
    visual: { colors: { primary: '#191970', secondary: '#4B0082', accent: '#FFFFFF', glow: 'rgba(25, 25, 112, 0.45)' }, animation: { type: 'sparkle', duration: 2000, easing: 'linear' }, particles: { count: 25, color: '#FFD700', size: 1.5, behavior: 'ambient' } },
    modifiers: { luck: 28, energy: 20 }, metadata: { creator, tags: ['starlight', 'mantle'], maxEditions: 6 },
  },
  {
    id: 'custom-addon-1018', name: 'Resonance Amplifier', description: 'An effect module that makes emotional resonance visible as energetic auras.', category: 'effect', rarity: 'legendary',
    attachment: { anchorPoint: 'aura', offset: { x: 0, y: 0, z: 0 }, scale: 1.7, rotation: 0, followAnimation: false },
    visual: { colors: { primary: '#FF4500', secondary: '#FFD700', accent: '#ADFF2F', glow: 'rgba(255, 69, 0, 0.4)' }, animation: { type: 'pulse', duration: 1000, easing: 'ease-in-out' }, particles: { count: 20, color: '#FFFFFF', size: 1.7, behavior: 'ambient' } },
    modifiers: { bond: 25, curiosity: 15 }, metadata: { creator, tags: ['resonance', 'amplifier'], maxEditions: 12 },
  },
  {
    id: 'custom-addon-1019', name: 'Void Step Boots', description: 'Boots that enable short steps through a pocket dimension.', category: 'accessory', rarity: 'mythic', attachment: { ...ACCESSORY_ATTACHMENT, anchorPoint: 'body', offset: { x: 0, y: 20, z: 0 } },
    visual: { colors: { primary: '#2F4F4F', secondary: '#696969', accent: '#000000', glow: 'rgba(47, 79, 79, 0.4)' }, animation: { type: 'shimmer', duration: 800, easing: 'ease-in-out' }, particles: { count: 10, color: '#D3D3D3', size: 1.4, behavior: 'trail' } },
    modifiers: { energy: 20, luck: 10 }, metadata: { creator, tags: ['void', 'boots'], maxEditions: 9 },
  },
  {
    id: 'custom-addon-1020', name: 'Reality Bending Ring', description: 'A ring that warps local reality and nudges improbable outcomes.', category: 'accessory', rarity: 'mythic', attachment: { ...ACCESSORY_ATTACHMENT, anchorPoint: 'left-hand', offset: { x: -12, y: 12, z: 0 }, scale: 0.5 },
    visual: { colors: { primary: '#FF8C00', secondary: '#FFA500', accent: '#FFFFFF', glow: 'rgba(255, 140, 0, 0.4)' }, animation: { type: 'pulse', duration: 1200, easing: 'ease-in-out' }, particles: { count: 7, color: '#FFDAB9', size: 1.2, behavior: 'ambient' } },
    modifiers: { luck: 30, curiosity: 20 }, metadata: { creator, tags: ['reality', 'ring'], maxEditions: 4 },
  },
  {
    id: 'custom-addon-1021', name: 'Chronal Compass', description: 'A compass tuned to paradoxes and temporal anomalies.', category: 'accessory', rarity: 'mythic', attachment: { ...ACCESSORY_ATTACHMENT, anchorPoint: 'floating', offset: { x: -24, y: -20, z: 0 }, scale: 0.7, followAnimation: false },
    visual: { colors: { primary: '#A9A9A9', secondary: '#696969', accent: '#FFD700', glow: 'rgba(169, 169, 169, 0.35)' }, animation: { type: 'rotate', duration: 3000, easing: 'linear' }, particles: { count: 10, color: '#ADD8E6', size: 1.3, behavior: 'ambient' } },
    modifiers: { curiosity: 25, luck: 18 }, metadata: { creator, tags: ['chrono', 'compass'], maxEditions: 7 },
  },
  {
    id: 'custom-addon-1022', name: 'Dimensional Shard Brooch', description: 'A brooch carrying a fractured shard from another dimension.', category: 'accessory', rarity: 'mythic', attachment: { ...ACCESSORY_ATTACHMENT },
    visual: { colors: { primary: '#8B008B', secondary: '#FF00FF', accent: '#E0FFFF', glow: 'rgba(139, 0, 139, 0.4)' }, animation: { type: 'shimmer', duration: 1800, easing: 'ease-in-out' }, particles: { count: 15, color: '#E0FFFF', size: 1.5, behavior: 'burst' } },
    modifiers: { luck: 22, curiosity: 18 }, metadata: { creator, tags: ['dimensional', 'brooch'], maxEditions: 6 },
  },
  {
    id: 'custom-addon-1023', name: 'Aura of Sentience', description: 'A sentient aura that reveals subtle truths through glyph-like shimmer.', category: 'aura', rarity: 'mythic',
    attachment: { anchorPoint: 'aura', offset: { x: 0, y: 0, z: 0 }, scale: 1.9, rotation: 0, followAnimation: false },
    visual: { colors: { primary: '#FFD700', secondary: '#ADFF2F', accent: '#00FFFF', glow: 'rgba(255, 215, 0, 0.45)' }, animation: { type: 'shimmer', duration: 2000, easing: 'ease-in-out' }, particles: { count: 20, color: '#FFFFFF', size: 1.6, behavior: 'ambient' } },
    modifiers: { curiosity: 30, energy: 20 }, metadata: { creator, tags: ['aura', 'sentience'], maxEditions: 5 },
  },
];

export const CUSTOM_ADDONS: Record<string, AddonTemplate> = Object.fromEntries(
  CUSTOM_ADDON_LIST.map(addon => [addon.id, addon])
);
