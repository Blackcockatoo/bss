'use client';

import Link from 'next/link';

import { useStore } from '@/lib/store';

const actionCards = [
  {
    title: 'Go to Pet',
    description: 'Check mood, vitals, and growth status for your companion.',
    href: '/app/pet',
  },
  {
    title: 'View Genome',
    description: 'Inspect the active pet genome and traits in a readable summary.',
    href: '/app/genome',
  },
  {
    title: 'Explore Activities',
    description:
      'Battle, explore the Vimana grid, play mini-games, and unlock style rewards.',
    href: '/app/activities',
  },
  {
    title: 'Battle Arena',
    description: 'Enter the consciousness arena and fight the eight opponents.',
    href: '/app/battle',
  },
  {
    title: 'Open MOSS60 Studio',
    description: "Access the repo's MOSS60 visual and cryptographic workspace.",
    href: '/app/moss60',
  },
];

export default function StudentAppHomePage() {
  const vitals = useStore((state) => state.vitals);
  const evolution = useStore((state) => state.evolution);
  const petType = useStore((state) => state.petType);

  const liveStats = [
    { label: 'Hunger', value: vitals.hunger },
    { label: 'Hygiene', value: vitals.hygiene },
    { label: 'Mood', value: vitals.mood },
    { label: 'Energy', value: vitals.energy },
  ];

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Student App</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Welcome back, explorer</h1>
        <p className="mt-2 text-sm text-zinc-300">
          These routes now mirror the active companion&apos;s live vitals instead of a seeded demo profile.
        </p>
      </header>

      <section className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-cyan-100">Active companion</h2>
            <p className="mt-2 text-sm text-zinc-300">
              {petType === 'auralia' ? 'Auralia form' : 'Geometric form'} · {evolution.state} stage · Level{' '}
              {evolution.level}
            </p>
          </div>
          <div className="grid w-full gap-2 text-sm sm:min-w-[220px] sm:w-auto sm:grid-cols-2">
            {liveStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">{stat.label}</p>
                <p className="text-base font-semibold text-white">{Math.round(stat.value)}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {actionCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-cyan-400"
          >
            <h3 className="text-base font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
