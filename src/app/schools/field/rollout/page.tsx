import type { Metadata } from "next";

import { RolloutPlanForm } from "@/components/field-mode/RolloutPlanForm";
import { FIELD_MODE_ROLLOUT_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Term rollout plan",
  description:
    "An editable, printable whole-school rollout plan that stays in this browser.",
  robots: { index: false, follow: false },
};

export default function RolloutPlanPage() {
  enforceChildSafeServerRoute(FIELD_MODE_ROLLOUT_PATH, "field");
  return <RolloutPlanForm />;
}
