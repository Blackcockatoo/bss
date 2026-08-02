"use client";

/**
 * Grouping and collapsing for the Guardian's advanced panels.
 *
 * The advanced view used to be a single stack of a dozen full-height cards.
 * On a phone that was an ~8000px scroll with no way to skip ahead, and no
 * signal about which panels belonged together. Sections collapse by default
 * so opening the advanced view costs one screen, not twelve, and behave the
 * same at every width rather than reflowing into something different on
 * tablet.
 */

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

export function AdvancedGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-500/70">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function AdvancedSection({
  title,
  subtitle,
  accent = "gold",
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Matches the accent the panel already used in the flat stack. */
  accent?: "gold" | "purple" | "cyan";
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const border =
    accent === "purple"
      ? "border-purple-600/20"
      : accent === "cyan"
        ? "border-cyan-600/20"
        : "border-yellow-600/20";
  const heading =
    accent === "purple"
      ? "text-purple-400"
      : accent === "cyan"
        ? "text-cyan-400"
        : "text-yellow-400";

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-gray-900/80 ${border}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[3rem] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500"
      >
        <span className="min-w-0">
          <span
            className={`block text-base font-semibold sm:text-lg ${heading}`}
          >
            {title}
          </span>
          {subtitle && (
            <span className="mt-0.5 block truncate text-xs text-gray-500">
              {subtitle}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={panelId}
          className={`border-t px-4 pb-4 pt-4 ${border} sm:px-5 sm:pb-5`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
