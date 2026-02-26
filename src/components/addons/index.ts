/**
 * Addon Components Index
 * Export all addon-related components and utilities
 */

// Core addon system
export { AddonRenderer, AddonSVGDefs } from './AddonRenderer';
export { AddonInventoryPanel } from './AddonInventoryPanel';
export { CryptoKeyDisplay } from './CryptoKeyDisplay';
export { PetProfilePanel } from './PetProfilePanel';

// New addon components
export { CelestialAura, createCelestialAura } from './CelestialAura';
export { SpiritCompanion, createSpiritCompanion } from './SpiritCompanion';
export type { SpiritType } from './SpiritCompanion';
export { AmbientEffect, createAmbientEffect } from './AmbientEffect';
export type { EffectType } from './AmbientEffect';
export { WearableAccessory, createWearableAccessory } from './WearableAccessory';
export type { AccessoryType } from './WearableAccessory';

// Premium addons
export { HolographicVault } from './premium/HolographicVault';
export { EtherealBackground } from './premium/EtherealBackground';
export { QuantumDataFlow } from './premium/QuantumDataFlow';
