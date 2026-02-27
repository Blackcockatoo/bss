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
      <main className="flex-1 flex items-center justify-center p-4 pt-16">
        <SteeringWheel />
      </main>
    </div>
  );
}
