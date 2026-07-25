/**
 * Meta-Pet Teacher Lesson System — shared types (Pass 1 foundation).
 *
 * These types describe the reusable, configuration-driven lesson architecture
 * that later passes will wire into the real Meta-Pet systems (Body Forge, DNA
 * Lab, vitals, emotions, advanced visualisations).
 *
 * Design goals for Pass 1:
 * - One shared Lesson Runner is driven entirely by {@link LessonDefinition}
 *   data, never by hard-coded per-lesson pages.
 * - Presentation, lesson content, app integration and progress state stay
 *   cleanly separated so future passes can add real activities without
 *   rewriting the Runner.
 * - Everything is local-first and account-free, matching the existing
 *   Meta-Pet / MetaPet Schools privacy contract.
 */

// Type-only import (no runtime cycle) so a progress record can hold typed
// Pass 2 evidence while evidence.ts continues to import shared types from here.
import type { LessonEvidence } from "./evidence";

/** Stable identifier for each of the seven lessons. */
export type LessonId =
  | "meet-your-metapet"
  | "build-a-body"
  | "dna-differences"
  | "needs-and-consequences"
  | "feelings-without-words"
  | "patterns-behind-the-pet"
  | "responsible-creator";

/** Lifecycle status of a lesson as shown on the Teacher Hub. */
export type LessonCardStatus =
  | "not-started"
  | "in-progress"
  | "paused"
  | "completed";

/** Which audience a rendered lesson surface is intended for. */
export type LessonViewMode = "teacher" | "student";

/**
 * The kind of Meta-Pet system a lesson eventually opens. In Pass 1 these are
 * used only for labelling and preview copy; later passes map them to the real
 * routes/components. Kept as string-literal union so it is extendable.
 */
export type LessonAppDestination =
  | "meet"
  | "body-forge"
  | "dna-lab"
  | "vitals"
  | "emotions"
  | "visualisation"
  | "challenge";

/** High-level shape of the student interaction inside a lesson. */
export type LessonActivityType =
  | "observe"
  | "build"
  | "compare"
  | "care"
  | "interpret"
  | "predict"
  | "create";

/**
 * The seven-stage classroom investigation rhythm every lesson moves through
 * (Field Mode Lesson Upgrade). Every lesson — at every duration depth — uses
 * these same seven stages so the shared Lesson Runner, Guide Bar and Teacher
 * Panel can drive all of them without per-lesson branching:
 *
 *   Notice   → look at the system before anything changes.
 *   Predict  → choose or describe what you think will happen.
 *   Act      → make one meaningful choice, change one variable, or do an
 *              offline activity.
 *   Observe  → the system (MetaPet or classroom result) visibly responds.
 *   Explain  → identify the cause-and-effect relationship.
 *   Create   → draw, write, build, arrange, demonstrate or design something.
 *   Reflect  → answer one short reflection question.
 */
export type LessonStepKind =
  | "notice"
  | "predict"
  | "act"
  | "observe"
  | "explain"
  | "create"
  | "reflect";

/** The type of evidence a lesson will eventually capture (placeholder only). */
export type LessonEvidenceType =
  | "pet-observation-card"
  | "body-design-comparison"
  | "dna-comparison"
  | "cause-effect-chain"
  | "emotion-reflection"
  | "visualisation-selection"
  | "responsible-creator-promise";

/**
 * Optional feature flags a lesson may require before its real activity can run.
 * Pass 1 never blocks on these; they are declared so the Runner and later
 * passes can gate real systems gracefully.
 */
export type LessonFeatureFlag =
  | "body-forge"
  | "dna-lab"
  | "vitals"
  | "emotions"
  | "advanced-visualisation";

/** A single guided step within a lesson. */
export interface LessonStepDefinition {
  /** Stable id, unique within the lesson. */
  id: string;
  /** 1-based display order. */
  order: number;
  /** Canonical phase this step represents. */
  kind: LessonStepKind;
  /** Short heading for the step. */
  title: string;
  /** What the teacher should say / do (Teacher Prompt). */
  teacherPrompt: string;
  /** What students should do (Student Task). */
  studentTask: string;
  /** Plain-language "What do I do now?" explanation for recovery. */
  whatDoINow: string;
  /** Preview-friendly description of the expected outcome of this step. */
  expectedOutcome: string;
}

/** Teacher-facing preview content, understandable in ~5 minutes. */
export interface LessonPreviewContent {
  /** The lesson's main learning idea, one or two sentences. */
  mainIdea: string;
  /** The major interaction students will do. */
  majorInteraction: string;
  /** The expected student outcome. */
  expectedOutcome: string;
  /** What resetting the lesson does. */
  resetBehaviour: string;
  /** A short preview of the completion screen message. */
  completionPreview: string;
}

/**
 * The full configuration for one lesson. The Lesson Runner renders entirely
 * from this object; no lesson has bespoke page code.
 */
export interface LessonDefinition {
  id: LessonId;
  /** 1-based lesson number shown in ordering. */
  number: number;
  /** URL slug used for deep links (matches {@link LessonId} for Pass 1). */
  slug: string;
  title: string;
  shortDescription: string;
  /** Suggested duration in minutes. */
  durationMinutes: number;
  /** Suggested learning areas (curriculum-friendly labels). */
  learningAreas: string[];
  /** The single learning intention for the lesson. */
  learningIntention: string;
  /** Observable success criteria. */
  successCriteria: string[];
  /** Teacher-facing framing shown before the lesson begins. */
  teacherIntroduction: string;
  /** Overview script the teacher can read aloud to open the lesson. */
  teacherScript: string;
  /** Overview instructions for students. */
  studentInstructions: string;
  /** Whole-class discussion prompts. */
  discussionPrompts: string[];
  /** The single big idea this lesson teaches, shown as "Key concept". */
  keyConcept: string;
  /**
   * Materials needed before the lesson (kept short and classroom-realistic).
   * Empty array means "no materials beyond a shared screen".
   */
  materials: string[];
  /** What a teacher should set up before the lesson starts. */
  preparation: string;
  /**
   * A short off-screen / physical classroom activity for the Act or Create
   * stage. Always usable at Quick Spark depth; expanded at Deep Dive via
   * {@link LessonDefinition.deepDiveActivity}.
   */
  physicalActivity: string;
  /**
   * The collaborative, physical or creative extension unlocked at Deep Dive
   * (40-minute) depth. Clearly optional at Quick Spark / Core Lesson depth.
   */
  deepDiveActivity: string;
  /** Safety or wellbeing notes for this lesson, if any (kept empty otherwise). */
  safetyNotes: string;
  /** Which Meta-Pet system the lesson opens (placeholder in Pass 1). */
  appDestination: LessonAppDestination;
  activityType: LessonActivityType;
  /** Ordered step list (five for every Pass 1 lesson). */
  steps: LessonStepDefinition[];
  evidenceType: LessonEvidenceType;
  /** Message shown on the completion screen. */
  completionMessage: string;
  /** Optional extension activity for fast finishers. */
  extensionActivity: string;
  /** Optional support activity for students who need scaffolding. */
  supportActivity: string;
  preview: LessonPreviewContent;
  /** Feature flags the real (later-pass) activity requires. */
  requiredFeatureFlags: LessonFeatureFlag[];
  /** Whether the lesson uses a shared demonstration pet. */
  usesDemonstrationPet: boolean;
  /** Whether the lesson uses the student's own real pet. */
  usesStudentRealPet: boolean;
  /** Whether changes made during the lesson should persist afterwards. */
  persistChanges: boolean;
  /** Whether the activity should reset when the lesson completes. */
  resetAtCompletion: boolean;
}

// ==================== PROGRESS STATE ====================

/** Persisted free-text evidence placeholder keyed by step id (Pass 1). */
export type LessonEvidenceMap = Record<string, string>;

/**
 * Presentation depth a lesson is running at. Support/extension reuse the same
 * lesson definition — they never fork the lesson into a separate implementation.
 */
export type LessonPresentationMode = "support" | "standard" | "extension";

/** Progress record for a single lesson. */
export interface LessonProgressRecord {
  lessonId: LessonId;
  /** Zero-based index of the current step. */
  currentStep: number;
  /** Zero-based indices of completed steps. */
  completedSteps: number[];
  /** Whether the whole lesson has been completed. */
  completed: boolean;
  /** Whether the lesson is currently paused. */
  paused: boolean;
  /** Epoch ms when the lesson was first started, or null. */
  startedAt: number | null;
  /** Epoch ms of the last interaction. */
  lastActiveAt: number | null;
  /** Epoch ms when the lesson was completed, or null. */
  completedAt: number | null;
  /** Legacy free-text evidence placeholders keyed by step id (Pass 1). */
  evidence: LessonEvidenceMap;
  /** Typed lesson evidence keyed by step id (Pass 2). */
  evidenceEntries: Record<string, LessonEvidence>;
}

/** Top-level persisted lesson-progress state. */
export interface LessonProgressState {
  /** Schema version for safe migration. */
  version: number;
  /** The lesson currently open in the Runner, or null when in the Hub. */
  currentLessonId: LessonId | null;
  /** Per-lesson progress records keyed by lesson id. */
  records: Partial<Record<LessonId, LessonProgressRecord>>;
  /** Whether the teacher or student view is active. */
  viewMode: LessonViewMode;
  /** Whether Classroom Focus Mode is currently active. */
  focusMode: boolean;
  /** Presentation depth (support / standard / extension). */
  presentationMode: LessonPresentationMode;
  /** Selected timing mode id (demo / standard / extended). */
  timingMode: string;
  /** Low Performance Mode: static/low-quality visuals for older devices. */
  lowPerformance: boolean;
}

/** Overall progress summary across all seven lessons. */
export interface LessonProgressSummary {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  completionRatio: number;
  /** The lesson a teacher would most naturally resume, if any. */
  resumeLessonId: LessonId | null;
}
