"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TimerBarProps {
  durationMinutes: number;
  startedAt: number;
}

export function TimerBar({ durationMinutes, startedAt }: TimerBarProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = now - startedAt;
  const totalMs = durationMinutes * 60 * 1000;
  const progress = Math.min(elapsedMs / totalMs, 1);
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  const done = progress >= 1;

  const barColor = done
    ? "bg-emerald-400"
    : progress > 0.8
      ? "bg-amber-400"
      : "bg-cyan-400";

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          {done ? "Session complete" : "Session in progress"}
        </span>
        <span className="font-mono text-slate-300">
          {elapsedMin}:{String(elapsedSec).padStart(2, "0")} / {durationMinutes}:00
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
