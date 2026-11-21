import type { Metadata } from "next";

import { PrintableWordWalls } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'Vocabulary word walls',
  description:
    'Printable word walls using vocabulary already used in each lesson.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/word-walls';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableWordWalls headingLevel={1} />
    </main>
  );
}
