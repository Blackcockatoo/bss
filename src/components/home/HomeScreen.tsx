"use client";

import {
  ArrowRight,
  BookOpen,
  Gamepad2,
  Heart,
  PawPrint,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { useAppMode } from "@/lib/appMode";
import { ENABLE_CHILD_SAFE_BASELINE } from "@/lib/env/features";
import { isChildSafeAllowedPathname } from "@/lib/childSafeBaseline";
import { PORTAL_DESCRIPTION, PORTAL_TAGLINE } from "@/lib/portalTruth";
import { getTotalMasteryStars } from "@/lib/progression/types";
import { LIBRARY_SHELVES, type LibraryShelf } from "@/lib/siteLibrary";
import { useStore } from "@/lib/store";
import { getVitalsAverage } from "@/vitals";

import { ModeToggle } from "./ModeToggle";

const PILOT_MAILTO =
  "mailto:bluesssnakestudio@gmail.com?subject=Meta-Pet%20School%20Pilot%20Enquiry";

const TRUST_BADGES = [
  "No ads",
  "No trackers",
  "No student accounts",
  "Browser-first",
  "Local-first",
  "Teacher-led school runtime",
];

function visibleShelves(teacherMode: boolean): LibraryShelf[] {
  const shelves = teacherMode
    ? // Teacher mode: school shelf first, then the shelves worth previewing.
      [...LIBRARY_SHELVES].sort((a, b) =>
        a.id === "school" ? -1 : b.id === "school" ? 1 : 0,
      )
    : LIBRARY_SHELVES;

  return shelves
    .map((shelf) => ({
      ...shelf,
      entries: shelf.entries.filter((entry) => {
        if (teacherMode && !entry.teacherVisible) return false;
        if (ENABLE_CHILD_SAFE_BASELINE && !isChildSafeAllowedPathname(entry.href))
          return false;
        return true;
      }),
    }))
    .filter((shelf) => shelf.entries.length > 0);
}

function LibraryShelfSection({ shelf }: { shelf: LibraryShelf }) {
  const Icon = shelf.icon;
  return (
    <section aria-labelledby={`shelf-${shelf.id}`} className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="rounded-xl p-2"
          style={{
            color: shelf.accent,
            backgroundColor: `${shelf.accent}1a`,
            boxShadow: `0 0 16px ${shelf.accent}33`,
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3
            id={`shelf-${shelf.id}`}
            className="text-lg font-semibold text-white"
          >
            {shelf.title}
          </h3>
          <p className="text-xs text-slate-400">{shelf.blurb}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shelf.entries.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900"
            style={{ borderLeftColor: shelf.accent, borderLeftWidth: 3 }}
          >
            <p className="flex items-center justify-between text-sm font-semibold text-slate-100">
              {entry.label}
              <ArrowRight
                className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                style={{ color: shelf.accent }}
              />
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {entry.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExplorerHero() {
  const vitals = useStore((state) => state.vitals);
  const evolution = useStore((state) => state.evolution);
  const essence = useStore((state) => state.essence);
  const miniGames = useStore((state) => state.miniGames);

  const vitalsAvg = Math.round(getVitalsAverage(vitals));
  const mastery = getTotalMasteryStars(miniGames);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(34,211,238,0.12), transparent 55%)",
        }}
      />
      <div className="relative space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
          Welcome back, explorer
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Your companion is waiting
        </h1>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
            <Heart className="h-3.5 w-3.5" />
            Vitals {vitalsAvg}%
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 font-semibold text-violet-300">
            <TrendingUp className="h-3.5 w-3.5" />
            {evolution.state} · Lv {evolution.level}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            {essence} Essence
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-semibold text-amber-300">
            ★ {mastery}/20 Mastery
          </span>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/pet"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            <PawPrint className="h-4 w-4" />
            Visit your pet
          </Link>
          <Link
            href="/app/activities"
            className="inline-flex items-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-5 py-2.5 text-sm font-semibold text-pink-300 transition-colors hover:bg-pink-500/20"
          >
            <Gamepad2 className="h-4 w-4" />
            Open the Arcade
          </Link>
          <a
            href="#library"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            <BookOpen className="h-4 w-4" />
            Browse the Library
          </a>
        </div>
      </div>
    </section>
  );
}

function TeacherHero() {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
        Teacher mode
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {PORTAL_TAGLINE}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-slate-300">
        {PORTAL_DESCRIPTION}
      </p>
      <div className="flex flex-wrap gap-2">
        {TRUST_BADGES.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
          >
            {badge}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href="/schools"
          className="inline-flex items-center rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
        >
          Review School Pilot Pack
        </Link>
        <Link
          href="/school-game"
          className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
        >
          Open Classroom Runtime
        </Link>
        <a
          href={PILOT_MAILTO}
          className="inline-flex items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/15"
        >
          Ask About a Pilot
        </a>
      </div>
    </section>
  );
}

const TEACHER_FACTS = [
  {
    title: "Why is it safe?",
    body: "Adult supervision, alias-only classroom use, local browser storage, clear deletion controls, and no default cloud data transmission.",
  },
  {
    title: "How schools can try it",
    body: "Review the pilot pack and parent information, then run seven teacher-led sessions of around 15–20 minutes in the classroom runtime.",
  },
  {
    title: "What parents should know",
    body: "No student email, no public profiles, no chat, no social sharing, no ads, no tracking. Teachers can delete local classroom data at any time.",
  },
];

export function HomeScreen() {
  const { mode } = useAppMode();
  const teacherMode = mode === "teacher";
  const shelves = visibleShelves(teacherMode);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        {/* Mode switch */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-300">
            {teacherMode ? "MetaPet Schools" : "Meta-Pet"}
          </p>
          <ModeToggle />
        </div>

        {teacherMode ? <TeacherHero /> : <ExplorerHero />}

        {teacherMode && (
          <div className="grid gap-4 md:grid-cols-3">
            {TEACHER_FACTS.map((fact) => (
              <section
                key={fact.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
              >
                <h2 className="text-base font-semibold text-white">
                  {fact.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {fact.body}
                </p>
              </section>
            ))}
          </div>
        )}

        {/* The Library */}
        <div id="library" className="scroll-mt-24 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-400" />
            <h2 className="text-xl font-bold text-white">The Library</h2>
          </div>
          <p className="text-sm text-slate-400">
            {teacherMode
              ? "The classroom-relevant destinations, ordered for review."
              : "Everything in one place, shelved by what you want to do — no labyrinth."}
          </p>
        </div>

        <div className="space-y-10">
          {shelves.map((shelf) => (
            <LibraryShelfSection key={shelf.id} shelf={shelf} />
          ))}
        </div>

        {/* Cross-mode pointer */}
        {teacherMode ? (
          <section className="rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-6 text-center">
            <p className="text-sm text-slate-300">
              Schools, principals, and councils can approach Blue $nake Studio
              about a no-cost pilot pathway.
            </p>
            <a
              href={PILOT_MAILTO}
              className="mt-3 inline-flex items-center rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Ask About a Pilot
            </a>
          </section>
        ) : (
          <section className="rounded-3xl border border-amber-500/20 bg-amber-950/15 p-6">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-amber-300">
                Teacher or parent?
              </span>{" "}
              Switch to Teacher mode above for the school pilot pack, parent
              information, and safety material — or jump straight to the{" "}
              <Link
                href="/schools"
                className="font-semibold text-amber-300 underline underline-offset-4"
              >
                School & Family shelf
              </Link>
              .
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
