"use client";

/**
 * Living Wardrobe — touch-native browse/try-on/equip surface.
 *
 * Required flow: Browse -> Try on pet -> Interact with pet -> Equip or
 * cancel. The pet stage (VisualDNAPet, the canonical Evolved/Body Forge
 * renderer) stays mounted and visible the entire time; tapping a card sets
 * a local, non-persisted preview override that AddonLayer picks up. Equip
 * is the only action that writes to useAddonStore; Cancel simply clears
 * the local override, which restores the real equipped state exactly,
 * because the store was never touched.
 *
 * No new inventory/ownership/catalog system: this reads the same
 * ADDON_CATALOG/CUSTOM_ADDONS templates and the same useAddonStore the
 * rest of the app already uses.
 */

import { useCallback, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { VisualDNAPet } from "@/components/VisualDNAPet";
import {
  ADDON_CATALOG,
  useAddonStore,
  type Addon,
  type AddonCategory,
  type AddonTemplate,
} from "@/lib/addons";
import { getAddonStatus, type AddonStatus } from "@/lib/addons/compatibility";
import { initializeStarterAddons } from "@/lib/addons/starter";
import { Move, X } from "lucide-react";

const CATEGORIES: { id: AddonCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "headwear", label: "Headwear" },
  { id: "weapon", label: "Weapon" },
  { id: "accessory", label: "Accessory" },
  { id: "aura", label: "Aura" },
  { id: "companion", label: "Companion" },
  { id: "effect", label: "Effect" },
];

const STATUS_LABEL: Record<AddonStatus, string> = {
  owned: "In your closet",
  equipped: "Equipped",
  available: "Free to claim",
  locked: "Locked",
  incompatible: "Not compatible",
};

const STATUS_BADGE_CLASS: Record<AddonStatus, string> = {
  owned: "bg-slate-800 text-slate-200 border-slate-600",
  equipped: "bg-cyan-500/20 text-cyan-200 border-cyan-400/50",
  available: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  locked: "bg-zinc-800 text-zinc-500 border-zinc-700",
  incompatible: "bg-red-950/40 text-red-300 border-red-800/60",
};

function allTemplates(): AddonTemplate[] {
  // ADDON_CATALOG already includes CUSTOM_ADDONS and GIRL_ADDONS spread in
  // (see catalog.tsx) — this is the single, complete template list.
  return Object.values(ADDON_CATALOG);
}

interface WardrobeCardProps {
  template: AddonTemplate;
  owned: Addon | null;
  status: AddonStatus;
  reason?: string;
  isPreviewed: boolean;
  onSelect: () => void;
}

function WardrobeCard({
  template,
  owned,
  status,
  reason,
  isPreviewed,
  onSelect,
}: WardrobeCardProps) {
  const canTryOn = Boolean(owned) && status !== "incompatible";
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!canTryOn}
      title={reason}
      aria-pressed={isPreviewed}
      className={`group flex min-h-[44px] flex-col gap-2 rounded-2xl border p-3 text-left transition ${
        isPreviewed
          ? "border-cyan-400 bg-cyan-500/10"
          : "border-white/10 bg-slate-900/70 hover:border-white/25"
      } ${!canTryOn ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-zinc-100">
          {template.name}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="text-xs capitalize text-zinc-500">
        {template.rarity} {template.category}
      </p>
      {reason && status !== "equipped" && status !== "owned" && (
        <p className="text-[11px] text-zinc-500">{reason}</p>
      )}
    </button>
  );
}

export function LivingWardrobe() {
  const reduceMotion = useReducedMotion();
  const addons = useAddonStore((state) => state.addons);
  const equipped = useAddonStore((state) => state.equipped);
  const equipAddon = useAddonStore((state) => state.equipAddon);
  const unequipAddon = useAddonStore((state) => state.unequipAddon);

  const [category, setCategory] = useState<AddonCategory | "all">("all");
  const [preview, setPreview] = useState<
    Partial<Record<AddonCategory, string | null>>
  >({});
  const [arrangeMode, setArrangeMode] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);

  const templates = useMemo(() => {
    const all = allTemplates();
    return category === "all"
      ? all
      : all.filter((t) => t.category === category);
  }, [category]);

  const previewedId = (cat: AddonCategory) =>
    cat in preview ? preview[cat] : undefined;

  const selectTemplate = useCallback(
    (template: AddonTemplate) => {
      const owned = addons[template.id];
      if (!owned) return;
      setPreview((prev) => {
        const currentlyPreviewed =
          template.category in prev
            ? prev[template.category]
            : undefined;
        const already = currentlyPreviewed === template.id;
        return {
          ...prev,
          [template.category]: already ? undefined : template.id,
        };
      });
    },
    [addons],
  );

  const previewCategories = Object.keys(preview) as AddonCategory[];
  const hasPendingPreview = previewCategories.some(
    (cat) => preview[cat] !== undefined,
  );

  const handleEquip = useCallback(() => {
    for (const cat of previewCategories) {
      const id = preview[cat];
      if (id === undefined) continue;
      if (id === null) unequipAddon(cat);
      else equipAddon(id);
    }
    setPreview({});
  }, [equipAddon, preview, previewCategories, unequipAddon]);

  const handleCancel = useCallback(() => {
    setPreview({});
  }, []);

  const handleUnlock = useCallback(async () => {
    setUnlocking(true);
    await initializeStarterAddons();
    setUnlocking(false);
  }, []);

  const bodyShape = null; // Evolved-form shape isn't threaded through here yet; unrestricted by default.

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      {/* Pet stage — always visible, the same canonical renderer used on /pet. */}
      <div className="lg:sticky lg:top-4 lg:w-[420px] lg:shrink-0">
        <VisualDNAPet
          className="w-full"
          showReadout={false}
          addonPreviewOverrides={preview}
          arrangeMode={arrangeMode}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setArrangeMode((v) => !v)}
            className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
              arrangeMode
                ? "border-blue-400 bg-blue-600 text-white"
                : "border-slate-700 bg-slate-900/80 text-zinc-300 hover:border-slate-500"
            }`}
          >
            <Move className="h-4 w-4" />
            {arrangeMode ? "Arrange Mode: on" : "Arrange Mode"}
          </button>
          {arrangeMode && (
            <p className="text-[11px] text-zinc-500">
              Drag an equipped item to reposition it. Turn off when done.
            </p>
          )}
        </div>
        {hasPendingPreview && (
          <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] mt-3 flex gap-2 rounded-2xl border border-cyan-400/40 bg-slate-950/95 p-3 shadow-lg backdrop-blur lg:static">
            <button
              type="button"
              onClick={handleEquip}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-cyan-500 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Equip
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-11 items-center justify-center gap-1 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-zinc-300 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Browse surface — a rail on desktop, a bottom-anchored sheet on mobile. */}
      <div className="flex-1 lg:max-w-none">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-4 text-sm font-semibold text-zinc-200"
            aria-expanded={sheetOpen}
          >
            Wardrobe
            <span className="text-xs text-zinc-500">
              {sheetOpen ? "Hide" : "Browse"}
            </span>
          </button>
        </div>

        <div
          className={`${sheetOpen ? "block" : "hidden lg:block"} mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:mt-0`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`h-11 shrink-0 rounded-xl px-3 text-xs font-medium transition ${
                    category === c.id
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={unlocking}
              className="h-11 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-200 disabled:opacity-60"
            >
              {unlocking ? "Unlocking…" : "Unlock starter set"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => {
              const owned = addons[template.id] ?? null;
              const statusSubject: Addon =
                owned ?? {
                  ...template,
                  ownership: {
                    ownerPublicKey: "",
                    signature: "",
                    issuedAt: 0,
                    issuerPublicKey: "",
                    issuerSignature: "",
                    nonce: "",
                  },
                };
              const { status, reason } = getAddonStatus(statusSubject, {
                owned: Boolean(owned),
                equippedId: equipped[template.category],
                bodyShape,
              });
              return (
                <WardrobeCard
                  key={template.id}
                  template={template}
                  owned={owned}
                  status={status}
                  reason={reason}
                  isPreviewed={previewedId(template.category) === template.id}
                  onSelect={() => selectTemplate(template)}
                />
              );
            })}
          </div>

          {templates.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No add-ons in this category yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
