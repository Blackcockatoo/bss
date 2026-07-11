'use client';

import { WellnessDashboard } from '@/components/WellnessDashboard';

export default function AppWellnessPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h1 className="text-2xl font-semibold text-white">Wellness</h1>
        <p className="mt-2 text-zinc-300">
          Check in with your mood, track water and sleep, build gentle habits,
          and look back on the story you and your companion are writing
          together.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Everything here stays on this device.
        </p>
      </header>

      <WellnessDashboard />
    </main>
  );
}
