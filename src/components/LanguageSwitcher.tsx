"use client";

import Link from "next/link";

import { storeLocale, useAppLocale } from "@/lib/appCopy";
import { HOME_LOCALES, HOME_PATHS, type HomeLocale } from "@/lib/homeCopy";

/** Each language in its own script, with the English name underneath. */
const NATIVE: Record<HomeLocale, string> = { en: "EN", ja: "日本語", hi: "हिन्दी" };
const ENGLISH: Record<HomeLocale, string> = { en: "English", ja: "Japanese", hi: "Hindi" };
/** Always multilingual, so someone stuck in the wrong language can still find it. */
export const LANGUAGE_ARIA_LABEL = "Language · 言語 · भाषा";

function Globe() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      className="mx-1 shrink-0 text-cyan-300"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9" />
      </g>
    </svg>
  );
}

interface LanguageSwitcherProps {
  /**
   * The language of the page being shown. Home pages pass their own locale and
   * link to the matching home; app screens omit it and switch in place.
   */
  current?: HomeLocale;
  className?: string;
}

/**
 * Globe + EN English · 日本語 Japanese · हिन्दी Hindi. Choosing a language
 * stores it (the same `metapet-locale` key the in-app strings read), so the
 * companion screens follow the visitor after they leave the home page. The
 * current language is filled with a tick; every option is a 44px target.
 */
export function LanguageSwitcher({ current, className = "" }: LanguageSwitcherProps) {
  const stored = useAppLocale();
  const active: HomeLocale =
    current ?? ((HOME_LOCALES as readonly string[]).includes(stored) ? (stored as HomeLocale) : "en");

  return (
    <nav
      aria-label={LANGUAGE_ARIA_LABEL}
      data-language-switcher
      className={`inline-flex items-center gap-1 rounded-full border border-cyan-300/40 bg-slate-950/80 p-1 ${className}`}
    >
      <Globe />
      {HOME_LOCALES.map((locale) => {
        const isActive = locale === active;
        const classes = `relative inline-flex min-h-11 min-w-14 flex-1 flex-col items-center justify-center rounded-full px-3 py-1 leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
          isActive ? "bg-cyan-300 text-slate-950" : "text-slate-200 hover:bg-cyan-300/10 hover:text-white"
        }`;
        const body = (
          <>
            <span className="text-sm font-semibold">{NATIVE[locale]}</span>
            <span
              lang="en"
              className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${isActive ? "text-slate-800" : "text-slate-400"}`}
            >
              {ENGLISH[locale]}
            </span>
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border border-cyan-300 bg-slate-950 text-[10px] font-bold text-cyan-300"
              >
                ✓
              </span>
            ) : null}
          </>
        );
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
            {body}
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
            {body}
          </button>
        );
      })}
    </nav>
  );
}

/** Home routes link between /, /ja and /hi; every other screen switches in place. */
export function homeLocaleForPath(pathname: string | null | undefined): HomeLocale | undefined {
  const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
  return HOME_LOCALES.find((locale) => HOME_PATHS[locale] === path);
}
