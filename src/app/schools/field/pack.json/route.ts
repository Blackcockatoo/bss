import { NextResponse } from "next/server";

import { buildFieldPackManifest } from "@/lib/fieldMode/cachePolicy";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildFieldPackManifest(process.env), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
