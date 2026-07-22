"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Home, Printer } from "lucide-react";

import { PetBodyRenderer, type BodySpec } from "@/components/body-forge/PetBodyRenderer";
import { Button } from "@/components/ui/button";
import { loadForgedBody } from "@/visual-dna/bodyForgeAdapter";
import { useStore } from "@/lib/store";
import {
  DEMO_PET_CONFIG,
  TEACHER_HUB_PATH,
  deriveLearningPassport,
  passportHasContent,
  usePetProfileHydrated,
  usePetProfileStore,
  useLessonProgressHydrated,
  useLessonProgressStore,
  type LearningPassport as LearningPassportModel,
  type LessonEvidence,
  type PassportLessonSection,
} from "@/lib/teacher-lessons";
import { configToBodySpec } from "./activities/petSpec";

function Placeholder({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-slate-500">{children}</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-slate-200">
      <span className="font-medium text-slate-100">{label}:</span>{" "}
      {value.trim() ? value : <span className="italic text-slate-500">Not recorded</span>}
    </p>
  );
}

/** Render the structured evidence for one lesson section. */
function EvidenceView({ evidence }: { evidence: LessonEvidence }) {
  switch (evidence.kind) {
    case "pet-observation-card":
      return (
        <div className="space-y-1">
          <Field label="Alias" value={evidence.alias} />
          <Field
            label="Observations"
            value={[
              evidence.observations.shape,
              evidence.observations.surface,
              evidence.observations.movement,
            ]
              .filter(Boolean)
              .join(", ")}
          />
          <Field label="Question" value={evidence.question} />
        </div>
      );
    case "body-design-comparison":
      return (
        <div className="space-y-1">
          <Field
            label="Chosen features"
            value={`${evidence.chosenFeatures.shape} shape, ${evidence.chosenFeatures.face} face, ${evidence.chosenFeatures.movement} movement, ${evidence.chosenFeatures.surface} surface`}
          />
          <Field label="Design reasoning" value={evidence.reason} />
          <Field
            label="Applied to pet"
            value={evidence.appliedChange?.appliedToPet ? "Yes" : "No"}
          />
        </div>
      );
    case "dna-comparison":
      return (
        <div className="space-y-1">
          <Field label="Prediction" value={evidence.predicted} />
          <Field label="Visible result" value={evidence.observed} />
          <Field label="Stayed the same" value={evidence.stayedSame} />
          <Field
            label="Kept variation"
            value={evidence.keptVariation ? "Yes" : "No"}
          />
        </div>
      );
    case "cause-effect-chain":
      return (
        <div className="space-y-1">
          <Field label="Action" value={evidence.action} />
          <Field label="Immediate effect" value={evidence.immediateEffect} />
          <Field label="Secondary effect" value={evidence.secondaryEffect} />
          <Field label="Pet response" value={evidence.petResponse} />
          <Field
            label="Balancing strategy"
            value={evidence.balancingActions.join(", ")}
          />
        </div>
      );
    case "emotion-reflection":
      return (
        <div className="space-y-1">
          <Field label="Clues noticed" value={evidence.clues.join(", ")} />
          <Field label="Careful interpretation" value={evidence.interpretation} />
          <Field label="Calming action" value={evidence.helpedBy} />
          <Field
            label="Alternative explanation"
            value={evidence.alternativeExplanation}
          />
        </div>
      );
    case "visualisation-selection":
      return (
        <div className="space-y-1">
          <Field label="Selected visualisation" value={evidence.selectedMode} />
          <Field label="Pattern noticed" value={evidence.patternNoticed} />
          <Field label="Shared feature" value={evidence.sharedFeature} />
          <Field label="Reason" value={evidence.reason} />
        </div>
      );
    case "responsible-creator-promise":
      return (
        <div className="space-y-1">
          <Field
            label="Scenario choices"
            value={`${evidence.scenarioChoices.filter((c) => c.responsible).length} of ${evidence.scenarioChoices.length} responsible`}
          />
          <Field label="Creator promise" value={evidence.promise} />
        </div>
      );
    default:
      return <Placeholder>No details recorded.</Placeholder>;
  }
}

function SectionCard({ section }: { section: PassportLessonSection }) {
  return (
    <section className="passport-section space-y-2 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">
          {section.number}. {section.title}
        </h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            section.status === "completed"
              ? "border-emerald-500/40 text-emerald-200"
              : section.status === "not-started"
                ? "border-slate-600/50 text-slate-400"
                : "border-cyan-500/40 text-cyan-200"
          }`}
        >
          {section.status === "completed"
            ? "Completed"
            : section.status === "not-started"
              ? "Not started"
              : "In progress"}
        </span>
      </header>
      {section.corrupted ? (
        <Placeholder>
          This lesson&apos;s evidence couldn&apos;t be read and was skipped
          safely.
        </Placeholder>
      ) : section.hasEvidence && section.evidence ? (
        <EvidenceView evidence={section.evidence} />
      ) : section.missingEvidence ? (
        <Placeholder>
          Lesson completed, but no saved evidence for this section.
        </Placeholder>
      ) : (
        <Placeholder>Not completed yet.</Placeholder>
      )}
    </section>
  );
}

export function LearningPassport({
  hubPath = TEACHER_HUB_PATH,
  fieldMode = false,
}: {
  hubPath?: string;
  fieldMode?: boolean;
}) {
  const progressHydrated = useLessonProgressHydrated();
  const profileHydrated = usePetProfileHydrated();
  const progress = useLessonProgressStore();
  const storedAlias = usePetProfileStore((s) => s.alias);
  const realHasPet = useStore((s) => s.genome !== null);
  const alias = fieldMode ? "" : storedAlias;
  const hasPet = fieldMode ? false : realHasPet;

  const passport: LearningPassportModel = useMemo(
    () => {
      const derived = deriveLearningPassport({ progress, alias, hasPet });
      return fieldMode ? { ...derived, appliedChanges: [] } : derived;
    },
    [progress, alias, hasPet, fieldMode],
  );

  const petSpec: BodySpec = useMemo(() => {
    const forged = fieldMode ? null : loadForgedBody();
    return forged ?? configToBodySpec(DEMO_PET_CONFIG);
  }, [fieldMode]);

  const hydrated = progressHydrated && profileHydrated;
  const hasContent = passportHasContent(passport);

  const dateLabel = useMemo(() => {
    if (!passport.dateRange.first) return "No dates yet";
    const fmt = (ms: number) => new Date(ms).toLocaleDateString();
    const first = fmt(passport.dateRange.first);
    const last = passport.dateRange.last ? fmt(passport.dateRange.last) : first;
    return first === last ? first : `${first} – ${last}`;
  }, [passport.dateRange]);

  return (
    <main className="passport-root min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Controls (hidden in print) */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
          >
            <Link href={hubPath}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {fieldMode ? "Field Lessons" : "Teacher Hub"}
            </Link>
          </Button>
          <Button
            type="button"
            onClick={() => window.print()}
            disabled={!hasContent}
            className="bg-amber-300 text-slate-950 hover:bg-amber-200 disabled:opacity-50"
          >
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Print Learning Passport
          </Button>
        </div>

        {/* Cover */}
        <header className="passport-section mb-6 flex flex-col items-center gap-3 rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-center">
          <div className="h-32 w-32">
            <PetBodyRenderer spec={petSpec} animate={false} className="h-full w-full" />
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            Meta-Pet Learning Passport
          </p>
          <h1 className="text-2xl font-semibold text-white">
            {passport.alias.trim() ? passport.alias : "My Meta-Pet"}
          </h1>
          <p className="text-sm text-slate-300">
            {passport.completedLessons} of {passport.totalLessons} lessons
            complete ({passport.completionPercent}%)
          </p>
          <div
            className="h-2 w-64 max-w-full overflow-hidden rounded-full bg-slate-700/60"
            role="progressbar"
            aria-valuenow={passport.completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Journey completion"
          >
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${passport.completionPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{dateLabel}</p>
          {!hasPet ? (
            <p className="text-xs text-slate-400">
              {fieldMode
                ? "Classroom demonstration pet — no student account or consumer pet is required."
                : "No Meta-Pet yet — this passport shows a classroom example."}
            </p>
          ) : null}
        </header>

        {!hydrated ? (
          <p className="text-center text-sm text-slate-400">Loading passport…</p>
        ) : !hasContent ? (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 text-center">
            <p className="text-sm text-slate-300">
              No lessons completed yet. Start a lesson from the {fieldMode ? "Field lesson launchpad" : "Teacher Hub"} to begin building this passport.
            </p>
          </div>
        ) : null}

        {/* Applied changes summary */}
        {passport.appliedChanges.length > 0 ? (
          <section className="passport-section mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h2 className="mb-2 text-sm font-semibold text-white">
              Changes applied to the Meta-Pet
            </h2>
            <ul className="space-y-1 text-sm text-slate-200">
              {passport.appliedChanges.map((change) => (
                <li key={`${change.lessonId}-${change.updateType}`}>
                  • {change.summary}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Lesson sections */}
        <div className="space-y-4">
          {passport.sections.map((section) => (
            <SectionCard key={section.lessonId} section={section} />
          ))}
        </div>

        {/* Journey summary + closing messages (printed with the passport). */}
        <section className="passport-section mt-6 space-y-3 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
          <h2 className="text-base font-semibold text-white">
            The seven-lesson journey
          </h2>
          <p className="text-sm text-slate-300">
            This passport records a student&apos;s journey across seven guided
            Meta-Pet lessons: meeting a companion, building a body, exploring
            DNA and difference, caring for needs, reading feelings, finding
            patterns, and becoming a responsible creator.
          </p>
          <p className="text-sm text-slate-300">
            <span className="font-medium text-slate-100">For teachers:</span>{" "}
            each section shows the student&apos;s own words and choices as
            classroom evidence — observations, predictions and reflections
            {fieldMode ? "." : ", including any changes they chose to apply to their Meta-Pet."} It is a record of thinking, not a graded test.
          </p>
          <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
            <span className="font-medium">Well done, creator!</span> You met,
            built, cared for and understood your Meta-Pet — and thought about how
            to be responsible with your creations. That is real science and real
            kindness.
          </p>
          <p className="text-xs text-slate-400">
            Generated {new Date(passport.createdAt).toLocaleString()} ·
            Completion {passport.completionPercent}%
          </p>
          <p className="text-xs text-slate-500">
            Privacy: this passport uses a safe alias only and is generated on
            this device from local lesson evidence. No real student name is
            required. {fieldMode ? "Deleting lesson evidence clears only this local classroom record." : "Deleting lesson evidence does not delete the Meta-Pet."}
          </p>
        </section>

        <footer className="no-print mt-8 flex justify-center">
          <Button
            asChild
            variant="outline"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
          >
            <Link href={hubPath}>
              <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Return to {fieldMode ? "Field Lessons" : "Teacher Hub"}
            </Link>
          </Button>
        </footer>
      </div>
    </main>
  );
}
