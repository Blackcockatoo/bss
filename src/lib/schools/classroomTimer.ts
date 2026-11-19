export const TIMER_PRESET_MINUTES = [2, 5, 10, 15] as const;

export type TimerPresetMinutes = (typeof TIMER_PRESET_MINUTES)[number];

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function remainingSeconds(endsAtMs: number, nowMs: number): number {
  return Math.max(0, (endsAtMs - nowMs) / 1000);
}
