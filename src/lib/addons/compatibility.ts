/**
 * Wardrobe compatibility rules.
 *
 * Pure functions only — the Living Wardrobe UI calls these to decide item
 * state (available / incompatible / locked) and to explain *why* an item
 * can't be worn, instead of silently hiding it (per the uplift brief:
 * "Geometry support may be limited... but the interface must explain
 * incompatibility rather than silently hide the wardrobe").
 */

import type { BodyShape } from "@/components/body-forge/PetBodyRenderer";
import type { Addon, PetForm } from "./types";
import { normalizeAddon } from "./normalize";

export type IncompatibilityReason =
  | "form-unsupported"
  | "body-shape-unsupported";

export interface CompatibilityResult {
  compatible: boolean;
  reason: IncompatibilityReason | null;
  message: string | null;
}

const FORM_LABELS: Record<PetForm, string> = {
  auralia: "Auralia",
  evolved: "Evolved / Body Forge",
  geometry: "Geometry / Sri Yantra",
};

/**
 * Whether `addon` can render on `form` at all (ignoring body shape). Used
 * for the wardrobe's per-form filter and for the item-card badge.
 */
export function isAddonCompatibleWithForm(
  addon: Addon,
  form: PetForm,
): CompatibilityResult {
  const normalized = normalizeAddon(addon);
  const forms = normalized.compatibleForms ?? [];
  if (forms.includes(form)) {
    return { compatible: true, reason: null, message: null };
  }
  return {
    compatible: false,
    reason: "form-unsupported",
    message: `${normalized.name} isn't wired up for the ${FORM_LABELS[form]} renderer yet.`,
  };
}

/**
 * Whether `addon` fits the given Body Forge shape. Only meaningful for the
 * Evolved/Body Forge form — Auralia and Geometry have their own fixed
 * silhouettes and never pass a `bodyShape`.
 */
export function isAddonCompatibleWithBodyShape(
  addon: Addon,
  bodyShape: BodyShape | null,
): CompatibilityResult {
  const normalized = normalizeAddon(addon);
  if (!bodyShape || !normalized.compatibleBodyShapes) {
    return { compatible: true, reason: null, message: null };
  }
  if (normalized.compatibleBodyShapes.includes(bodyShape)) {
    return { compatible: true, reason: null, message: null };
  }
  return {
    compatible: false,
    reason: "body-shape-unsupported",
    message: `${normalized.name} was authored for a different body shape and won't sit right on "${bodyShape}".`,
  };
}

/**
 * Full compatibility check for a specific pet: form first (hard gate), then
 * body shape (soft gate — only checked for forms that pass a shape).
 */
export function resolveAddonCompatibility(
  addon: Addon,
  form: PetForm,
  bodyShape: BodyShape | null = null,
): CompatibilityResult {
  const formResult = isAddonCompatibleWithForm(addon, form);
  if (!formResult.compatible) return formResult;
  return isAddonCompatibleWithBodyShape(addon, bodyShape);
}
