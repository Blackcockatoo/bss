"use client";

import LegalNotice from "@/components/LegalNotice";
import { JourneyProgressStrip } from "@/components/JourneyProgressStrip";
import { QuickNav } from "@/components/QuickNav";
import { WardrobeUnlockCeremony } from "@/components/wardrobe/WardrobeUnlockCeremony";
import { WardrobeProgressBridge } from "@/lib/wardrobe/WardrobeProgressBridge";
import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "@/lib/childSafeBaseline";
import {
  ENABLE_CHILD_SAFE_BASELINE,
  IS_SCHOOLS_PROFILE,
} from "@/lib/env/features";
import { useSurface } from "@/lib/domain/SurfaceProvider";
import { getSurfaceContact, buildMailto } from "@/lib/domain/contact";
import { useIdentityProfileStore } from "@/lib/identity/profile";
import { normalizePetForm, PET_FORM_STORAGE_KEY } from "@/lib/petForms";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";
import { useStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const surface = useSurface();
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
  const effectiveSchoolsMode =
    surface === "school" || IS_SCHOOLS_PROFILE || isSchoolPath;
  const contact = getSurfaceContact(surface);
  const childSafeBlocked = useMemo(
    () =>
      (ENABLE_CHILD_SAFE_BASELINE || IS_SCHOOLS_PROFILE) &&
      !isChildSafeAllowedPathname(pathname ?? "/"),
    [pathname],
  );

  useEffect(() => {
    document.body.classList.add("antialiased");
  }, []);

  // Remember the chosen visual form across reloads so returning from the
  // Body Forge (or any session) never silently reverts the renderer.
  // Restored after hydration to keep server markup deterministic.
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    refreshIdentityProfile();
  }, [refreshIdentityProfile]);

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
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        await registration.update();
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    registerServiceWorker();
  }, []);

  if (childSafeBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-foreground">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold text-primary">
            MetaPet Schools is active.
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
    <div className="antialiased flex min-h-screen flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className={`sticky top-0 z-40 border-b px-3 py-2 backdrop-blur sm:px-4 sm:py-3 ${effectiveSchoolsMode ? "border-border bg-background/95" : "border-slate-800 bg-slate-950/90"}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className={`text-sm ${effectiveSchoolsMode ? "text-foreground font-medium" : "text-zinc-200"}`}>
            {effectiveSchoolsMode ? "MetaPet School" : "Meta-Pet"}
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
      </div>

      <div className="flex-1 pb-2">{children}</div>
      {/* Wardrobe progression: the bridge feeds live gameplay into the
          persistent progress record; the ceremony surfaces new unlocks. */}
      <WardrobeProgressBridge />
      <WardrobeUnlockCeremony />
      <footer className="px-4 pb-24 pt-4 text-center sm:pb-6">
        <a
          href={buildMailto(contact)}
          className="mb-4 inline-block text-xs text-slate-400 underline hover:text-slate-300"
        >
          {effectiveSchoolsMode ? "Pilot Enquiry" : "Contact"}
        </a>
        <LegalNotice />
      </footer>
      <QuickNav />
    </div>
  );
}
