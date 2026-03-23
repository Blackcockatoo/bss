"use client";

import {
  CURRICULUM_FIT_BADGE_CLASSNAMES,
  CURRICULUM_FIT_INFO,
  CURRICULUM_FIT_TAGS,
} from "@/lib/education/curriculum-fit";
import type { CurriculumFitTag } from "@/lib/education/curriculum-fit";
import { SCRIPTED_LESSONS } from "@/lib/education/lesson-cards";
import { ScriptedLessonCard } from "@/components/ScriptedLessonCard";
import { BookOpen } from "lucide-react";
import { useMemo, useState } from "react";

export function LessonCardGallery() {
  const [activeFilter, setActiveFilter] = useState<CurriculumFitTag | null>(
    null,
  );

  const filtered = useMemo(() => {
    if (!activeFilter) return SCRIPTED_LESSONS;
    return SCRIPTED_LESSONS.filter((l) =>
      l.curriculumFit.includes(activeFilter),
    );
  }, [activeFilter]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <BookOpen className="h-4 w-4 text-slate-400" />
          Scripted Lessons
        </h2>
        <p className="text-xs text-slate-500">
          Pick a 15-20 minute lesson. Follow the script. Done.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveFilter(null)}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
            activeFilter === null
              ? "border-white/30 bg-white/10 text-white"
              : "border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200"
          }`}
        >
          All
        </button>
        {CURRICULUM_FIT_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() =>
              setActiveFilter((prev) => (prev === tag ? null : tag))
            }
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              activeFilter === tag
                ? CURRICULUM_FIT_BADGE_CLASSNAMES[tag]
                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            {CURRICULUM_FIT_INFO[tag].label}
          </button>
        ))}
      </div>

      {/* Lesson cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((lesson) => (
          <ScriptedLessonCard
            key={lesson.id}
            lesson={lesson}
            recommended={lesson.number === 1 && activeFilter === null}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-600">
          No lessons match this filter.
        </p>
      )}
    </section>
  );
}
