"use client";

import { type LessonDefinition } from "@/lib/teacher-lessons";
import { LessonModal } from "./LessonModal";

interface TeacherNotesProps {
  lesson: LessonDefinition | null;
  open: boolean;
  onClose: () => void;
}

function NotesSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Teacher-only planning notes for a lesson: intention, success criteria,
 * script, discussion prompts and differentiation. Read-only reference surface.
 */
export function TeacherNotes({ lesson, open, onClose }: TeacherNotesProps) {
  if (!lesson) return null;

  return (
    <LessonModal
      open={open}
      onClose={onClose}
      title={`Teacher Notes — ${lesson.title}`}
    >
      <div className="space-y-5 text-sm text-slate-200">
        <NotesSection title="Learning intention">
          <p className="leading-6">{lesson.learningIntention}</p>
        </NotesSection>

        <NotesSection title="Success criteria">
          <ul className="list-disc space-y-1 pl-5 leading-6 text-slate-300">
            {lesson.successCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </NotesSection>

        <NotesSection title="Teacher introduction">
          <p className="leading-6 text-slate-300">
            {lesson.teacherIntroduction}
          </p>
        </NotesSection>

        <NotesSection title="Opening script">
          <p className="rounded-2xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 leading-6 text-slate-200">
            “{lesson.teacherScript}”
          </p>
        </NotesSection>

        <NotesSection title="Discussion prompts">
          <ul className="list-disc space-y-1 pl-5 leading-6 text-slate-300">
            {lesson.discussionPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </NotesSection>

        <div className="grid gap-4 sm:grid-cols-2">
          <NotesSection title="Extension">
            <p className="leading-6 text-slate-300">
              {lesson.extensionActivity}
            </p>
          </NotesSection>
          <NotesSection title="Support">
            <p className="leading-6 text-slate-300">{lesson.supportActivity}</p>
          </NotesSection>
        </div>

        <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-200/90">
          Teacher-led classroom use. Local-first, no student accounts. Progress
          remains in this browser during routine use and can be reset from the
          Teacher Hub.
        </p>
      </div>
    </LessonModal>
  );
}
