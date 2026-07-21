"use client";

import Link from "next/link";
import { Lightbulb, MousePointerClick, RefreshCw, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildLessonPath, type LessonDefinition } from "@/lib/teacher-lessons";
import { LessonModal } from "./LessonModal";

interface LessonPreviewProps {
  lesson: LessonDefinition | null;
  open: boolean;
  onClose: () => void;
}

function PreviewRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Lightbulb;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-200"
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
          {label}
        </p>
        <p className="text-sm leading-6 text-slate-200">{children}</p>
      </div>
    </div>
  );
}

/**
 * A ~5-minute teacher preview of a lesson. Preview mode is read-only: it never
 * changes student or pet progress. It links into the real lesson in preview
 * mode so a teacher can walk the steps without recording completion.
 */
export function LessonPreview({ lesson, open, onClose }: LessonPreviewProps) {
  if (!lesson) return null;

  return (
    <LessonModal
      open={open}
      onClose={onClose}
      title={`Preview — ${lesson.title}`}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="flex-1 bg-amber-300 text-slate-950 hover:bg-amber-200"
          >
            <Link href={buildLessonPath(lesson.slug, { preview: true })}>
              Walk Through in Preview
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="rounded-2xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 text-xs text-slate-300">
          Preview is read-only. Nothing you do here changes student progress or
          the pet. Lesson {lesson.number} · {lesson.durationMinutes} min.
        </p>
        <PreviewRow icon={Lightbulb} label="Main learning idea">
          {lesson.preview.mainIdea}
        </PreviewRow>
        <PreviewRow icon={MousePointerClick} label="Major interaction">
          {lesson.preview.majorInteraction}
        </PreviewRow>
        <PreviewRow icon={Target} label="Expected student outcome">
          {lesson.preview.expectedOutcome}
        </PreviewRow>
        <PreviewRow icon={RefreshCw} label="Reset behaviour">
          {lesson.preview.resetBehaviour}
        </PreviewRow>
        <PreviewRow icon={Sparkles} label="Completion screen">
          {lesson.preview.completionPreview}
        </PreviewRow>
      </div>
    </LessonModal>
  );
}
