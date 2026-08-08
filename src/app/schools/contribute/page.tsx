import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  CONTRIBUTION_CLOSING_LINE,
  CONTRIBUTION_HEADLINE,
  CONTRIBUTION_RATIONALE,
  CONTRIBUTION_TRUST_LINE,
  FREE_TIER_INCLUDES,
  PAID_SERVICES,
} from "@/lib/schools/contribution";

import { ContributionChooser } from "./ContributionChooser";

export const metadata: Metadata = {
  title: "Contribute — MetaPet School",
  description:
    "MetaPet School's complete core is free for every school. Contribution is voluntary, adult-only, and changes nothing about what a class receives.",
  robots: { index: true, follow: true },
};

export default function ContributePage() {
  enforceChildSafeServerRoute("/schools/contribute");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-12 px-5 py-12 md:px-8 md:py-16">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            For adults · never shown to students
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {CONTRIBUTION_HEADLINE}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {CONTRIBUTION_TRUST_LINE}
          </p>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {CONTRIBUTION_RATIONALE}
          </p>
        </header>

        <section
          aria-labelledby="free-heading"
          className="rounded-3xl border-2 border-emerald-800 bg-card p-6 md:p-8"
        >
          <h2 id="free-heading" className="text-2xl font-semibold">
            A$0 is a complete answer
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            A school that contributes nothing receives everything below. You do
            not need to explain your budget, prove hardship, apply, or ask
            permission. You will not be asked again mid-year, and you can come
            back any time.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {FREE_TIER_INCLUDES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-base text-foreground"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={FIELD_MODE_HOME_PATH}
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Run one class free
          </Link>
        </section>

        <section
          aria-labelledby="contribute-heading"
          className="rounded-3xl border border-border bg-card p-6 md:p-8"
        >
          <h2 id="contribute-heading" className="text-2xl font-semibold">
            If your school can contribute
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Contribution is annual, voluntary and invisible to students. It does
            not unlock anything, change any lesson, or alter a single screen a
            child sees. It funds the work behind the project.
          </p>
          <div className="mt-6">
            <ContributionChooser />
          </div>
        </section>

        <section
          aria-labelledby="services-heading"
          className="rounded-3xl border border-border bg-card p-6 md:p-8"
        >
          <h2 id="services-heading" className="text-2xl font-semibold">
            Paid work that is genuinely separate
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Blue $nake Studio does paid human work. None of it is a licence, and
            none of it is required to run the seven sessions. If somebody
            implies otherwise, they are wrong.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PAID_SERVICES.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl border border-border bg-muted p-4"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="honesty-heading"
          className="rounded-3xl border border-border bg-card p-6 md:p-8"
        >
          <h2 id="honesty-heading" className="text-2xl font-semibold">
            What we are not claiming
          </h2>
          <ul className="mt-4 space-y-2 text-base leading-7 text-muted-foreground">
            <li>
              Contributions are not described as tax-deductible donations. That
              status has not been established.
            </li>
            <li>
              There is no payment processor connected yet. Nothing on this page
              takes a card or collects payment details.
            </li>
            <li>
              MetaPet School is early. It is being tested through small,
              carefully supported classroom pilots, and we are collecting
              evidence before making claims about outcomes.
            </li>
          </ul>
        </section>

        <p className="text-xl font-semibold leading-9 text-foreground md:text-2xl">
          {CONTRIBUTION_CLOSING_LINE}
        </p>
      </div>
    </main>
  );
}
