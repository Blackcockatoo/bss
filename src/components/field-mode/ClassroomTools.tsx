"use client";

import { useEffect, useState } from "react";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
} from "@/lib/childSafeBaseline";
import {
  TIMER_PRESET_MINUTES,
  formatCountdown,
  remainingSeconds,
  type TimerPresetMinutes,
} from "@/lib/schools/classroomTimer";
import { randomiseGroups } from "@/lib/schools/groupRandomiser";
import {
  placeholderStudentLabels,
  useHasClientStorage,
  useLocalAliasRoster,
} from "@/lib/schools/localAliasRoster";

function playGentleChime() {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 523.25;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.04, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.75);
    window.setTimeout(() => {
      void context.close();
    }, 900);
  } catch {
    // Sound is optional; a missing audio context must not break the timer.
  }
}

export function ClassroomTools() {
  const [preset, setPreset] = useState<TimerPresetMinutes>(5);
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(5 * 60);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [projector, setProjector] = useState(false);
  const [status, setStatus] = useState("Timer ready.");

  const aliases = useLocalAliasRoster();
  const rosterReady = useHasClientStorage();
  const [preferRoster, setPreferRoster] = useState(true);
  const useRoster = preferRoster && aliases.length > 0;
  const [studentCount, setStudentCount] = useState(24);
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<string[][]>([]);

  useEffect(() => {
    if (!running || endsAt === null) return;
    const tick = () => {
      const left = remainingSeconds(endsAt, Date.now());
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setEndsAt(null);
        setStatus("Time is up.");
        if (soundEnabled) playGentleChime();
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [running, endsAt, soundEnabled]);

  const startOrPause = () => {
    if (running) {
      if (endsAt === null) return;
      const left = remainingSeconds(endsAt, Date.now());
      setRunning(false);
      setEndsAt(null);
      setRemaining(left);
      setStatus("Timer paused.");
      return;
    }
    const from = remaining > 0 ? remaining : preset * 60;
    setRemaining(from);
    setEndsAt(Date.now() + from * 1000);
    setRunning(true);
    setStatus(`Timer started for ${formatCountdown(from)}.`);
  };

  const resetTimer = () => {
    setRunning(false);
    setEndsAt(null);
    setRemaining(preset * 60);
    setStatus("Timer reset.");
  };

  const choosePreset = (minutes: TimerPresetMinutes) => {
    setPreset(minutes);
    if (!running) {
      setRemaining(minutes * 60);
      setStatus(`Timer set to ${minutes} minutes.`);
    }
  };

  const makeGroups = () => {
    const labels =
      useRoster && aliases.length > 0
        ? aliases.map((entry) => entry.alias)
        : placeholderStudentLabels(studentCount);
    setGroups(randomiseGroups(labels, groupSize));
  };

  const display = formatCountdown(remaining);
  const shellClass = projector
    ? "fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-950"
    : "min-h-screen bg-slate-50 text-slate-950";

  return (
    <main className={shellClass}>
      <div
        className={
          projector
            ? "flex flex-1 flex-col px-6 py-6"
            : "mx-auto w-full max-w-5xl space-y-10 px-5 py-10 md:px-8 md:py-14"
        }
      >
        {projector ? null : (
          <header className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
              Classroom tools
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Classroom timer and groups
            </h1>
            <p className="text-base leading-7 text-slate-700">
              Use the timer on a shared screen, then make groups from the alias
              roster already on this device. If there is no roster, type a
              number of students instead. Nothing is sent or stored on a
              server.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={FIELD_MODE_HOME_PATH}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Home
              </a>
              <a
                href={FIELD_MODE_LESSONS_PATH}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Lessons
              </a>
              <a
                href={FIELD_MODE_CLASSROOM_PATH}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Alias roster
              </a>
            </div>
          </header>
        )}

        <section
          aria-labelledby={projector ? undefined : "timer-heading"}
          className={
            projector
              ? "flex flex-1 flex-col justify-center"
              : "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          }
        >
          {projector ? null : (
            <h2 id="timer-heading" className="text-2xl font-semibold">
              Timer
            </h2>
          )}
          <p className="sr-only" aria-live="polite">
            {status} {display}
          </p>
          <p
            className={`font-semibold tabular-nums tracking-tight text-slate-950 ${
              projector
                ? "text-center text-[8rem] leading-none md:text-[10rem]"
                : "mt-6 text-7xl md:text-8xl"
            }`}
            aria-hidden="true"
          >
            {display}
          </p>
          <div className={`flex flex-wrap gap-2 ${projector ? "mt-10 justify-center" : "mt-6"}`}>
            {TIMER_PRESET_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                aria-pressed={preset === minutes}
                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold ${
                  preset === minutes
                    ? "bg-emerald-800 text-white"
                    : "border border-slate-300 text-slate-800"
                }`}
                onClick={() => choosePreset(minutes)}
              >
                {minutes} minutes
              </button>
            ))}
          </div>
          <div className={`flex flex-wrap gap-3 ${projector ? "mt-6 justify-center" : "mt-6"}`}>
            <button
              type="button"
              className="min-h-12 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              onClick={startOrPause}
            >
              {running ? "Pause" : remaining > 0 && remaining < preset * 60 ? "Resume" : "Start"}
            </button>
            <button
              type="button"
              className="min-h-12 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={resetTimer}
            >
              Reset
            </button>
            <button
              type="button"
              className="min-h-12 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setProjector((value) => !value)}
            >
              {projector ? "Exit projector view" : "Show on projector"}
            </button>
          </div>
          <label className={`mt-6 flex items-start gap-3 text-sm leading-6 text-slate-700 ${projector ? "justify-center" : ""}`}>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.target.checked)}
            />
            Play a gentle sound when time is up. This stays off unless you turn
            it on, and it stays on this device.
          </label>
        </section>

        {projector ? null : (
          <section
            aria-labelledby="groups-heading"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <h2 id="groups-heading" className="text-2xl font-semibold">
              Group maker
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Groups are made here only. Aliases are read from the existing
              local roster; they are not sent anywhere and the groups are not
              saved.
            </p>
            <p className="mt-3 text-sm font-medium text-emerald-900" aria-live="polite">
              {!rosterReady
                ? "Looking for a local alias roster…"
                : aliases.length > 0
                  ? `${aliases.length} aliases found on this device.`
                  : "No alias roster was found on this device."}
            </p>
            {aliases.length > 0 ? (
              <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={preferRoster}
                  onChange={(event) => setPreferRoster(event.target.checked)}
                />
                Use the local alias roster
              </label>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-700">
                Enter how many students to make unnamed groups, or{" "}
                <a
                  href={FIELD_MODE_CLASSROOM_PATH}
                  className="font-semibold text-emerald-900 underline underline-offset-2"
                >
                  add aliases in classroom setup
                </a>
                .
              </p>
            )}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {useRoster && aliases.length > 0 ? null : (
                <label className="space-y-2 text-sm font-semibold text-slate-800">
                  Number of students
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={studentCount}
                    onChange={(event) =>
                      setStudentCount(
                        Math.max(2, Math.min(60, Number(event.target.value) || 2)),
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
                  />
                </label>
              )}
              <label className="space-y-2 text-sm font-semibold text-slate-800">
                About this many per group
                <select
                  value={groupSize}
                  onChange={(event) => setGroupSize(Number(event.target.value))}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
                >
                  {[2, 3, 4, 5].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="mt-6 min-h-12 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              onClick={makeGroups}
            >
              Make groups
            </button>
            {groups.length > 0 ? (
              <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                {groups.map((group, index) => (
                  <li
                    key={`group-${index}`}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="text-sm font-semibold text-emerald-900">
                      Group {index + 1}
                    </p>
                    <ul className="mt-2 space-y-1 text-base text-slate-800">
                      {group.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
