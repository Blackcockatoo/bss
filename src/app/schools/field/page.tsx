import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_SAFETY_PATH,
  FIELD_MODE_START_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

const FIELD_PROMISES = [
  "Years 3–6",
  "Teacher-led use",
  "Seven short classroom lessons",
  "No student accounts",
  "Alias-only classroom use",
  "Local device records",
  "Australian Curriculum alignment",
] as const;

// Recommended school homepage CTA order: Browse Lessons, Open Classroom,
// Teacher Guide, Safety & Privacy -- four distinct destinations, not five
// buttons that all land on the same runtime.
const FIELD_HOME_ACTIONS = [
  {
    href: FIELD_MODE_START_PATH,
    label: "Browse Lessons",
    primary: true,
  },
  {
    href: FIELD_MODE_CLASSROOM_PATH,
    label: "Open Classroom",
    primary: false,
  },
  {
    href: FIELD_MODE_GUIDE_PATH,
    label: "Teacher Guide",
    primary: false,
  },
  {
    href: FIELD_MODE_SAFETY_PATH,
    label: "Safety & Privacy",
    primary: false,
  },
] as const;

export default function FieldModePage() {
  enforceChildSafeServerRoute(FIELD_MODE_HOME_PATH, "field");
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:px-8 md:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Focused Australian classroom mode
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-800">
              Blue Snake Studios · MetaPet Schools
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              MetaPet Field Mode — Australian Schools
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-700">
              A calm, teacher-led classroom experience for Australian Years 3–6.
              Run one of seven short lessons using safe aliases and records that
              remain on this device. No student sign-in is required.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {FIELD_HOME_ACTIONS.map((action) =>
              action.primary ? (
                <a
                  key={action.href}
                  href={action.href}
                  className="inline-flex min-h-14 items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                >
                  {action.label}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </a>
              ) : (
                <a
                  key={action.href}
                  href={action.href}
                  className="inline-flex min-h-14 items-center justify-center rounded-xl border border-emerald-800/30 bg-white px-6 py-3 text-base font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                >
                  {action.label}
                </a>
              ),
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-950">
            What teachers can expect
          </h2>
          <ul className="mt-5 space-y-4">
            {FIELD_PROMISES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base text-slate-700">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Field Mode keeps consumer shopping, identity, sharing, social,
            marketplace and advanced laboratory areas outside the classroom
            route boundary.
          </p>
        </aside>
      </div>
    </main>
  );
}
