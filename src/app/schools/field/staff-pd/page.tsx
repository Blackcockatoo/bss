import type { Metadata } from "next";

import { StaffPdSlides } from "@/components/field-mode/StaffPdSlides";
import { FIELD_MODE_STAFF_PD_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "15-minute staff briefing",
  description:
    "A 15-minute staff projector deck about MetaPet School, drawn only from claims already in the classroom pack.",
  robots: { index: false, follow: false },
};

export default function StaffPdPage() {
  enforceChildSafeServerRoute(FIELD_MODE_STAFF_PD_PATH, "field");
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <StaffPdSlides />
    </main>
  );
}
