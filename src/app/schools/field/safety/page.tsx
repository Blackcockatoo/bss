import type { Metadata } from "next";
import { HeartHandshake, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_SAFETY_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";

export const metadata: Metadata = {
  title: "Safety and Privacy",
  description:
    "Field Mode safeguarding, privacy and parent information for Australian classrooms.",
};

export default function FieldSafetyPage() {
  enforceChildSafeServerRoute(FIELD_MODE_SAFETY_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Safeguarding · privacy · parent information
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Safety and privacy at a glance
          </h1>
          <p className="text-base leading-7 text-slate-700 md:text-lg">
            Field Mode is a teacher-led classroom learning tool, not therapy,
            counselling, social media or an always-on companion. Your
            school&apos;s existing child-safety and wellbeing procedures remain
            the authority.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-900/15 bg-white p-6 shadow-sm">
            <LockKeyhole className="h-6 w-6 text-emerald-800" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-semibold">What is stored</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Teacher-chosen aliases, never student real names</li>
              <li>Lesson progress and light classroom evidence</li>
              <li>Classroom setup records on this browser only</li>
              <li>No routine cloud sync, public profile, chat or tracking</li>
            </ul>
            <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">
              Local school data auto-deletes after {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days
              without use. Teachers can delete it sooner with the existing
              classroom controls.
            </p>
          </article>

          <article className="rounded-3xl border border-cyan-900/15 bg-white p-6 shadow-sm">
            <UsersRound className="h-6 w-6 text-cyan-800" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-semibold">Parent and carer information</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Students take part in seven short Years 3–6 activities led by a
              teacher. They observe a digital companion, discuss patterns and
              practise age-appropriate systems and online-safety thinking.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>No student email or account</li>
              <li>No public sharing, social feed or advertising</li>
              <li>Participation follows the school&apos;s approved local process</li>
              <li>Questions about participation go to the school</li>
            </ul>
          </article>
        </section>

        <section className="rounded-3xl border border-rose-900/15 bg-rose-50 p-6 text-rose-950">
          <div className="flex items-center gap-3">
            <HeartHandshake className="h-6 w-6" aria-hidden="true" />
            <h2 className="text-xl font-semibold">If a concern arises</h2>
          </div>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
            <li>Pause the activity and return to normal classroom support.</li>
            <li>Do not improvise counselling through MetaPet.</li>
            <li>Follow the school&apos;s existing safeguarding and wellbeing pathway.</li>
            <li>Record only the factual information required by school policy.</li>
            <li>Review whether the class or student should continue.</li>
          </ol>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-800" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Teacher supervision</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            A teacher remains present and leads every Field Mode session.
            MetaPet must never be the primary response to a wellbeing issue and
            does not replace professional judgement or school procedures.
          </p>
          <a
            href={FIELD_MODE_CLASSROOM_PATH}
            className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Open alias-only classroom controls
          </a>
        </section>
      </div>
    </main>
  );
}
