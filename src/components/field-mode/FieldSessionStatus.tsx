"use client";

import { Clock3, MonitorSmartphone, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  FIELD_SESSION_LABELS,
  type FieldSessionConfig,
} from "@/lib/fieldMode/session";

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function FieldSessionStatus({
  session,
  paused,
}: {
  session: FieldSessionConfig;
  paused: boolean;
}) {
  const initialSeconds = session.durationMinutes * 60;
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (paused || remaining <= 0) return;
    const timer = window.setInterval(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [paused, remaining]);

  const timeLabel = useMemo(
    () => (remaining === 0 ? "Reflection time" : formatRemaining(remaining)),
    [remaining],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100">
      <span className="inline-flex items-center gap-1.5 font-semibold" aria-live="polite">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {paused ? `Paused · ${timeLabel}` : timeLabel}
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
