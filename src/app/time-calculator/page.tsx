import Link from 'next/link';
import { TimeCalculatorPanel } from '@/components/time-calculator/TimeCalculatorPanel';

export default function TimeCalculatorPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black p-4 text-white md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Experimental Module</p>
          <h1 className="text-3xl font-bold md:text-4xl">Sacred Geometry Time Calculator Compass</h1>
          <p className="max-w-3xl text-sm text-zinc-300 md:text-base">
            Integrated from the new repository module so it can live alongside the rest of the app experiences.
          </p>
          <Link className="inline-block text-sm text-cyan-300 underline underline-offset-4" href="/">
            ← Back to home
          </Link>
        </header>

        <TimeCalculatorPanel />
      </div>
    </main>
  );
}
