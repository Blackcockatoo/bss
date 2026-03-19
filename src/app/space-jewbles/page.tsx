import { redirect } from "next/navigation";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export default function SpaceJewblesPage() {
  enforceChildSafeServerRoute("/space-jewbles");

  redirect("/monkey-invaders");
}
