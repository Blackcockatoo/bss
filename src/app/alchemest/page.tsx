'use client';

import Link from 'next/link';

export default function AlchemestPage() {
  return (
    <div className="relative h-screen w-full bg-[#090f1a]">
      <Link
        href="/"
        className="absolute left-3 top-3 z-50 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:border-amber-500/60 hover:text-white"
      >
        &larr; Back to Pet
      </Link>
      <iframe
        src="/alchemest.html"
        title="ALCHEMEST Practical Studio"
        className="h-full w-full border-none"
        style={{ height: '100vh' }}
      />
    </div>
  );
}
