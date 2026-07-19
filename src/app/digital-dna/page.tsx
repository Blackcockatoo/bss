"use client";

import { DigitalDNAReveal } from "@/components/DigitalDNAReveal";
import { PetRegistryBootstrap } from "@/components/PetRegistryBootstrap";
import { RouteShellLoading } from "@/components/RouteShellLoading";
import { RouteTutorialControls } from "@/components/RouteTutorialControls";
import { AdvancedDNAVisualisations } from "@/components/advanced-dna/AdvancedDNAVisualisations";
import dynamic from "next/dynamic";
import Link from "next/link";

import { useEnforceChildSafeClientRoute } from "@/lib/childSafeRoute.client";
import { useJourneyProgressTracker } from "@/lib/journeyProgress";

/**
 * Digital DNA page — loads DigitalDNAHub as a client-only component
 * (ssr: false) because it uses Three.js, Tone.js, and browser canvas APIs
 * that are not available in a server-side rendering context.
 */
const DigitalDNAHub = dynamic(() => import("@/components/DigitalDNAHub"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading DNA exploration instruments"
      className="rounded-[2rem] border border-slate-800 bg-slate-950/70"
    >
      <RouteShellLoading
        eyebrow="Digital DNA"
        title="Helix instruments are warming up"
        detail="The decoded constellation above is already live. Three.js and the sound layer are loading underneath it."
        compact
      />
    </div>
  ),
});

export default function DigitalDNAPage() {
  const childSafeBlocked = useEnforceChildSafeClientRoute("/digital-dna");
  useJourneyProgressTracker("dna");

  if (childSafeBlocked) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-slate-950">
      <PetRegistryBootstrap />
      <Link
        href="/pet"
        className="fixed z-50 rounded-full text-sm font-semibold
                   px-4 py-2.5 top-[calc(0.75rem+env(safe-area-inset-top))]
                   left-3 sm:left-4
                   bg-slate-900/90 border border-slate-700 text-zinc-200
                   hover:text-white hover:border-amber-500/60
                   transition-colors shadow-lg"
      >
        &larr; Back to Pet
      </Link>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pt-6 sm:px-6">
        <div className="flex justify-end">
          <RouteTutorialControls
            scope="dna"
            className="text-slate-300 hover:text-white"
          />
        </div>
        <details className="group rounded-[1.5rem] border border-cyan-400/20 bg-cyan-950/20 p-3 text-white shadow-lg shadow-cyan-950/20">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-3 py-2 text-left">
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                Bonus discovery
              </span>
              <span className="mt-1 block text-base font-semibold text-white sm:text-lg">
                ✨ Peek at your pet&apos;s DNA star map
              </span>
            </span>
            <span className="rounded-full bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-200 group-open:hidden">
              Show
            </span>
            <span className="hidden rounded-full bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-200 group-open:block">
              Hide
            </span>
          </summary>
          <div className="mt-3">
            <DigitalDNAReveal />
          </div>
        </details>
      </div>

      <DigitalDNAHub />
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
        <AdvancedDNAVisualisations />
      </div>
    </div>
  );
}
