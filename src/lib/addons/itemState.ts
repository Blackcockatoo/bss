/**
 * Resolves a single, unambiguous display state per wardrobe card, plus the
 * "newly discovered" ribbon flag (which can coexist with any state — an
 * item can be simultaneously "owned" and "new").
 */

import type { BodyShape } from "@/components/body-forge/PetBodyRenderer";
import { resolveAddonCompatibility } from "./compatibility";
import type { Addon, PetForm } from "./types";

export type WardrobeItemState =
  | "previewing"
  | "equipped"
  | "owned"
  | "locked"
  | "incompatible";

export interface ResolvedItemState {
  state: WardrobeItemState;
  isNew: boolean;
  incompatibilityMessage: string | null;
}

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export function resolveWardrobeItemState(
  addon: Addon,
  options: {
    owned: boolean;
    equippedId: string | null;
    previewingId: string | null;
    form: PetForm;
    bodyShape: BodyShape | null;
    now?: number;
  },
): ResolvedItemState {
  const { owned, equippedId, previewingId, form, bodyShape } = options;
  const now = options.now ?? Date.now();

  const compatibility = resolveAddonCompatibility(addon, form, bodyShape);
  const isNew =
    owned && addon.metadata.createdAt > 0 && now - addon.metadata.createdAt <= NEW_WINDOW_MS;

  if (previewingId === addon.id) {
    return { state: "previewing", isNew, incompatibilityMessage: null };
  }
  if (!compatibility.compatible) {
    return { state: "incompatible", isNew, incompatibilityMessage: compatibility.message };
  }
  if (equippedId === addon.id) {
    return { state: "equipped", isNew, incompatibilityMessage: null };
  }
  if (owned) {
    return { state: "owned", isNew, incompatibilityMessage: null };
  }
  return { state: "locked", isNew, incompatibilityMessage: null };
}
