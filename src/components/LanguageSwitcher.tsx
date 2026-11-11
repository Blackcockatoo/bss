"use client";

import Link from "next/link";

import { storeLocale, useAppLocale } from "@/lib/appCopy";
import { HOME_LOCALES, HOME_PATHS, type HomeLocale } from "@/lib/homeCopy";

const NAMES: Record<HomeLocale, string> = { en: "EN", ja: "日本語", hi: "हिन्दी" };

interface LanguageSwitcherProps {
  /**
   * The language of the page being shown. Home pages pass their own locale and
   * link to the matching home; app screens omit it and switch in place.
   */
  current?: HomeLocale;
  label?: string;
  className?: string;
}

/**
 * EN · 日本語 · हिन्दी pill. Choosing a language stores it (the same
 * `metapet-locale` key the in-app strings read), so the companion screens
 * follow the visitor after they leave the home page.
 */
export function LanguageSwitcher({ current, label = "Language", className = "" }: LanguageSwitcherProps) {
  const stored = useAppLocale();
  const active: HomeLocale =
    current ?? ((HOME_LOCALES as readonly string[]).includes(stored) ? (stored as HomeLocale) : "en");

  return (
    <nav
      aria-label={label}
      className={`inline-flex items-center gap-0.5 rounded-full border border-slate-700/80 bg-slate-950/70 p-1 text-xs font-semibold ${className}`}
    >
      {HOME_LOCALES.map((locale) => {
        const isActive = locale === active;
        const classes = `rounded-full px-3 py-1.5 transition-colors ${
          isActive ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:text-white"
        }`;
        const choose = () => storeLocale(locale);
        return current ? (
          <Link
            key={locale}
            href={HOME_PATHS[locale]}
            hrefLang={locale}
            lang={locale}
            aria-current={isActive ? "true" : undefined}
            onClick={choose}
            className={classes}
          >
            {NAMES[locale]}
          </Link>
        ) : (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={isActive}
            onClick={choose}
            className={classes}
          >
            {NAMES[locale]}
          </button>
        );
      })}
    </nav>
  );
}
