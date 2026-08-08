"use client";

import { BookOpenCheck, ClipboardCheck, FileText, Printer, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  FIELD_MODE_PASSPORT_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
  FIELD_MODE_REVIEW_PATH,
} from "@/lib/childSafeBaseline";
import {
  DEFAULT_FIELD_SESSION,
  FIELD_DELIVERY_MODES,
  FIELD_DURATIONS,
  FIELD_MODE_SESSION_STORAGE_KEY,
  FIELD_SESSION_LABELS,
  FIELD_SUPPORT_MODES,
  FIELD_YEAR_BANDS,
  buildFieldLessonPath,
  sanitizeFieldSession,
  type FieldSessionConfig,
} from "@/lib/fieldMode/session";
import { touchSchoolsLocalState } from "@/lib/schools/storage";
import {
  LESSON_DEFINITIONS,
  selectLessonStatus,
  useLessonProgressHydrated,
  useLessonProgressStore,
} from "@/lib/teacher-lessons";

function loadSession(): FieldSessionConfig {
  if (typeof window === "undefined") return DEFAULT_FIELD_SESSION;
  try {
    const raw = window.localStorage.getItem(FIELD_MODE_SESSION_STORAGE_KEY);
    return raw
      ? sanitizeFieldSession(JSON.parse(raw) as Partial<FieldSessionConfig>)
      : DEFAULT_FIELD_SESSION;
  } catch {
    return DEFAULT_FIELD_SESSION;
  }
}

export function FieldLessonLaunchpad() {
  const [session, setSession] = useState<FieldSessionConfig>(loadSession);
  const hydrated = useLessonProgressHydrated();
  const progress = useLessonProgressStore();

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FIELD_MODE_SESSION_STORAGE_KEY,
        JSON.stringify(session),
      );
      touchSchoolsLocalState(window.localStorage);
    } catch {
      // Storage can be unavailable; the launchpad still works for this session.
    }
  }, [session]);

  const completeCount = useMemo(
    () =>
      LESSON_DEFINITIONS.filter(
        (lesson) => selectLessonStatus(progress, lesson.id) === "completed",
      ).length,
    [progress],
  );

  const update = <K extends keyof FieldSessionConfig>(
    key: K,
    value: FieldSessionConfig[K],
  ) => setSession((current) => ({ ...current, [key]: value }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Teacher launchpad · Australian Years 3–6
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Ready when you are.
          </h1>
          <p className="text-base leading-7 text-slate-700 md:text-lg">
            No account or payment required. Open Session One and start teaching,
            or pick any other session. Records stay on this device.
          </p>
          <p className="text-sm font-medium text-emerald-900" aria-live="polite">
            {hydrated ? `${completeCount} of 7 sessions completed on this device` : "Loading local session records…"}
          </p>
        </header>

        <section aria-labelledby="field-lessons-heading">
          <div className="mb-4 flex items-center gap-3">
            <BookOpenCheck className="h-6 w-6 text-emerald-800" aria-hidden="true" />
            <h2 id="field-lessons-heading" className="text-2xl font-semibold">
              The seven sessions
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {LESSON_DEFINITIONS.map((lesson) => {
              const status = selectLessonStatus(progress, lesson.id);
              const isRecommendedStart = lesson.number === 1;
              return (
                <article
                  key={lesson.id}
                  className={`flex flex-col rounded-3xl bg-white p-5 shadow-sm ${
                    isRecommendedStart
                      ? "border-2 border-emerald-800"
                      : "border border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                      Session {lesson.number}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                      {status.replace("-", " ")}
                    </span>
                  </div>
                  {isRecommendedStart ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-800">
                      Recommended starting point
                    </p>
                  ) : null}
                  <h3 className="mt-3 text-xl font-semibold">{lesson.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    {lesson.shortDescription}
                  </p>
                  <p className="mt-4 text-xs font-medium text-slate-500">
                    {FIELD_SESSION_LABELS.yearBand[session.yearBand]} · {session.durationMinutes} min · {FIELD_SESSION_LABELS.deliveryMode[session.deliveryMode]}
                  </p>
                  <a
                    href={buildFieldLessonPath(lesson.slug, session)}
                    className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    {status === "not-started" ? "Start lesson" : "Open lesson"}
                  </a>
                  <a
                    href={`${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`}
                    className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4" aria-hidden="true" />
                    Print / save PDF fallback
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="field-setup-heading"
          className="rounded-3xl border border-emerald-950/15 bg-white p-5 shadow-sm md:p-7"
        >
          <h2 id="field-setup-heading" className="text-2xl font-semibold">
            Adjust classroom settings
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Optional. The defaults work for a Years 3–4 whole-class lesson.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              Year band
              <select
                aria-label="Year band"
                value={session.yearBand}
                onChange={(event) =>
                  update("yearBand", event.target.value as FieldSessionConfig["yearBand"])
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                {FIELD_YEAR_BANDS.map((value) => (
                  <option key={value} value={value}>
                    {FIELD_SESSION_LABELS.yearBand[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-800">
              Lesson time
              <select
                aria-label="Lesson time"
                value={session.durationMinutes}
                onChange={(event) =>
                  update("durationMinutes", Number(event.target.value) as FieldSessionConfig["durationMinutes"])
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                {FIELD_DURATIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} minutes
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-800">
              Grouping
              <select
                aria-label="Grouping"
                value={session.deliveryMode}
                onChange={(event) =>
                  update("deliveryMode", event.target.value as FieldSessionConfig["deliveryMode"])
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                {FIELD_DELIVERY_MODES.map((value) => (
                  <option key={value} value={value}>
                    {FIELD_SESSION_LABELS.deliveryMode[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-800">
              Presentation
              <select
                aria-label="Presentation"
                value={session.supportMode}
                onChange={(event) =>
                  update("supportMode", event.target.value as FieldSessionConfig["supportMode"])
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                {FIELD_SUPPORT_MODES.map((value) => (
                  <option key={value} value={value}>
                    {FIELD_SESSION_LABELS.supportMode[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={session.soundEnabled}
                onChange={(event) => update("soundEnabled", event.target.checked)}
                className="h-5 w-5"
              />
              Sound {session.soundEnabled ? "on" : "off"}
            </label>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Local evidence tools">
          <a
            href={FIELD_MODE_PASSPORT_PATH}
            className="rounded-3xl border border-emerald-900/15 bg-emerald-50 p-5 text-emerald-950 hover:bg-emerald-100"
          >
            <FileText className="h-6 w-6" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-semibold">Learning Passport</h2>
            <p className="mt-2 text-sm leading-6">
              See the alias-only journey summary derived from local lesson
              evidence.
            </p>
          </a>
          <a
            href={FIELD_MODE_REVIEW_PATH}
            className="rounded-3xl border border-cyan-900/15 bg-cyan-50 p-5 text-cyan-950 hover:bg-cyan-100"
          >
            <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-semibold">Teacher Evidence Review</h2>
            <p className="mt-2 text-sm leading-6">
              Review or delete lesson evidence stored on this classroom device.
            </p>
          </a>
        </section>

        <aside className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" aria-hidden="true" />
          No student accounts, real names, public sharing or cloud classroom
          profiles are used by this Field lesson path.
        </aside>
      </div>
    </main>
  );
}
