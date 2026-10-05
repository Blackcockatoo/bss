import Link from "next/link";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import { METAPET_ORIGIN, SCHOOL_ORIGIN } from "@/lib/productSurfaces";

const LABS = [
  { title: "DNA & visualisations", href: "/digital-dna", detail: "Compare different representations of the same seed." },
  { title: "Body Forge", href: "/body-forge", detail: "Investigate how form changes the creature you create." },
  { title: "Evolution & behaviour", href: "/pet", detail: "Open the pet's Mechanics Lab to inspect its existing evolution and care systems." },
  { title: "Genome", href: "/app/genome", detail: "Explore the genetic systems underneath the companion." },
  { title: "MOSS60", href: "/moss60", detail: "Explore the number and geometry experiments." },
  { title: "Activities & worlds", href: "/app/activities", detail: "Find games, Vimana and the deeper Navigator." },
];

export const metadata = { title: "Teacher Lab — MetaPet" };

export default function TeacherLabPage() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <h1 className="text-3xl font-semibold">Go deeper with MetaPet</h1>
    <p className="max-w-3xl text-base leading-7 text-slate-300">Start with the guided lessons, then explore the systems behind them. These tools open the full MetaPet world; choose and review an experience before using it with your class.</p>
    <p className="max-w-3xl text-sm leading-6 text-slate-400">Pet and lesson saves belong to the current browser and website. Moving between domains does not transfer them. This workspace uses your existing local evidence and does not create student accounts.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LABS.map((lab) => <Link key={lab.href} href={IS_SCHOOLS_PROFILE ? METAPET_ORIGIN + lab.href : lab.href}
        className="rounded-2xl border border-cyan-400/20 bg-slate-900 p-6 hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
        <h2 className="text-xl font-semibold text-cyan-200">{lab.title}</h2>
        <p className="mt-3 text-base leading-7 text-slate-300">{lab.detail}</p>
        <p className="mt-4 text-sm font-semibold">Explore</p>
      </Link>)}
    </div>
    <a href={SCHOOL_ORIGIN} className="inline-flex min-h-11 items-center rounded-xl border border-slate-700 px-4 py-2 text-sm">Return to the classroom entrance</a>
  </main>;
}
