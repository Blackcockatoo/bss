import type { Metadata } from "next";
import Link from "next/link";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { dataLifecycle } from "@/app/schools/content";

import { LocalDataControls } from "./LocalDataControls";

export const metadata: Metadata = {
  title: "Local data controls — MetaPet School",
  description:
    "Inspect and delete the MetaPet School classroom records held in this browser. Adult-only.",
  robots: { index: false, follow: false },
};

export default function SchoolsDataPage() {
  enforceChildSafeServerRoute("/schools/data");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-10 px-5 py-12 md:px-8 md:py-16">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            For adults · not part of the classroom flow
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            What happens to the data?
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Everything MetaPet School holds about a class lives in this browser,
            on this device. This page shows what is here and lets you delete it.
          </p>
        </header>

        <section
          aria-labelledby="lifecycle-heading"
          className="rounded-3xl border border-border bg-card p-6 md:p-8"
        >
          <h2 id="lifecycle-heading" className="text-2xl font-semibold">
            The seven questions, answered
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {dataLifecycle.map((item) => (
              <div key={item.question}>
                <dt className="text-base font-semibold text-foreground">
                  {item.question}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <LocalDataControls />

        <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold">If you need more detail</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            The governance pack has the full data inventory, retention schedule
            and third-party register for an ICT or privacy review.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              href="/schools/docs/data-inventory"
            >
              Data inventory
            </Link>
            <Link
              className="inline-flex min-h-12 items-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              href="/schools/docs/retention-and-deletion-schedule"
            >
              Retention and deletion schedule
            </Link>
            <Link
              className="inline-flex min-h-12 items-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              href="/schools/docs/third-party-services-register"
            >
              Third-party services register
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
