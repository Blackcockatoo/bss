"use client";

import {
  CURRICULUM_FIT_BADGE_CLASSNAMES,
  CURRICULUM_FIT_INFO,
} from "@/lib/education/curriculum-fit";
import type { ScriptedLessonCard as LessonCardData } from "@/lib/education/lesson-cards";
import { useEducationStore } from "@/lib/education";
import { PrintWorksheetButton } from "@/components/PrintableWorksheet";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  Clock,
  ListOrdered,
  MessageCircle,
  Plus,
} from "lucide-react";
import { useState } from "react";

const PILLAR_COLORS: Record<string, string> = {
  "Pattern investigation": "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  "Group discussion": "border-violet-400/30 bg-violet-500/10 text-violet-200",
  Reflection: "border-pink-400/30 bg-pink-500/10 text-pink-200",
};

export function ScriptedLessonCard({
  lesson,
  recommended = false,
}: {
  lesson: LessonCardData;
  recommended?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const addLesson = useEducationStore((s) => s.addLesson);
  const [added, setAdded] = useState(false);

  const handleAddToQueue = () => {
    addLesson({
      title: lesson.title,
      description: lesson.subtitle,
      engagementCategory: lesson.engagementCategory,
      focusArea: lesson.focusArea,
      dnaMode: lesson.dnaMode,
      targetMinutes: lesson.durationMinutes,
      standardsRef: [],
      prePrompt: lesson.prePrompt,
      postPrompt: lesson.postPrompt,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 overflow-hidden transition hover:border-slate-600/80">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 space-y-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {recommended && (
              <span className="inline-block rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 mb-1">
                Start here
              </span>
            )}
            <h3 className="text-sm font-semibold text-white">
              <span className="text-slate-500 mr-1.5">#{lesson.number}</span>
              {lesson.title}
            </h3>
            <p className="text-xs text-slate-400">{lesson.subtitle}</p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 mt-1" />
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
            <Clock className="h-3 w-3" />
            {lesson.durationMinutes} min
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${PILLAR_COLORS[lesson.pillar] ?? "border-slate-600 bg-slate-800 text-slate-300"}`}
          >
            {lesson.pillar}
          </span>
          {lesson.curriculumFit.map((tag) => (
            <span
              key={tag}
              className={`rounded-full border px-2 py-0.5 text-[10px] ${CURRICULUM_FIT_BADGE_CLASSNAMES[tag]}`}
            >
              {CURRICULUM_FIT_INFO[tag].label}
            </span>
          ))}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-4">
              {/* Steps */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ListOrdered className="h-3.5 w-3.5" />
                  Steps
                </h4>
                <ol className="space-y-3">
                  {lesson.steps.map((step) => (
                    <li key={step.order} className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                          {step.order}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-200">
                              {step.instruction}
                            </span>
                            <span className="shrink-0 text-[10px] text-slate-600">
                              {step.durationMinutes} min
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Students: {step.studentAction}
                          </p>
                        </div>
                      </div>
                      {step.teacherSays && (
                        <div className="ml-7 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">
                          <p className="flex items-start gap-1.5 text-[11px] text-indigo-300">
                            <MessageCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>
                              <span className="font-semibold">Teacher says: </span>
                              &ldquo;{step.teacherSays}&rdquo;
                            </span>
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Pre/post prompts */}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-600">
                    Before
                  </p>
                  <p className="text-xs text-slate-300">{lesson.prePrompt}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-600">
                    After
                  </p>
                  <p className="text-xs text-slate-300">{lesson.postPrompt}</p>
                </div>
              </div>

              {/* Safety */}
              <p className="text-[10px] text-slate-600">{lesson.safetyNote}</p>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddToQueue}
                  disabled={added}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    added
                      ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : "border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                  }`}
                >
                  {added ? (
                    <>Added to queue</>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Load into Queue
                    </>
                  )}
                </button>
                <PrintWorksheetButton lesson={lesson} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
