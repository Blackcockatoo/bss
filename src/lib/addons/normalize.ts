/**
 * Backward-compatible defaults for the Living Wardrobe schema fields added
 * on top of the original crypto-addon `Addon` shape (see types.ts). Every
 * addon minted before this uplift is missing these fields; this module is
 * the single place that fills them in, so the rest of the wardrobe code can
 * assume every field is present without re-deriving defaults per call site.
 *
 * Never mutates its input. Never touches `id`, `ownership`, or any other
 * pre-existing field — those must round-trip byte-for-byte.
 */

import type { Addon, AddonCategory } from "./types";

/** Items authored before form-compatibility existed are assumed to work on
 * Auralia (their original home) and Evolved/Body Forge, since both use the
 * same anchor-point vocabulary. Geometry/Sri Yantra has no addon anchor
 * system yet, so it is deliberately excluded from the default. */
const DEFAULT_COMPATIBLE_FORMS = Object.freeze(["auralia", "evolved"]) as Addon["compatibleForms"];

export function normalizeAddon(addon: Addon): Addon {
  const equipSlot: AddonCategory = addon.equipSlot ?? addon.category;
  const compatibleForms = addon.compatibleForms ?? DEFAULT_COMPATIBLE_FORMS;
  const compatibleAnchors = addon.compatibleAnchors ?? [addon.attachment.anchorPoint];
  const renderLayer = addon.renderLayer ?? "front";
  const interactionProfile = addon.interactionProfile ?? {};
  const reactiveBehaviour = addon.reactiveBehaviour ?? "none";
  const tryOnSupported = addon.tryOnSupported ?? true;
  const unlockMethod = addon.unlockMethod ?? { type: "unknown" as const };

  // Skip the object-copy when every field is already normalized: keeps
  // repeated normalization (e.g. per catalog render) allocation-free.
  if (
    equipSlot === addon.equipSlot &&
    compatibleForms === addon.compatibleForms &&
    compatibleAnchors === addon.compatibleAnchors &&
    renderLayer === addon.renderLayer &&
    interactionProfile === addon.interactionProfile &&
    reactiveBehaviour === addon.reactiveBehaviour &&
    tryOnSupported === addon.tryOnSupported &&
    unlockMethod === addon.unlockMethod
  ) {
    return addon;
  }

  return {
    ...addon,
    equipSlot,
    compatibleForms,
    compatibleAnchors,
    renderLayer,
    interactionProfile,
    reactiveBehaviour,
    tryOnSupported,
    unlockMethod,
  };
}

export function normalizeAddons(
  addons: Record<string, Addon>,
): Record<string, Addon> {
  const result: Record<string, Addon> = {};
  for (const [id, addon] of Object.entries(addons)) {
    result[id] = normalizeAddon(addon);
  }
  return result;
}
