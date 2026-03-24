import Link from "next/link";

import { ClassroomManager } from "@/components/ClassroomManager";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  PLANNED_TEACHER_HUB_MENU_ACTIONS,
  PRIMARY_TEACHER_HUB_MENU_ACTIONS,
} from "./menuActions";

const PILOT_EVIDENCE_ITEMS = [
  "Teacher interview notes",
  "Anonymous student exit feedback",
  "Parent/carer feedback",
  "Pre/post measure",
  "Incident log",
  "Dropout and engagement counts",
  "Implementation fidelity notes",
];

const WORKFLOW_STEPS = [
  "Review the teacher guide, parent note, and staff briefing before any classroom use.",
  "Set up an alias-only roster and a short lesson queue on the current device.",
  "Run the sequence as a teacher-led classroom activity, not an always-on companion.",
  "Delete or export local evidence at the end of the pilot window according to the governance pack.",
];

export default function SchoolGamePage() {
  enforceChildSafeServerRoute("/school-game");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:gap-10 md:py-16">
        <header className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.05)] md:p-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
              MetaPet Schools
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Teacher-led classroom runtime
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              This route is the school-only runtime: alias-based classroom
              setup, a short lesson queue, local evidence, and clear deletion
              controls. It is intentionally separate from adult-only and
              experimental Meta-Pet surfaces.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                "Alias roster only",
                "No student accounts",
                "Teacher-led use",
                "Local evidence only",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 font-medium text-amber-100"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950"
                href="/schools"
              >
                Return to school overview
              </Link>
              <Link
                className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
                href="/legal/privacy"
              >
                Privacy materials
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              Workflow
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Use the runtime as a bounded teacher tool
            </h2>
            <div className="mt-6 space-y-3">
              {WORKFLOW_STEPS.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
              Resource Pack
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Download the school-facing materials first
            </h2>
            <div className="mt-6 grid gap-4">
              {PRIMARY_TEACHER_HUB_MENU_ACTIONS.map((action) => (
                <a
                  key={action.id}
                  href={action.href}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-base font-semibold text-white">
                    {action.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {action.description}
                  </p>
                </a>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Planned after pilot
              </p>
              {PLANNED_TEACHER_HUB_MENU_ACTIONS.map((action) => (
                <p key={action.id} className="mt-2 text-sm leading-6 text-slate-300">
                  {action.description}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-violet-300">
            Pilot Evidence
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Collect only the evidence needed for a school pilot
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {PILOT_EVIDENCE_ITEMS.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            Classroom Setup
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Prepare the roster, lesson queue, and local evidence on-device
          </h2>
          <div className="mt-6">
            <ClassroomManager />
          </div>
        </section>
      </div>
    </main>
  );
}
