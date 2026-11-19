import type { Metadata } from "next";

import { OfflinePackManager } from "@/components/field-mode/OfflinePackManager";
import { FIELD_MODE_OFFLINE_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Offline and Emergency Pack",
  description:
    "Prepare, verify, roll back, back up and print the local MetaPet School classroom pack. Not yet verified on school hardware.",
};

export default function FieldOfflinePage() {
  enforceChildSafeServerRoute(FIELD_MODE_OFFLINE_PATH, "field");
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-4xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Teacher-controlled resilience
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Offline and Emergency Pack
          </h1>
          <p className="max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-base leading-7 text-amber-950">
            This pack has not yet been verified on school hardware. Treat it as
            a preparation step, and print the seven-lesson pack as the reliable
            fallback if the network fails.
          </p>
          <p className="max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            Prep while the device is connected: install or update the pack,
            verify that it completed, and keep the last good pack for rollback.
            Then print or save the seven lessons plus the parent note so the
            class can continue on paper.
          </p>
        </header>
        <OfflinePackManager />
      </div>
    </main>
  );
}
