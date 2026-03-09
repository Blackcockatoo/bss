"use client";

import {
  CRYSTAL_HEART,
  ETHEREAL_BACKGROUND,
  HOLOGRAPHIC_VAULT,
  PHOENIX_WINGS,
  QUANTUM_DATA_FLOW,
  VOID_MASK,
} from "@/lib/addons/catalog";
import type { AddonTemplate } from "@/lib/addons/catalog";
import { CUSTOM_ADDONS } from "@/lib/addons/customAddons";
import { initializeStarterAddons } from "@/lib/addons/starter";
import { useSubscription } from "@/lib/pricing/hooks";
import Link from "next/link";
import { useMemo, useState } from "react";

const PREMIUM_ADDONS: AddonTemplate[] = [
  HOLOGRAPHIC_VAULT,
  ETHEREAL_BACKGROUND,
  QUANTUM_DATA_FLOW,
  PHOENIX_WINGS,
  CRYSTAL_HEART,
  VOID_MASK,
];

const CUSTOM_COLLECTION_ADDONS: AddonTemplate[] = Object.values(
  CUSTOM_ADDONS,
).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const RARITY_STYLES: Record<
  string,
  { badge: string; border: string; glow: string }
> = {
  rare: {
    badge: "bg-blue-500/20 text-blue-200 border-blue-400/40",
    border: "border-blue-500/30",
    glow: "from-blue-500/10",
  },
  epic: {
    badge: "bg-violet-500/20 text-violet-200 border-violet-400/40",
    border: "border-violet-500/30",
    glow: "from-violet-500/10",
  },
  legendary: {
    badge: "bg-orange-500/20 text-orange-200 border-orange-400/40",
    border: "border-orange-500/30",
    glow: "from-orange-500/10",
  },
  mythic: {
    badge: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40",
    border: "border-fuchsia-500/30",
    glow: "from-fuchsia-500/10",
  },
};

function AddonCard({
  addon,
  ctaLabel = "Preview",
}: { addon: AddonTemplate; ctaLabel?: string }) {
  const styles = RARITY_STYLES[addon.rarity] ?? RARITY_STYLES.rare;
  const mods = addon.modifiers ?? {};
  const modEntries = Object.entries(mods).filter(([, v]) => v && v > 0);

  return (
    <article
      className={`group flex h-full flex-col gap-3 rounded-2xl border ${styles.border} bg-gradient-to-b ${styles.glow} to-slate-900/80 p-4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/20`}
    >
      {addon.visual.previewAsset ? (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <img
            src={addon.visual.previewAsset}
            alt={addon.name}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            {addon.id}
          </p>
          <h3 className="text-sm font-semibold leading-snug text-zinc-100">
            {addon.name}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${styles.badge}`}
        >
          {addon.rarity}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-zinc-400">
        {addon.description}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-0.5 text-[10px] uppercase text-zinc-300">
          {addon.category}
        </span>
        {addon.metadata.maxEditions && (
          <span className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-0.5 text-[10px] text-zinc-300">
            {addon.metadata.maxEditions} editions
          </span>
        )}
      </div>

      {modEntries.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {modEntries.map(([stat, val]) => (
            <span
              key={stat}
              className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-200"
            >
              +{val} {stat}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-2">
        <span className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-400">
          {ctaLabel}
        </span>
      </div>
    </article>
  );
}

export default function ShopPage() {
  const subscription = useSubscription();
  const [unlocking, setUnlocking] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

  const mythicCount = useMemo(
    () =>
      CUSTOM_COLLECTION_ADDONS.filter((addon) => addon.rarity === "mythic")
        .length,
    [],
  );

  const handleUnlock = async () => {
    setUnlocking(true);
    setUnlockMessage(null);

    const result = await initializeStarterAddons();

    if (result.success) {
      setUnlockMessage(
        `Unlocked ${result.addonsCreated} addon(s) to your inventory. Open Pet → Addons to equip them.`,
      );
    } else {
      setUnlockMessage(result.error ?? "Failed to unlock addons.");
    }

    setUnlocking(false);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-zinc-100">
      <section className="mb-8 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,#7c3aed33,#020617)] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">
              Meta-Pet Workshop
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Use your custom addons now
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300">
              Your custom collection is now integrated and usable. Click unlock
              to mint them into your inventory, then equip them in the Pet addon
              panel.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1">
              {CUSTOM_COLLECTION_ADDONS.length} custom addons
            </span>
            <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-3 py-1">
              {mythicCount} mythic
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleUnlock}
            disabled={unlocking}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {unlocking ? "Unlocking…" : "Unlock to Inventory"}
          </button>
          <Link
            href="/pet"
            className="rounded-xl border border-zinc-500/50 bg-zinc-900/70 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-300"
          >
            Go to Pet & Equip →
          </Link>
          {subscription.planId === "free" && (
            <Link
              href="/pricing"
              className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300"
            >
              Compare Pro Plan
            </Link>
          )}
        </div>

        {unlockMessage && (
          <p className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300">
            {unlockMessage}
          </p>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Custom Collection</h2>
            <p className="text-sm text-zinc-500">
              IDs 1008–1023 · ready to mint and equip.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CUSTOM_COLLECTION_ADDONS.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              ctaLabel="Included in unlock"
            />
          ))}
        </div>
      </section>

      {/* Earnable Addons */}
      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Premium Addons</h2>
            <p className="text-sm text-zinc-500">Available with Companion Pass or Teacher Pro.</p>
          </div>
          <Link href="/pricing" className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            View plans →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PREMIUM_ADDONS.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              ctaLabel="Companion Pass · included"
            />
          ))}
        </div>
      </section>

      {/* Addon Marketplace Coming Soon */}
      <section className="mb-10 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-slate-900/60 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Addon Marketplace — Coming Soon
            </p>
            <h3 className="mt-1 text-lg font-bold text-zinc-100">
              Individual drops · Creator revenue share · Limited editions
            </h3>
            <p className="mt-2 max-w-xl text-sm text-zinc-400 leading-relaxed">
              Buy individual addon packs from $1.99. Creators earn 70% of each sale.
              Limited-edition mythic drops with on-chain scarcity. Educators can share
              curriculum-themed addon bundles. The marketplace opens when the ecosystem is ready.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-2 text-sm font-semibold text-amber-200">
              Notify me
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-500">
          <span className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-0.5">Drop pricing: $1.99–$9.99</span>
          <span className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-0.5">Creator cut: 70%</span>
          <span className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-0.5">Cryptographically signed editions</span>
          <span className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-0.5">Curriculum addon bundles</span>
        </div>
      </section>
    </main>
  );
}
