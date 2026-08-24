import Link from "next/link";

import {
  SCHOOL_DELETION_EXPLANATION,
  SCHOOL_PRIVACY_ARTIFACTS,
  SCHOOL_PRIVACY_COMMITMENTS,
  SCHOOL_PRIVACY_SUMMARY_ITEMS,
} from "@/lib/schools/privacyTruth";

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
        {SCHOOL_PRIVACY_ARTIFACTS.map((item) => (
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
          {SCHOOL_PRIVACY_SUMMARY_ITEMS.map((item) => (
            <li key={item.label}>
              <strong className="text-slate-200">{item.label}:</strong>{" "}
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          How deletion works
        </h2>
        {SCHOOL_DELETION_EXPLANATION.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-6 text-slate-300">
            {paragraph}
          </p>
        ))}
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
            {SCHOOL_PRIVACY_COMMITMENTS.transmission} Whether the Privacy Act
            and APPs apply, and who is the relevant entity, depends on the
            operator, deployment and school practice. This is a
            data-minimisation design, not a legal compliance determination.
            Review the{" "}
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
            {SCHOOL_PRIVACY_COMMITMENTS.tracking}{" "}
            {SCHOOL_PRIVACY_COMMITMENTS.advertising} Hosting still involves
            ordinary requests to the deployment provider. The third-party
            services register documents that narrower, checkable boundary.
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
