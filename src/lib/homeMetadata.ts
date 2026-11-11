import type { Metadata } from "next";

import { HOME_COPY, HOME_OG_LOCALE, HOME_PATHS, type HomeLocale } from "@/lib/homeCopy";

/**
 * Per-language metadata for the MetaPet home: localized title/description,
 * canonical + hreflang alternates (en, ja, hi, x-default) and OG locale.
 * URLs are resolved against `metadataBase` from the root layout.
 */
export function homeMetadata(locale: HomeLocale): Metadata {
  const t = HOME_COPY[locale];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: HOME_PATHS[locale],
      languages: {
        en: HOME_PATHS.en,
        ja: HOME_PATHS.ja,
        hi: HOME_PATHS.hi,
        "x-default": HOME_PATHS.en,
      },
    },
    openGraph: {
      title: t.metaTitle,
      description: t.ogDescription,
      locale: HOME_OG_LOCALE[locale],
      alternateLocale: (Object.keys(HOME_OG_LOCALE) as HomeLocale[])
        .filter((other) => other !== locale)
        .map((other) => HOME_OG_LOCALE[other]),
    },
    twitter: {
      card: "summary",
      title: t.metaTitle,
      description: locale === "en"
        ? "Digital companions, DNA, Body Forge, activities, wellness and a clearly separated school edition."
        : t.ogDescription,
    },
  };
}
