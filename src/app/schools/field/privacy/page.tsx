import type { Metadata } from "next";
import { LockKeyhole, ShieldX } from "lucide-react";

import { FIELD_MODE_PRIVACY_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  FIELD_CHILD_PRIVACY_EXPLANATION,
  FIELD_NEVER_DOES,
  FIELD_PRIVACY_EXPLANATION,
} from "@/lib/fieldMode/product";

export const metadata: Metadata = {
  title: "What MetaPet School Never Does",
  description: "Plain-language adult and child privacy explanations for Field Mode.",
};

export default function FieldPrivacyPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRIVACY_PATH, "field");
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">Honest privacy language</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">What MetaPet School Never Does</h1>
          <p className="text-base leading-7 text-slate-700">{FIELD_PRIVACY_EXPLANATION}</p>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          {FIELD_NEVER_DOES.map((item) => (
            <article key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" aria-hidden="true" />
              <p className="text-sm font-medium leading-6">{item}</p>
            </article>
          ))}
        </section>
        <section className="rounded-3xl border border-cyan-900/15 bg-cyan-50 p-6 text-cyan-950">
          <div className="flex items-center gap-3"><LockKeyhole className="h-6 w-6" aria-hidden="true" /><h2 className="text-2xl font-semibold">For children</h2></div>
          <p className="mt-4 text-lg leading-8">{FIELD_CHILD_PRIVACY_EXPLANATION}</p>
        </section>
      </div>
    </main>
  );
}
