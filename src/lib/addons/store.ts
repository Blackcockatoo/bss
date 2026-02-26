/**
 * Addon Store - Zustand state management for addons
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Addon, AddonInventory, AddonTransfer, AddonPositionOverride } from './types';
import { verifyAddon, verifyTransfer, generateNonce } from './crypto';
import { signTransfer } from './crypto';

interface AddonStore extends AddonInventory {
  // Actions
  addAddon: (addon: Addon) => Promise<boolean>;
  removeAddon: (addonId: string) => void;
  equipAddon: (addonId: string) => boolean;
  unequipAddon: (category: keyof AddonInventory['equipped']) => void;
  transferAddon: (addonId: string, toPublicKey: string, privateKey: string) => Promise<AddonTransfer | null>;
  receiveAddon: (addon: Addon, transfer: AddonTransfer) => Promise<boolean>;
  verifyAllAddons: () => Promise<Record<string, boolean>>;
  setOwnerPublicKey: (publicKey: string) => void;

  // Position management
  setAddonPosition: (addonId: string, x: number, y: number) => void;
  lockAddonPosition: (addonId: string, locked: boolean) => void;
  resetAddonPosition: (addonId: string) => void;
  getAddonPosition: (addonId: string) => AddonPositionOverride | undefined;

  // Getters
  getAddon: (addonId: string) => Addon | undefined;
  getEquippedAddons: () => Addon[];
  getAddonsByCategory: (category: string) => Addon[];
  isAddonEquipped: (addonId: string) => boolean;
}

export const useAddonStore = create<AddonStore>()(
  persist(
    (set, get) => ({
      // Initial state
      addons: {},
      equipped: {},
      ownerPublicKey: '',
      positionOverrides: {},

      // Set owner public key
      setOwnerPublicKey: (publicKey: string) => {
        set({ ownerPublicKey: publicKey });
      },

      // Add an addon to inventory
      addAddon: async (addon: Addon) => {
        // Verify the addon first
        const verification = await verifyAddon(addon);
        if (!verification.valid) {
          console.error('Addon verification failed:', verification.errors);
          return false;
        }

        // Check if it's for the current owner
        const { ownerPublicKey } = get();
        const resolvedOwnerKey = ownerPublicKey || addon.ownership.ownerPublicKey;
        if (!ownerPublicKey) {
          set({ ownerPublicKey: resolvedOwnerKey });
        }
        if (addon.ownership.ownerPublicKey !== resolvedOwnerKey) {
          console.error('Addon is not owned by current user');
          return false;
        }

        set((state) => ({
          addons: {
            ...state.addons,
            [addon.id]: addon,
          },
        }));

        return true;
      },

      // Remove an addon from inventory
      removeAddon: (addonId: string) => {
        set((state) => {
          const { [addonId]: removed, ...rest } = state.addons;

          // Also unequip if it was equipped
          const equipped = { ...state.equipped };
          Object.keys(equipped).forEach((key) => {
            if (equipped[key as keyof typeof equipped] === addonId) {
              delete equipped[key as keyof typeof equipped];
            }
          });

          return {
            addons: rest,
            equipped,
          };
        });
      },

      // Equip an addon
      equipAddon: (addonId: string) => {
        const state = get();
        const addon = state.addons[addonId];

        if (!addon) {
          console.error('Addon not found:', addonId);
          return false;
        }

        // Unequip any addon in the same category
        set((state) => ({
          equipped: {
            ...state.equipped,
            [addon.category]: addonId,
          },
        }));

        return true;
      },

      // Unequip an addon category
      unequipAddon: (category: keyof AddonInventory['equipped']) => {
        set((state) => {
          const equipped = { ...state.equipped };
          delete equipped[category];
          return { equipped };
        });
      },

      // Set custom position for an addon
      setAddonPosition: (addonId: string, x: number, y: number) => {
        set((state) => ({
          positionOverrides: {
            ...state.positionOverrides,
            [addonId]: {
              x,
              y,
              locked: state.positionOverrides?.[addonId]?.locked ?? false,
            },
          },
        }));
      },

      // Lock/unlock addon position
      lockAddonPosition: (addonId: string, locked: boolean) => {
        set((state) => {
          const existing = state.positionOverrides?.[addonId];
          if (!existing) return state;
          return {
            positionOverrides: {
              ...state.positionOverrides,
              [addonId]: {
                ...existing,
                locked,
              },
            },
          };
        });
      },

      // Reset addon position to default
      resetAddonPosition: (addonId: string) => {
        set((state) => {
          const { [addonId]: removed, ...rest } = state.positionOverrides || {};
          return { positionOverrides: rest };
        });
      },

      // Get custom position for an addon
      getAddonPosition: (addonId: string) => {
        return get().positionOverrides?.[addonId];
      },

      // Transfer an addon to another user
      transferAddon: async (addonId: string, toPublicKey: string, privateKey: string) => {
        const state = get();
        const addon = state.addons[addonId];

        if (!addon) {
          console.error('Addon not found:', addonId);
          return null;
        }

        // Create transfer object
        const transfer: Omit<AddonTransfer, 'signature'> = {
          addonId,
          fromPublicKey: state.ownerPublicKey,
          toPublicKey,
          timestamp: Date.now(),
          nonce: generateNonce(),
        };

        // Sign the transfer
        const signature = await signTransfer(transfer, privateKey);

        const signedTransfer: AddonTransfer = {
          ...transfer,
          signature,
        };

        // Update addon ownership
        const updatedAddon: Addon = {
          ...addon,
          ownership: {
            ...addon.ownership,
            ownerPublicKey: toPublicKey,
          },
        };

        // Remove from current inventory
        get().removeAddon(addonId);

        return signedTransfer;
      },

      // Receive an addon from a transfer
      receiveAddon: async (addon: Addon, transfer: AddonTransfer) => {
        // Verify the transfer
        const transferValid = await verifyTransfer(transfer);
        if (!transferValid) {
          console.error('Transfer verification failed');
          return false;
        }

        // Verify the addon
        const addonValid = await verifyAddon(addon);
        if (!addonValid.valid) {
          console.error('Addon verification failed:', addonValid.errors);
          return false;
        }

        // Check if transfer is to current owner
        const { ownerPublicKey } = get();
        if (transfer.toPublicKey !== ownerPublicKey) {
          console.error('Transfer is not for current owner');
          return false;
        }

        // Add to inventory
        return await get().addAddon(addon);
      },

      // Verify all addons in inventory
      verifyAllAddons: async () => {
        const state = get();
        const results: Record<string, boolean> = {};

        for (const [id, addon] of Object.entries(state.addons)) {
          const verification = await verifyAddon(addon);
          results[id] = verification.valid;

          // Remove invalid addons
          if (!verification.valid) {
            console.warn(`Invalid addon detected: ${id}`, verification.errors);
            get().removeAddon(id);
          }
        }

        return results;
      },

      // Get a specific addon
      getAddon: (addonId: string) => {
        return get().addons[addonId];
      },

      // Get all equipped addons
      getEquippedAddons: () => {
        const state = get();
        return Object.values(state.equipped)
          .map((id) => state.addons[id!])
          .filter(Boolean);
      },

      // Get addons by category
      getAddonsByCategory: (category: string) => {
        const state = get();
        return Object.values(state.addons).filter(
          (addon) => addon.category === category
        );
      },

      // Check if an addon is equipped
      isAddonEquipped: (addonId: string) => {
        const state = get();
        return Object.values(state.equipped).includes(addonId);
      },
    }),
    {
      name: 'auralia-addon-storage',
      version: 1,
    }
  )
);

/**
 * Initialize the addon store with a user's public key
 */
export function initializeAddonStore(publicKey: string) {
  useAddonStore.getState().setOwnerPublicKey(publicKey);
}

/**
 * Export addon inventory for backup
 */
export function exportAddonInventory(): string {
  const state = useAddonStore.getState();
  return JSON.stringify({
    addons: state.addons,
    equipped: state.equipped,
    ownerPublicKey: state.ownerPublicKey,
    exportedAt: Date.now(),
  }, null, 2);
}

/**
 * Import addon inventory from backup
 */
export async function importAddonInventory(jsonData: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonData);

    if (!data.addons || !data.ownerPublicKey) {
      throw new Error('Invalid addon inventory data');
    }

    // Verify all addons before importing
    for (const addon of Object.values(data.addons) as Addon[]) {
      const verification = await verifyAddon(addon);
      if (!verification.valid) {
        console.error(`Invalid addon in import: ${addon.id}`, verification.errors);
        return false;
      }
    }

    // Import the data
    useAddonStore.setState({
      addons: data.addons,
      equipped: data.equipped || {},
      ownerPublicKey: data.ownerPublicKey,
    });

    return true;
  } catch (error) {
    console.error('Failed to import addon inventory:', error);
    return false;
  }
}
