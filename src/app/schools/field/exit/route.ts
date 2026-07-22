import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
  fieldModeCookieOptions,
} from "@/lib/childSafeBaseline";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/schools", request.url), 307);
  response.cookies.set(FIELD_MODE_COOKIE, FIELD_MODE_COOKIE_VALUE, {
    ...fieldModeCookieOptions(request.nextUrl.protocol === "https:"),
    maxAge: 0,
  });
  return response;
}
