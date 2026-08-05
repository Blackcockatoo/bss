"use client";

import {
  BookOpen,
  BookOpenCheck,
  DoorOpen,
  GraduationCap,
  HardDriveDownload,
  Home,
  ShieldCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_NAV_ITEMS,
  type FieldModeNavItem,
} from "@/lib/childSafeBaseline";
import {
  METAPET_SCHOOL_NAME,
  METAPET_SCHOOL_TAGLINE,
} from "@/lib/fieldMode/identity";

const ICONS: Record<FieldModeNavItem["kind"], typeof Home> = {
  home: Home,
  lessons: BookOpenCheck,
  classroom: GraduationCap,
  offline: HardDriveDownload,
  guide: BookOpen,
  safety: ShieldCheck,
  exit: DoorOpen,
};

export function FieldModeNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Field Mode"
      className="field-mode-nav field-print-hide border-b border-emerald-950/15 bg-white/95 px-4 py-3 text-slate-900 shadow-sm backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2">
        <a
          href={FIELD_MODE_HOME_PATH}
          className="mr-auto flex flex-col leading-tight"
        >
          <span className="text-sm font-semibold text-emerald-950">
            {METAPET_SCHOOL_NAME}
          </span>
          <span className="text-[0.6875rem] font-medium text-emerald-900/70">
            {METAPET_SCHOOL_TAGLINE}
          </span>
        </a>
        {FIELD_MODE_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.kind];
          const active =
            item.href === FIELD_MODE_HOME_PATH
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : item.kind === "exit"
                    ? "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    : "border-emerald-900/15 bg-white text-emerald-950 hover:bg-emerald-50"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
