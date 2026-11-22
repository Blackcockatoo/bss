"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { storeLocale, useAppLocale } from "@/lib/appCopy";

/**
 * Keeps `<html lang>` truthful. The root layout renders `lang="en"` (it is
 * shared and static); /ja and /hi pin their language and remember it for the
 * app screens, everything else follows the visitor's chosen locale.
 */
export function DocumentLang() {
  const pathname = usePathname() ?? "/";
  const locale = useAppLocale();
  const pinned = pathname === "/ja" ? "ja" : pathname === "/hi" ? "hi" : pathname === "/" ? "en" : null;

  // Remember /ja or /hi when the visitor arrives there, and only then. Re-running
  // on locale changes would fight an explicit EN pick made on the way out of
  // /ja or /hi (the switcher stores "en" before the route commits).
  useEffect(() => {
    if (pinned === "ja" || pinned === "hi") storeLocale(pinned);
  }, [pinned]);

  useEffect(() => {
    document.documentElement.lang = pinned ?? locale;
  }, [pinned, locale]);

  return null;
}
