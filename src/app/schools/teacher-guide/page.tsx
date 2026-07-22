import Link from "next/link";
import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

import { weeklyFitOptions, assuranceItems } from "../content";

export const metadata: Metadata = {
  title: "Teacher Guide — MetaPet School",
  description:
    "Teacher onboarding for MetaPet School: how a session runs, where it fits in the week, and the reassurance points for parents, principals and wellbeing teams.",
  alternates: { canonical: "/teacher-guide" },
};

const STEPS = [
  {
    title: "1 · Try it yourself (10 minutes)",
    body: "Open the classroom runtime on your own device. No account, no install, nothing saved beyond the browser. You see exactly what students see.",
  },
  {
    title: "2 · Set up an alias roster",
    body: "Students use classroom aliases only — no names, no accounts, no personal data. The roster stays local on the school device.",
  },
  {
    title: "3 · Run one 20-minute session",
    body: "Use Lesson 1 as a taster. Each lesson card has one outcome, one activity, one prompt and light evidence, so nothing surprises you mid-lesson.",
  },
  {
    title: "4 · Enter Field Mode for the class",
    body: "Field Mode narrows the product to lessons, the classroom runtime and this guide, then exits cleanly back to the school home when you are done.",
  },
];

export default function TeacherGuidePage() {
  enforceChildSafeServerRoute("/schools/teacher-guide");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12 md:py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            MetaPet School · Teacher Guide
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Everything a teacher needs to run a session
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            MetaPet School is teacher-led, low-friction and classroom focused.
            You stay in control of the pace, the roster and the evidence.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/field"
              className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
            >
              Enter Field Mode
            </Link>
            <Link
              href="/lessons"
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
            >
              Browse lessons
            </Link>
          </div>
        </header>

        <section className="grid gap-4">
          {STEPS.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
            >
              <h2 className="text-lg font-semibold text-white">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {step.body}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Where it fits in a school week
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {weeklyFitOptions.map((option) => (
              <article
                key={option.label}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <h3 className="text-base font-semibold text-white">
                  {option.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {option.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Reassurance for families and leadership
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {assuranceItems.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <h3 className="text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/parents"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
            >
              Information for parents
            </Link>
            <Link
              href="/safety"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
            >
              Safety and privacy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
