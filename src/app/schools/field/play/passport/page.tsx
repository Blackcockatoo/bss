import { LearningPassport } from "@/components/teacher-lessons/LearningPassport";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { FIELD_PLAY_HOME } from "@/lib/productSurfaces";

export const metadata = { title: "My passport — MetaPet" };

export default function StudentPassportPage() {
  enforceChildSafeServerRoute(FIELD_PLAY_HOME + "/passport", "field");
  return <LearningPassport fieldMode audience="student" hubPath={FIELD_PLAY_HOME} />;
}
