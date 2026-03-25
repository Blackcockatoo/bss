"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  FileText,
  BookOpen,
  Home,
  PawPrint,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { CHILD_SAFE_NAV_ROUTES } from "@/lib/childSafeBaseline";
import {
  ENABLE_CHILD_SAFE_BASELINE,
  IS_SCHOOLS_PROFILE,
} from "@/lib/env/features";
import { triggerHaptic } from "@/lib/haptics";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const CORE_QUICK_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pet", label: "Pet", icon: PawPrint },
  { href: "/school-game", label: "School", icon: BookOpen },
  { href: "/identity", label: "Identity", icon: UserCircle },
];

export const SCHOOLS_QUICK_NAV_ITEMS = [
  { href: "/schools", label: "Overview", icon: Home },
  { href: "/school-game", label: "Runtime", icon: BookOpen },
  { href: "/legal/privacy", label: "Privacy", icon: FileText },
];

export function QuickNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

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
  }, []);

  const showInstall = useMemo(() => installPrompt !== null, [installPrompt]);
  const visibleNavItems = useMemo(
    () =>
      (ENABLE_CHILD_SAFE_BASELINE || IS_SCHOOLS_PROFILE)
        ? (IS_SCHOOLS_PROFILE ? SCHOOLS_QUICK_NAV_ITEMS : CORE_QUICK_NAV_ITEMS)
            .filter((item) => CHILD_SAFE_NAV_ROUTES.has(item.href))
        : CORE_QUICK_NAV_ITEMS,
    [],
  );

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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <div className="max-w-lg mx-auto">
        <div className={`pointer-events-auto flex items-center justify-between rounded-2xl border px-1.5 py-1.5 backdrop-blur-lg sm:px-2 sm:py-2 ${IS_SCHOOLS_PROFILE ? "border-border bg-background/95 shadow-lg shadow-black/5" : "border-slate-700/70 bg-slate-950/90 shadow-lg shadow-slate-950/60"}`}>
          {/* Back button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className={`h-11 w-11 rounded-xl touch-manipulation sm:h-12 sm:w-12 ${IS_SCHOOLS_PROFILE ? "text-muted-foreground hover:bg-secondary hover:text-foreground" : "text-slate-400 hover:bg-slate-800/80 hover:text-white"}`}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Divider */}
          <div className={`h-8 w-px ${IS_SCHOOLS_PROFILE ? "bg-border" : "bg-slate-700/50"}`} />

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
                  className="flex"
                >
                  <div
                    className={`
                      flex flex-col items-center justify-center gap-0.5
                      min-w-[44px] h-11 px-1.5 rounded-xl
                      transition-all duration-200
                      touch-manipulation
                      sm:min-w-[52px] sm:h-12 sm:px-2
                      ${
                        IS_SCHOOLS_PROFILE
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
    </div>
  );
}
