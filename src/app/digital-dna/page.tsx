"use client";

import { DigitalDNAReveal } from "@/components/DigitalDNAReveal";
import { RouteProgressionCard } from "@/components/RouteProgressionCard";
import { RouteShellLoading } from "@/components/RouteShellLoading";
import { RouteTutorialControls } from "@/components/RouteTutorialControls";
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
      <Link
        href="/"
        className="fixed z-50 rounded-full text-sm font-semibold
                   px-4 py-2.5 top-[calc(0.75rem+env(safe-area-inset-top))]
                   left-3 sm:left-4
                   bg-slate-900/90 border border-slate-700 text-zinc-200
                   hover:text-white hover:border-amber-500/60
                   transition-colors shadow-lg"
      >
        &larr; Back to Pet
      </Link>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-8 pt-20 sm:px-6">
        <div className="flex justify-end">
          <RouteTutorialControls
            scope="dna"
            className="text-slate-300 hover:text-white"
          />
        </div>
        <RouteProgressionCard route="dna" showAdvanced />
        <DigitalDNAReveal />
      </div>

      <DigitalDNAHub />
    </div>
  );
}
