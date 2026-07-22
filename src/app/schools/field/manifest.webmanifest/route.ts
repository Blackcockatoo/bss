import { NextResponse } from "next/server";

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
      name: "MetaPet Field Mode — Australian Schools",
      short_name: "MetaPet Field",
      description:
        "Teacher-led Years 3–6 Australian classroom lessons with alias-only local records.",
      id: FIELD_MODE_APP_ID,
      start_url: "/schools/field",
      scope: "/schools/field/",
      display: "standalone",
      background_color: "#f8fafc",
      theme_color: "#065f46",
      orientation: "any",
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
