import Link from "next/link";
import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { getSurfaceContact, buildMailto } from "@/lib/domain/contact";

export const metadata: Metadata = {
  title: "Contact — MetaPet School",
  description:
    "Contact Blue Snake Studios about a no-cost MetaPet School classroom pilot. Teachers, principals, councils and education contacts welcome.",
  alternates: { canonical: "/contact" },
};

export default function SchoolContactPage() {
  enforceChildSafeServerRoute("/schools/contact");

  const contact = getSurfaceContact("school");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12 md:py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            MetaPet School · Contact
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Ask about a classroom pilot
          </h1>
          <p className="text-base leading-7 text-slate-300">
            Schools, teachers, principals, councils and education contacts can
            approach Blue Snake Studios about a no-cost pilot pathway. There is
            nothing to commit to — every step is small, teacher-controlled and
            reversible.
          </p>
        </header>

        <section className="rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white">Get in touch</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Email us and we will reply with pilot details and the governance
            pack for your leadership and ICT teams.
          </p>
          <a
            href={buildMailto(contact)}
            className="mt-4 inline-flex items-center rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Email about a pilot
          </a>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Before you write</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <li>
              <Link href="/safety" className="text-cyan-300 hover:text-cyan-200">
                Safety and privacy
              </Link>{" "}
              — how alias-only, local-first classroom use works.
            </li>
            <li>
              <Link
                href="/parents"
                className="text-cyan-300 hover:text-cyan-200"
              >
                Information for parents and carers
              </Link>
            </li>
            <li>
              <Link
                href="/teacher-guide"
                className="text-cyan-300 hover:text-cyan-200"
              >
                Teacher guide
              </Link>{" "}
              — how a session runs from start to finish.
            </li>
          </ul>
        </section>

        <p className="text-center text-xs text-slate-500">
          MetaPet School is created by Blue Snake Studios.
        </p>
      </div>
    </main>
  );
}
