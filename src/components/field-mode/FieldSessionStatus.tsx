"use client";

import { Clock3, MonitorSmartphone, Volume2, VolumeX } from "lucide-react";

import {
  FIELD_SESSION_LABELS,
  type FieldSessionConfig,
} from "@/lib/fieldMode/session";

export function FieldSessionStatus({
  session,
  paused,
}: {
  session: FieldSessionConfig;
  paused: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100">
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {paused ? "Paused" : `${session.durationMinutes}-minute guide · no student countdown`}
      </span>
      <span aria-hidden="true">·</span>
      <span>{FIELD_SESSION_LABELS.yearBand[session.yearBand]}</span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <MonitorSmartphone className="h-4 w-4" aria-hidden="true" />
        {FIELD_SESSION_LABELS.deliveryMode[session.deliveryMode]}
      </span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        {session.soundEnabled ? (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        )}
        Sound {session.soundEnabled ? "on" : "off"}
      </span>
    </div>
  );
}
