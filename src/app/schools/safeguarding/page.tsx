import Link from "next/link";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export default function SafeguardingPage() {
  enforceChildSafeServerRoute("/schools/safeguarding");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12 md:gap-14 md:py-16">
        <header className="space-y-4">
          <Link
            href="/schools"
            className="text-sm text-amber-300 hover:text-amber-200"
          >
            &larr; Back to school documents
          </Link>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            Safeguarding
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Safety, boundaries, and escalation
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-300">
            This page summarises the key safeguarding documents for MetaPet
            Schools. Full versions are available in the governance pack.
          </p>
        </header>

        <section className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">
            What MetaPet Schools is / is not
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-emerald-200">
                What it is
              </h3>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                <li>A teacher-led classroom tool</li>
                <li>A short sequence for Years 3-6</li>
                <li>
                  A way to teach systems thinking, digital responsibility, and
                  online safety habits
                </li>
                <li>A low-data pilot surface with alias-based local records</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200">
                What it is not
              </h3>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                <li>Not therapy or counselling</li>
                <li>Not social media</li>
                <li>Not a generative AI chatbot</li>
                <li>Not an always-on companion</li>
                <li>Not a behaviour surveillance or profiling tool</li>
                <li>Not a replacement for teacher judgement</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            The school deployment is intentionally narrower than the broader
            MetaPet product. School decisions should be based on the school
            deployment, the governance pack, and pilot evidence only.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">
            Wellbeing escalation pathway
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            If a student response during a session suggests distress, disclosure,
            or dysregulation beyond normal classroom reflection:
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-amber-200">
                Immediate teacher response
              </h3>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-slate-300">
                <li>Pause the activity.</li>
                <li>Move the student back to normal classroom support.</li>
                <li>Do not improvise counselling through the tool.</li>
                <li>Record a factual note about what happened.</li>
              </ol>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-amber-200">
                School escalation
              </h3>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-slate-300">
                <li>
                  Follow the school&apos;s existing wellbeing and safeguarding
                  procedures.
                </li>
                <li>
                  Notify the nominated staff member for wellbeing or child
                  safety.
                </li>
                <li>Contact family according to school policy when required.</li>
                <li>
                  Review whether the class or individual should continue with the
                  pilot.
                </li>
              </ol>
            </div>
          </div>
          <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/5 p-3 text-sm text-rose-200">
            MetaPet Schools must never be used as the primary response to a
            wellbeing issue. It is a classroom learning tool, not a support
            service.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">
            Teacher supervision model
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            The teacher is present and leading throughout every session. Students
            do not use MetaPet Schools unsupervised.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <span className="font-semibold text-slate-100">Setup:</span>{" "}
              Teacher creates the alias roster and selects the lesson before
              class.
            </li>
            <li>
              <span className="font-semibold text-slate-100">Runtime:</span>{" "}
              Teacher projects or distributes the companion and guides
              observation, discussion, and reflection.
            </li>
            <li>
              <span className="font-semibold text-slate-100">Evidence:</span>{" "}
              Teacher optionally collects light evidence (verbal, written, or
              checklist).
            </li>
            <li>
              <span className="font-semibold text-slate-100">Deletion:</span>{" "}
              Teacher clears local data at the end of the pilot using the
              built-in controls.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">
            Privacy at a glance
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <span className="font-semibold text-slate-100">
                No student accounts.
              </span>{" "}
              Students are identified by teacher-assigned aliases only.
            </li>
            <li>
              <span className="font-semibold text-slate-100">
                Local data only.
              </span>{" "}
              Roster, lesson progress, and reflection data stay on the classroom
              device.
            </li>
            <li>
              <span className="font-semibold text-slate-100">
                No cloud sync.
              </span>{" "}
              Nothing is transmitted to external servers during routine classroom
              use.
            </li>
            <li>
              <span className="font-semibold text-slate-100">
                Easy deletion.
              </span>{" "}
              Clearing the browser or using the built-in reset removes all local
              data.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">
            Full governance documents
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            For detailed policies, risk assessments, and compliance
            documentation, download the full governance pack from the school
            documents page.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/schools#governance"
              className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950"
            >
              View governance pack
            </Link>
            <a
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
              download
              href="/docs/schools-au/governance/child-safety-risk-assessment.md"
            >
              Child safety risk assessment
            </a>
            <a
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
              download
              href="/docs/schools-au/governance/privacy-policy.md"
            >
              Privacy policy
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
