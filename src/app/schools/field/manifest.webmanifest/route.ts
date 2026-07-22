import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "MetaPet Field Mode — Australian Schools",
      short_name: "MetaPet Field",
      description:
        "Teacher-led Years 3–6 Australian classroom lessons with alias-only local records.",
      start_url: "/schools/field",
      scope: "/schools/field/",
      display: "standalone",
      background_color: "#f8fafc",
      theme_color: "#065f46",
      orientation: "any",
      icons: [
        {
          src: "/icon-field.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "maskable",
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
