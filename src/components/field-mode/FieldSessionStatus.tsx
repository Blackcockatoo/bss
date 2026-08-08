"use client";

import { Clock3, MonitorSmartphone, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import {
  FIELD_SESSION_LABELS,
  type FieldSessionConfig,
} from "@/lib/fieldMode/session";

/**
 * Pacing guidance for the teacher, shown at whole-minute granularity.
 *
 * This used to render a per-second countdown on the shared classroom screen.
 * Two problems with that: a ticking clock in front of a class invites children
 * to watch the timer instead of the task, and an `aria-live` region whose value
 * changes every second announces the clock over everything else a screen reader
 * user is trying to hear.
 *
 * Minutes are enough for pacing. Nothing is enforced when the time runs out —
 * the label simply changes to a reflection cue and every control stays usable.
 */
function formatPacing(seconds: number): string {
  if (seconds <= 0) return "Time for reflection";
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "About 1 min left" : `About ${minutes} min left`;
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

  const timeLabel = formatPacing(remaining);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100">
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {/* Announced only when the whole-minute label actually changes. */}
        <span aria-live="polite">
          {paused ? `Paused · ${timeLabel}` : timeLabel}
        </span>
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
