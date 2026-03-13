import Link from "next/link";
import { getPetOrDemo } from "@/lib/demo/pet";

const actionCards = [
  {
    title: "Go to Pet",
    description: "Check mood, vitals, and growth status for your companion.",
    href: "/app/pet",
  },
  {
    title: "View Genome",
    description: "Inspect the active pet genome and traits in a readable summary.",
    href: "/app/genome",
  },
  {
    title: "Explore Activities",
    description: "Jump into guided activities to play and learn with your pet.",
    href: "/app/activities",
  },
];

export default function StudentAppHomePage() {
  const activePet = getPetOrDemo(null);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Student App</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Welcome back, explorer</h1>
        <p className="mt-2 text-sm text-zinc-300">
          You are viewing a working demo pet so first-time visitors can start immediately.
        </p>
      </header>

      <section className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-5">
        <h2 className="text-lg font-medium text-cyan-100">Active pet: {activePet.name}</h2>
        <p className="mt-2 text-sm text-zinc-300">
          {activePet.species} · Mood: {activePet.mood} · Level {activePet.level}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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
