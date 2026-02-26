'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

/**
 * Digital DNA page — loads DigitalDNAHub as a client-only component
 * (ssr: false) because it uses Three.js, Tone.js, and browser canvas APIs
 * that are not available in a server-side rendering context.
 */
const DigitalDNAHub = dynamic(() => import('@/components/DigitalDNAHub'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      {/* Pulsing DNA icon while the bundle loads */}
      <div className="text-6xl animate-pulse select-none">🧬</div>
      <p className="text-amber-300 text-xl font-semibold tracking-wide animate-pulse">
        Loading Digital DNA…
      </p>
      <p className="text-slate-500 text-sm">Initialising Three.js &amp; audio engine</p>
    </div>
  ),
});

export default function DigitalDNAPage() {
  return (
    <div className="relative">
      {/* Back button — fixed so it stays visible during scroll */}
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

      <DigitalDNAHub />
    </div>
  );
}
