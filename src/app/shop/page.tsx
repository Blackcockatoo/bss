'use client';

import Link from 'next/link';
import { useSubscription } from '@/lib/pricing/hooks';
import {
  HOLOGRAPHIC_VAULT,
  ETHEREAL_BACKGROUND,
  QUANTUM_DATA_FLOW,
  PHOENIX_WINGS,
  CRYSTAL_HEART,
  VOID_MASK,
  SPACE_JEWBLES_BADGE,
  COSMIC_BANANA_WEAPON,
  MYTHIC_HUNTER_AURA,
} from '@/lib/addons/catalog';
import type { AddonTemplate } from '@/lib/addons/catalog';

const PREMIUM_ADDONS: AddonTemplate[] = [
  HOLOGRAPHIC_VAULT,
  ETHEREAL_BACKGROUND,
  QUANTUM_DATA_FLOW,
  PHOENIX_WINGS,
  CRYSTAL_HEART,
  VOID_MASK,
];

const EARNABLE_ADDONS: { template: AddonTemplate; achievement: string; route: string }[] = [
  { template: SPACE_JEWBLES_BADGE, achievement: 'Reach wave 10 in Space Jewbles', route: '/space-jewbles' },
  { template: COSMIC_BANANA_WEAPON, achievement: 'Defeat 5+ bosses in Space Jewbles', route: '/space-jewbles' },
  { template: MYTHIC_HUNTER_AURA, achievement: 'Collect 3+ mythic drops in Space Jewbles', route: '/space-jewbles' },
];

const RARITY_STYLES: Record<string, { badge: string; border: string; glow: string }> = {
  rare:      { badge: 'bg-blue-700 text-blue-100',   border: 'border-blue-700/40',   glow: 'from-blue-950/40' },
  epic:      { badge: 'bg-purple-700 text-purple-100', border: 'border-purple-700/40', glow: 'from-purple-950/40' },
  legendary: { badge: 'bg-orange-700 text-orange-100', border: 'border-orange-700/40', glow: 'from-orange-950/40' },
  mythic:    { badge: 'bg-pink-700 text-pink-100',    border: 'border-pink-700/40',   glow: 'from-pink-950/40' },
};

function AddonCard({ addon }: { addon: AddonTemplate }) {
  const styles = RARITY_STYLES[addon.rarity] ?? RARITY_STYLES.rare;
  const mods = addon.modifiers ?? {};
  const modEntries = Object.entries(mods).filter(([, v]) => v && v > 0);

  return (
    <div className={`flex flex-col gap-3 rounded-xl border ${styles.border} bg-gradient-to-b ${styles.glow} to-slate-900/60 p-5`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{addon.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles.badge}`}>
          {addon.rarity}
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">{addon.description}</p>

      {modEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {modEntries.map(([stat, val]) => (
            <span key={stat} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 font-mono">
              +{val} {stat}
            </span>
          ))}
        </div>
      )}

      {addon.metadata.maxEditions && (
        <p className="text-xs text-zinc-600">Limited: {addon.metadata.maxEditions} editions</p>
      )}

      <button
        disabled
        className="mt-auto w-full rounded-lg border border-amber-500/30 bg-amber-950/30 py-2 text-sm font-medium text-amber-400 cursor-not-allowed"
      >
        Coming Soon
      </button>
    </div>
  );
}

function EarnableCard({ template, achievement, route }: { template: AddonTemplate; achievement: string; route: string }) {
  const styles = RARITY_STYLES[template.rarity] ?? RARITY_STYLES.rare;

  return (
    <div className={`flex items-center gap-4 rounded-xl border ${styles.border} bg-slate-900/50 p-4`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-100">{template.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles.badge}`}>
            {template.rarity}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{achievement}</p>
      </div>
      <Link
        href={route}
        className="shrink-0 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:border-cyan-400/60 hover:text-cyan-300 transition-colors"
      >
        Play →
      </Link>
    </div>
  );
}

export default function ShopPage() {
  const subscription = useSubscription();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 text-zinc-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meta-Pet Workshop</h1>
        <p className="mt-2 text-zinc-400">Your hub for premium addons and plan upgrades.</p>
        <p className="mt-1 text-xs text-zinc-600 max-w-lg leading-relaxed">
          Every addon is cryptographically signed and truly owned by you &mdash; not licensed, not rented. We&apos;re building toward a future where digital items can be gifted, traded, and carried between companions.
        </p>
      </div>

      {/* Upgrade banner — free plan only */}
      {subscription.planId === 'free' && (
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Teacher Pro · $19 / month</p>
            <p className="mt-1 text-xs text-zinc-400">Unlimited classes, students, assignments, advanced analytics, and premium addon access.</p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition-colors"
          >
            View Plans →
          </Link>
        </div>
      )}

      {/* Premium Addons */}
      <section className="mb-12">
        <h2 className="mb-1 text-xl font-semibold text-zinc-100">Premium Addons</h2>
        <p className="mb-5 text-sm text-zinc-500">Crypto-secured cosmetic items for your Auralia. Limited editions, transferable ownership.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PREMIUM_ADDONS.map(addon => (
            <AddonCard key={addon.id} addon={addon} />
          ))}
        </div>
      </section>

      {/* Earnable Addons */}
      <section className="mb-10">
        <h2 className="mb-1 text-xl font-semibold text-zinc-100">Earn Free Addons</h2>
        <p className="mb-5 text-sm text-zinc-500">Complete in-game achievements to unlock these items at no cost.</p>

        <div className="flex flex-col gap-3">
          {EARNABLE_ADDONS.map(({ template, achievement, route }) => (
            <EarnableCard key={template.id} template={template} achievement={achievement} route={route} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <div className="text-center space-y-2">
        <p className="text-xs text-zinc-700">
          Payment integration coming soon. Items are reserved and will be available at launch.
        </p>
        <p className="text-xs text-zinc-800 max-w-sm mx-auto leading-relaxed">
          Our commitment: core gameplay will always be free. Premium items are cosmetic only &mdash; no pay-to-win, ever.
        </p>
      </div>
    </main>
  );
}
