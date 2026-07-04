"use client";

/**
 * QuickLaunchGrid — compact one-tap tiles into the app's other worlds,
 * shown near the top of the home shell so nothing is buried in sections.
 * (Descendant of the interim launcher landing the home briefly had.)
 */

import Link from "next/link";

import { isChildSafeAllowedPathname } from "@/lib/childSafeBaseline";
import { ENABLE_CHILD_SAFE_BASELINE } from "@/lib/env/features";

interface LaunchTile {
  href: string;
  title: string;
  desc: string;
  icon: string;
  accent: string;
}

const LAUNCH_TILES: LaunchTile[] = [
  {
    href: "/digital-dna",
    title: "DNA Music Hub",
    desc: "Strands become geometry and sound.",
    icon: "🧬",
    accent: "border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10",
  },
  {
    href: "/addons-demo",
    title: "Add-on Studio",
    desc: "Mint and equip cosmetic add-ons.",
    icon: "✨",
    accent: "border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10",
  },
  {
    href: "/moss60",
    title: "Moss60 Hub",
    desc: "The 60-glyph strand system.",
    icon: "🌿",
    accent: "border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10",
  },
  {
    href: "/genome-explorer",
    title: "Genome Explorer",
    desc: "The engine behind your pet.",
    icon: "🔬",
    accent: "border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10",
  },
  {
    href: "/visualizer",
    title: "Visualizer",
    desc: "Live geometry playground.",
    icon: "🌀",
    accent: "border-cyan-500/25 bg-cyan-500/5 hover:bg-cyan-500/10",
  },
  {
    href: "/identity",
    title: "Identity",
    desc: "Keys, crest, and profile.",
    icon: "🗝️",
    accent: "border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10",
  },
];

export function QuickLaunchGrid() {
  const tiles = ENABLE_CHILD_SAFE_BASELINE
    ? LAUNCH_TILES.filter((tile) => isChildSafeAllowedPathname(tile.href))
    : LAUNCH_TILES;

  if (tiles.length === 0) return null;

  return (
    <section aria-label="Quick launch">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
        Explore
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`group flex min-h-[44px] items-start gap-2 rounded-xl border p-3 transition-colors ${tile.accent}`}
          >
            <span aria-hidden className="text-lg leading-none pt-0.5">
              {tile.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-100 group-hover:text-white">
                {tile.title}
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
                {tile.desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default QuickLaunchGrid;
