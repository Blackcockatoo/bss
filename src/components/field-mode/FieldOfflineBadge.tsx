"use client";

import { CloudOff, HardDriveDownload, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

import { FIELD_MODE_OFFLINE_PATH } from "@/lib/childSafeBaseline";
import { useFieldConnectivity } from "@/lib/fieldMode/connectivity";
import {
  FIELD_PACK_STATUS_EVENT,
  getFieldPackOverview,
  type FieldPackOverview,
} from "@/lib/fieldMode/offlinePack.client";

export function FieldOfflineBadge() {
  const online = useFieldConnectivity();
  const [overview, setOverview] = useState<FieldPackOverview | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void getFieldPackOverview().then((next) => {
        if (active) setOverview(next);
      });
    };
    refresh();
    window.addEventListener(FIELD_PACK_STATUS_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(FIELD_PACK_STATUS_EVENT, refresh);
    };
  }, [online]);

  const ready = Boolean(overview?.active) && !overview?.bypassed;
  const Icon = online ? (ready ? HardDriveDownload : Wifi) : CloudOff;
  const label = online
    ? overview?.updateAvailable
      ? "Field Pack update ready"
      : ready
        ? "Online · Field Pack ready"
        : "Online · Prepare offline pack"
    : ready
      ? "Offline · Field Pack active"
      : "Offline · No complete pack";

  return (
    <div className="field-offline-badge field-print-hide border-b border-emerald-950/10 bg-emerald-50 px-4 py-2">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 text-xs text-emerald-950">
        <span className="inline-flex items-center gap-2 font-semibold" aria-live="polite">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </span>
        <a
          href={FIELD_MODE_OFFLINE_PATH}
          className="font-semibold underline underline-offset-2"
        >
          Offline &amp; backup tools
        </a>
      </div>
    </div>
  );
}
