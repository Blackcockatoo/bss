import type { Metadata } from "next";

import { PrintableVerifiedStatus } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'What’s verified',
  description:
    'Checks actually done for MetaPet School, and what has not been verified.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/verified';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableVerifiedStatus headingLevel={1} />
    </main>
  );
}
