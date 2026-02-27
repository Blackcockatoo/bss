import Link from 'next/link';
import { TimeCalculatorPanel } from '@/components/time-calculator/TimeCalculatorPanel';

export default function TimeCalculatorPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black p-4 text-white md:p-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Integrated Experience</p>
          <h1 className="text-3xl font-bold md:text-4xl">MetaPet × Sacred Geometry Time Calculator</h1>
          <p className="max-w-4xl text-sm text-zinc-300 md:text-base">
            One coherent space: care for MetaPet, read its current vitals, and instantly map that state into the time
            calculator pattern presets.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-cyan-300 underline underline-offset-4" href="/">
              ← Back to home
            </Link>
            <Link className="text-cyan-300 underline underline-offset-4" href="/pet">
              Open full pet view
            </Link>
          </div>
        </header>

        <TimeCalculatorPanel />
      </div>
    </main>
  );
}
