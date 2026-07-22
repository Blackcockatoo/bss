import type { MetadataRoute } from "next";

import { resolveServerSurface } from "@/lib/domain/serverSurface";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const surface = await resolveServerSurface();

  if (surface === "school") {
    return {
      name: "MetaPet School",
      short_name: "MetaPet School",
      description:
        "Australian classroom learning through living digital creatures. Teacher-led, child-safe and classroom focused for Years 3-6.",
      start_url: "/",
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
