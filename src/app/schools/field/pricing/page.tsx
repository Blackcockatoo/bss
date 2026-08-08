import type { Metadata } from "next";
import { ArrowRight, BadgeDollarSign, CheckCircle2 } from "lucide-react";

import {
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRICING_PATH,
  FIELD_MODE_WHY_FREE_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  FIELD_CONTRIBUTION_COPY,
  FIELD_CONTRIBUTION_HEADLINE,
  FIELD_CONTRIBUTIONS,
  FIELD_GOVERNING_LINE,
  buildFieldContributionEnquiryHref,
} from "@/lib/fieldMode/product";

export const metadata: Metadata = {
  title: "Free Access and Voluntary Contributions",
  description:
    "The complete MetaPet Field Mode is free for every school, with optional adult support contributions.",
};

export default function FieldPricingPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRICING_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Fair access · adult-only contribution information
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {FIELD_CONTRIBUTION_HEADLINE}
          </h1>
          <p className="text-lg font-semibold text-emerald-950">
            {FIELD_GOVERNING_LINE}
          </p>
          <p className="max-w-3xl text-base leading-7 text-slate-700">
            {FIELD_CONTRIBUTION_COPY}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Suggested annual contribution levels">
          {FIELD_CONTRIBUTIONS.map((level, index) => (
            <article key={level.amount} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <BadgeDollarSign className="h-6 w-6 text-emerald-800" aria-hidden="true" />
              <h2 className="mt-3 text-xl font-semibold">{level.amount}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{level.meaning}</p>
              {index === 0 ? (
                <a href={FIELD_MODE_LESSONS_PATH} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">
                  Use complete Field Mode
                </a>
              ) : (
                <a href={buildFieldContributionEnquiryHref(level.amount)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900">
                  Record adult intent
                </a>
              )}
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-900/15 bg-emerald-50 p-6 text-emerald-950">
            <h2 className="text-2xl font-semibold">The $0 path is complete</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6">
              {["No hardship explanation", "No reduced lesson set", "No delayed access", "No child-facing prompt", "No preselected paid level"].map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">What a contribution does not buy</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Contributions never unlock child-facing features or greater access to children. Training, customisation, network deployment and bespoke implementation require a separate written scope. Councils, departments and multi-school networks use a custom agreement.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This is a contribution-intent pathway, not a payment checkout. No payment success is represented until a reviewed provider and accounting process exist.
            </p>
            <a href={FIELD_MODE_WHY_FREE_PATH} className="mt-5 inline-flex items-center gap-2 font-semibold text-emerald-900 underline underline-offset-2">
              Read the public-interest charter <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
