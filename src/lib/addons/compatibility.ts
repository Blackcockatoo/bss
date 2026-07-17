/**
 * Backward-compatible defaults and Living Wardrobe status resolution for
 * addons. Never mutates a stored Addon and never touches anything covered
 * by the crypto signature (see getAddonSigningPayload in crypto.ts) — this
 * module only computes read-time presentation/compatibility values.
 */

import type { Addon, AddonAttachment, AddonCategory } from "./types";

export interface ResolvedAddonDefaults {
  equipSlot: AddonCategory;
  compatibleAnchors: AddonAttachment["anchorPoint"][] | null;
  compatibleBodyShapes: string[] | null;
  renderLayer: "behind" | "body" | "front" | "aura";
  followsBody: boolean;
  reactsToPointer: boolean;
  reactiveBehaviour: "static" | "sway" | "orbit" | "pulseWithMood";
  tryOnSupported: boolean;
  unlockMethod: "starter" | "purchase" | "achievement" | "gift";
}

/** Fills in safe defaults for every optional Living Wardrobe field. `null` in a "compatible*" field means unrestricted. */
export function resolveAddonDefaults(addon: Addon): ResolvedAddonDefaults {
  return {
    equipSlot: addon.equipSlot ?? addon.category,
    compatibleAnchors: addon.compatibleAnchors ?? null,
    compatibleBodyShapes: addon.compatibleBodyShapes ?? null,
    renderLayer: addon.renderLayer ?? "front",
    followsBody: addon.interactionProfile?.followsBody ?? true,
    reactsToPointer: addon.interactionProfile?.reactsToPointer ?? false,
    reactiveBehaviour: addon.reactiveBehaviour ?? "static",
    tryOnSupported: addon.tryOnSupported ?? true,
    unlockMethod: addon.unlockMethod ?? "starter",
  };
}

export type AddonStatus =
  | "owned"
  | "equipped"
  | "available"
  | "locked"
  | "incompatible";

export interface AddonStatusContext {
  owned: boolean;
  equippedId?: string;
  /** Current pet's BodySpec shape id, or null when unknown (e.g. geometry form). */
  bodyShape: string | null;
}

export interface AddonStatusResult {
  status: AddonStatus;
  reason?: string;
}

/**
 * Resolves an addon's Living Wardrobe status:
 * - "incompatible" — explicitly restricted shape/anchor (existing addons
 *   never set these fields, so they're always compatible; overrides
 *   everything else, since it's true regardless of ownership).
 * - "equipped" / "owned" — already in inventory, currently worn or not.
 * - "available" — not owned yet, but free to claim via the existing
 *   starter-unlock flow.
 * - "locked" — not owned, and gated behind a plan/achievement/gift the
 *   Living Wardrobe does not sell or grant (no purchasing added here).
 */
export function getAddonStatus(
  addon: Addon,
  ctx: AddonStatusContext,
): AddonStatusResult {
  const defaults = resolveAddonDefaults(addon);

  if (
    ctx.bodyShape &&
    defaults.compatibleBodyShapes &&
    !defaults.compatibleBodyShapes.includes(ctx.bodyShape)
  ) {
    return {
      status: "incompatible",
      reason: `${addon.name} isn't designed for this body shape.`,
    };
  }

  if (ctx.owned) {
    return ctx.equippedId === addon.id
      ? { status: "equipped" }
      : { status: "owned" };
  }

  if (defaults.unlockMethod === "starter") {
    return { status: "available", reason: "Free to claim." };
  }

  return {
    status: "locked",
    reason:
      defaults.unlockMethod === "purchase"
        ? "Requires a plan upgrade."
        : defaults.unlockMethod === "achievement"
          ? "Unlocks from an in-app achievement."
          : "Not yet unlocked.",
  };
}
