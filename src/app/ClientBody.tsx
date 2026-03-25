"use client";

import LegalNotice from "@/components/LegalNotice";
import { JourneyProgressStrip } from "@/components/JourneyProgressStrip";
import { QuickNav } from "@/components/QuickNav";
import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "@/lib/childSafeBaseline";
import {
  ENABLE_CHILD_SAFE_BASELINE,
  IS_SCHOOLS_PROFILE,
} from "@/lib/env/features";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const childSafeBlocked = useMemo(
    () =>
      (ENABLE_CHILD_SAFE_BASELINE || IS_SCHOOLS_PROFILE) &&
      !isChildSafeAllowedPathname(pathname ?? "/"),
    [pathname],
  );

  useEffect(() => {
    document.body.classList.add("antialiased");
  }, []);

  useEffect(() => {
    if (!childSafeBlocked || !pathname) {
      return;
    }

    router.replace(getChildSafeFallbackPathname(pathname));
  }, [childSafeBlocked, pathname, router]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    registerServiceWorker();
  }, []);

  if (childSafeBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-zinc-200">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold text-emerald-300">
            MetaPet Schools is active.
          </p>
          <p className="text-sm text-zinc-400">
            This route is outside the school-safe deployment and is redirecting
            to the classroom surface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased flex min-h-screen flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="text-sm text-zinc-200">
            {IS_SCHOOLS_PROFILE ? "MetaPet Schools" : "Meta-Pet"}
          </div>
          <button
            type="button"
            onClick={() => setPrivacyOpen((current) => !current)}
            className="min-h-9 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 transition-colors hover:border-emerald-300/45 hover:bg-emerald-500/15"
            aria-expanded={privacyOpen}
          >
            Local-first / child-safe
          </button>
        </div>
        {privacyOpen && (
          <div className="mx-auto mt-3 w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs leading-5 text-zinc-300 sm:leading-6">
            Default school use is local-first, alias-based, and teacher-led.
            Student accounts, public sharing, and retention-style mechanics stay
            out of the school deployment. Classroom records remain on this
            device unless a teacher deliberately exports evidence. Classroom
            data on this device auto-deletes after{" "}
            {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days without use.
          </div>
        )}
        {!IS_SCHOOLS_PROFILE && <JourneyProgressStrip />}
      </div>

      <div className="flex-1 pb-2">{children}</div>
      <footer className="px-4 pb-24 pt-4 text-center sm:pb-6">
        <LegalNotice />
      </footer>
      <QuickNav />
    </div>
  );
}
