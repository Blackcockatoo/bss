import Link from "next/link";

const campaignCtas = [
  {
    label: "Principal briefing",
    href: "/schools#pilot-package",
    description:
      "Share this section with leadership for implementation and approval context.",
  },
  {
    label: "Parent communication",
    href: "/schools#family-comms",
    description:
      "Deep-link directly to parent-safe messaging and privacy talking points.",
  },
  {
    label: "Policy and ICT review",
    href: "/schools#governance",
    description:
      "Open the governance view for school councils, ICT, and department reviewers.",
  },
];

export default function SchoolsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 md:py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            Jewble for Schools
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            A focused route for school pilots and campaign deep-links
          </h1>
          <p className="max-w-3xl text-base text-slate-300 md:text-lg">
            This page is a direct school-facing narrative: implementation
            readiness, privacy-by-design, and communication support in one
            place. Use it for internal navigation, newsletters, and campaign
            CTAs without sending stakeholders through extra marketing layers.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950"
              href="#pilot-package"
            >
              View school package
            </Link>
            <Link
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
              href="/"
            >
              Back to MetaPet
            </Link>
          </div>
        </header>

        <section
          id="pilot-package"
          className="rounded-2xl border border-amber-300/20 bg-slate-900/60 p-6 md:p-8"
        >
          <h2 className="text-2xl font-semibold text-white">
            Pilot package snapshot
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
            <li>
              Seven structured sessions with facilitation scripts for normal
              class windows.
            </li>
            <li>
              Curriculum alignment across Digital Technologies, Science, and
              wellbeing practice.
            </li>
            <li>Offline-first delivery with no student account requirement.</li>
            <li>
              Leadership-ready reporting language for post-pilot review and
              decisions.
            </li>
          </ul>
        </section>

        <section
          id="family-comms"
          className="rounded-2xl border border-teal-400/20 bg-slate-900/60 p-6 md:p-8"
        >
          <h2 className="text-2xl font-semibold text-white">
            Family communication baseline
          </h2>
          <p className="mt-3 text-slate-300">
            Share clear statements with caregivers: no hidden tracking, no ad
            loops, and no unexpected account setup burden. This deep-link
            section helps school communication teams reuse consistent,
            privacy-safe wording.
          </p>
        </section>

        <section
          id="governance"
          className="rounded-2xl border border-violet-400/20 bg-slate-900/60 p-6 md:p-8"
        >
          <h2 className="text-2xl font-semibold text-white">
            Governance and assurance
          </h2>
          <p className="mt-3 text-slate-300">
            For school councils, ICT, and department reviewers: this route
            consolidates governance-fit, operational simplicity, and
            data-minimal implementation claims into a single shareable page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            Campaign-ready deep-links
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {campaignCtas.map((cta) => (
              <article
                key={cta.href}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <h3 className="font-medium text-white">{cta.label}</h3>
                <p className="mt-2 text-sm text-slate-400">{cta.description}</p>
                <Link
                  className="mt-3 inline-flex text-sm font-semibold text-amber-300"
                  href={cta.href}
                >
                  {cta.href}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
