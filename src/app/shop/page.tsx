'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSubscription, useFeatureGate } from '@/lib/pricing/hooks';
import { useAddonStore } from '@/lib/addons/store';
import { useEducationStore, EDU_ACHIEVEMENTS_CATALOG } from '@/lib/education';
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
import type { Addon } from '@/lib/addons';
import { AddonRenderer, AddonSVGDefs } from '@/components/addons/AddonRenderer';

// ─── Data ───────────────────────────────────────────────────────────────────

const PREMIUM_ADDONS: AddonTemplate[] = [
  HOLOGRAPHIC_VAULT,
  ETHEREAL_BACKGROUND,
  QUANTUM_DATA_FLOW,
  PHOENIX_WINGS,
  CRYSTAL_HEART,
  VOID_MASK,
];

const EARNABLE_MAP = [
  { achievementId: 'first-steps',     template: SPACE_JEWBLES_BADGE  },
  { achievementId: 'streak-lord',     template: COSMIC_BANANA_WEAPON },
  { achievementId: 'reflection-sage', template: MYTHIC_HUNTER_AURA   },
] as const;

// ─── Styles ──────────────────────────────────────────────────────────────────

const RARITY_STYLE: Record<string, { badge: string; border: string; from: string }> = {
  rare:      { badge: 'bg-blue-700 text-blue-100',    border: 'border-blue-700/40',   from: 'from-blue-950/30'   },
  epic:      { badge: 'bg-purple-700 text-purple-100', border: 'border-purple-700/40', from: 'from-purple-950/30' },
  legendary: { badge: 'bg-orange-700 text-orange-100', border: 'border-orange-700/40', from: 'from-orange-950/30' },
  mythic:    { badge: 'bg-pink-700 text-pink-100',    border: 'border-pink-700/40',   from: 'from-pink-950/30'   },
};

const TIER_STYLE: Record<string, string> = {
  bronze:   'text-amber-500',
  silver:   'text-slate-400',
  gold:     'text-yellow-400',
  platinum: 'text-cyan-300',
};

const FALLBACK_STYLE = { badge: 'bg-zinc-700 text-zinc-200', border: 'border-zinc-700/40', from: 'from-zinc-900/30' };

// ─── Pet Preview with live addon ─────────────────────────────────────────────

function PetPreview({ template, animationPhase }: { template: AddonTemplate; animationPhase: number }) {
  // AddonRenderer only uses attachment + visual; safe cast for preview
  const previewAddon = useMemo(
    () => ({ attachment: template.attachment, visual: template.visual }) as unknown as Addon,
    [template],
  );

  const gradId = `petG-${template.id}`;
  const glowId = `petGl-${template.id}`;

  return (
    <div className="aspect-square w-full max-w-[140px] mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full auralia-pet-svg">
        <AddonSVGDefs />
        <defs>
          <radialGradient id={gradId} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.8" />
          </radialGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Auralia silhouette */}
        <g transform="translate(100, 100)">
          <ellipse cx="0" cy="8"   rx="20" ry="25" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
          <ellipse cx="0" cy="-12" rx="15" ry="14" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
          <ellipse cx="-6" cy="-12" rx="3" ry="3" fill="#4ECDC4" />
          <ellipse cx="6"  cy="-12" rx="3" ry="3" fill="#4ECDC4" />
        </g>

        {/* Live addon */}
        <AddonRenderer
          addon={previewAddon}
          petSize={40}
          petPosition={{ x: 100, y: 100 }}
          animationPhase={animationPhase}
          draggable={false}
        />
      </svg>
    </div>
  );
}

// ─── Premium addon card ───────────────────────────────────────────────────────

function PremiumCard({
  template,
  animationPhase,
  isPro,
}: {
  template: AddonTemplate;
  animationPhase: number;
  isPro: boolean;
}) {
  const s = RARITY_STYLE[template.rarity] ?? FALLBACK_STYLE;
  const modEntries = Object.entries(template.modifiers ?? {}).filter(([, v]) => (v ?? 0) > 0);

  return (
    <div className={`flex flex-col rounded-xl border ${s.border} bg-gradient-to-b ${s.from} to-slate-900/60 overflow-hidden`}>
      {/* Live preview panel */}
      <div className="bg-slate-900/80 p-5 border-b border-slate-800/60">
        <PetPreview template={template} animationPhase={animationPhase} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{template.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold capitalize ${s.badge}`}>
            {template.rarity}
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">{template.description}</p>

        {modEntries.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {modEntries.map(([stat, val]) => (
              <span key={stat} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 font-mono">
                +{val} {stat}
              </span>
            ))}
          </div>
        )}

        {template.metadata.maxEditions && (
          <p className="text-xs text-zinc-600">Limited · {template.metadata.maxEditions} editions</p>
        )}

        <div className="mt-auto pt-1">
          {isPro ? (
            <button
              disabled
              className="w-full rounded-lg border border-amber-500/30 bg-amber-950/30 py-2 text-sm font-medium text-amber-400 cursor-not-allowed"
            >
              Mint · Coming Soon
            </button>
          ) : (
            <Link
              href="/pricing"
              className="block w-full rounded-lg bg-cyan-500/10 border border-cyan-500/30 py-2 text-center text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              Unlock with Pro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const subscription = useSubscription();
  const { allowed: isPro } = useFeatureGate('premium-addons');
  const addonAddons  = useAddonStore(s => s.addons);
  const addonEquipped = useAddonStore(s => s.equipped);
  const eduAchievements = useEducationStore(s => s.eduAchievements);

  const [animationPhase, setAnimationPhase] = useState(0);

  // Shared animation loop for all previews
  useEffect(() => {
    let frame: number;
    let last = performance.now();
    const tick = (now: number) => {
      setAnimationPhase(prev => prev + (now - last));
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Collection snapshot
  const ownedList  = useMemo(() => Object.values(addonAddons), [addonAddons]);
  const equippedCount = useMemo(() => Object.values(addonEquipped).filter(Boolean).length, [addonEquipped]);
  const rarityTally = useMemo(() => {
    const tally: Record<string, number> = {};
    ownedList.forEach(a => { tally[a.rarity] = (tally[a.rarity] ?? 0) + 1; });
    return tally;
  }, [ownedList]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Back button */}
      <Link
        href="/"
        className="fixed z-50 rounded-full text-sm font-semibold
                   px-4 py-2.5 top-[calc(0.75rem+env(safe-area-inset-top))]
                   left-3 sm:left-4
                   bg-slate-900/90 border border-slate-700 text-zinc-200
                   hover:text-white hover:border-amber-500/60
                   transition-colors shadow-lg"
      >
        &larr; Back
      </Link>

      <main className="max-w-4xl mx-auto px-4 pb-28 pt-20">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">Auralia Workshop</h1>
          <p className="mt-2 text-zinc-400">Collect, equip, and personalise your digital companion.</p>
        </div>

        {/* Collection snapshot */}
        {ownedList.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 px-5 py-3">
            <span className="text-sm font-medium text-zinc-200">
              {ownedList.length} item{ownedList.length !== 1 ? 's' : ''} owned
            </span>
            <span className="text-xs text-zinc-700">·</span>
            <span className="text-sm text-zinc-400">{equippedCount} equipped</span>
            {Object.entries(rarityTally).map(([rarity, count]) => {
              const s = RARITY_STYLE[rarity] ?? FALLBACK_STYLE;
              return (
                <span key={rarity} className={`text-xs font-medium capitalize rounded-full px-2 py-0.5 ${s.badge}`}>
                  {count} {rarity}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 text-sm text-zinc-500">
            Your collection is empty — earn your first addon through learning below.
          </div>
        )}

        {/* Upgrade banner — free plan only */}
        {subscription.planId === 'free' && (
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-6 py-5">
            <div>
              <p className="text-sm font-semibold text-cyan-300">Teacher Pro · $19 / month</p>
              <p className="mt-1 text-xs text-zinc-400">
                Unlock all premium addons, unlimited classes, students, assignments, advanced analytics, and more.
              </p>
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
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-zinc-100 mb-1">Premium Addons</h2>
          <p className="text-sm text-zinc-500 mb-6">
            ECDSA-secured ownership · Limited editions · Transferable
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PREMIUM_ADDONS.map(template => (
              <PremiumCard
                key={template.id}
                template={template}
                animationPhase={animationPhase}
                isPro={isPro}
              />
            ))}
          </div>
        </section>

        {/* Earn Through Learning */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-100 mb-1">Earn Through Learning</h2>
          <p className="text-sm text-zinc-500 mb-5">
            Complete school-game achievements to unlock these at no cost.
          </p>
          <div className="flex flex-col gap-3">
            {EARNABLE_MAP.map(({ achievementId, template }) => {
              const achDef   = EDU_ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
              const achState = eduAchievements.find(a => a.id === achievementId);
              const isEarned = (achState?.unlockedAt ?? null) !== null;
              const s = RARITY_STYLE[template.rarity] ?? FALLBACK_STYLE;
              const tierColor = TIER_STYLE[achDef?.tier ?? 'bronze'];

              return (
                <div
                  key={template.id}
                  className={`flex items-center gap-4 rounded-xl border ${s.border} bg-slate-900/50 p-4`}
                >
                  <div className="text-3xl shrink-0 select-none">{achDef?.emoji ?? '🎯'}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-100">{template.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${s.badge}`}>
                        {template.rarity}
                      </span>
                      {achDef && (
                        <span className={`text-xs font-medium capitalize ${tierColor}`}>
                          {achDef.tier}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {achDef?.description ?? 'Complete the school-game challenge'}
                    </p>
                  </div>

                  {isEarned ? (
                    <span className="shrink-0 rounded-lg border border-green-700/40 bg-green-950/30 px-3 py-1.5 text-xs font-medium text-green-400">
                      Earned ✓
                    </span>
                  ) : (
                    <Link
                      href="/school-game"
                      className="shrink-0 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:border-cyan-400/60 hover:text-cyan-300 transition-colors"
                    >
                      Play →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <p className="text-center text-xs text-zinc-700">
          Payment integration coming soon · Items reserved for launch · Limited editions
        </p>
      </main>
    </div>
  );
}
