"use client";

import LegalNotice from "@/components/LegalNotice";
import { JourneyProgressStrip } from "@/components/JourneyProgressStrip";
import { QuickNav } from "@/components/QuickNav";
import { WardrobeUnlockCeremony } from "@/components/wardrobe/WardrobeUnlockCeremony";
import { WardrobeProgressBridge } from "@/lib/wardrobe/WardrobeProgressBridge";
import {
  FIELD_MODE_COOKIE_VALUE,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_UI_COOKIE,
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
  isFieldModePathname,
  isPathnameAllowedByPolicy,
} from "@/lib/childSafeBaseline";
import {
  ENABLE_CHILD_SAFE_BASELINE,
  IS_SCHOOLS_PROFILE,
} from "@/lib/env/features";
import { useIdentityProfileStore } from "@/lib/identity/profile";
import { normalizePetForm, PET_FORM_STORAGE_KEY } from "@/lib/petForms";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";
import { useStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { METAPET_PRODUCT } from "@/lib/fieldMode/product";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const refreshIdentityProfile = useIdentityProfileStore(
    (state) => state.refreshProfile,
  );
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const isSchoolPath = useMemo(
    () =>
      !!pathname &&
      (pathname === "/school-game" ||
        pathname === "/schools" ||
        pathname.startsWith("/schools/")),
    [pathname],
  );
  const isFieldPath = !!pathname && isFieldModePathname(pathname);
  const [fieldUiActive, setFieldUiActive] = useState<boolean | null>(
    isFieldPath ? true : null,
  );
  const fieldSurfaceActive =
    isFieldPath ||
    (fieldUiActive === true &&
      isPathnameAllowedByPolicy(pathname ?? "/", "field"));
  const fieldUiResolved = isFieldPath || fieldUiActive !== null;
  const effectiveSchoolsMode =
    IS_SCHOOLS_PROFILE || isSchoolPath || fieldSurfaceActive;
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
    if (isFieldPath) {
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const active = document.cookie
        .split(/;\s*/)
        .some(
          (cookie) =>
            cookie === `${FIELD_MODE_UI_COOKIE}=${FIELD_MODE_COOKIE_VALUE}`,
        );
      setFieldUiActive(active);
    });
    return () => {
      cancelled = true;
    };
  }, [isFieldPath, pathname]);

  // Remember the chosen visual form across reloads so returning from the
  // Body Forge (or any session) never silently reverts the renderer.
  // Restored after hydration to keep server markup deterministic.
  useEffect(() => {
    if (!fieldUiResolved || effectiveSchoolsMode) return;
    try {
      const stored = window.localStorage.getItem(PET_FORM_STORAGE_KEY);
      if (stored) {
        useStore.getState().setPetType(normalizePetForm(stored));
      }
    } catch {
      // Storage may be unavailable (private mode); form simply defaults.
    }
    return useStore.subscribe((state, previous) => {
      if (state.petType === previous.petType) return;
      try {
        window.localStorage.setItem(PET_FORM_STORAGE_KEY, state.petType);
      } catch {
        // Non-fatal: the session keeps working without the preference.
      }
    });
  }, [effectiveSchoolsMode, fieldUiResolved]);

  useEffect(() => {
    if (!fieldUiResolved || effectiveSchoolsMode) return;
    refreshIdentityProfile();
  }, [effectiveSchoolsMode, fieldUiResolved, refreshIdentityProfile]);

  useEffect(() => {
    if (!childSafeBlocked || !pathname) {
      return;
    }

    router.replace(getChildSafeFallbackPathname(pathname));
  }, [childSafeBlocked, pathname, router]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        if (navigator.onLine) {
          await registration.update();
        }
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    registerServiceWorker();
  }, [isFieldPath]);

  if (childSafeBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-foreground">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold text-primary">
            {METAPET_PRODUCT.school} is active.
          </p>
          <p className="text-sm text-muted-foreground">
            This route is outside the school-safe deployment and is redirecting
            to the classroom surface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`antialiased flex min-h-screen flex-col ${
        fieldSurfaceActive
          ? "pb-0"
          : "pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <div className={`app-shell-header sticky top-0 z-40 border-b px-3 py-2 backdrop-blur sm:px-4 sm:py-3 ${effectiveSchoolsMode ? "border-border bg-background/95" : "border-slate-800 bg-slate-950/90"}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className={`text-sm ${effectiveSchoolsMode ? "text-foreground font-medium" : "text-zinc-200"}`}>
            {fieldSurfaceActive
              ? "MetaPet Field Mode"
              : effectiveSchoolsMode
                ? METAPET_PRODUCT.school
                : "Meta-Pet"}
          </div>
          <button
            type="button"
            onClick={() => setPrivacyOpen((current) => !current)}
            className={`min-h-9 rounded-full border px-3 py-1 text-xs transition-colors ${effectiveSchoolsMode ? "border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:border-emerald-600/50 hover:bg-emerald-100" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:border-emerald-300/45 hover:bg-emerald-500/15"}`}
            aria-expanded={privacyOpen}
          >
            Local-first / child-safe
          </button>
        </div>
        {privacyOpen && (
          <div className={`mx-auto mt-3 w-full max-w-6xl rounded-2xl border p-3 text-xs leading-5 sm:leading-6 ${effectiveSchoolsMode ? "border-border bg-card text-muted-foreground" : "border-slate-800 bg-slate-900/60 text-zinc-300"}`}>
            Default school use is local-first, alias-based, and teacher-led.
            Student accounts, public sharing, and retention-style mechanics stay
            out of the school deployment. Classroom records remain on this
            device unless a teacher deliberately exports evidence. Classroom
            data on this device auto-deletes after{" "}
            {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days without use.
          </div>
        )}
        {!effectiveSchoolsMode && <JourneyProgressStrip />}
        {fieldSurfaceActive && !isFieldPath ? (
          <div className="mx-auto mt-3 flex w-full max-w-6xl items-center justify-between gap-3 rounded-xl border border-emerald-700/20 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
            <span>Approved Field Mode information</span>
            <a
              href={FIELD_MODE_HOME_PATH}
              className="font-semibold underline underline-offset-2"
            >
              Return to Field Mode
            </a>
          </div>
        ) : null}
      </div>

      <div className="flex-1 pb-2">{children}</div>
      {/* Wardrobe progression: the bridge feeds live gameplay into the
          persistent progress record; the ceremony surfaces new unlocks. */}
      {!effectiveSchoolsMode ? (
        <>
          <WardrobeProgressBridge />
          <WardrobeUnlockCeremony />
        </>
      ) : null}
      <footer className="app-shell-footer px-4 pb-24 pt-4 text-center sm:pb-6">
        {!fieldSurfaceActive ? (
          <a
            href="mailto:bluesssnakestudio@gmail.com?subject=Meta-Pet%20School%20Pilot%20Enquiry"
            className="mb-4 inline-block text-xs text-slate-400 underline hover:text-slate-300"
          >
            Pilot Enquiry
          </a>
        ) : null}
        <LegalNotice schoolsMode={effectiveSchoolsMode} />
      </footer>
      {!fieldSurfaceActive && fieldUiResolved ? <QuickNav /> : null}
      {!effectiveSchoolsMode ? <Analytics /> : null}
    </div>
  );
}
