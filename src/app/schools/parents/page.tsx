import Link from "next/link";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";

export default function SchoolsParentPage() {
  enforceChildSafeServerRoute("/schools/parents");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
          MetaPet Schools
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Information for parents and carers
        </h1>
        <p className="text-base leading-7 text-slate-300">
          MetaPet Schools is a short, teacher-led classroom activity for Years
          3&ndash;6. Students use a digital companion to notice patterns,
          practise simple online safety habits, and talk about systems and
          regulation in age-appropriate language.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          What your child will do
        </h2>
        <p className="text-sm leading-6 text-slate-300">
          In each 15&ndash;20 minute session the teacher leads the class through
          a guided activity. Students observe a digital companion on a shared or
          individual device, discuss what they notice with classmates, and
          reflect on patterns, feelings and system behaviour. There are seven
          sessions in the pilot sequence.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          What is NOT involved
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-300">
          <li>No student account or email</li>
          <li>No public profile</li>
          <li>No social sharing or chat</li>
          <li>No personal data collected</li>
          <li>No ads or tracking</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          What is stored and for how long
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-300">
          <li>
            A <strong className="text-slate-200">teacher-chosen alias</strong>{" "}
            (not the student&rsquo;s real name)
          </li>
          <li>Lesson progress on the classroom device</li>
          <li>A local class summary for pilot evidence</li>
        </ul>
        <p className="text-sm leading-6 text-slate-300">
          All data stays in the browser on the school device. Nothing is sent to
          any server. Data auto-deletes after{" "}
          <strong className="text-emerald-200">
            {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days
          </strong>{" "}
          without use, and teachers can delete everything immediately at any
          time.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          How participation works
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-300">
          <li>
            The default pilot pack assumes parent/carer opt-in before direct
            student use.
          </li>
          <li>
            If your school uses a different approved local process, it should
            explain that clearly before classroom use.
          </li>
          <li>
            Students who are not the primary device user can still take part
            through observation, discussion, or teacher-provided alternatives.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          Who should I contact?
        </h2>
        <p className="text-sm leading-6 text-slate-300">
          Please contact the school if you have questions about classroom use,
          privacy, or whether your child participates in the pilot.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <a
          href="/docs/schools-au/teacher-pack/parent-note.md"
          className="rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200"
        >
          Download as document
        </a>
        <Link
          href="/schools"
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200"
        >
          Back to school overview
        </Link>
      </div>
    </main>
  );
}
