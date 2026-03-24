import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "./src/lib/childSafeBaseline";
import { APP_PROFILE } from "./src/lib/env/features";

function isEnabled(value: string | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const CHILD_SAFE_BASELINE_ENABLED = isEnabled(
  process.env.NEXT_PUBLIC_CHILD_SAFE_BASELINE,
);

export function middleware(request: NextRequest) {
  if (!CHILD_SAFE_BASELINE_ENABLED) {
    if (APP_PROFILE !== "schools") {
      return NextResponse.next();
    }
  }

  const { pathname } = request.nextUrl;
  if (APP_PROFILE === "schools" && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/schools";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isChildSafeAllowedPathname(pathname)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = getChildSafeFallbackPathname(pathname);
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
