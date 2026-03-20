import { redirect } from "next/navigation";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export default function MonkeyInvadersPage() {
  enforceChildSafeServerRoute("/monkey-invaders");

  redirect("/monkey-invaders.html");
}
