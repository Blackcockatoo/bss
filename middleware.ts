import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isChildSafeAllowedPathname } from "./src/lib/childSafeBaseline";

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
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isChildSafeAllowedPathname(pathname)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname.startsWith("/docs") ? "/legal" : "/app";
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
