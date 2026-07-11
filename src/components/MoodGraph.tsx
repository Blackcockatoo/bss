"use client";

import type { MoodCheckIn, UserMood } from "@/lib/bond";
import { USER_MOOD_ICONS, USER_MOOD_VALUES } from "@/lib/bond";
import { getDateKey } from "@/lib/wellness";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

export type MoodGraphRange = 7 | 30;

export interface MoodDayPoint {
  dateKey: string; // YYYY-MM-DD
  avg: number | null; // 1-5 average of that day's check-ins, null if none
  count: number;
}

const DAY_MS = 86400000;

/**
 * Bucket mood check-ins by day (UTC date keys, matching the hydration
 * tracker) and average each day's mood values on the 1-5 scale.
 * Returns `days` points ordered oldest -> newest, ending today.
 */
export function buildMoodSeries(
  moodHistory: MoodCheckIn[],
  days: MoodGraphRange,
  now: number = Date.now(),
): MoodDayPoint[] {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const checkIn of moodHistory) {
    const key = getDateKey(checkIn.timestamp);
    const bucket = totals.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += USER_MOOD_VALUES[checkIn.mood];
    bucket.count += 1;
    totals.set(key, bucket);
  }

  const series: MoodDayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateKey = getDateKey(now - i * DAY_MS);
    const bucket = totals.get(dateKey);
    series.push({
      dateKey,
      avg: bucket ? bucket.sum / bucket.count : null,
      count: bucket?.count ?? 0,
    });
  }
  return series;
}

const MOOD_SCALE: UserMood[] = ["struggling", "low", "neutral", "good", "great"];

function moodForValue(value: number): UserMood {
  const index = Math.min(
    MOOD_SCALE.length - 1,
    Math.max(0, Math.round(value) - 1),
  );
  return MOOD_SCALE[index];
}

const MOOD_BAR_COLORS: Record<UserMood, string> = {
  struggling: "bg-gradient-to-t from-red-600 to-red-400",
  low: "bg-gradient-to-t from-orange-600 to-orange-400",
  neutral: "bg-gradient-to-t from-zinc-500 to-zinc-400",
  good: "bg-gradient-to-t from-green-600 to-green-400",
  great: "bg-gradient-to-t from-emerald-600 to-emerald-400",
};

interface MoodGraphProps {
  moodHistory: MoodCheckIn[];
  className?: string;
}

export function MoodGraph({ moodHistory, className }: MoodGraphProps) {
  const [range, setRange] = useState<MoodGraphRange>(7);
  const [mountTimestamp] = useState(() => Date.now());

  const series = useMemo(
    () => buildMoodSeries(moodHistory, range, mountTimestamp),
    [moodHistory, range, mountTimestamp],
  );

  const hasData = series.some((point) => point.avg !== null);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Mood over time</span>
        </div>
        <div className="flex gap-1" role="group" aria-label="Graph range">
          {([7, 30] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs transition-colors touch-manipulation",
                range === option
                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                  : "bg-zinc-800/60 text-zinc-500 border border-transparent hover:text-zinc-300",
              )}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="flex gap-2">
          {/* Mood icon axis, 5 (great) at top down to 1 (struggling) */}
          <div
            className="flex flex-col justify-between h-24 py-0.5 text-[10px] leading-none select-none"
            aria-hidden="true"
          >
            {[...MOOD_SCALE].reverse().map((mood) => (
              <span key={mood}>{USER_MOOD_ICONS[mood]}</span>
            ))}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-end gap-px h-24">
              {series.map((point, i) => {
                const isToday = i === series.length - 1;
                if (point.avg === null) {
                  return (
                    <div
                      key={point.dateKey}
                      className="flex-1 flex flex-col justify-end h-full"
                      title={`${point.dateKey}: no check-in`}
                    >
                      <div className="w-full h-0.5 rounded bg-zinc-800" />
                    </div>
                  );
                }
                const mood = moodForValue(point.avg);
                return (
                  <div
                    key={point.dateKey}
                    className="flex-1 flex flex-col justify-end h-full"
                    title={`${point.dateKey}: ${point.avg.toFixed(1)}/5 (${point.count} check-in${point.count === 1 ? "" : "s"})`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        MOOD_BAR_COLORS[mood],
                        isToday && "ring-1 ring-purple-400/60",
                      )}
                      style={{ height: `${(point.avg / 5) * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {range === 7 && (
              <div className="flex gap-px">
                {series.map((point, i) => (
                  <span
                    key={point.dateKey}
                    className={cn(
                      "flex-1 text-center text-[10px]",
                      i === series.length - 1
                        ? "text-purple-400"
                        : "text-zinc-600",
                    )}
                  >
                    {"SMTWTFS"[new Date(point.dateKey).getDay()]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-zinc-500">
          No check-ins in the last {range} days yet. Log how you&apos;re feeling
          and your mood graph will grow here.
        </p>
      )}
    </div>
  );
}
