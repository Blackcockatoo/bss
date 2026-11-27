import type { Metadata } from "next";
import Link from "next/link";

import {
  FAMILY_PRIVACY_KIDS_SECTIONS,
  FAMILY_PRIVACY_PARENT_SECTIONS,
} from "./content";

/**
 * DRAFT consumer privacy notice for www.bluesnakestudios.com (the MetaPet
 * companion, Expressions, games and identity tools).
 *
 * The facts here describe what the code does today; see `content.ts` for the
 * source of each claim. It has not been reviewed by Blue Snake Studios or a
 * lawyer. Keep the draft banner and `noindex` until it has been reviewed and
 * the bracketed placeholders are filled in.
 */
export const metadata: Metadata = {
  title: "Privacy for Families (Draft) | MetaPet",
  description:
    "Draft plain-language privacy notice for kids and parents using MetaPet by Blue Snake Studios.",
  robots: { index: false, follow: true },
};

function Section({
  heading,
  paragraphs,
  bullets,
}: {
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
      <h3 className="text-lg font-semibold text-slate-100">{heading}</h3>
      {paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-6 text-slate-300">
          {paragraph}
        </p>
      ))}
      {bullets && bullets.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function FamilyPrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div
        role="note"
        data-testid="family-privacy-draft-banner"
        className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm font-semibold text-amber-200"
      >
        DRAFT: pending review by Blue Snake Studios and a legal adviser. This
        notice has not been finalised and is shown for review only.
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
          Blue Snake Studios
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Privacy for kids and families
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          This notice covers MetaPet on www.bluesnakestudios.com: your pet,
          Expressions, the games, and the identity and DNA tools. The classroom
          edition at www.metapet.school has its own{" "}
          <Link
            href="/legal/privacy"
            className="text-emerald-200 underline underline-offset-4"
          >
            school privacy materials
          </Link>
          .
        </p>
        <p className="text-sm leading-6 text-slate-400">
          Last updated: [date to be confirmed on approval].
        </p>
      </div>

      <section
        aria-labelledby="for-kids"
        className="space-y-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5"
      >
        <h2 id="for-kids" className="text-2xl font-semibold text-emerald-100">
          For kids
        </h2>
        {FAMILY_PRIVACY_KIDS_SECTIONS.map((section) => (
          <Section key={section.heading} {...section} />
        ))}
      </section>

      <section
        aria-labelledby="for-parents"
        className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/40 p-5"
      >
        <h2 id="for-parents" className="text-2xl font-semibold text-slate-100">
          For parents and carers
        </h2>
        {FAMILY_PRIVACY_PARENT_SECTIONS.map((section) => (
          <Section key={section.heading} {...section} />
        ))}
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/legal/terms"
          className="inline-flex rounded-full border border-emerald-400/30 px-4 py-2 font-semibold text-emerald-200"
        >
          Terms of use (draft)
        </Link>
        <Link
          href="/legal"
          className="inline-flex rounded-full border border-slate-700 px-4 py-2 font-semibold text-slate-300"
        >
          Legal hub
        </Link>
      </div>
    </main>
  );
}
