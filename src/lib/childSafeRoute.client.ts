"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "@/lib/childSafeBaseline";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export function useEnforceChildSafeClientRoute(pathname: string): boolean {
  const router = useRouter();
  const blocked = useMemo(
    () => IS_SCHOOLS_PROFILE && !isChildSafeAllowedPathname(pathname),
    [pathname],
  );

  useEffect(() => {
    if (!blocked) {
      return;
    }

    router.replace(getChildSafeFallbackPathname(pathname));
  }, [blocked, pathname, router]);

  return blocked;
}
