import type { Metadata } from "next";
import Link from "next/link";

import { FIELD_MODE_START_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  CONTRIBUTION_EXPLANATION,
  CONTRIBUTION_HEADLINE,
  CONTRIBUTION_RATIONALE,
  CONTRIBUTION_SUPPORTING_COPY,
  FREE_ACCESS,
  FREE_ACCESS_INCLUDES,
  GOVERNING_PRINCIPLE,
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
      <div className="mx-auto w-full max-w-3xl space-y-14 px-6 py-14 md:py-20">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            For adults · never shown to students
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {CONTRIBUTION_HEADLINE}
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            {CONTRIBUTION_SUPPORTING_COPY}
          </p>
        </header>

        {/*
          The free option, alone and first. It is not one card among several,
          because it is not one option among several — it is the product.
        */}
        <section aria-labelledby="free-heading">
          <h2 id="free-heading" className="sr-only">
            Use MetaPet School for free
          </h2>
          <Link
            href={FIELD_MODE_START_PATH}
            className="inline-flex min-h-14 items-center rounded-xl bg-emerald-700 px-7 py-4 text-lg font-semibold text-white hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            {FREE_ACCESS.action}
          </Link>
          <p className="mt-4 text-base leading-7 text-foreground">
            {FREE_ACCESS.assurance}
          </p>
          <ul className="mt-6 space-y-1.5 text-base leading-7 text-muted-foreground">
            {FREE_ACCESS_INCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="why-heading" className="space-y-4">
          <h2 id="why-heading" className="text-2xl font-semibold">
            Why it works this way
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            {CONTRIBUTION_EXPLANATION}
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            {CONTRIBUTION_RATIONALE}
          </p>
        </section>

        <section
          aria-labelledby="optional-heading"
          className="border-t border-border pt-10"
        >
          <h2 id="optional-heading" className="text-2xl font-semibold">
            Optional: help sustain it
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Contribution is annual, voluntary and invisible to students. It does
            not unlock anything, change any session, or alter a single screen a
            child sees.
          </p>
          <div className="mt-6">
            <ContributionChooser />
          </div>
        </section>

        <section aria-labelledby="services-heading">
          <h2 id="services-heading" className="text-2xl font-semibold">
            Paid work that is genuinely separate
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Blue $nake Studio does paid human work. None of it is a licence, and
            none of it is required to run the seven sessions.
          </p>
          <ul className="mt-4 space-y-1.5 text-base leading-7 text-muted-foreground">
            {PAID_SERVICES.map((service) => (
              <li key={service.title}>
                <span className="font-medium text-foreground">
                  {service.title}
                </span>
                {" — "}
                {service.description}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="honesty-heading">
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

        <p className="border-t border-border pt-10 text-2xl font-semibold leading-relaxed tracking-tight text-foreground md:text-3xl">
          {GOVERNING_PRINCIPLE.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>
    </main>
  );
}
