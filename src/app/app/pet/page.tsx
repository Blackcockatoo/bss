'use client';

import { useStore } from '@/lib/store';

export default function AppPetPage() {
  const vitals = useStore((state) => state.vitals);
  const evolution = useStore((state) => state.evolution);
  const petType = useStore((state) => state.petType);
  const lastAction = useStore((state) => state.lastAction);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Pet Overview</h1>
      <p className="mt-2 text-zinc-300">
        Live companion vitals and care state for your active {petType === 'auralia' ? 'Auralia' : 'geometric'} pet.
      </p>
      <div className="mt-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-zinc-200 md:grid-cols-2">
        <p>Mood: {Math.round(vitals.mood)}%</p>
        <p>Energy: {Math.round(vitals.energy)}%</p>
        <p>Hunger: {Math.round(vitals.hunger)}%</p>
        <p>Hygiene: {Math.round(vitals.hygiene)}%</p>
        <p>Stage: {evolution.state}</p>
        <p>Level: {evolution.level}</p>
        <p>Last care action: {lastAction ?? 'None yet'}</p>
        <p>Sickness: {vitals.isSick ? `${vitals.sicknessType} (${Math.round(vitals.sicknessSeverity)}%)` : 'Stable'}</p>
      </div>
    </main>
  );
}
