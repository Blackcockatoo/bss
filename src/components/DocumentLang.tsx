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

  useEffect(() => {
    if (pinned && pinned !== "en" && locale !== pinned) storeLocale(pinned);
  }, [pinned, locale]);

  useEffect(() => {
    document.documentElement.lang = pinned ?? locale;
  }, [pinned, locale]);

  return null;
}
