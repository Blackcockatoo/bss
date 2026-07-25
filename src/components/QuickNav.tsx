"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  Compass,
  HeartPulse,
  Home,
  PawPrint,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FIELD_MODE_NAV_ICONS } from "@/components/field-mode/fieldModeNavIcons";
import {
  CHILD_SAFE_NAV_ROUTES,
  SCHOOL_PRIMARY_NAV_ITEMS,
  isFieldModePathname,
  isSchoolNavPathname,
} from "@/lib/childSafeBaseline";
import {
  ENABLE_CHILD_SAFE_BASELINE,
  IS_SCHOOLS_PROFILE,
} from "@/lib/env/features";
import { triggerHaptic } from "@/lib/haptics";
import { useClassroomFocusActive } from "@/lib/teacher-lessons/classroomFocusSignal";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const CORE_QUICK_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pet", label: "Pet", icon: PawPrint },
  { href: "/app/activities", label: "Explore", icon: Compass },
  { href: "/app/wellness", label: "Wellness", icon: HeartPulse },
  { href: "/schools", label: "School", icon: FIELD_MODE_NAV_ICONS.home },
  { href: "/identity", label: "Identity", icon: UserCircle },
];

/**
 * The school-profile bottom/desktop navigation. Sourced directly from
 * SCHOOL_PRIMARY_NAV_ITEMS (childSafeBaseline.ts) -- the same list the Field
 * Mode top bar renders from -- so mobile, desktop and the Field Mode session
 * bar can never drift into showing different item sets.
 */
export const SCHOOLS_QUICK_NAV_ITEMS = SCHOOL_PRIMARY_NAV_ITEMS.map((item) => ({
  href: item.href,
  label: item.label,
  icon: FIELD_MODE_NAV_ICONS[item.kind],
}));

export function QuickNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  // A single, synchronous, pathname-derived profile check -- no cookie or
  // hydration race involved -- so the correct item set is known on first
  // render, not just once a client-only presentation marker resolves.
  const effectiveSchoolsMode =
    IS_SCHOOLS_PROFILE || isSchoolNavPathname(pathname ?? "/");
  // The nested Field Mode layout (/schools/field/*) already renders
  // FieldModeNav as the primary nav for that surface; QuickNav stays out of
  // the way there instead of stacking a second bar on top of it.
  const isFieldPath = !!pathname && isFieldModePathname(pathname);

  const handleBack = useCallback(() => {
    triggerHaptic("light");
    if (IS_SCHOOLS_PROFILE) {
      router.push("/schools");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [router]);

  useEffect(() => {
    if (effectiveSchoolsMode) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [effectiveSchoolsMode]);

  const showInstall = useMemo(
    () => !effectiveSchoolsMode && installPrompt !== null,
    [effectiveSchoolsMode, installPrompt],
  );
  const visibleNavItems = useMemo(() => {
    if (effectiveSchoolsMode) {
      // SCHOOLS_QUICK_NAV_ITEMS is generated from the approved Field Mode
      // route policy, so every item is inherently allowed -- no further
      // filtering is needed (or possible to get wrong) here.
      return SCHOOLS_QUICK_NAV_ITEMS;
    }
    if (ENABLE_CHILD_SAFE_BASELINE) {
      return CORE_QUICK_NAV_ITEMS.filter((item) =>
        CHILD_SAFE_NAV_ROUTES.has(item.href),
      );
    }
    return CORE_QUICK_NAV_ITEMS;
  }, [effectiveSchoolsMode]);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) {
      return;
    }
    triggerHaptic("success");
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const handleNavClick = useCallback(() => {
    triggerHaptic("selection");
  }, []);

  // During Classroom Focus Mode the lesson guide bar is the only persistent
  // bottom control surface. Removing this bar from the DOM entirely means it
  // can neither receive keyboard focus, intercept pointer/touch events, nor
  // occupy layout space over the lesson's Next button.
  const classroomFocusActive = useClassroomFocusActive();
  if (classroomFocusActive || isFieldPath) {
    return null;
  }

  return (
    <nav
      aria-label="Meta-Pet navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
    >
      <div className="mx-auto max-w-2xl">
        <div className={`pointer-events-auto flex items-center justify-between rounded-2xl border px-1.5 py-1.5 backdrop-blur-lg sm:px-2 sm:py-2 ${effectiveSchoolsMode ? "border-border bg-background/95 shadow-lg shadow-black/5" : "border-slate-700/70 bg-slate-950/90 shadow-lg shadow-slate-950/60"}`}>
          {/* Back button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className={`h-11 w-11 rounded-xl touch-manipulation sm:h-12 sm:w-12 ${effectiveSchoolsMode ? "text-muted-foreground hover:bg-secondary hover:text-foreground" : "text-slate-400 hover:bg-slate-800/80 hover:text-white"}`}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Divider */}
          <div className={`h-8 w-px ${effectiveSchoolsMode ? "bg-border" : "bg-slate-700/50"}`} />

          {/* Nav Items */}
          <div className="flex flex-1 items-center justify-around gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  aria-current={isActive ? "page" : undefined}
                  className="flex"
                >
                  <div
                    className={`
                      flex flex-col items-center justify-center gap-0.5
                      min-w-[42px] h-11 px-1 rounded-xl
                      transition-all duration-200
                      touch-manipulation
                      sm:min-w-[52px] sm:h-12 sm:px-2
                      ${
                        effectiveSchoolsMode
                          ? isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95"
                          : isActive
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-white active:scale-95"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span
                      className={`text-[8px] font-medium sm:text-[9px] ${isActive ? "opacity-100" : "opacity-70"}`}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Install button */}
          {showInstall && (
            <>
              <div className="h-8 w-px bg-slate-700/50" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleInstall}
                className="h-11 w-11 rounded-xl text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 touch-manipulation sm:h-12 sm:w-12"
                aria-label="Install app"
              >
                <ArrowDownToLine className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
