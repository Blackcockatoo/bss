import type { Metadata } from "next";

import { FieldTrustConsole } from "@/components/field-mode/FieldTrustConsole";
import { FIELD_MODE_TRUST_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Trust Console",
  description: "Verify MetaPet School local records, retention, offline pack and network promises.",
};

export default function FieldTrustPage() {
  enforceChildSafeServerRoute(FIELD_MODE_TRUST_PATH, "field");
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-4xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">Adult-only verification</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Trust Console</h1>
          <p className="text-base leading-7 text-slate-700">Inspect the current device instead of trusting marketing copy. This is a privacy and reliability view, not student analytics.</p>
        </header>
        <FieldTrustConsole />
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-semibold">Public pilot evidence</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            MetaPet School is ready for a constrained one-teacher, one-class,
            seven-lesson pilot with school approval and ICT/privacy review. No
            adoption, outcome or reliability result is claimed before evidence exists.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Teacher setup time",
              "Lesson completion",
              "Device/browser performance",
              "Offline reliability",
              "Anonymous student clarity feedback",
              "Parent/carer clarity feedback",
              "Accessibility or safeguarding issues",
              "What failed and what changed",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold">{item}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Not yet established</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
