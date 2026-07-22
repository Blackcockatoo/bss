import Link from "next/link";
import type { Metadata } from "next";

import { SCHOOL_ORIGIN } from "@/lib/domain/surface";

export const metadata: Metadata = {
  title: "Meta-Pet — Privacy-first digital learning companion",
  description:
    "Meta-Pet is a browser-first, local-first digital learning companion for classrooms and families. No ads, no trackers, no student accounts, and no unnecessary data collection.",
  openGraph: {
    title: "Meta-Pet — Privacy-first classroom companion",
    description:
      "A teacher-led digital companion for Years 3–6: short guided activities, local-first storage, no ads, no trackers, no student accounts.",
  },
  twitter: {
    card: "summary",
    title: "Meta-Pet — Privacy-first classroom companion",
    description:
      "A teacher-led digital companion for Years 3–6: short guided activities, local-first storage, no ads, no trackers, no student accounts.",
  },
};

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

const PILOT_MAILTO =
  "mailto:bluesssnakestudio@gmail.com?subject=Meta-Pet%20School%20Pilot%20Enquiry";

export default function HomePage() {
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
            <a
              href={SCHOOL_ORIGIN}
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              MetaPet for Schools
            </a>
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
            <a
              href={SCHOOL_ORIGIN}
              className="inline-flex items-center rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
            >
              Visit MetaPet School
            </a>
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
