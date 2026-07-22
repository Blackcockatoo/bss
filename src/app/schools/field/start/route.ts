import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_UI_COOKIE,
  fieldModeCookieOptions,
  fieldModeUiCookieOptions,
} from "@/lib/childSafeBaseline";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL(FIELD_MODE_LESSONS_PATH, request.url),
    307,
  );
  response.cookies.set(
    FIELD_MODE_COOKIE,
    FIELD_MODE_COOKIE_VALUE,
    fieldModeCookieOptions(request.nextUrl.protocol === "https:"),
  );
  response.cookies.set(
    FIELD_MODE_UI_COOKIE,
    FIELD_MODE_COOKIE_VALUE,
    fieldModeUiCookieOptions(request.nextUrl.protocol === "https:"),
  );
  return response;
}
