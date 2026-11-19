import type { Metadata } from "next";

import { PrintableReliefPack } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'Relief teacher pack — Lesson 1',
  description:
    'A no-login pack for a relief teacher to run Lesson 1 in 15 minutes.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/relief';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableReliefPack headingLevel={1} />
    </main>
  );
}
