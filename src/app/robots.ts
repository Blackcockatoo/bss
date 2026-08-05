import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { findSiteUrl } from "@/lib/env/siteUrl";
import {
  METAPET_SCHOOL_ORIGIN,
  isMetaPetSchoolHostname,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";

/**
 * Consumer areas the field route policy redirects to Field Mode. Crawlers on
 * the classroom host should not spend budget discovering them through a
 * redirect chain, and these paths must never rank as classroom content.
 */
const CONSUMER_CRAWL_BLOCKLIST = [
  "/api/",
  "/pet",
  "/shop",
  "/pricing",
  "/identity",
  "/digital-dna",
  "/dna-hub",
  "/genome-explorer",
  "/genome-resonance",
  "/geometry-sound",
  "/body-forge",
  "/alchemest",
  "/compass",
  "/visualizer",
  "/share",
  "/qr-messaging",
  "/addons-demo",
  "/lineage-demo",
  "/scaffold",
  "/moss60",
  "/space-jewbles",
  "/monkey-invaders",
] as const;

/**
 * Two public domains are served from one deployment, so robots.txt must be
 * resolved per host. Emitting the Blue Snake Studios sitemap from
 * metapet.school pointed crawlers at a different domain and advertised
 * consumer routes this host redirects away from.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isMetaPetSchoolHostname(hostname)) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: [...CONSUMER_CRAWL_BLOCKLIST],
        },
      ],
      sitemap: metaPetSchoolUrl("/sitemap.xml"),
      host: METAPET_SCHOOL_ORIGIN,
    };
  }

  const siteUrl = findSiteUrl();

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
