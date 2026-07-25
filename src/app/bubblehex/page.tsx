import { redirect } from "next/navigation";

import {
  BUBBLE_HEX_ROUTE,
  getArcadeGame,
  getArcadeGameHref,
} from "@/lib/arcade/games";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export default function BubbleHexPage() {
  enforceChildSafeServerRoute(BUBBLE_HEX_ROUTE);

  redirect(getArcadeGameHref(getArcadeGame("bubble-hex")));
}
