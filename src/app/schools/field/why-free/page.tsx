import type { Metadata } from "next";
import { ExternalLink, Scale, ShieldCheck } from "lucide-react";

import { FIELD_MODE_WHY_FREE_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { METAPET_PRODUCT } from "@/lib/fieldMode/product";

export const metadata: Metadata = {
  title: "Why MetaPet School Refuses the Usual Bargain",
  description:
    "The public-interest charter separating classroom access from child-data extraction.",
};

const SOURCES = [
  ["OAIC Children’s Online Privacy Code", "https://www.oaic.gov.au/privacy/privacy-registers/privacy-codes/childrens-online-privacy-code"],
  ["Attorney-General’s Department privacy reforms", "https://www.ag.gov.au/rights-and-protections/privacy"],
  ["eSafety social-media age restrictions", "https://www.esafety.gov.au/about-us/industry-regulation/social-media-age-restrictions"],
  ["Australian Framework for Generative AI in Schools", "https://www.education.gov.au/schooling/announcements/australian-framework-generative-artificial-intelligence-ai-schools"],
] as const;

export default function WhyFreePage() {
  enforceChildSafeServerRoute(FIELD_MODE_WHY_FREE_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">Public-interest charter</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Why MetaPet School Refuses the Usual Bargain</h1>
          <blockquote className="border-l-4 border-emerald-700 pl-5 text-xl font-semibold leading-8 text-emerald-950">
            Good educational software costs money. Children should not pay with their identity, attention or behavioural data.
          </blockquote>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck className="h-7 w-7 text-emerald-800" aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-semibold">The boundary</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Teachers need useful, creative technology.</li>
              <li>Children generally do not choose classroom software or negotiate its terms.</li>
              <li>Safe software still requires maintenance, testing, accessibility and support.</li>
              <li>Institutions may support the work without receiving greater access to children.</li>
              <li>{METAPET_PRODUCT.studio} retains the intellectual property and defines the school-use boundary.</li>
              <li>The funding model may evolve; the non-extractive child-safety boundary does not.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-cyan-900/15 bg-cyan-50 p-6 text-cyan-950">
            <Scale className="h-7 w-7" aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-semibold">A distinction worth keeping clear</h2>
            <p className="mt-4 text-sm leading-6">
              Charging adults transparently for labour, training and specialised support is legitimate. Monetising a child’s vulnerability, attention or information is a different bargain. MetaPet School separates the two.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-semibold">Australian policy context — adult review only</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Australia’s Children’s Online Privacy Code is pending and must be finalised and registered by 10 December 2026. Broader policy is moving toward child-centred privacy, proactive safety and stronger accountability. Under-16 social-media account restrictions already apply to covered platforms; MetaPet School is not social media. The Australian AI in Schools Framework identifies human wellbeing, transparency, fairness, accountability, privacy, security and safety as relevant principles.
          </p>
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            These sources provide context, not endorsement. MetaPet School does not claim government approval or certification against an unfinished code, and curriculum mapping is not ACARA endorsement.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SOURCES.map(([label, href]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  {label}<ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
