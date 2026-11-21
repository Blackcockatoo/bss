import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  INVISIBLE_TRAIL_COMMENTS_PATH,
  INVISIBLE_TRAIL_INTENTION,
  INVISIBLE_TRAIL_LAB_PATH,
  INVISIBLE_TRAIL_PACK_CODES,
  INVISIBLE_TRAIL_REPORT_STARTERS,
  INVISIBLE_TRAIL_TITLE,
} from "@/lib/schools/invisibleTrailPack";
import {
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";

export const metadata: Metadata = {
  title: "Report comment starters — The Invisible Trail",
  description:
    "Short report comment starters for the optional Invisible Trail lab. They are not official achievement standards.",
  alternates: { canonical: metaPetSchoolUrl(INVISIBLE_TRAIL_COMMENTS_PATH) },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: "Report comment starters — The Invisible Trail",
    description:
      "Short report comment starters for the optional Invisible Trail lab.",
    url: metaPetSchoolUrl(INVISIBLE_TRAIL_COMMENTS_PATH),
    locale: "en_AU",
  },
};

const LEVELS = [
  ["working-towards", "Working towards"],
  ["at", "At the intention"],
  ["above", "Above the intention"],
] as const;

export default function InvisibleTrailCommentsPage() {
  enforceChildSafeServerRoute(INVISIBLE_TRAIL_COMMENTS_PATH, "field");
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-3xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
          Optional companion · Years 3–6
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Report comment starters — {INVISIBLE_TRAIL_TITLE}
        </h1>
        <p className="text-sm leading-6 text-slate-700">
          These are short starters only. They use this lab’s learning intention
          and the codes already stated on the lab ({INVISIBLE_TRAIL_PACK_CODES.join(
            ", ",
          )}
          ). They are not official achievement standards, and they are not ACARA,
          VCAA or NESA text. Replace [alias] and change the wording so it
          describes what you actually saw this student do.
        </p>
        <p className="text-sm leading-6 text-slate-700">
          Learning intention: {INVISIBLE_TRAIL_INTENTION}
        </p>
        <ul className="space-y-5">
          {LEVELS.map(([key, label]) => (
            <li
              key={key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-base font-semibold">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                {INVISIBLE_TRAIL_REPORT_STARTERS[key]}
              </p>
            </li>
          ))}
        </ul>
        <a
          href={INVISIBLE_TRAIL_LAB_PATH}
          className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline"
        >
          Back to the lab
        </a>
      </div>
    </main>
  );
}
