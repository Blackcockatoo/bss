'use client';

import Link from 'next/link';
import { SteeringWheel } from '@/components/steering';

export default function CompassPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
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

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-16 gap-7">
        <SteeringWheel />
        <p className="text-xs text-zinc-500 max-w-md text-center leading-relaxed">
          The compass maps the MOSS60 system with twelve live sectors. Drag to rotate,
          tap a sector to open it, and use this as the fast path between core learning
          tools and optional activities.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/school-game"
            className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
          >
            Open Classroom Quest
          </Link>
        </div>
      </main>
    </div>
  );
}
