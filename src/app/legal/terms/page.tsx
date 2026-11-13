import type { Metadata } from "next";
import Link from "next/link";

/**
 * DRAFT Terms of Use.
 *
 * This text has not been reviewed by Blue Snake Studios or a lawyer. Keep the
 * draft banner and `noindex` until it has been reviewed and the bracketed
 * placeholders are confirmed.
 */
export const metadata: Metadata = {
  title: "Terms of Use (Draft) | MetaPet",
  description:
    "Draft plain-language terms of use for MetaPet by Blue Snake Studios, for families, students and schools.",
  robots: { index: false, follow: true },
};

type TermsSection = {
  heading: string;
  paragraphs: readonly string[];
};

const TERMS_SECTIONS: readonly TermsSection[] = [
  {
    heading: "1. Who we are",
    paragraphs: [
      "MetaPet is made by Blue Snake Studios, an Australian business. In these terms, \"we\", \"us\" and \"our\" mean Blue Snake Studios. \"You\" means the person using MetaPet. If you are a parent, carer or teacher setting MetaPet up for a child, it also means you.",
      "MetaPet is available at www.bluesnakestudios.com and, for classrooms, at www.metapet.school.",
    ],
  },
  {
    heading: "2. The short version",
    paragraphs: [
      "MetaPet is a digital companion and learning tool. Be kind, use it to learn and play, and don't try to break it or use it to hurt anyone. We try to collect as little information as we can. Our privacy materials explain exactly what is stored and where.",
    ],
  },
  {
    heading: "3. Children and young people",
    paragraphs: [
      "MetaPet is designed with children in mind. If you are under 18, please use MetaPet with permission from a parent, carer or teacher, and ask them if anything here is unclear.",
      "MetaPet does not ask children to create an account, and you should not enter your real full name, address, school name, photos or other personal details into any text box or pet name.",
      "If you see anything on MetaPet that makes you feel unsafe or upset, stop and tell a trusted adult.",
    ],
  },
  {
    heading: "4. Schools and teachers",
    paragraphs: [
      "The classroom edition (MetaPet Schools / Field Mode) is designed to run without student logins. Student records use aliases and stay on the classroom device unless a teacher chooses to export them.",
      "Teachers and schools remain responsible for supervising students, following their own school, sector and state or territory policies, and deciding whether MetaPet suits their setting. Our safety and product-boundary pages are there to help with that review.",
    ],
  },
  {
    heading: "5. Your privacy",
    paragraphs: [
      "How we handle information is explained in our privacy materials and privacy policy. Pets and progress are saved in your browser on your device. Clearing your browser data can remove them, and we cannot recover them for you.",
    ],
  },
  {
    heading: "6. Using MetaPet fairly",
    paragraphs: [
      "Please don't: try to access parts of MetaPet you aren't meant to, interfere with how it runs, copy or resell it, use it to bully, threaten or harass anyone, or use it to share personal information about yourself or others.",
      "We may limit or stop access for anyone who misuses MetaPet, especially if a child's safety is at risk.",
    ],
  },
  {
    heading: "7. Content and ownership",
    paragraphs: [
      "MetaPet's software, artwork, characters, lessons and other content belong to Blue Snake Studios or the people who licensed them to us. You may use MetaPet for personal learning and play, and teachers may use and print the classroom materials for their own teaching.",
      "Pet names and anything else you create stay yours. Because they are stored on your device, we generally don't see them.",
    ],
  },
  {
    heading: "8. Purchases and contributions",
    paragraphs: [
      "Some pages describe paid plans or ways to support MetaPet. Where checkout is not connected, nothing is charged. If we introduce paid features, we will show the price and any terms clearly before you pay. Paid features should only be bought by an adult.",
    ],
  },
  {
    heading: "9. Your rights under Australian Consumer Law",
    paragraphs: [
      "Nothing in these terms limits any rights you have under the Australian Consumer Law or other laws that cannot be excluded.",
    ],
  },
  {
    heading: "10. Availability and changes",
    paragraphs: [
      "MetaPet is an evolving educational product. We may change, pause or remove features, and we can't promise it will always be available or error-free. To the extent the law allows, we are not responsible for losses caused by MetaPet being unavailable or by lost browser data.",
      "We may update these terms. If we make an important change, we'll update the date on this page and, where appropriate, let schools know.",
    ],
  },
  {
    heading: "11. Contact and governing law",
    paragraphs: [
      "Questions, concerns or safety reports: [contact email to be confirmed].",
      "These terms are governed by the laws of [Australian state or territory to be confirmed], Australia.",
    ],
  },
];

export default function LegalTermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div
        role="note"
        className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm font-semibold text-amber-200"
      >
        Draft — pending review. These terms have not been finalised and are
        shown for review only.
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
          Blue Snake Studios
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          MetaPet Terms of Use
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          Last updated: [date to be confirmed on approval]. Please read these
          together with our{" "}
          <Link
            href="/legal/privacy"
            className="text-emerald-200 underline underline-offset-4"
          >
            privacy materials
          </Link>
          .
        </p>
      </div>

      {TERMS_SECTIONS.map((section) => (
        <section
          key={section.heading}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5"
        >
          <h2 className="text-lg font-semibold text-slate-100">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-6 text-slate-300">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/legal/privacy"
          className="inline-flex rounded-full border border-emerald-400/30 px-4 py-2 font-semibold text-emerald-200"
        >
          Privacy materials
        </Link>
        <Link
          href="/legal/safety"
          className="inline-flex rounded-full border border-emerald-400/30 px-4 py-2 font-semibold text-emerald-200"
        >
          Safety materials
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
