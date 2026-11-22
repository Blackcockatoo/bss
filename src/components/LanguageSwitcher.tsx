"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { storeLocale, useAppLocale } from "@/lib/appCopy";
import { HOME_LOCALES, HOME_PATHS, type HomeLocale } from "@/lib/homeCopy";

/** Each language in its own script, with the English name underneath. */
const NATIVE: Record<HomeLocale, string> = { en: "English", ja: "日本語", hi: "हिन्दी" };
const ENGLISH: Record<HomeLocale, string> = { en: "English", ja: "Japanese", hi: "Hindi" };
/** Always multilingual, so someone stuck in the wrong language can still find it. */
export const LANGUAGE_ARIA_LABEL = "Language / 言語 / भाषा";

function Globe() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" className="shrink-0">
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
 * A small globe button that opens the language list: English · 日本語 Japanese ·
 * हिन्दी Hindi, current one ticked. Choosing a language stores it (the same
 * `metapet-locale` key the in-app strings read), so the companion screens
 * follow the visitor after they leave the home page. Closes on outside click,
 * Escape or selection; arrow keys move through the list.
 */
export function LanguageSwitcher({ current, className = "" }: LanguageSwitcherProps) {
  const stored = useAppLocale();
  const active: HomeLocale =
    current ?? ((HOME_LOCALES as readonly string[]).includes(stored) ? (stored as HomeLocale) : "en");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef(false);
  const listId = useId();

  const items = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-language-option]") ?? []);
  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    if (focusOnOpen.current) {
      const options = items();
      (options.find((el) => el.dataset.languageOption === active) ?? options[0])?.focus();
      focusOnOpen.current = false;
    }
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, active]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    if (!open) {
      if (event.target === buttonRef.current && event.key === "ArrowDown") {
        event.preventDefault();
        focusOnOpen.current = true;
        setOpen(true);
      }
      return;
    }
    const options = items();
    const index = options.indexOf(document.activeElement as HTMLElement);
    event.preventDefault();
    event.stopPropagation();
    const next =
      event.key === "Home" ? 0
      : event.key === "End" ? options.length - 1
      : event.key === "ArrowDown" ? (index + 1) % options.length
      : index <= 0 ? options.length - 1 : index - 1;
    options[next]?.focus();
  };

  return (
    <div
      ref={rootRef}
      data-language-switcher
      className={`relative shrink-0 ${className}`}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (open && event.relatedTarget && !rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={LANGUAGE_ARIA_LABEL}
        title={LANGUAGE_ARIA_LABEL}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        onClick={(event) => {
          focusOnOpen.current = event.detail === 0; // keyboard (Enter/Space) opens straight into the list
          setOpen((value) => !value);
        }}
        className={`grid h-10 w-10 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          open
            ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-200"
            : "border-slate-700/70 bg-slate-950/60 text-slate-400 hover:border-cyan-300/50 hover:text-cyan-200"
        }`}
      >
        <Globe />
      </button>
      <div
        ref={listRef}
        id={listId}
        role="group"
        aria-label={LANGUAGE_ARIA_LABEL}
        hidden={!open}
        className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-44 ${open ? "flex" : "hidden"} flex-col gap-0.5 rounded-xl border border-cyan-300/30 bg-slate-950/95 p-1.5 text-left shadow-2xl shadow-black/60 backdrop-blur`}
      >
        {HOME_LOCALES.map((locale) => {
          const isActive = locale === active;
          const classes = `relative flex min-h-11 w-full flex-col justify-center rounded-lg py-1 pl-3 pr-9 text-left leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-200 ${
            isActive ? "text-cyan-200" : "text-slate-200 hover:bg-cyan-300/10 hover:text-white focus-visible:bg-cyan-300/10"
          }`;
          const body = (
            <>
              <span className="text-sm font-semibold">{NATIVE[locale]}</span>
              {locale !== "en" ? (
                <span lang="en" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {ENGLISH[locale]}
                </span>
              ) : null}
              {isActive ? (
                <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-cyan-300">
                  ✓
                </span>
              ) : null}
            </>
          );
          const choose = () => {
            storeLocale(locale);
            setOpen(false);
          };
          return current ? (
            <Link
              key={locale}
              href={HOME_PATHS[locale]}
              hrefLang={locale}
              lang={locale}
              data-language-option={locale}
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
              data-language-option={locale}
              aria-pressed={isActive}
              onClick={() => {
                choose();
                buttonRef.current?.focus();
              }}
              className={classes}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Home routes link between /, /ja and /hi; every other screen switches in place. */
export function homeLocaleForPath(pathname: string | null | undefined): HomeLocale | undefined {
  const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
  return HOME_LOCALES.find((locale) => HOME_PATHS[locale] === path);
}
