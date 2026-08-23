import Link from "next/link";

import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";

const PRIVACY_ARTIFACTS = [
  "Privacy policy",
  "Child-friendly privacy notice",
  "Parent/carer privacy notice",
  "Data inventory",
  "Retention and deletion schedule",
  "Third-party services register",
];

export default function LegalPrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
          MetaPet Schools
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Privacy materials
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          The school deployment uses alias-based local records, short retention,
          and teacher-controlled exports only. Download the privacy pack for the
          full artifact set.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PRIVACY_ARTIFACTS.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          Data retention summary
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          <li>
            <strong className="text-slate-200">What is stored:</strong> student
            aliases, lesson progress, class summary counts and local evidence
            summaries selected by the teacher.
          </li>
          <li>
            <strong className="text-slate-200">Where:</strong> browser
            localStorage on the current device by default. Routine classroom
            use does not submit classroom-record contents to B$S. The hosting
            provider still receives ordinary page requests and request
            metadata; a teacher-initiated export deliberately leaves the
            browser.
          </li>
          <li>
            <strong className="text-slate-200">Retention period:</strong> data
            becomes eligible for expiry cleanup after{" "}
            <span className="font-semibold text-emerald-200">
              {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days
            </span>{" "}
            without use and is removed when a school route next opens.
          </li>
          <li>
            <strong className="text-slate-200">Immediate deletion:</strong>{" "}
            teachers can delete all classroom data at any time using the
            &ldquo;Delete all school data&rdquo; button in the Classroom
            Manager.
          </li>
          <li>
            <strong className="text-slate-200">
              No student identifiers required:
            </strong>{" "}
            the classroom build has no field for a real name, student ID or
            email address, and no student sign-up flow.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          How deletion works
        </h2>
        <p className="text-sm leading-6 text-slate-300">
          Expiry is enforced when a school route runs. If the{" "}
          {SCHOOLS_LOCAL_DATA_RETENTION_DAYS}-day window has passed, the app
          removes the covered classroom records the next time a school route
          opens. A website cannot erase browser storage while it is not
          running, so schools should still clear site data when a device or
          pilot is retired.
        </p>
        <p className="text-sm leading-6 text-slate-300">
          Manual deletion (the &ldquo;Delete all school data&rdquo; button in
          the Classroom Manager) is available for teachers who want to clear
          data immediately — for example at the end of a session or pilot.
          Either mechanism is sufficient; they are belt-and-suspenders, not
          sequential steps.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          Compliance frameworks
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          <li>
            <strong className="text-slate-200">
              Australian Privacy Act 1988 (Cth) / Australian Privacy Principles
              (APPs):
            </strong>{" "}
            The school build is designed so routine classroom use does not
            submit student-record contents to B$S. Whether the Privacy Act and
            APPs apply, and who is the relevant entity, depends on the operator,
            deployment and school practice. This is a data-minimisation design,
            not a legal compliance determination. Review the{" "}
            <a
              className="text-emerald-200 underline underline-offset-4"
              href="https://www.oaic.gov.au/privacy/australian-privacy-principles"
              target="_blank"
              rel="noreferrer"
            >
              OAIC Australian Privacy Principles
            </a>{" "}
            and obtain setting-specific advice where needed.
          </li>
          <li>
            <strong className="text-slate-200">COPPA (US) / GDPR-K (EU):</strong>{" "}
            Scope depends on where and how the service is deployed and who uses
            it. Alias-based records, no default classroom sync and short local
            retention reduce data exposure, but do not establish compliance in
            another jurisdiction.
          </li>
          <li>
            <strong className="text-slate-200">No application-level student-data sharing by default:</strong>{" "}
            School routes do not load the consumer analytics SDK, advertising
            networks or social features. Hosting still involves ordinary
            requests to the deployment provider. The third-party services
            register documents that narrower, checkable boundary.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/schools/docs/privacy-policy"
          className="inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Read the privacy policy in app
        </Link>
        <a
          href="/docs/schools-au/governance/privacy-policy.md"
          className="inline-flex rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200"
        >
          Download the privacy policy
        </a>
      </div>
    </main>
  );
}
