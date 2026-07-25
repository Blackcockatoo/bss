import type { Metadata } from "next";

import { FieldMissionLauncher } from "@/components/field-mode/FieldMissionLauncher";
import { FIELD_MODE_MISSIONS_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Field Missions",
  description:
    "Optional 5-10 minute Field Missions teachers can run inside or between the seven classroom lessons.",
};

export default function FieldMissionsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_MISSIONS_PATH, "field");
  return <FieldMissionLauncher />;
}
