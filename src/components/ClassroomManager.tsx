"use client";

import { EducationQueuePanel } from "@/components/EducationQueuePanel";
import { resetTeacherOnboarding } from "@/lib/education/teacher-onboarding";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_ENGAGEMENT_CATEGORY,
  ENGAGEMENT_CATEGORY_DEFINITIONS,
  ENGAGEMENT_CATEGORY_OPTIONS,
  normalizeEngagementCategory,
  useEducationStore,
} from "@/lib/education";
import type {
  DnaMode,
  EngagementCategory,
  FocusArea,
} from "@/lib/education";
import { SCHOOLS_ACTIVITY_MODE_LABELS } from "@/lib/education/types";
import {
  SCHOOLS_CLASSROOM_ANALYTICS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_LOCAL_DATA_RETENTION_DAYS,
  clearSchoolsLocalState,
  purgeExpiredSchoolsLocalState,
  touchSchoolsLocalState,
} from "@/lib/schools/storage";
import {
  ClipboardList,
  ListOrdered,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  alias: string;
  addedAt: number;
};

type Assignment = {
  id: string;
  title: string;
  engagementCategory: EngagementCategory;
  focus: string;
  targetMinutes: number;
  createdAt: number;
  dnaMode?: DnaMode;
  standardsRef?: string;
};

type ProgressStatus = "not-started" | "in-progress" | "complete";

type ProgressMap = Record<string, Record<string, ProgressStatus>>;

type AggregatedAnalytics = {
  totalStudents: number;
  totalAssignments: number;
  completionRate: number;
  assignments: Array<{
    id: string;
    title: string;
    completeCount: number;
    inProgressCount: number;
    notStartedCount: number;
  }>;
  updatedAt: number;
};

const DEFAULT_STATUS: ProgressStatus = "not-started";

const sanitizeAlias = (value: string) => value.trim().slice(0, 32);
const sanitizeTitle = (value: string) => value.trim().slice(0, 60);
const sanitizeFocus = (value: string) => value.trim().slice(0, 40);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse classroom data:", error);
    return fallback;
  }
};

const createId = () => crypto.randomUUID();

const ENGAGEMENT_CATEGORY_BADGE_CLASSNAMES: Record<
  EngagementCategory,
  string
> = {
  "health-digital-use":
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  learning: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  exploring: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  "training-practice":
    "border-violet-400/30 bg-violet-500/10 text-violet-200",
  "mindfulness-regulation":
    "border-teal-400/30 bg-teal-500/10 text-teal-200",
  "vegging-passive-consumption":
    "border-slate-400/30 bg-slate-500/10 text-slate-200",
};


function getEngagementCategoryBadgeClassName(
  category: string | null | undefined,
): string {
  return ENGAGEMENT_CATEGORY_BADGE_CLASSNAMES[
    normalizeEngagementCategory(category)
  ];
}

function normalizeAssignment(
  assignment: Partial<Assignment> &
    Pick<Assignment, "id" | "title" | "createdAt">,
): Assignment {
  return {
    id: assignment.id,
    title: sanitizeTitle(assignment.title),
    engagementCategory: normalizeEngagementCategory(
      assignment.engagementCategory,
    ),
    focus: sanitizeFocus(assignment.focus ?? "Reflection") || "Reflection",
    targetMinutes: Math.max(1, Number(assignment.targetMinutes) || 1),
    createdAt: assignment.createdAt,
    dnaMode: assignment.dnaMode ?? null,
    standardsRef: assignment.standardsRef?.trim() || undefined,
  };
}

export function ClassroomManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [newAlias, setNewAlias] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newEngagementCategory, setNewEngagementCategory] =
    useState<EngagementCategory>(DEFAULT_ENGAGEMENT_CATEGORY);
  const [newFocus, setNewFocus] = useState("Reflection");
  const [newTargetMinutes, setNewTargetMinutes] = useState(10);
  const [newDnaMode, setNewDnaMode] = useState<DnaMode>(null);
  const [newStandardsRef, setNewStandardsRef] = useState("");
  const [showQueue, setShowQueue] = useState(false);
  const [expiredDataPurged, setExpiredDataPurged] = useState(false);

  const addLessonToQueue = useEducationStore((s) => s.addLesson);
  const queue = useEducationStore((s) => s.queue);
  const resetEducationStore = useEducationStore((s) => s.reset);

  useEffect(() => {
    const purged = purgeExpiredSchoolsLocalState(window.localStorage);
    setExpiredDataPurged(purged);
    setStudents(
      safeParse<Student[]>(
        window.localStorage.getItem(SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY),
        [],
      ),
    );
    setAssignments(
      safeParse<
        Array<Partial<Assignment> & Pick<Assignment, "id" | "title" | "createdAt">>
      >(
        window.localStorage.getItem(SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY),
        [],
      ).map(normalizeAssignment),
    );
    setProgress(
      safeParse<ProgressMap>(
        window.localStorage.getItem(SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY),
        {},
      ),
    );
    touchSchoolsLocalState(window.localStorage);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
      JSON.stringify(students),
    );
    touchSchoolsLocalState(window.localStorage);
  }, [students]);

  useEffect(() => {
    window.localStorage.setItem(
      SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY,
      JSON.stringify(assignments),
    );
    touchSchoolsLocalState(window.localStorage);
  }, [assignments]);

  useEffect(() => {
    window.localStorage.setItem(
      SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY,
      JSON.stringify(progress),
    );
    touchSchoolsLocalState(window.localStorage);
  }, [progress]);

  const analytics = useMemo<AggregatedAnalytics>(() => {
    const assignmentAnalytics = assignments.map((assignment) => {
      const assignmentProgress = progress[assignment.id] ?? {};
      let completeCount = 0;
      let inProgressCount = 0;
      let notStartedCount = 0;
      students.forEach((student) => {
        const status = assignmentProgress[student.id] ?? DEFAULT_STATUS;
        if (status === "complete") completeCount += 1;
        if (status === "in-progress") inProgressCount += 1;
        if (status === "not-started") notStartedCount += 1;
      });
      return {
        id: assignment.id,
        title: assignment.title,
        completeCount,
        inProgressCount,
        notStartedCount,
      };
    });

    const totalStudents = students.length;
    const totalAssignments = assignments.length;
    const totalCells = totalStudents * totalAssignments;
    const totalComplete = assignmentAnalytics.reduce(
      (sum, entry) => sum + entry.completeCount,
      0,
    );
    const completionRate = totalCells === 0 ? 0 : totalComplete / totalCells;

    return {
      totalStudents,
      totalAssignments,
      completionRate,
      assignments: assignmentAnalytics,
      updatedAt: Date.now(),
    };
  }, [assignments, progress, students]);

  useEffect(() => {
    window.localStorage.setItem(
      SCHOOLS_CLASSROOM_ANALYTICS_STORAGE_KEY,
      JSON.stringify(analytics),
    );
    touchSchoolsLocalState(window.localStorage);
  }, [analytics]);

  const handleAddStudent = () => {
    const alias = sanitizeAlias(newAlias);
    if (!alias) return;
    const student: Student = {
      id: createId(),
      alias,
      addedAt: Date.now(),
    };
    setStudents((prev) => [...prev, student]);
    setProgress((prev) => {
      const updated = { ...prev };
      assignments.forEach((assignment) => {
        updated[assignment.id] = {
          ...updated[assignment.id],
          [student.id]: DEFAULT_STATUS,
        };
      });
      return updated;
    });
    setNewAlias("");
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((student) => student.id !== studentId));
    setProgress((prev) => {
      const updated: ProgressMap = {};
      Object.entries(prev).forEach(([assignmentId, assignmentProgress]) => {
        const { [studentId]: _removed, ...rest } = assignmentProgress;
        updated[assignmentId] = rest;
      });
      return updated;
    });
  };

  const handleAddAssignment = () => {
    const title = sanitizeTitle(newTitle);
    if (!title) return;
    const assignment: Assignment = {
      id: createId(),
      title,
      engagementCategory: newEngagementCategory,
      focus: sanitizeFocus(newFocus) || "Reflection",
      targetMinutes: Math.max(1, Number(newTargetMinutes) || 1),
      createdAt: Date.now(),
      dnaMode: newDnaMode,
      standardsRef: newStandardsRef.trim() || undefined,
    };
    setAssignments((prev) => [...prev, assignment]);
    setProgress((prev) => {
      const updated = { ...prev };
      updated[assignment.id] = students.reduce<Record<string, ProgressStatus>>(
        (acc, student) => {
          acc[student.id] = DEFAULT_STATUS;
          return acc;
        },
        {},
      );
      return updated;
    });
    setNewTitle("");
    setNewEngagementCategory(DEFAULT_ENGAGEMENT_CATEGORY);
    setNewFocus("Reflection");
    setNewTargetMinutes(10);
    setNewDnaMode(null);
    setNewStandardsRef("");
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    setAssignments((prev) =>
      prev.filter((assignment) => assignment.id !== assignmentId),
    );
    setProgress((prev) => {
      const { [assignmentId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const updateStatus = (
    assignmentId: string,
    studentId: string,
    status: ProgressStatus,
  ) => {
    setProgress((prev) => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [studentId]: status,
      },
    }));
  };

  const resetProgress = () => {
    if (!window.confirm("Reset all classroom progress?")) return;
    setProgress((prev) => {
      const updated: ProgressMap = {};
      Object.keys(prev).forEach((assignmentId) => {
        updated[assignmentId] = students.reduce<Record<string, ProgressStatus>>(
          (acc, student) => {
            acc[student.id] = DEFAULT_STATUS;
            return acc;
          },
          {},
        );
      });
      return updated;
    });
  };

  const resetClassroom = () => {
    if (
      !window.confirm(
        "Delete all MetaPet Schools data from this device, including the roster, progress, summaries, and queue?",
      )
    ) {
      return;
    }
    clearSchoolsLocalState(window.localStorage);
    resetEducationStore();
    setStudents([]);
    setAssignments([]);
    setProgress({});
    setShowQueue(false);
  };

  const resetAnalytics = () => {
    if (!window.confirm("Clear the local class summary?")) return;
    window.localStorage.removeItem(SCHOOLS_CLASSROOM_ANALYTICS_STORAGE_KEY);
    touchSchoolsLocalState(window.localStorage);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Local classroom data only
            </div>
            <p className="text-sm leading-6 text-zinc-300">
              This classroom setup is alias-based and stays on the current
              device unless a teacher deliberately exports evidence. Local
              school data expires after {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days
              without use.
            </p>
            {expiredDataPurged && (
              <p className="text-xs text-emerald-300">
                Older local school data was cleared automatically at load time.
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-rose-500 text-rose-300 hover:bg-rose-500/10"
            onClick={resetClassroom}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete local school data
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <ClipboardList className="h-4 w-4 text-cyan-300" />
            Class roster
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-xs uppercase tracking-wide text-zinc-500"
              htmlFor="classroom-alias"
            >
              Learner alias
            </label>
            <div className="flex gap-2">
              <input
                id="classroom-alias"
                value={newAlias}
                onChange={(event) => setNewAlias(event.target.value)}
                placeholder="e.g., Bluebird 4"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <Button
                type="button"
                onClick={handleAddStudent}
                className="h-10 px-4 bg-cyan-500/90 hover:bg-cyan-500 text-slate-950"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Use classroom-friendly aliases only (no full names or student
              IDs).
            </p>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No learners yet. Add aliases to build the roster.
              </p>
            ) : (
              students.map((student) => {
                const completedCount = Object.values(progress).reduce(
                  (count, assignmentProgress) =>
                    assignmentProgress[student.id] === "complete"
                      ? count + 1
                      : count,
                  0,
                );
                return (
                  <div
                    key={student.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-100">
                          {student.alias}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {completedCount} completed lesson
                          {completedCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10"
                        onClick={() => handleRemoveStudent(student.id)}
                        aria-label={`Remove ${student.alias}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <ClipboardList className="h-4 w-4 text-emerald-300" />
            Lesson planner
          </div>
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-wide text-zinc-500"
              htmlFor="classroom-assignment"
            >
              Lesson title
            </label>
            <input
              id="classroom-assignment"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="e.g., Session 1 - Meet the digital companion"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <label
                  className="text-xs uppercase tracking-wide text-zinc-500"
                  htmlFor="classroom-category-primary"
                >
                  Engagement category
                </label>
                <select
                  id="classroom-category-primary"
                  value={newEngagementCategory}
                  onChange={(event) =>
                    setNewEngagementCategory(
                      normalizeEngagementCategory(event.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {ENGAGEMENT_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-xs uppercase tracking-wide text-zinc-500"
                  htmlFor="classroom-focus"
                >
                  Focus area
                </label>
                <input
                  id="classroom-focus"
                  value={newFocus}
                  onChange={(event) => setNewFocus(event.target.value)}
                  placeholder="Reflection"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label
                  className="text-xs uppercase tracking-wide text-zinc-500"
                  htmlFor="classroom-minutes"
                >
                  Target minutes
                </label>
                <input
                  id="classroom-minutes"
                  type="number"
                  min={1}
                  value={newTargetMinutes}
                  onChange={(event) =>
                    setNewTargetMinutes(Number(event.target.value))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label
                  className="text-xs uppercase tracking-wide text-zinc-500"
                  htmlFor="classroom-dna-mode"
                >
                  Activity mode
                </label>
                <select
                  id="classroom-dna-mode"
                  value={newDnaMode ?? ""}
                  onChange={(event) =>
                    setNewDnaMode(
                      event.target.value === ""
                        ? null
                        : (event.target.value as DnaMode),
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">None</option>
                  {(
                    Object.entries(SCHOOLS_ACTIVITY_MODE_LABELS) as [
                      string,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label
                  className="text-xs uppercase tracking-wide text-zinc-500"
                  htmlFor="classroom-standards"
                >
                  Curriculum links
                </label>
                <input
                  id="classroom-standards"
                  value={newStandardsRef}
                  onChange={(event) => setNewStandardsRef(event.target.value)}
                  placeholder="e.g., AC9TDI4P02"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Category guide
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                {
                  ENGAGEMENT_CATEGORY_DEFINITIONS[newEngagementCategory]
                    .description
                }
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Keep categories descriptive and classroom-facing. Avoid using
                them as behaviour scores or surveillance labels.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAddAssignment}
              className="w-full h-10 bg-emerald-500/90 hover:bg-emerald-500 text-slate-950"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add lesson
            </Button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {assignments.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Lessons appear here once created.
              </p>
            ) : (
              assignments.map((assignment) => {
                const inQueue = queue.some((l) => l.title === assignment.title);
                return (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-100">
                          {assignment.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getEngagementCategoryBadgeClassName(assignment.engagementCategory)}`}
                          >
                            {
                              ENGAGEMENT_CATEGORY_DEFINITIONS[
                                assignment.engagementCategory
                              ].shortLabel
                            }
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {assignment.focus} · {assignment.targetMinutes} min
                          {assignment.dnaMode &&
                            ` · ${SCHOOLS_ACTIVITY_MODE_LABELS[assignment.dnaMode]}`}
                        </p>
                        {assignment.standardsRef && (
                          <p className="text-[10px] text-emerald-400/70 mt-0.5">
                            {assignment.standardsRef}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className={`h-8 px-2 text-xs ${inQueue ? "text-emerald-400" : "text-cyan-400 hover:bg-cyan-500/10"}`}
                          onClick={() => {
                            if (!inQueue) {
                              const focusKey = assignment.focus
                                .trim()
                                .toLowerCase();
                              const focusMap: Record<string, FocusArea> = {
                                reflection: "reflection",
                                repair: "reflection",
                                "pattern recognition":
                                  "pattern-recognition",
                                patterns: "pattern-recognition",
                                "sound exploration": "sound-exploration",
                                sound: "sound-exploration",
                                collaboration: "collaboration",
                                "geometry creation":
                                  "geometry-creation",
                                geometry: "geometry-creation",
                              };
                              addLessonToQueue({
                                title: assignment.title,
                                description: `${assignment.focus} activity`,
                                engagementCategory:
                                  assignment.engagementCategory,
                                focusArea: focusMap[focusKey] ?? "reflection",
                                dnaMode: assignment.dnaMode ?? null,
                                targetMinutes: assignment.targetMinutes,
                                standardsRef: assignment.standardsRef
                                  ? [assignment.standardsRef]
                                  : [],
                                prePrompt: null,
                                postPrompt: null,
                              });
                              touchSchoolsLocalState(window.localStorage);
                            }
                          }}
                          disabled={inQueue}
                          aria-label={
                            inQueue ? "Already in queue" : "Add to queue"
                          }
                        >
                          <ListOrdered className="h-3.5 w-3.5 mr-1" />
                          {inQueue ? "Queued" : "Queue"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          aria-label={`Remove ${assignment.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">
              Progress tracking
            </h3>
            <p className="text-xs text-zinc-500">
              Track progress without storing personal identifiers.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-slate-700"
            onClick={resetProgress}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset progress
          </Button>
        </div>
        {assignments.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Create lessons to start tracking progress.
          </p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {assignment.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getEngagementCategoryBadgeClassName(assignment.engagementCategory)}`}
                      >
                        {
                          ENGAGEMENT_CATEGORY_DEFINITIONS[
                            assignment.engagementCategory
                          ].shortLabel
                        }
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {assignment.focus} · {assignment.targetMinutes} min
                    </p>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {analytics.assignments.find(
                      (item) => item.id === assignment.id,
                    )?.completeCount ?? 0}{" "}
                    / {students.length} complete
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {students.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      Add learners to capture progress.
                    </p>
                  ) : (
                    students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-zinc-200">
                          {student.alias}
                        </span>
                        <select
                          value={
                            progress[assignment.id]?.[student.id] ??
                            DEFAULT_STATUS
                          }
                          onChange={(event) =>
                            updateStatus(
                              assignment.id,
                              student.id,
                              event.target.value as ProgressStatus,
                            )
                          }
                          className="rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                          <option value="not-started">Not started</option>
                          <option value="in-progress">In progress</option>
                          <option value="complete">Complete</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education Queue */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <ListOrdered className="h-4 w-4 text-amber-300" />
            Lesson Queue
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-700 text-xs"
            onClick={() => setShowQueue(!showQueue)}
          >
            {showQueue ? "Hide" : "Show"} Queue ({queue.length})
          </Button>
        </div>
        {showQueue && <EducationQueuePanel mode="teacher" />}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            Local class summary
          </h3>
          <p className="text-xs text-zinc-500">
            Use the summary for teacher reflection and pilot evidence. It stays
            local on this device unless you deliberately export it.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-zinc-500">Learners</p>
              <p className="text-lg font-semibold text-zinc-100">
                {analytics.totalStudents}
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-zinc-500">Lessons</p>
              <p className="text-lg font-semibold text-zinc-100">
                {analytics.totalAssignments}
              </p>
            </div>
            <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-zinc-500">Completion rate</p>
              <p className="text-lg font-semibold text-zinc-100">
                {Math.round(analytics.completionRate * 100)}%
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {analytics.assignments.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Summary cards appear after adding lessons.
              </p>
            ) : (
              analytics.assignments.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-sm font-medium text-zinc-100">
                    {entry.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {entry.completeCount} complete · {entry.inProgressCount} in
                    progress · {entry.notStartedCount} not started
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            Reset controls
          </h3>
          <p className="text-xs text-zinc-500">
            Use these controls when sharing a device, ending a pilot cycle, or
            responding to a family deletion request.
          </p>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-700"
              onClick={resetProgress}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset progress only
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-700"
              onClick={resetAnalytics}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear local class summary
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-700"
              onClick={() => {
                resetTeacherOnboarding();
                window.location.reload();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run setup wizard
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-rose-500 text-rose-300 hover:bg-rose-500/10"
              onClick={resetClassroom}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete all local school data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
