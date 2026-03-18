import type { MetadataRoute } from "next";
import { findSiteUrl } from "@/lib/env/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = findSiteUrl();

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
