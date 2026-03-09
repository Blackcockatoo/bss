"use client";

import { AuthDialog } from "@/components/AuthDialog";
import LegalNotice from "@/components/LegalNotice";
import { PlanBadge } from "@/components/PlanBadge";
import { QuickNav } from "@/components/QuickNav";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth/store";
import { ENABLE_AUTH } from "@/lib/env/features";
import { useEffect, useState } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    document.body.classList.add("antialiased");
  }, []);

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

  return (
    <div className="antialiased min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col">
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="text-sm text-zinc-200">Meta-Pet</div>
          <div className="flex items-center gap-2">
            <PlanBadge />
            {ENABLE_AUTH && isAuthenticated && currentUser ? (
              <>
                <span className="text-xs text-zinc-400">
                  {currentUser.displayName}
                </span>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="h-8 text-zinc-300"
                >
                  Logout
                </Button>
              </>
            ) : ENABLE_AUTH ? (
              <Button
                onClick={() => setAuthOpen(true)}
                className="h-8 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                Login / Register
              </Button>
            ) : (
              <span className="text-xs text-emerald-300">
                Zero-account mode
              </span>
            )}
          </div>
        </div>
        {ENABLE_AUTH && !isAuthenticated && (
          <p className="mx-auto mt-2 w-full max-w-6xl text-xs text-zinc-400">
            Sign in to unlock subscription features like advanced analytics,
            exports, and upcoming Pro tools.
          </p>
        )}
      </div>

      <div className="flex-1">{children}</div>
      <footer className="px-4 pb-6 pt-4 text-center">
        <LegalNotice />
      </footer>
      <QuickNav />
      {ENABLE_AUTH ? (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      ) : null}
    </div>
  );
}
