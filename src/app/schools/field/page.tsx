import { ArrowRight, CheckCircle2, Printer, ShieldCheck } from "lucide-react";

import {
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
  FIELD_MODE_SAFETY_PATH,
  FIELD_MODE_START_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { METAPET_SCHOOL_NAME } from "@/lib/fieldMode/identity";
import {
  CANONICAL_SESSION_COUNT,
  FIRST_CANONICAL_SESSION,
} from "@/lib/schools/canonicalSequence";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";

const WHAT_YOU_NEED = [
  "Years 3–6 class",
  "About 20 minutes",
  "A teacher to lead it",
  "A browser — nothing to install",
  "No student accounts to create",
  "A printer if you want the paper fallback",
] as const;

const SESSION_ONE_PATH = `${FIELD_MODE_LESSONS_PATH}/${FIRST_CANONICAL_SESSION.slug}`;
const SESSION_ONE_PRINT_PATH = `${FIELD_MODE_PRINT_PATH_PREFIX}/${FIRST_CANONICAL_SESSION.slug}`;

export default function FieldModePage() {
  enforceChildSafeServerRoute(FIELD_MODE_HOME_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-10 px-5 py-10 md:px-8 md:py-16">
        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {METAPET_SCHOOL_NAME} · Australian Years 3–6
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {CANONICAL_SESSION_COUNT} short lessons about how systems work.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-700">
            Teacher-led, about 15–20 minutes each. No student sign-in. Records
            stay on this device and you can delete them at any time.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={SESSION_ONE_PATH}
              className="inline-flex min-h-14 items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Start Session One
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href={FIELD_MODE_START_PATH}
              className="inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-emerald-800 px-6 py-3 text-base font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Run the seven-session sequence
            </a>
          </div>

          <p className="text-base text-slate-600">
            Session One is a complete lesson on its own. Running only that one
            is a legitimate way to finish.
          </p>
        </section>

        <section
          aria-labelledby="what-you-need-heading"
          className="rounded-3xl border-2 border-emerald-900/20 bg-white p-6 shadow-sm md:p-8"
        >
          <h2
            id="what-you-need-heading"
            className="text-2xl font-semibold text-slate-950"
          >
            What you need
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {WHAT_YOU_NEED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-base text-slate-800"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <a
            href={SESSION_ONE_PRINT_PATH}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print the Session One paper fallback
          </a>
        </section>

        <section
          aria-labelledby="before-you-start-heading"
          className="grid gap-4 md:grid-cols-2"
        >
          <h2 id="before-you-start-heading" className="sr-only">
            Before you start
          </h2>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">
              What this stores
            </h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-slate-700">
              <li>Teacher-chosen aliases; real names are not required and should not be entered</li>
              <li>Lesson progress and any light evidence you record</li>
              <li>In this browser only, on this device</li>
              <li>
                Cleared on the next school-route load after{" "}
                {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days without use
              </li>
            </ul>
            <a
              href={FIELD_MODE_SAFETY_PATH}
              className="mt-5 inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              See exactly what data it uses
            </a>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">
              What this is not
            </h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-slate-700">
              <li>Not a replacement for your school platform</li>
              <li>Not therapy, counselling or a wellbeing assessment</li>
              <li>No chat, social feed, sharing or public profile</li>
              <li>No streaks, leaderboards or rewards to chase</li>
            </ul>
            <a
              href={FIELD_MODE_GUIDE_PATH}
              className="mt-5 inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              Open the teacher guide
            </a>
          </article>
        </section>

        <aside className="rounded-2xl bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
          Field Mode keeps consumer, shopping, identity, sharing, social,
          marketplace and advanced laboratory areas outside the classroom route
          boundary. Nothing on this side of the boundary asks a student for an
          account, a name or anything else about them.
        </aside>
      </div>
    </main>
  );
}
