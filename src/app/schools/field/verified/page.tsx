import type { Metadata } from "next";

import {
  PrintableOfficialLinks,
  PrintableVerifiedStatus,
} from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar } from "@/components/field-mode/PrintToolbar";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_OFFLINE_PATH,
  FIELD_MODE_PRINT_ALL_PATH,
  FIELD_MODE_SAFETY_PATH,
  FIELD_MODE_VERIFIED_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "What’s verified",
  description:
    "Checks actually done for MetaPet School, including official link reachability, and what has not been verified.",
};

export default function FieldVerifiedPage() {
  enforceChildSafeServerRoute(FIELD_MODE_VERIFIED_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 print:bg-white print:p-0">
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <div className="mx-auto max-w-4xl space-y-8">
        <PrintableVerifiedStatus headingLevel={1} />
        <PrintableOfficialLinks headingLevel={2} includeCurriculum />
        <nav className="field-print-hide flex flex-wrap gap-3 pb-8">
          <a
            href={FIELD_MODE_SAFETY_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Safety and privacy
          </a>
          <a
            href={FIELD_MODE_OFFLINE_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Offline Pack
          </a>
          <a
            href={FIELD_MODE_PRINT_ALL_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Print the classroom pack
          </a>
        </nav>
      </div>
    </main>
  );
}
