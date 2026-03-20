import { redirect } from "next/navigation";

import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "@/lib/childSafeBaseline";
import { ENABLE_CHILD_SAFE_BASELINE } from "@/lib/env/features";

export function enforceChildSafeServerRoute(pathname: string): void {
  if (!ENABLE_CHILD_SAFE_BASELINE || isChildSafeAllowedPathname(pathname)) {
    return;
  }

  redirect(getChildSafeFallbackPathname(pathname));
}
