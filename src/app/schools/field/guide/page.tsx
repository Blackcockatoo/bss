import type { Metadata } from "next";
import {
  BookOpenCheck,
  CircleCheckBig,
  HardDriveDownload,
  ShieldCheck,
} from "lucide-react";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_OFFLINE_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Teacher Guide",
  description:
    "A concise teacher guide for preparing and running MetaPet Field Mode lessons.",
};

const RUN_STEPS = [
  {
    title: "Before class",
    body: "Confirm your school process, prepare alias-only classroom records, choose one lesson and check the device or display. Download the Offline Pack while connected if the network may be unreliable.",
  },
  {
    title: "During the lesson",
    body: "Keep the session teacher-led. Use the guided lesson prompts, invite observation and discussion, and keep student responses within normal classroom learning activities.",
  },
  {
    title: "After the lesson",
    body: "Review only the light evidence you need, back up local classroom records if required by your school, and use the existing deletion controls when the records are no longer needed.",
  },
] as const;

export default function FieldTeacherGuidePage() {
  enforceChildSafeServerRoute(FIELD_MODE_GUIDE_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Australian Years 3–6 · teacher-led
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Field Mode teacher guide
          </h1>
          <p className="text-base leading-7 text-slate-700 md:text-lg">
            A simple checklist for running the existing seven-lesson sequence
            as a focused classroom activity. Students do not need accounts and
            classroom records use teacher-chosen aliases on this device.
          </p>
        </header>

        <section aria-labelledby="guide-sequence-heading">
          <div className="mb-4 flex items-center gap-3">
            <BookOpenCheck
              className="h-6 w-6 text-emerald-800"
              aria-hidden="true"
            />
            <h2 id="guide-sequence-heading" className="text-2xl font-semibold">
              Run a calm classroom session
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {RUN_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-emerald-900/15 bg-emerald-50 p-6 text-emerald-950">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-semibold">Classroom boundary</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6">
              <li>No real names or student sign-ins</li>
              <li>No public profiles, chat or sharing</li>
              <li>No shopping, wallet or marketplace features</li>
              <li>No unsupervised or wellbeing-service use</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-cyan-900/15 bg-cyan-50 p-6 text-cyan-950">
            <HardDriveDownload className="h-6 w-6" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-semibold">Network preparation</h2>
            <p className="mt-3 text-sm leading-6">
              Install and verify the complete Field Pack while connected. Every
              lesson also has a static print-or-save-PDF fallback. Updates are
              teacher-triggered and keep the last complete pack available for
              rollback.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="guide-actions-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <CircleCheckBig
              className="h-6 w-6 text-emerald-800"
              aria-hidden="true"
            />
            <h2 id="guide-actions-heading" className="text-2xl font-semibold">
              Ready to teach
            </h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={FIELD_MODE_LESSONS_PATH}
              className="inline-flex min-h-12 items-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Choose a lesson
            </a>
            <a
              href={FIELD_MODE_CLASSROOM_PATH}
              className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Prepare classroom
            </a>
            <a
              href={FIELD_MODE_OFFLINE_PATH}
              className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Prepare Offline Pack
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
