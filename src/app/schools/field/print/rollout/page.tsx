import type { Metadata } from "next";

import { PrintableRolloutPlan } from "@/components/field-mode/PrintableRolloutPlan";
import { PrintToolbar, printMainClassName } from "@/components/field-mode/PrintToolbar";
import { FIELD_MODE_ROLLOUT_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { FIELD_MODE_PRINT_ROLLOUT_PATH } from "@/lib/schools/classroomPack";

export const metadata: Metadata = {
  title: "Term rollout plan template",
  description:
    "A blank printable template for planning which classes do which MetaPet School lessons.",
  robots: { index: false, follow: false },
};

export default function PrintRolloutPlanPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRINT_ROLLOUT_PATH, "field");
  return (
    <main className={printMainClassName}>
      <PrintToolbar
        backHref={FIELD_MODE_ROLLOUT_PATH}
        backLabel="Open editable plan"
      />
      <p className="field-print-hide mx-auto mb-4 max-w-4xl text-sm leading-6 text-slate-700">
        This printed sheet is a blank template. To print a plan you have already
        filled in on this device, use Print on the editable rollout plan page.
      </p>
      <PrintableRolloutPlan headingLevel={1} />
    </main>
  );
}
