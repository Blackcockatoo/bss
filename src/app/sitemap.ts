import type { MetadataRoute } from "next";

import { findSiteUrl } from "@/lib/env/siteUrl";
import { getSurfaceConfig } from "@/lib/domain/surface";
import { resolveServerSurface } from "@/lib/domain/serverSurface";

// Approved, public school pages only (clean URLs). No consumer / internal
// routes are listed so the school domain never advertises blocked areas.
const SCHOOL_PAGES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/field", priority: 0.9 },
  { path: "/lessons", priority: 0.9 },
  { path: "/classroom", priority: 0.8 },
  { path: "/teacher-guide", priority: 0.8 },
  { path: "/parents", priority: 0.7 },
  { path: "/safety", priority: 0.7 },
  { path: "/privacy", priority: 0.6 },
  { path: "/contact", priority: 0.6 },
];

const STUDIO_PAGES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/pet", priority: 0.9 },
  { path: "/school-game", priority: 0.8 },
  { path: "/monkey-invaders", priority: 0.8 },
  { path: "/identity", priority: 0.7 },
  { path: "/genome-explorer", priority: 0.8 },
  { path: "/digital-dna", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const surface = await resolveServerSurface();
  const config = getSurfaceConfig(surface);
  const base = config.metadata.origin || findSiteUrl();
  if (!base) {
    return [];
  }

  const normalizedBase = base.replace(/\/+$/, "");
  const pages = surface === "school" ? SCHOOL_PAGES : STUDIO_PAGES;

  return pages.map(({ path, priority }) => ({
    url: path === "/" ? normalizedBase : `${normalizedBase}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}
