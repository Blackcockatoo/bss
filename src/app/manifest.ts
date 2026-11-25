import type { MetadataRoute } from "next";

import { CONSUMER_APP_ICON_192, CONSUMER_APP_ICON_512 } from "@/lib/consumerAppArtwork";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import {
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
  FIELD_MODE_ICON_SVG_PATH,
  FIELD_MODE_MASKABLE_ICON_512_PATH,
} from "@/lib/fieldMode/pwa";

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
      { src: CONSUMER_APP_ICON_192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: CONSUMER_APP_ICON_512, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
