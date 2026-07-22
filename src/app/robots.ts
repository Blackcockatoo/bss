import type { MetadataRoute } from "next";

import { findSiteUrl } from "@/lib/env/siteUrl";
import { getSurfaceConfig } from "@/lib/domain/surface";
import { resolveServerSurface } from "@/lib/domain/serverSurface";

// Consumer / internal areas that must never be advertised on the school domain.
const SCHOOL_DISALLOW = [
  "/app",
  "/pet",
  "/identity",
  "/wallet",
  "/shop",
  "/pricing",
  "/body-forge",
  "/dna-hub",
  "/digital-dna",
  "/digital-dosha",
  "/genome-explorer",
  "/genome-resonance",
  "/genome",
  "/breeding",
  "/addons-demo",
  "/alchemest",
  "/moss60",
  "/monkey-invaders",
  "/space-jewbles",
  "/schools", // internal implementation; clean URLs are canonical
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const surface = await resolveServerSurface();
  const config = getSurfaceConfig(surface);
  const base = config.metadata.origin || findSiteUrl() || "";

  if (surface === "school") {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: SCHOOL_DISALLOW }],
      ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
      ...(base ? { host: base } : {}),
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
