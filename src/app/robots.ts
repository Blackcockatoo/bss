import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
