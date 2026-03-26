import { redirect } from "next/navigation";

import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "@/lib/childSafeBaseline";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export function enforceChildSafeServerRoute(pathname: string): void {
  if (!IS_SCHOOLS_PROFILE || isChildSafeAllowedPathname(pathname)) {
    return;
  }

  redirect(getChildSafeFallbackPathname(pathname));
}
