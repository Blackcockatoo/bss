import type { Metadata } from "next";

import { PrintableLeadershipBrief } from "@/components/field-mode/classroomPackDocuments";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: 'Principal and ICT one-pager',
  description:
    'A one-page briefing for principals and ICT, drawn from the published staff brief and privacy rules.',
  robots: { index: false, follow: false },
};

const PATH = '/schools/field/print/leadership';

export default function Page() {
  enforceChildSafeServerRoute(PATH, "field");

  return (
    <main className={printMainClassName}>
      <PrintToolbar backHref={FIELD_MODE_HOME_PATH} backLabel="Back to home" />
      <PrintableLeadershipBrief headingLevel={1} />
    </main>
  );
}
