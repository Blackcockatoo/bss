"use client";

/**
 * HomeLanding — mode-aware home page.
 *
 * Normal mode (default): an app launcher that gets people into the actual
 * experiences (pet, DNA music hub, add-ons, …) in one tap.
 * School mode: the teacher-facing pilot/marketing landing.
 *
 * The mode follows the header School/Normal switch (see @/lib/appMode);
 * IS_SCHOOLS_PROFILE deployments always render the school landing.
 */

import Link from "next/link";

import { useAppMode } from "@/lib/appMode";
import { isChildSafeAllowedPathname } from "@/lib/childSafeBaseline";
import {
  ENABLE_CHILD_SAFE_BASELINE,
  IS_SCHOOLS_PROFILE,
} from "@/lib/env/features";

const PILOT_MAILTO =
  "mailto:bluesssnakestudio@gmail.com?subject=Meta-Pet%20School%20Pilot%20Enquiry";

const TRUST_BADGES = [
  "No ads",
  "No trackers",
  "No student accounts",
  "Browser-first",
  "Local-first",
  "Teacher-led school runtime",
  "Parent/carer information available",
  "Pilot pack ready",
];

interface AppTile {
  href: string;
  title: string;
  desc: string;
  icon: string;
  accent: string;
}

const APP_TILES: AppTile[] = [
  {
    href: "/pet",
    title: "Meta-Pet Companion",
    desc: "Care for Auralia — feed, play, bond, evolve.",
    icon: "🐦",
    accent: "border-cyan-500/25 bg-cyan-500/5 hover:bg-cyan-500/10",
  },
  {
    href: "/digital-dna",
    title: "DNA Music Hub",
    desc: "Turn number strands into geometry, colour, and sound.",
    icon: "🧬",
    accent: "border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10",
  },
  {
    href: "/addons-demo",
    title: "Add-on Studio",
    desc: "Mint and equip crypto-signed cosmetic add-ons.",
    icon: "✨",
    accent: "border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10",
  },
  {
    href: "/moss60",
    title: "Moss60 Hub",
    desc: "Explore the 60-glyph strand system.",
    icon: "🌿",
    accent: "border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10",
  },
  {
    href: "/genome-explorer",
    title: "Genome Explorer",
    desc: "Dig into the genetic engine behind your pet.",
    icon: "🔬",
    accent: "border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10",
  },
  {
    href: "/identity",
    title: "Identity",
    desc: "Your local-first keys, crest, and profile.",
    icon: "🗝️",
    accent: "border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10",
  },
];

export function HomeLanding() {
  const appMode = useAppMode();
  const schoolMode = IS_SCHOOLS_PROFILE || appMode === "school";
  return schoolMode ? <SchoolLanding /> : <NormalLanding />;
}

function NormalLanding() {
  // Child-safe deployments only expose a subset of routes; hide tiles that
  // would just redirect back.
  const tiles = ENABLE_CHILD_SAFE_BASELINE
    ? APP_TILES.filter((tile) => isChildSafeAllowedPathname(tile.href))
    : APP_TILES;
  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      {/* Hero — compact, app-first */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-6 pt-10 sm:pt-14">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Meta-Pet
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          Your local-first geometry companion. Pick a place to start:
        </p>
      </section>

      {/* App launcher */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className={`group flex min-h-[44px] items-start gap-3 rounded-2xl border p-4 transition-colors ${tile.accent}`}
            >
              <span aria-hidden className="text-2xl leading-none pt-0.5">
                {tile.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-100 group-hover:text-white">
                  {tile.title} →
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {tile.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Compact school pointer */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-14">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Teacher or school?
            </p>
            <p className="text-xs text-slate-400">
              Switch to School mode in the header, or go straight to the pilot
              pack.
            </p>
          </div>
          <Link
            href="/schools"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/15"
          >
            School Pilot Pack
          </Link>
        </div>
      </section>
    </main>
  );
}

function SchoolLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
            Meta-Pet
          </h1>
          <p className="text-xl leading-8 text-slate-300 md:text-2xl md:leading-9">
            Privacy-first digital learning companion for classrooms and families.
          </p>
          <p className="max-w-2xl text-base leading-7 text-slate-400">
            Meta-Pet turns care, pattern learning, digital responsibility, and
            emotional regulation into short guided activities. It is
            browser-first and local-first: no ads, no trackers, no student
            accounts, and no unnecessary data collection.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/pet"
              className="inline-flex items-center rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
            >
              Try Demo
            </Link>
            <Link
              href="/schools"
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Review School Pilot Pack
            </Link>
            <Link
              href="/school-game"
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Open Classroom Runtime
            </Link>
            <Link
              href="/schools/parents"
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Parent / Carer Info
            </Link>
            <a
              href={PILOT_MAILTO}
              className="inline-flex items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/15"
            >
              Ask About a Pilot
            </a>
          </div>
        </div>
      </section>

      {/* Best first click */}
      <section className="bg-slate-900/50 py-12">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Best first click
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                role: "For teachers",
                label: "Review School Pilot Pack",
                href: "/schools",
                color: "amber",
              },
              {
                role: "For parents / carers",
                label: "Read Parent / Carer Info",
                href: "/schools/parents",
                color: "emerald",
              },
              {
                role: "For students / families",
                label: "Try Demo",
                href: "/pet",
                color: "cyan",
              },
              {
                role: "For principals / councils",
                label: "Ask About a Pilot",
                href: PILOT_MAILTO,
                color: "violet",
                external: true,
              },
            ].map(({ role, label, href, color, external }) => (
              <Link
                key={role}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`group rounded-2xl border p-5 transition-colors
                  ${color === "amber" ? "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10" : ""}
                  ${color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" : ""}
                  ${color === "cyan" ? "border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10" : ""}
                  ${color === "violet" ? "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10" : ""}
                `}
              >
                <p className={`text-xs font-medium mb-2
                  ${color === "amber" ? "text-amber-400/70" : ""}
                  ${color === "emerald" ? "text-emerald-400/70" : ""}
                  ${color === "cyan" ? "text-cyan-400/70" : ""}
                  ${color === "violet" ? "text-violet-400/70" : ""}
                `}>
                  {role}
                </p>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-white">
                  {label} →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="mx-auto w-full max-w-5xl px-6 py-16 space-y-16">

        {/* What is Meta-Pet? */}
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            What is Meta-Pet?
          </h2>
          <p className="text-base leading-7 text-slate-300">
            Meta-Pet is a digital companion that helps children notice patterns,
            practise digital responsibility, and reflect on systems and
            regulation through short guided activities.
          </p>
        </section>

        {/* Why is it safe? */}
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Why is it safe?
          </h2>
          <p className="text-base leading-7 text-slate-300">
            The school pathway is designed around adult supervision,
            alias-only classroom use, local browser storage, clear deletion
            controls, and no default cloud data transmission.
          </p>
        </section>

        {/* How schools can try it */}
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            How schools can try it
          </h2>
          <p className="text-base leading-7 text-slate-300">
            Start with the school pilot pack, review the parent/carer
            information, then use the classroom runtime for seven teacher-led
            sessions of around 15–20 minutes.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/schools"
              className="inline-flex items-center rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
            >
              Review School Pilot Pack
            </Link>
            <Link
              href="/school-game"
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              Open Classroom Runtime
            </Link>
          </div>
        </section>

        {/* What parents should know */}
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            What parents should know
          </h2>
          <p className="text-base leading-7 text-slate-300">
            No student email, no public profile, no chat, no social sharing,
            no ads, no tracking, and no personal data collection. Teachers can
            delete local classroom data.
          </p>
          <div className="pt-2">
            <Link
              href="/schools/parents"
              className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15"
            >
              Read Parent / Carer Info
            </Link>
          </div>
        </section>

        {/* Pilot enquiry */}
        <section className="space-y-4 rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/70">
            Pilot enquiry
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Start a no-cost pilot
          </h2>
          <p className="text-base leading-7 text-slate-300">
            Schools, teachers, principals, councils, and education contacts can
            approach Blue $nake Studio about a no-cost pilot pathway.
          </p>
          <div className="pt-2">
            <a
              href={PILOT_MAILTO}
              className="inline-flex items-center rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Ask About a Pilot
            </a>
          </div>
        </section>

        {/* Classroom detail */}
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Classroom details
          </h2>
          <ul className="grid gap-2 text-sm leading-6 text-slate-300 sm:grid-cols-2">
            {[
              "Years 3–6",
              "Seven teacher-led sessions",
              "Around 15–20 minutes per session",
              "No student accounts",
              "No data collection",
              "Alias-only classroom use",
              "Local browser storage",
              "Clear deletion controls",
              "Parent/carer information",
              "Safeguarding and governance pack",
              "Pilot readiness material",
              "Classroom runtime included",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Footer pilot CTA */}
      <div className="border-t border-slate-800 bg-slate-950 py-10 text-center">
        <p className="mb-4 text-sm text-slate-400">
          Ready to explore a school pilot?
        </p>
        <a
          href={PILOT_MAILTO}
          className="inline-flex items-center rounded-xl bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
        >
          Ask About a Pilot
        </a>
      </div>
    </main>
  );
}

export default HomeLanding;
