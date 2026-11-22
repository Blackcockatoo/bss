import type { Metadata } from "next";

import { PrintableExitTickets } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'Exit tickets',
  description:
    'Alias-only exit tickets for the seven MetaPet School lessons.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/tickets';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableExitTickets headingLevel={1} />
    </main>
  );
}
