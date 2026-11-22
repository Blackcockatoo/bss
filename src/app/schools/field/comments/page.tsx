import type { Metadata } from "next";

import { ReportCommentsPage } from "@/components/field-mode/ReportCommentsPage";
import { FIELD_MODE_COMMENTS_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { allReportCommentBanks } from "@/lib/schools/reportComments";

export const metadata: Metadata = {
  title: "Report comment starters",
  description:
    "Short, editable report comment starters for each Years 3–6 lesson, written from that lesson’s learning intention and published AC v9 codes.",
  robots: { index: false, follow: false },
};

export default function FieldCommentsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_COMMENTS_PATH, "field");
  return <ReportCommentsPage banks={allReportCommentBanks()} />;
}
