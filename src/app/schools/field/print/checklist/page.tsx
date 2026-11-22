import type { Metadata } from "next";

import { PrintableAssessmentTools } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'Assessment and reflection',
  description:
    'The published teacher observation checklist and student reflection sheet.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/checklist';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableAssessmentTools headingLevel={1} />
    </main>
  );
}
