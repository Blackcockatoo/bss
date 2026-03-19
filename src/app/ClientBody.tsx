"use client";

import LegalNotice from "@/components/LegalNotice";
import { QuickNav } from "@/components/QuickNav";
import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <span className="text-xs text-emerald-300">
            Child-safe local mode
          </span>
        </div>
        <p className="mx-auto mt-2 w-full max-w-6xl text-xs text-zinc-400">
          Default student use stays local-first, zero-account, and free from
          countdown or streak pressure.
        </p>
      </div>

      <div className="flex-1">{children}</div>
      <footer className="px-4 pb-6 pt-4 text-center">
        <LegalNotice />
      </footer>
      <QuickNav />
    </div>
  );
}
