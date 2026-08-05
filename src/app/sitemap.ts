import { headers } from "next/headers";
import type { MetadataRoute } from "next";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_OFFLINE_PATH,
  FIELD_MODE_SAFETY_PATH,
} from "@/lib/childSafeBaseline";
import { findSiteUrl } from "@/lib/env/siteUrl";
import {
  isMetaPetSchoolHostname,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

/**
 * The classroom index. Only routes the field policy actually allows appear
 * here — the shared Blue Snake Studios sitemap advertised consumer pages that
 * this host redirects away from, and listed none of the classroom pages.
 */
function metaPetSchoolSitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: metaPetSchoolUrl(FIELD_MODE_HOME_PATH),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: metaPetSchoolUrl(FIELD_MODE_LESSONS_PATH),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: metaPetSchoolUrl(FIELD_MODE_GUIDE_PATH),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: metaPetSchoolUrl(FIELD_MODE_CLASSROOM_PATH),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: metaPetSchoolUrl(FIELD_MODE_OFFLINE_PATH),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: metaPetSchoolUrl(FIELD_MODE_SAFETY_PATH),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: metaPetSchoolUrl("/schools/safeguarding"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: metaPetSchoolUrl("/schools/parents"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: metaPetSchoolUrl("/legal/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  for (const lesson of LESSON_DEFINITIONS) {
    entries.push({
      url: metaPetSchoolUrl(`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}

function blueSnakeStudiosSitemap(base: string): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/pet`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/school-game`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/monkey-invaders`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/schools`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/identity`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/genome-explorer`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/digital-dna`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isMetaPetSchoolHostname(hostname)) {
    return metaPetSchoolSitemap();
  }

  const base = findSiteUrl();
  if (!base) {
    return [];
  }

  return blueSnakeStudiosSitemap(base);
}
