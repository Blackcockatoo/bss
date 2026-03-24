import Link from "next/link";

import LegalNotice from "@/components/LegalNotice";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

const SCHOOL_LEGAL_LINKS = [
  {
    href: "/legal/privacy",
    title: "Privacy materials",
    description:
      "Privacy policy, child notice, parent/carer notice, retention schedule, data inventory, and third-party services register.",
  },
  {
    href: "/legal/safety",
    title: "Safety materials",
    description:
      "Child-safety risk assessment, misuse and over-engagement controls, escalation pathway, and supervision model.",
  },
  {
    href: "/legal/boundaries",
    title: "Product boundaries",
    description:
      "What MetaPet Schools is, what it is not, and how the school deployment differs from broader product surfaces.",
  },
];

export default function LegalPage() {
  if (IS_SCHOOLS_PROFILE) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            MetaPet Schools
          </p>
          <h1 className="text-3xl font-semibold text-slate-100">
            Legal and governance hub
          </h1>
          <p className="text-sm leading-6 text-slate-300">
            Use these pages for school review. They describe the school-facing
            privacy position, safeguarding posture, and product boundaries in
            plain language.
          </p>
        </div>

        <div className="grid gap-4">
          {SCHOOL_LEGAL_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <p className="text-base font-semibold text-slate-100">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <section className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <LegalNotice className="text-slate-300" />
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-100">Legal</h1>
      <p className="text-sm text-slate-300">
        This page outlines licensing and intellectual property notices for the
        Meta-Pet experience.
      </p>
      <section className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
        <LegalNotice className="text-slate-300" />
      </section>
      <section className="rounded-lg border border-slate-800/60 bg-slate-950/20 p-4 text-xs text-slate-600 space-y-2">
        <p className="font-medium text-slate-500">Our principles</p>
        <p>
          Blue Snake Studios builds software we&apos;d trust with our own
          children. That means no hidden data collection, no manipulative
          engagement loops, and no selling user information.
        </p>
        <p>
          We believe digital companions should teach kids about science,
          privacy, and ownership in ways that respect their intelligence.
        </p>
      </section>
    </main>
  );
}
