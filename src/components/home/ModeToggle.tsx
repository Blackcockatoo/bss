"use client";

import { Compass, GraduationCap } from "lucide-react";

import { useAppMode, type AppMode } from "@/lib/appMode";

const OPTIONS: Array<{ mode: AppMode; label: string; icon: typeof Compass }> = [
  { mode: "explorer", label: "Explorer", icon: Compass },
  { mode: "teacher", label: "Teacher", icon: GraduationCap },
];

/** The Explorer / Teacher mode switch. Hidden on locked schools builds. */
export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode, canToggle } = useAppMode();

  if (!canToggle) return null;

  return (
    <div
      role="group"
      aria-label="App mode"
      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = mode === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => setMode(option.mode)}
            aria-pressed={active}
            className={`flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              active
                ? option.mode === "teacher"
                  ? "bg-amber-300 text-slate-950 shadow"
                  : "bg-cyan-400 text-slate-950 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && option.label}
          </button>
        );
      })}
    </div>
  );
}
