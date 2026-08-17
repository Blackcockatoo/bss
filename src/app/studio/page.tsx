import type { Metadata } from "next";
import Link from "next/link";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { ARCADE_ROUTE } from "@/lib/games/arcade";
import {
  SCHOOL_PITCH,
  STUDIO_HANDLE,
  STUDIO_HOME,
  STUDIO_NAME,
  STUDIO_PILLARS,
  STUDIO_ROSTER,
  STUDIO_STATEMENT,
  STUDIO_TAGLINE,
} from "@/lib/studio/identity";

export const metadata: Metadata = {
  title: "The Studio — Blue $nake Studios",
  description:
    "What Blue $nake Studios builds and why: the MetaPet living system, the generative DNA layer, the arcade, the free classroom edition, and the personalities the studio backs.",
  openGraph: {
    title: "Blue $nake Studios",
    description:
      "Living systems, a generative DNA layer, an arcade, and a classroom edition that is free permanently.",
  },
  twitter: {
    card: "summary",
    title: "Blue $nake Studios",
    description:
      "One studio, building living systems and the games that live inside them.",
  },
};

export default function StudioPage() {
  enforceChildSafeServerRoute("/studio");

  return (
    <main className="min-h-screen bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-slate-100 sm:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.14),transparent_40%),radial-gradient(circle_at_88%_16%,rgba(59,130,246,0.12),transparent_38%)]" />
        <div className="relative mx-auto w-full max-w-4xl space-y-7 px-6 py-16 md:py-24">
          <Link
            href="/"
            className="inline-flex text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 transition-colors hover:text-cyan-300"
          >
            ← {STUDIO_NAME}
          </Link>
          <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
            {STUDIO_TAGLINE}
          </h1>
          <div className="space-y-5">
            {STUDIO_STATEMENT.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="max-w-3xl text-base leading-8 text-slate-300 md:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <a
            href={STUDIO_HOME}
            className="inline-flex text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
            rel="noopener noreferrer"
          >
            {STUDIO_HOME.replace("https://", "")} · {STUDIO_HANDLE} →
          </a>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 py-14 md:py-16">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
          What the studio builds
        </h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {STUDIO_PILLARS.map((pillar) => (
            <Link
              key={pillar.href}
              href={pillar.href}
              className="group rounded-3xl border border-slate-800 bg-slate-900/45 p-6 transition-all hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-900/75"
            >
              <h3 className="text-lg font-semibold text-white">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {pillar.description}
              </p>
              <p className="mt-5 text-sm font-semibold text-cyan-300 transition-transform group-hover:translate-x-1">
                Open →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-amber-400/[0.03]">
        <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80">
            {SCHOOL_PITCH.eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {SCHOOL_PITCH.headline}
          </h2>
          <div className="mt-6 space-y-5">
            {SCHOOL_PITCH.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="max-w-3xl text-base leading-7 text-slate-300"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {SCHOOL_PITCH.proofPoints.map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-2xl border border-amber-400/15 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-300"
              >
                <span aria-hidden="true" className="text-amber-300">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={SCHOOL_PITCH.href}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
            >
              Go to MetaPet School
            </a>
            <Link
              href={SCHOOL_PITCH.reviewHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
            >
              Review the pilot pack
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 py-14 md:py-16">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Sponsored by the studio
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
          B$S backs people as well as products. These are independent artists —
          their sites, their voice, their work.
        </p>

        <div className="mt-8 space-y-4">
          {STUDIO_ROSTER.map((member) => (
            <a
              key={member.id}
              href={member.href}
              rel="noopener noreferrer"
              target="_blank"
              className="group block overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900 to-slate-950 p-6 transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 md:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-3xl font-black italic tracking-tight text-white">
                  {member.name}
                </h3>
                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {member.role}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                {member.tagline} · {member.location}
              </p>
              <blockquote className="mt-5 border-l-2 border-cyan-400/40 pl-4 text-lg font-medium italic leading-8 text-slate-200">
                {member.quote}
              </blockquote>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">
                {member.description}
              </p>
              <p className="mt-6 text-sm font-semibold text-cyan-300 transition-transform group-hover:translate-x-1">
                {member.linkLabel} →
              </p>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {STUDIO_NAME}</p>
          <div className="flex gap-5">
            <Link href={ARCADE_ROUTE} className="hover:text-cyan-300">
              Arcade
            </Link>
            <Link href="/pet" className="hover:text-cyan-300">
              MetaPet
            </Link>
            <Link href="/legal" className="hover:text-cyan-300">
              Legal
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
