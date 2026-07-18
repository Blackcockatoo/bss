/**
 * Living Wardrobe — ephemeral UI/try-on state.
 *
 * Deliberately NOT `persist`-wrapped: this is the temporary preview layer,
 * separate from the canonical `useAddonStore` equipment store. Nothing here
 * is ever written to disk, so a page reload can never resurrect an
 * uncommitted preview (uplift requirement: "Reloading must never persist
 * uncommitted preview state").
 *
 * The wardrobe never mutates `useAddonStore` itself except through the one
 * explicit `equipAddon`/`unequipAddon` call made by "Equip"/"Remove" — every
 * other wardrobe action (open, browse, preview, switch preview, cancel,
 * close) only touches this store, which is exactly why Cancel and an
 * unexpected close can never corrupt saved equipment: there is nothing to
 * restore, because nothing was changed.
 */

import { create } from "zustand";
import type { Addon, PetForm } from "./types";

interface WardrobeState {
  isOpen: boolean;
  arrangeMode: boolean;
  /** The addon currently being tried on, if any. Not a store addon id —
   * the full object, so unowned catalog items can be previewed too. */
  previewAddon: Addon | null;
  /** Which pet form the current preview belongs to (guards against a
   * preview started for one form leaking onto another). */
  previewForm: PetForm | null;
  activeCategory: Addon["category"] | "all";

  openWardrobe: (form: PetForm) => void;
  /** Closing without an explicit Equip discards the preview — equivalent
   * to Cancel, since the equipment store was never touched. */
  closeWardrobe: () => void;
  previewAddonForForm: (addon: Addon, form: PetForm) => void;
  clearPreview: () => void;
  setArrangeMode: (value: boolean) => void;
  toggleArrangeMode: () => void;
  setActiveCategory: (category: Addon["category"] | "all") => void;
}

export const useWardrobeStore = create<WardrobeState>((set) => ({
  isOpen: false,
  arrangeMode: false,
  previewAddon: null,
  previewForm: null,
  activeCategory: "all",

  openWardrobe: (form) =>
    // Always opens clean: any preview left over from an unmounted/aborted
    // session is discarded rather than resurfacing unexpectedly.
    set({ isOpen: true, previewForm: form, previewAddon: null, arrangeMode: false }),
  closeWardrobe: () =>
    set({ isOpen: false, arrangeMode: false, previewAddon: null, previewForm: null }),
  previewAddonForForm: (addon, form) =>
    set({ previewAddon: addon, previewForm: form }),
  clearPreview: () => set({ previewAddon: null }),
  setArrangeMode: (value) =>
    // Entering Arrange Mode always drops any live preview — you arrange
    // equipped items, not previews.
    set((state) => ({ arrangeMode: value, previewAddon: value ? null : state.previewAddon })),
  toggleArrangeMode: () =>
    set((state) => ({
      arrangeMode: !state.arrangeMode,
      previewAddon: !state.arrangeMode ? null : state.previewAddon,
    })),
  setActiveCategory: (category) => set({ activeCategory: category }),
}));
