"use client";

import { useMemo, useState } from "react";

import {
  FIELD_MODE_PRINT_CURRICULUM_PATH,
} from "@/lib/schools/classroomPack";
import {
  LESSON_STATE_MAPS,
  STATE_MAP_BAND_LABELS,
  STATE_MAP_INTRO,
  type LessonStateMap,
  type StateCurriculumJurisdiction,
  type StateMapBand,
  type StateMapResult,
} from "@/lib/schools/stateLessonMaps";
import {
  ALL_STATE_CURRICULUM_SOURCES,
  STATE_CURRICULUM_NOT_AN_ENDORSEMENT,
} from "@/lib/schools/stateCurriculumSources";

const BANDS: StateMapBand[] = ["f-2", "3-6", "7-8", "invisible-trail"];

function MapResult({ result }: { result: StateMapResult }) {
  if (result.status === "not-mapped-yet") {
    return (
      <p className="text-sm leading-6 text-slate-700">
        <span className="font-semibold">Not mapped yet.</span> {result.reason}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {result.codes.map((entry) => (
        <li key={entry.code} className="text-sm leading-6 text-slate-800">
          <p className="font-semibold tracking-wide">
            {entry.code}
            <span className="ml-2 font-normal text-slate-600">
              {entry.officialBand}
            </span>
          </p>
          <p className="mt-1 text-slate-700">“{entry.wording}”</p>
        </li>
      ))}
    </ul>
  );
}

function LessonCard({
  lesson,
  jurisdiction,
}: {
  lesson: LessonStateMap;
  jurisdiction: StateCurriculumJurisdiction;
}) {
  const stateResult =
    jurisdiction === "victoria" ? lesson.victorian : lesson.nsw;
  const stateLabel =
    jurisdiction === "victoria"
      ? "Victorian Curriculum 2.0"
      : "NSW syllabus";
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">{lesson.title}</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-800">
        {STATE_MAP_BAND_LABELS[lesson.band]}
      </p>
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          Australian Curriculum v9 codes already listed
        </p>
        <p className="text-sm text-slate-800">
          {lesson.australianCodes.length > 0
            ? lesson.australianCodes.join(", ")
            : "None listed on this item."}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          {stateLabel}
        </p>
        <MapResult result={stateResult} />
      </div>
    </article>
  );
}

export function CurriculumMaps({
  printBoth = false,
}: {
  printBoth?: boolean;
}) {
  const [jurisdiction, setJurisdiction] =
    useState<StateCurriculumJurisdiction>("victoria");
  const [band, setBand] = useState<StateMapBand | "all">("all");

  const rows = useMemo(() => {
    return LESSON_STATE_MAPS.filter(
      (item) => band === "all" || item.band === band,
    );
  }, [band]);

  if (printBoth) {
    return (
      <div className="space-y-10">
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          {STATE_MAP_INTRO}
        </p>
        {(["victoria", "nsw"] as const).map((item) => (
          <section key={item} className="space-y-4">
            <h2 className="text-2xl font-semibold">
              {item === "victoria"
                ? "Victorian Curriculum 2.0"
                : "NSW syllabus"}
            </h2>
            {LESSON_STATE_MAPS.map((lesson) => (
              <LessonCard
                key={`${item}-${lesson.id}`}
                lesson={lesson}
                jurisdiction={item}
              />
            ))}
          </section>
        ))}
        <Sources />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-base leading-7 text-slate-700">
        {STATE_MAP_INTRO}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">State or territory syllabus</legend>
          {(
            [
              ["victoria", "Victoria"],
              ["nsw", "New South Wales"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setJurisdiction(value)}
              className={`inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-semibold ${
                jurisdiction === value
                  ? "bg-emerald-800 text-white"
                  : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
              aria-pressed={jurisdiction === value}
            >
              {label}
            </button>
          ))}
        </fieldset>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Lesson set</legend>
          <button
            type="button"
            onClick={() => setBand("all")}
            className={`inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-semibold ${
              band === "all"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
            aria-pressed={band === "all"}
          >
            All sets
          </button>
          {BANDS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setBand(value)}
              className={`inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-semibold ${
                band === value
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
              aria-pressed={band === value}
            >
              {STATE_MAP_BAND_LABELS[value]}
            </button>
          ))}
        </fieldset>
        <a
          href={FIELD_MODE_PRINT_CURRICULUM_PATH}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Print both states
        </a>
      </div>
      <div className="space-y-4">
        {rows.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            jurisdiction={jurisdiction}
          />
        ))}
      </div>
      <Sources />
    </div>
  );
}

function Sources() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-lg font-semibold">Official sources</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {STATE_CURRICULUM_NOT_AN_ENDORSEMENT}
      </p>
      <ul className="mt-4 space-y-3">
        {ALL_STATE_CURRICULUM_SOURCES.map((source) => (
          <li key={source.id} className="text-sm leading-6 text-slate-800">
            <a
              href={source.href}
              className="font-semibold text-emerald-900 underline"
            >
              {source.title}
            </a>
            <span className="text-slate-600">
              {" "}
              · {source.publisher} · HTTP {source.httpStatus}
            </span>
            <p className="mt-1 text-slate-700">{source.notes}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
