"use client";

/**
 * Living Wardrobe — the primary equipment experience.
 *
 * Replaces the shop → inventory → equip journey with try-on built around
 * the active, already-mounted pet: this component never renders its own
 * copy of the pet (no duplicate renderer — see PRODUCTION PROTECTION in
 * the uplift brief). It is a fixed overlay that docks beside/below the
 * single canonical `PetRuntimeStage` already on the page, which is why the
 * pet stays visible throughout the decision.
 *
 * State model:
 *   - `useAddonStore` — canonical, persisted ownership/equipment. Only
 *     touched by the explicit Equip / Remove actions below.
 *   - `useWardrobeStore` — ephemeral try-on/UI state (open, category,
 *     preview, Arrange Mode). Never persisted, so a reload can never leave
 *     an uncommitted preview lying around, and closing/cancelling never
 *     has anything to "undo" in the equipment store.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Lock,
  Move,
  RotateCcw,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import type { BodyShape } from "@/components/body-forge/PetBodyRenderer";
import { buildWardrobeCatalog, type WardrobeCatalogEntry } from "@/lib/addons/catalogView";
import { resolveWardrobeItemState, type WardrobeItemState } from "@/lib/addons/itemState";
import { useAddonStore } from "@/lib/addons/store";
import type { Addon, AddonCategory, PetForm } from "@/lib/addons/types";
import { useWardrobeStore } from "@/lib/addons/wardrobeStore";
import { loadForgedBody } from "@/visual-dna/bodyForgeAdapter";

const CATEGORY_ORDER: Array<AddonCategory | "all"> = [
  "all",
  "headwear",
  "weapon",
  "accessory",
  "aura",
  "companion",
  "effect",
];

const CATEGORY_LABELS: Record<AddonCategory | "all", string> = {
  all: "All",
  headwear: "Headwear",
  weapon: "Weapon",
  accessory: "Accessory",
  aura: "Aura",
  companion: "Companion",
  effect: "Effect",
};

const FORM_LABELS: Record<PetForm, string> = {
  auralia: "Auralia",
  evolved: "Evolved / Body Forge",
  geometry: "Geometry / Sri Yantra",
};

const RARITY_GLOW: Record<Addon["rarity"], string> = {
  common: "shadow-[0_0_0_1px_rgba(148,163,184,0.25)]",
  uncommon: "shadow-[0_0_18px_-6px_rgba(34,197,94,0.55)]",
  rare: "shadow-[0_0_18px_-6px_rgba(59,130,246,0.6)]",
  epic: "shadow-[0_0_18px_-4px_rgba(168,85,247,0.65)]",
  legendary: "shadow-[0_0_22px_-4px_rgba(249,115,22,0.7)]",
  mythic: "shadow-[0_0_26px_-2px_rgba(244,114,182,0.75)]",
};

function useForgedBodyShape(): BodyShape | null {
  const [shape, setShape] = useState<BodyShape | null>(null);
  useEffect(() => {
    const sync = () => setShape(loadForgedBody()?.shape ?? null);
    sync();
    window.addEventListener("bss:body-forge:updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bss:body-forge:updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return shape;
}

const STATE_BADGE: Record<WardrobeItemState, { label: string; className: string }> = {
  previewing: { label: "Previewing", className: "bg-cyan-500 text-cyan-950" },
  equipped: { label: "Equipped", className: "bg-amber-400 text-amber-950" },
  owned: { label: "Owned", className: "bg-slate-700 text-slate-100" },
  locked: { label: "Locked", className: "bg-slate-800 text-slate-400" },
  incompatible: { label: "Incompatible", className: "bg-rose-900/80 text-rose-200" },
};

export interface LivingWardrobeProps {
  isOpen: boolean;
  onClose: () => void;
  form: PetForm;
}

export function LivingWardrobe({ isOpen, onClose, form }: LivingWardrobeProps) {
  const addons = useAddonStore((s) => s.addons);
  const equipped = useAddonStore((s) => s.equipped);
  const equipAddon = useAddonStore((s) => s.equipAddon);
  const unequipAddon = useAddonStore((s) => s.unequipAddon);

  const previewAddon = useWardrobeStore((s) => s.previewAddon);
  const previewForm = useWardrobeStore((s) => s.previewForm);
  const arrangeMode = useWardrobeStore((s) => s.arrangeMode);
  const activeCategory = useWardrobeStore((s) => s.activeCategory);
  const openWardrobe = useWardrobeStore((s) => s.openWardrobe);
  const closeWardrobe = useWardrobeStore((s) => s.closeWardrobe);
  const previewAddonForForm = useWardrobeStore((s) => s.previewAddonForForm);
  const clearPreview = useWardrobeStore((s) => s.clearPreview);
  const toggleArrangeMode = useWardrobeStore((s) => s.toggleArrangeMode);
  const setActiveCategory = useWardrobeStore((s) => s.setActiveCategory);

  const bodyShape = useForgedBodyShape();
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) openWardrobe(form);
  }, [isOpen, form, openWardrobe]);

  const catalog = useMemo(() => buildWardrobeCatalog(addons), [addons]);
  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? catalog
        : catalog.filter((entry) => entry.addon.category === activeCategory),
    [catalog, activeCategory],
  );

  const currentPreview = previewForm === form ? previewAddon : null;
  const equippedAddons = useMemo(
    () =>
      Object.values(equipped)
        .map((id) => (id ? addons[id] : undefined))
        .filter((a): a is Addon => Boolean(a)),
    [equipped, addons],
  );

  if (!isOpen) return null;

  const detailEntry = catalog.find((entry) => entry.addon.id === detailId) ?? null;

  const stateFor = (entry: WardrobeCatalogEntry) =>
    resolveWardrobeItemState(entry.addon, {
      owned: entry.owned,
      equippedId: equipped[entry.addon.equipSlot ?? entry.addon.category] ?? null,
      previewingId: currentPreview?.id ?? null,
      form,
      bodyShape,
    });

  const handleCardTap = (entry: WardrobeCatalogEntry) => {
    setDetailId(entry.addon.id);
    const state = stateFor(entry);
    // Equipped, incompatible and no-try-on items still open the detail
    // panel (so incompatibility/lock messaging is explained rather than
    // silently doing nothing) but never start a live preview.
    if (
      state.state === "equipped" ||
      state.state === "incompatible" ||
      !(entry.addon.tryOnSupported ?? true)
    ) {
      return;
    }
    previewAddonForForm(entry.addon, form);
  };

  const handleEquip = () => {
    if (!currentPreview) return;
    const entry = catalog.find((e) => e.addon.id === currentPreview.id);
    if (!entry?.owned) return;
    equipAddon(currentPreview.id);
    clearPreview();
  };

  const handleRemove = (addon: Addon) => {
    unequipAddon((addon.equipSlot ?? addon.category) as AddonCategory);
    if (currentPreview?.id === addon.id) clearPreview();
  };

  const handleClose = () => {
    closeWardrobe();
    setDetailId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Living Wardrobe">
      <button
        type="button"
        aria-label="Close wardrobe"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[60vh] flex-col rounded-t-3xl border-t border-cyan-900/50 bg-[radial-gradient(circle_at_top,_rgba(8,47,73,0.5),_rgba(2,6,23,0.98)_70%)] pb-[env(safe-area-inset-bottom)] shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[460px] lg:rounded-none lg:border-l lg:border-t-0"
        data-testid="living-wardrobe-panel"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">
              Living Wardrobe
            </p>
            <h2 className="text-lg font-semibold text-white">{FORM_LABELS[form]}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleArrangeMode}
              disabled={equippedAddons.length === 0}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                arrangeMode
                  ? "border-blue-400 bg-blue-600 text-white"
                  : "border-slate-700 bg-slate-900/80 text-slate-300"
              }`}
              aria-pressed={arrangeMode}
            >
              <Move className="h-3.5 w-3.5" />
              Arrange
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {form === "geometry" && (
          <div className="mx-4 mt-3 rounded-xl border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200 sm:mx-5">
            The Geometry / Sri Yantra form doesn't have a compatible add-on
            anchor system yet — items below will show as incompatible rather
            than silently disappearing. Switch to Evolved or Auralia to wear
            them.
          </div>
        )}

        {arrangeMode ? (
          <ArrangeModePanel equippedAddons={equippedAddons} />
        ) : (
          <>
            {/* Category filter — thumb-sized, no hover dependency */}
            <div className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 py-3 sm:px-5">
              {CATEGORY_ORDER.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`min-h-9 flex-shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors ${
                    activeCategory === category
                      ? "bg-cyan-500 text-cyan-950"
                      : "bg-slate-900/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>

            {/* Item grid */}
            <div className="grid flex-1 auto-rows-min grid-cols-3 gap-3 overflow-y-auto overscroll-contain px-4 pb-3 sm:px-5">
              {filtered.map((entry) => (
                <ItemCard
                  key={entry.addon.id}
                  entry={entry}
                  state={stateFor(entry).state}
                  isNew={stateFor(entry).isNew}
                  onTap={() => handleCardTap(entry)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="col-span-3 py-8 text-center text-sm text-slate-500">
                  Nothing in this category yet.
                </p>
              )}
            </div>

            {/* Selected item + Preview/Equip/Cancel/Remove — always visible,
                never a hover-revealed control. */}
            {detailEntry && (
              <DetailBar
                entry={detailEntry}
                resolved={stateFor(detailEntry)}
                isPreviewing={currentPreview?.id === detailEntry.addon.id}
                onEquip={handleEquip}
                onCancel={clearPreview}
                onRemove={() => handleRemove(detailEntry.addon)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemCard({
  entry,
  state,
  isNew,
  onTap,
}: {
  entry: WardrobeCatalogEntry;
  state: WardrobeItemState;
  isNew: boolean;
  onTap: () => void;
}) {
  const { addon } = entry;
  const badge = STATE_BADGE[state];
  return (
    <button
      type="button"
      onClick={onTap}
      className={`group relative flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-center transition-transform active:scale-95 ${RARITY_GLOW[addon.rarity]} ${
        state === "incompatible" ? "opacity-50" : ""
      }`}
    >
      {isNew && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-fuchsia-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
          NEW
        </span>
      )}
      <span
        className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${badge.className}`}
      >
        {badge.label}
      </span>
      <div className="flex h-10 w-10 items-center justify-center text-cyan-200">
        {state === "locked" ? (
          <Lock className="h-5 w-5" />
        ) : addon.visual.previewAsset ? (
          <img
            src={addon.visual.previewAsset}
            alt=""
            className="h-10 w-10 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <svg viewBox="0 0 100 100" className="h-10 w-10">
            <path
              d={addon.visual.svgPath || "M 50 50 m -25 0 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0"}
              fill={addon.visual.colors.primary}
              stroke={addon.visual.colors.accent}
              strokeWidth="2"
            />
          </svg>
        )}
      </div>
      <p className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-200">
        {addon.name}
      </p>
    </button>
  );
}

function DetailBar({
  entry,
  resolved,
  isPreviewing,
  onEquip,
  onCancel,
  onRemove,
}: {
  entry: WardrobeCatalogEntry;
  resolved: ReturnType<typeof resolveWardrobeItemState>;
  isPreviewing: boolean;
  onEquip: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const { addon, owned } = entry;
  return (
    <div className="flex-shrink-0 border-t border-slate-800/80 bg-slate-950/90 px-4 py-3 sm:px-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{addon.name}</p>
          <p className="text-xs capitalize text-slate-400">
            {addon.rarity} · {addon.category}
          </p>
        </div>
      </div>
      {resolved.state === "incompatible" && resolved.incompatibilityMessage && (
        <p className="mb-2 text-xs text-rose-300">{resolved.incompatibilityMessage}</p>
      )}
      {resolved.state === "locked" && (
        <p className="mb-2 text-xs text-slate-400">
          {addon.unlockMethod?.description ?? "Not yet unlocked."}
        </p>
      )}
      <div className="flex gap-2">
        {resolved.state === "equipped" ? (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 flex-1 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Remove
          </button>
        ) : isPreviewing ? (
          <>
            <button
              type="button"
              onClick={onEquip}
              disabled={!owned}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              Equip
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 flex-1 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </button>
          </>
        ) : (
          <p className="flex min-h-11 flex-1 items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            Tap the item again to preview it on your pet.
          </p>
        )}
      </div>
    </div>
  );
}

function ArrangeModePanel({ equippedAddons }: { equippedAddons: Addon[] }) {
  const positionOverrides = useAddonStore((s) => s.positionOverrides);
  const lockAddonPosition = useAddonStore((s) => s.lockAddonPosition);
  const resetAddonPosition = useAddonStore((s) => s.resetAddonPosition);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
      <p className="rounded-xl border border-blue-700/50 bg-blue-950/30 px-3 py-2 text-xs text-blue-200">
        Drag any equipped item directly on your pet to reposition it. Use the
        controls below (or the on-pet handles) to lock, unlock or reset —
        everything here works without hovering.
      </p>
      {equippedAddons.length === 0 && (
        <p className="text-sm text-slate-500">Nothing equipped yet.</p>
      )}
      {equippedAddons.map((addon) => {
        const override = positionOverrides?.[addon.id];
        const locked = override?.locked ?? false;
        return (
          <div
            key={addon.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-slate-200">{addon.name}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => lockAddonPosition(addon.id, !locked)}
                aria-pressed={locked}
                aria-label={locked ? "Unlock position" : "Lock position"}
                className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                  locked
                    ? "border-emerald-500 bg-emerald-600/20 text-emerald-300"
                    : "border-slate-700 bg-slate-900 text-slate-300"
                }`}
              >
                {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => resetAddonPosition(addon.id)}
                aria-label="Reset position"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-amber-300"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
