import type { Metadata } from "next";

import { ClassroomTools } from "@/components/field-mode/ClassroomTools";
import { FIELD_MODE_TOOLS_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Classroom timer and groups",
  description:
    "A projector-friendly classroom timer and a local group maker that uses only the alias roster on this device.",
  robots: { index: false, follow: false },
};

export default function ClassroomToolsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_TOOLS_PATH, "field");
  return <ClassroomTools />;
}
