import { headers } from "next/headers";
import type { MetadataRoute } from "next";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_OFFLINE_PATH,
  FIELD_MODE_SAFETY_PATH,
  FIELD_MODE_PRINT_ALL_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
  FIELD_MODE_VERIFIED_PATH,
} from "@/lib/childSafeBaseline";
import { findSiteUrl } from "@/lib/env/siteUrl";
import { getArcadeCrawlRoutes } from "@/lib/games/arcade";
import { STUDIO_ROUTE } from "@/lib/studio/identity";
import {
  isMetaPetSchoolHostname,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";
import {
  FIELD_MODE_PRINT_F2_ALL_PATH,
  FIELD_MODE_PRINT_YEARS_78_ALL_PATH,
  FIELD_MODE_PRINT_TOPICAL_PATH,
  FIELD_MODE_CURRICULUM_PATH,
  FIELD_MODE_PRINT_CURRICULUM_PATH,
} from "@/lib/schools/classroomPack";
import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

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
      url: metaPetSchoolUrl("/schools/field/play/invisible-trail"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: metaPetSchoolUrl("/schools/field/print/invisible-trail.html"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
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
      url: metaPetSchoolUrl(FIELD_MODE_VERIFIED_PATH),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
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
    // /legal/terms is a noindex draft. List it here once it is approved.
  ];

  entries.push({
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_ALL_PATH),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  });
  entries.push({
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_F2_ALL_PATH),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  });
  entries.push({
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_YEARS_78_ALL_PATH),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  });
  entries.push({
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_TOPICAL_PATH),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  });
  entries.push({
    url: metaPetSchoolUrl(FIELD_MODE_CURRICULUM_PATH),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  });
  entries.push({
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_CURRICULUM_PATH),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  });
  entries.push({
    url: metaPetSchoolUrl("/schools/field/print/invisible-trail"),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  });
  entries.push({
    url: metaPetSchoolUrl("/schools/field/play/invisible-trail/slides"),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  });
  entries.push({
    url: metaPetSchoolUrl("/schools/field/play/invisible-trail/comments"),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  });

  for (const lesson of ALL_LESSON_DEFINITIONS) {
    entries.push({
      url: metaPetSchoolUrl(`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    entries.push({
      url: metaPetSchoolUrl(`${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    });
    entries.push({
      url: metaPetSchoolUrl(`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}/slides`),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    });
    entries.push({
      url: metaPetSchoolUrl(`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}/comments`),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}

function blueSnakeStudiosSitemap(base: string): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const homeAlternates = {
    languages: {
      en: base,
      ja: `${base}/ja`,
      hi: `${base}/hi`,
    },
  };

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: homeAlternates,
    },
    // Japanese and Hindi editions of the home page.
    ...(["ja", "hi"] as const).map((locale) => ({
      url: `${base}/${locale}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: homeAlternates,
    })),
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
    // Arcade routes come from the registry so a new game is indexed by adding
    // it in one place rather than remembering to edit the sitemap too.
    ...getArcadeCrawlRoutes().map((route) => ({
      url: `${base}${route}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${base}${STUDIO_ROUTE}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
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
    {
      url: `${base}/app/moss60`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/teach`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/legal/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    // /legal/terms is a noindex draft. List it here once it is approved.
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
