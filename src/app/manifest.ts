import type { MetadataRoute } from "next";

import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export default function manifest(): MetadataRoute.Manifest {
  if (IS_SCHOOLS_PROFILE) {
    return {
      name: "MetaPet Schools",
      short_name: "MetaPet Schools",
      description:
        "Teacher-led, low-data classroom pilot for Years 3-6 with alias-only rosters and local-only classroom records.",
      start_url: "/schools",
      display: "standalone",
      background_color: "#f5f7fa",
      theme_color: "#f5f7fa",
      orientation: "portrait",
      icons: [
        {
          src: "/icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "maskable",
        },
      ],
    };
  }

  return {
    name: "Meta-Pet",
    short_name: "MetaPet",
    description: "Your digital companion with genome-based evolution",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
