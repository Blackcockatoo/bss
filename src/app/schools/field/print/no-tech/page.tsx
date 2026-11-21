import type { Metadata } from "next";

import { PrintableNoTechGuide } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'No-tech / paper path',
  description:
    'An honest paper path for each lesson, including what still needs a shared screen.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/no-tech';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableNoTechGuide headingLevel={1} />
    </main>
  );
}
