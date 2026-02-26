"use client";

import { useEffect } from "react";
import { QuickNav } from "@/components/QuickNav";
import LegalNotice from "@/components/LegalNotice";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
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
      <div className="flex-1">{children}</div>
      <footer className="px-4 pb-6 pt-4 text-center">
        <LegalNotice />
      </footer>
      <QuickNav />
    </div>
  );
}
