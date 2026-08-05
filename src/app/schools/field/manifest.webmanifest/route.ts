import { NextResponse } from "next/server";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_OFFLINE_PATH,
} from "@/lib/childSafeBaseline";
import {
  METAPET_SCHOOL_BACKGROUND_COLOR,
  METAPET_SCHOOL_DESCRIPTION,
  METAPET_SCHOOL_NAME,
  METAPET_SCHOOL_SHORT_NAME,
  METAPET_SCHOOL_THEME_COLOR,
} from "@/lib/fieldMode/identity";
import {
  FIELD_MODE_APP_ID,
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
  FIELD_MODE_ICON_SVG_PATH,
  FIELD_MODE_MASKABLE_ICON_512_PATH,
} from "@/lib/fieldMode/pwa";

export function GET() {
  return NextResponse.json(
    {
      name: `${METAPET_SCHOOL_NAME} — Australian Years 3–6 Classroom Lessons`,
      short_name: METAPET_SCHOOL_SHORT_NAME,
      description: METAPET_SCHOOL_DESCRIPTION,
      id: FIELD_MODE_APP_ID,
      // start_url must sit inside scope. A trailing slash on scope alone put
      // the start URL outside it, which browsers treat as an invalid install
      // target. Next serves these routes without a trailing slash, so both
      // values are slash-free.
      start_url: FIELD_MODE_HOME_PATH,
      scope: FIELD_MODE_HOME_PATH,
      display: "standalone",
      background_color: METAPET_SCHOOL_BACKGROUND_COLOR,
      theme_color: METAPET_SCHOOL_THEME_COLOR,
      orientation: "any",
      lang: "en-AU",
      dir: "ltr",
      categories: ["education"],
      shortcuts: [
        {
          name: "Lessons",
          url: FIELD_MODE_LESSONS_PATH,
        },
        {
          name: "Classroom",
          url: FIELD_MODE_CLASSROOM_PATH,
        },
        {
          name: "Teacher Guide",
          url: FIELD_MODE_GUIDE_PATH,
        },
        {
          name: "Offline Pack",
          url: FIELD_MODE_OFFLINE_PATH,
        },
      ],
      icons: [
        {
          src: FIELD_MODE_ICON_192_PATH,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: FIELD_MODE_ICON_512_PATH,
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: FIELD_MODE_MASKABLE_ICON_512_PATH,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: FIELD_MODE_ICON_SVG_PATH,
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/manifest+json",
      },
    },
  );
}
