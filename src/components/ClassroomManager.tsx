'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, RefreshCw, ClipboardList, ListOrdered } from 'lucide-react';
import { useEducationStore, deriveStudentDNA } from '@/lib/education';
import type { DnaMode, FocusArea } from '@/lib/education';
import { DNA_MODE_LABELS, FOCUS_AREA_LABELS } from '@/lib/education';
import { EducationQueuePanel } from '@/components/EducationQueuePanel';
import { StudentDNACard } from '@/components/StudentDNACard';

type Student = {
  id: string;
  alias: string;
  addedAt: number;
};

type Assignment = {
  id: string;
  title: string;
  focus: string;
  targetMinutes: number;
  createdAt: number;
  dnaMode?: DnaMode;
  standardsRef?: string;
};

type ProgressStatus = 'not-started' | 'in-progress' | 'complete';

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

const ROSTER_STORAGE_KEY = 'metapet-classroom-roster';
const ASSIGNMENT_STORAGE_KEY = 'metapet-classroom-assignments';
const PROGRESS_STORAGE_KEY = 'metapet-classroom-progress';
const ANALYTICS_STORAGE_KEY = 'metapet-classroom-analytics';

const DEFAULT_STATUS: ProgressStatus = 'not-started';

const sanitizeAlias = (value: string) => value.trim().slice(0, 32);
const sanitizeTitle = (value: string) => value.trim().slice(0, 60);
const sanitizeFocus = (value: string) => value.trim().slice(0, 40);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse classroom data:', error);
    return fallback;
  }
};

const createId = () => crypto.randomUUID();

export function ClassroomManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [newAlias, setNewAlias] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newFocus, setNewFocus] = useState('Mindfulness');
  const [newTargetMinutes, setNewTargetMinutes] = useState(10);
  const [newDnaMode, setNewDnaMode] = useState<DnaMode>(null);
  const [newStandardsRef, setNewStandardsRef] = useState('');
  const [showQueue, setShowQueue] = useState(false);

  const addLessonToQueue = useEducationStore((s) => s.addLesson);
  const lessonProgress = useEducationStore((s) => s.lessonProgress);
  const queue = useEducationStore((s) => s.queue);

  useEffect(() => {
    setStudents(safeParse<Student[]>(window.localStorage.getItem(ROSTER_STORAGE_KEY), []));
    setAssignments(safeParse<Assignment[]>(window.localStorage.getItem(ASSIGNMENT_STORAGE_KEY), []));
    setProgress(safeParse<ProgressMap>(window.localStorage.getItem(PROGRESS_STORAGE_KEY), {}));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    window.localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const analytics = useMemo<AggregatedAnalytics>(() => {
    const assignmentAnalytics = assignments.map(assignment => {
      const assignmentProgress = progress[assignment.id] ?? {};
      let completeCount = 0;
      let inProgressCount = 0;
      let notStartedCount = 0;
      students.forEach(student => {
        const status = assignmentProgress[student.id] ?? DEFAULT_STATUS;
        if (status === 'complete') completeCount += 1;
        if (status === 'in-progress') inProgressCount += 1;
        if (status === 'not-started') notStartedCount += 1;
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
    const totalComplete = assignmentAnalytics.reduce((sum, entry) => sum + entry.completeCount, 0);
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
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
  }, [analytics]);

  const handleAddStudent = () => {
    const alias = sanitizeAlias(newAlias);
    if (!alias) return;
    const student: Student = {
      id: createId(),
      alias,
      addedAt: Date.now(),
    };
    setStudents(prev => [...prev, student]);
    setProgress(prev => {
      const updated = { ...prev };
      assignments.forEach(assignment => {
        updated[assignment.id] = {
          ...updated[assignment.id],
          [student.id]: DEFAULT_STATUS,
        };
      });
      return updated;
    });
    setNewAlias('');
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents(prev => prev.filter(student => student.id !== studentId));
    setProgress(prev => {
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
      focus: sanitizeFocus(newFocus) || 'Mindfulness',
      targetMinutes: Math.max(1, Number(newTargetMinutes) || 1),
      createdAt: Date.now(),
      dnaMode: newDnaMode,
      standardsRef: newStandardsRef.trim() || undefined,
    };
    setAssignments(prev => [...prev, assignment]);
    setProgress(prev => {
      const updated = { ...prev };
      updated[assignment.id] = students.reduce<Record<string, ProgressStatus>>((acc, student) => {
        acc[student.id] = DEFAULT_STATUS;
        return acc;
      }, {});
      return updated;
    });
    setNewTitle('');
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
    setProgress(prev => {
      const { [assignmentId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const updateStatus = (assignmentId: string, studentId: string, status: ProgressStatus) => {
    setProgress(prev => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [studentId]: status,
      },
    }));
  };

  const resetProgress = () => {
    if (!window.confirm('Reset all classroom progress?')) return;
    setProgress(prev => {
      const updated: ProgressMap = {};
      Object.keys(prev).forEach(assignmentId => {
        updated[assignmentId] = students.reduce<Record<string, ProgressStatus>>((acc, student) => {
          acc[student.id] = DEFAULT_STATUS;
          return acc;
        }, {});
      });
      return updated;
    });
  };

  const resetClassroom = () => {
    if (!window.confirm('Clear the roster, assignments, and progress?')) return;
    setStudents([]);
    setAssignments([]);
    setProgress({});
  };

  const resetAnalytics = () => {
    if (!window.confirm('Clear aggregated analytics?')) return;
    window.localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <ClipboardList className="h-4 w-4 text-cyan-300" />
            Class roster
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-zinc-500" htmlFor="classroom-alias">
              Learner alias
            </label>
            <div className="flex gap-2">
              <input
                id="classroom-alias"
                value={newAlias}
                onChange={event => setNewAlias(event.target.value)}
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
              Use classroom-friendly aliases only (no full names or student IDs).
            </p>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-xs text-zinc-500">No learners yet. Add aliases to build the roster.</p>
            ) : (
              students.map(student => {
                const studentProgress = lessonProgress.filter(p => p.studentAlias === student.alias);
                const dnaModes: Record<string, DnaMode> = {};
                for (const lesson of queue) {
                  dnaModes[lesson.id] = lesson.dnaMode;
                }
                const dnaProfile = studentProgress.length > 0
                  ? deriveStudentDNA(student.alias, studentProgress, dnaModes)
                  : null;
                return (
                  <div
                    key={student.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-100">{student.alias}</p>
                        <p className="text-[11px] text-zinc-500">Joined {new Date(student.addedAt).toLocaleDateString()}</p>
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
                    {dnaProfile && <StudentDNACard profile={dnaProfile} compact />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <ClipboardList className="h-4 w-4 text-emerald-300" />
            Activity assignments
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-zinc-500" htmlFor="classroom-assignment">
              Activity title
            </label>
            <input
              id="classroom-assignment"
              value={newTitle}
              onChange={event => setNewTitle(event.target.value)}
              placeholder="e.g., 5-minute breathing ritual"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500" htmlFor="classroom-focus">
                  Focus area
                </label>
                <input
                  id="classroom-focus"
                  value={newFocus}
                  onChange={event => setNewFocus(event.target.value)}
                  placeholder="Mindfulness"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500" htmlFor="classroom-minutes">
                  Target minutes
                </label>
                <input
                  id="classroom-minutes"
                  type="number"
                  min={1}
                  value={newTargetMinutes}
                  onChange={event => setNewTargetMinutes(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500" htmlFor="classroom-dna-mode">
                  DNA mode
                </label>
                <select
                  id="classroom-dna-mode"
                  value={newDnaMode ?? ''}
                  onChange={event => setNewDnaMode(event.target.value === '' ? null : event.target.value as DnaMode)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">None</option>
                  {(Object.entries(DNA_MODE_LABELS) as [string, string][]).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500" htmlFor="classroom-standards">
                  Standards (opt.)
                </label>
                <input
                  id="classroom-standards"
                  value={newStandardsRef}
                  onChange={event => setNewStandardsRef(event.target.value)}
                  placeholder="e.g., NGSS:MS-ETS1-1"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddAssignment}
              className="w-full h-10 bg-emerald-500/90 hover:bg-emerald-500 text-slate-950"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add assignment
            </Button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {assignments.length === 0 ? (
              <p className="text-xs text-zinc-500">Assignments appear here once created.</p>
            ) : (
              assignments.map(assignment => {
                const inQueue = queue.some(l => l.title === assignment.title);
                return (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-100">{assignment.title}</p>
                        <p className="text-xs text-zinc-500">
                          {assignment.focus} · {assignment.targetMinutes} min
                          {assignment.dnaMode && ` · ${DNA_MODE_LABELS[assignment.dnaMode]}`}
                        </p>
                        {assignment.standardsRef && (
                          <p className="text-[10px] text-emerald-400/70 mt-0.5">{assignment.standardsRef}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className={`h-8 px-2 text-xs ${inQueue ? 'text-emerald-400' : 'text-cyan-400 hover:bg-cyan-500/10'}`}
                          onClick={() => {
                            if (!inQueue) {
                              const focusMap: Record<string, FocusArea> = {
                                Mindfulness: 'reflection',
                                'Pattern Recognition': 'pattern-recognition',
                                'Sound Exploration': 'sound-exploration',
                                Collaboration: 'collaboration',
                              };
                              addLessonToQueue({
                                title: assignment.title,
                                description: `${assignment.focus} activity`,
                                focusArea: focusMap[assignment.focus] ?? 'reflection',
                                dnaMode: assignment.dnaMode ?? null,
                                targetMinutes: assignment.targetMinutes,
                                standardsRef: assignment.standardsRef ? [assignment.standardsRef] : [],
                                prePrompt: null,
                                postPrompt: null,
                              });
                            }
                          }}
                          disabled={inQueue}
                          aria-label={inQueue ? 'Already in queue' : 'Add to queue'}
                        >
                          <ListOrdered className="h-3.5 w-3.5 mr-1" />
                          {inQueue ? 'Queued' : 'Queue'}
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
            <h3 className="text-sm font-semibold text-zinc-200">Progress tracking</h3>
            <p className="text-xs text-zinc-500">Track progress without storing personal identifiers.</p>
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
          <p className="text-xs text-zinc-500">Create assignments to start tracking progress.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{assignment.title}</p>
                    <p className="text-xs text-zinc-500">
                      {assignment.focus} · {assignment.targetMinutes} min
                    </p>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {analytics.assignments.find(item => item.id === assignment.id)?.completeCount ?? 0} / {students.length} complete
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {students.length === 0 ? (
                    <p className="text-xs text-zinc-500">Add learners to capture progress.</p>
                  ) : (
                    students.map(student => (
                      <div key={student.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-zinc-200">{student.alias}</span>
                        <select
                          value={progress[assignment.id]?.[student.id] ?? DEFAULT_STATUS}
                          onChange={event => updateStatus(assignment.id, student.id, event.target.value as ProgressStatus)}
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
            {showQueue ? 'Hide' : 'Show'} Queue ({queue.length})
          </Button>
        </div>
        {showQueue && <EducationQueuePanel mode="teacher" />}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">Aggregated analytics</h3>
          <p className="text-xs text-zinc-500">
            Analytics are stored as anonymized totals (no names or IDs).
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-zinc-500">Learners</p>
              <p className="text-lg font-semibold text-zinc-100">{analytics.totalStudents}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-zinc-500">Assignments</p>
              <p className="text-lg font-semibold text-zinc-100">{analytics.totalAssignments}</p>
            </div>
            <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-zinc-500">Completion rate</p>
              <p className="text-lg font-semibold text-zinc-100">{Math.round(analytics.completionRate * 100)}%</p>
            </div>
          </div>
          <div className="space-y-2">
            {analytics.assignments.length === 0 ? (
              <p className="text-xs text-zinc-500">Analytics will appear after adding assignments.</p>
            ) : (
              analytics.assignments.map(entry => (
                <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-sm font-medium text-zinc-100">{entry.title}</p>
                  <p className="text-xs text-zinc-500">
                    {entry.completeCount} complete · {entry.inProgressCount} in progress · {entry.notStartedCount} not started
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">Reset controls</h3>
          <p className="text-xs text-zinc-500">
            Reset data locally if you are sharing a device or closing out a term.
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
              Clear aggregated analytics
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-rose-500 text-rose-300 hover:bg-rose-500/10"
              onClick={resetClassroom}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset classroom data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
