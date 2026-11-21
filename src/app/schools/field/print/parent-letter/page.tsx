import type { Metadata } from "next";

import { PrintableParentLetter } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'Parent and carer letter',
  description:
    'Editable parent and carer letter using the published privacy wording.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/parent-letter';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableParentLetter headingLevel={1} />
    </main>
  );
}
