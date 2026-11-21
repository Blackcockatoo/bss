import type { Metadata } from "next";

import { PrintableStaffPd } from "@/components/field-mode/PrintableStaffPd";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_STAFF_PD_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { FIELD_MODE_PRINT_STAFF_PD_PATH } from "@/lib/schools/classroomPack";

export const metadata: Metadata = {
  title: "Staff briefing handout",
  description:
    "A printable 15-minute staff briefing run sheet for MetaPet School.",
  robots: { index: false, follow: false },
};

export default function PrintStaffPdPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRINT_STAFF_PD_PATH, "field");
  return (
    <main className={printMainClassName}>
      <PrintToolbar
        backHref={FIELD_MODE_STAFF_PD_PATH}
        backLabel="Open projector deck"
      />
      <PrintableStaffPd headingLevel={1} />
    </main>
  );
}
