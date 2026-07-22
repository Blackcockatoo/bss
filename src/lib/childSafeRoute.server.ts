import { redirect } from "next/navigation";

import {
  getChildSafeFallbackPathname,
  getPolicyFallbackPathname,
  isChildSafeAllowedPathname,
  isPathnameAllowedByPolicy,
  type ChildSafePolicyId,
} from "@/lib/childSafeBaseline";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export function enforceChildSafeServerRoute(
  pathname: string,
  policyId?: ChildSafePolicyId,
): void {
  if (policyId) {
    if (!isPathnameAllowedByPolicy(pathname, policyId)) {
      redirect(getPolicyFallbackPathname(policyId));
    }
    return;
  }

  if (!IS_SCHOOLS_PROFILE || isChildSafeAllowedPathname(pathname)) {
    return;
  }

  redirect(getChildSafeFallbackPathname(pathname));
}
