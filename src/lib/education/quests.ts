import type {
  DnaMode,
  FocusArea,
  LessonProgress,
  LessonQuestSummary,
  QueuedLesson,
  QuestMode,
  QuestPackId,
} from "./types";

type QuestKind = "core" | "bonus";

type QuestMetric =
  | "visited-modes"
  | "session-interactions"
  | "play-count"
  | "mode-interactions"
  | "mandala-strokes"
  | "mandala-harmony-changes"
  | "triangle-trace-steps"
  | "triangle-visited-sides"
  | "triangle-playback"
  | "sound-playback"
  | "sound-tempo-changes"
  | "sound-transform-changes"
  | "reflection";

export interface QuestDefinition {
  id: string;
  kind: QuestKind;
  title: string;
  description: string;
  target: number;
  metric: QuestMetric;
  mode?: QuestMode;
}

export interface QuestPack {
  id: QuestPackId;
  name: string;
  description: string;
  requiredCoreQuests: number;
  quests: QuestDefinition[];
}

export interface QuestSessionSignals {
  activeMode: QuestMode;
  visitedModes: QuestMode[];
  sessionInteractions: number;
  playCount: number;
  modeInteractions: Record<QuestMode, number>;
  mandalaStrokeCount: number;
  mandalaHarmonyChangeCount: number;
  triangleTraceSteps: number;
  triangleVisitedSides: number;
  trianglePlaybackCount: number;
  soundPlaybackCount: number;
  soundTempoChangeCount: number;
  soundTransformChangeCount: number;
  reflectionSubmitted: boolean;
}

export interface QuestProgressItem extends QuestDefinition {
  current: number;
  complete: boolean;
}

export interface QuestPackProgress {
  pack: QuestPack;
  quests: QuestProgressItem[];
  completedQuestIds: string[];
  completedCoreQuests: number;
  requiredCoreQuests: number;
  totalCompletedQuests: number;
  readyToComplete: boolean;
  remainingCoreQuestTitles: string[];
}

export interface LessonCompletionRequirements {
  ready: boolean;
  missingRequirements: string[];
}

export const QUEST_PACKS: Record<QuestPackId, QuestPack> = {
  "pattern-basics": {
    id: "pattern-basics",
    name: "Pattern Basics",
    description: "Warm up with quick wins across the main learning modes.",
    requiredCoreQuests: 2,
    quests: [
      {
        id: "pattern-basics-modes",
        kind: "core",
        title: "Explore 3 modes",
        description: "Visit three different discovery modes in this session.",
        target: 3,
        metric: "visited-modes",
      },
      {
        id: "pattern-basics-touches",
        kind: "core",
        title: "Make 20 touches",
        description: "Interact with the hub twenty times to build familiarity.",
        target: 20,
        metric: "session-interactions",
      },
      {
        id: "pattern-basics-melody",
        kind: "core",
        title: "Play a DNA melody",
        description: "Trigger at least one full melody or phrase.",
        target: 1,
        metric: "play-count",
      },
      {
        id: "pattern-basics-reflection",
        kind: "bonus",
        title: "Add a reflection",
        description: "Finish with a short reflection when prompted.",
        target: 1,
        metric: "reflection",
      },
    ],
  },
  "symmetry-studio": {
    id: "symmetry-studio",
    name: "Symmetry Studio",
    description: "Use the mandala canvas to build mirrored patterns with intent.",
    requiredCoreQuests: 2,
    quests: [
      {
        id: "symmetry-studio-strokes",
        kind: "core",
        title: "Paint 2 mirrored strokes",
        description: "Complete two drawing strokes in Symmetry Studio.",
        target: 2,
        metric: "mandala-strokes",
        mode: "mandala",
      },
      {
        id: "symmetry-studio-harmony",
        kind: "core",
        title: "Change harmony once",
        description: "Adjust harmony while working inside Symmetry Studio.",
        target: 1,
        metric: "mandala-harmony-changes",
        mode: "mandala",
      },
      {
        id: "symmetry-studio-touches",
        kind: "core",
        title: "Make 12 symmetry touches",
        description: "Stay in Symmetry Studio and build up twelve interactions.",
        target: 12,
        metric: "mode-interactions",
        mode: "mandala",
      },
      {
        id: "symmetry-studio-reflection",
        kind: "bonus",
        title: "Describe the pattern",
        description: "Add one reflection after the symmetry work is done.",
        target: 1,
        metric: "reflection",
      },
    ],
  },
  "triangle-trace": {
    id: "triangle-trace",
    name: "Triangle Trace",
    description: "Trace the perimeter, cross sides, and turn the path into sound.",
    requiredCoreQuests: 2,
    quests: [
      {
        id: "triangle-trace-steps",
        kind: "core",
        title: "Trace 10 perimeter steps",
        description: "Capture at least ten points on the triangle edge.",
        target: 10,
        metric: "triangle-trace-steps",
        mode: "triangle",
      },
      {
        id: "triangle-trace-sides",
        kind: "core",
        title: "Cross 2 sides",
        description: "Touch two distinct triangle sides during the trace.",
        target: 2,
        metric: "triangle-visited-sides",
        mode: "triangle",
      },
      {
        id: "triangle-trace-playback",
        kind: "core",
        title: "Play traced notes",
        description: "Play back a traced phrase from the triangle panel.",
        target: 1,
        metric: "triangle-playback",
        mode: "triangle",
      },
      {
        id: "triangle-trace-reflection",
        kind: "bonus",
        title: "Reflect on the path",
        description: "Add a short note after tracing and playback.",
        target: 1,
        metric: "reflection",
      },
    ],
  },
  "sound-path": {
    id: "sound-path",
    name: "Sound Path",
    description: "Experiment in Sound Lab by tapping, tuning, and reshaping phrases.",
    requiredCoreQuests: 2,
    quests: [
      {
        id: "sound-path-playback",
        kind: "core",
        title: "Play 5 sounds",
        description: "Trigger five sounds while you are inside Sound Lab.",
        target: 5,
        metric: "sound-playback",
        mode: "sound",
      },
      {
        id: "sound-path-tempo",
        kind: "core",
        title: "Change tempo once",
        description: "Adjust the tempo while working in Sound Lab.",
        target: 1,
        metric: "sound-tempo-changes",
        mode: "sound",
      },
      {
        id: "sound-path-transform",
        kind: "core",
        title: "Switch transform once",
        description: "Change the phrase transform from raw, reverse, or orbit.",
        target: 1,
        metric: "sound-transform-changes",
        mode: "sound",
      },
      {
        id: "sound-path-reflection",
        kind: "bonus",
        title: "Name the phrase",
        description: "Leave one reflection about how the phrase changed.",
        target: 1,
        metric: "reflection",
      },
    ],
  },
};

export const QUEST_PACK_ORDER: QuestPackId[] = [
  "pattern-basics",
  "symmetry-studio",
  "triangle-trace",
  "sound-path",
];

export function createEmptyQuestModeCounts(): Record<QuestMode, number> {
  return {
    spiral: 0,
    mandala: 0,
    triangle: 0,
    sound: 0,
    journey: 0,
  };
}

export function normalizeLessonDnaMode(mode: DnaMode): QuestMode | null {
  if (mode === null) return null;
  if (mode === "particles") return "triangle";
  return mode;
}

export function getQuestPackById(packId: QuestPackId): QuestPack {
  return QUEST_PACKS[packId];
}

export function getQuestPackLabel(packId: QuestPackId): string {
  return QUEST_PACKS[packId].name;
}

export function selectQuestPack(input: {
  focusArea: FocusArea;
  dnaMode: DnaMode;
}): QuestPack {
  const normalizedMode = normalizeLessonDnaMode(input.dnaMode);

  if (normalizedMode === "mandala") {
    return QUEST_PACKS["symmetry-studio"];
  }

  if (normalizedMode === "triangle") {
    return QUEST_PACKS["triangle-trace"];
  }

  if (normalizedMode === "sound") {
    return QUEST_PACKS["sound-path"];
  }

  if (normalizedMode === "spiral" || normalizedMode === "journey") {
    return QUEST_PACKS["pattern-basics"];
  }

  if (input.focusArea === "geometry-creation") {
    return QUEST_PACKS["symmetry-studio"];
  }

  if (input.focusArea === "sound-exploration") {
    return QUEST_PACKS["sound-path"];
  }

  if (input.focusArea === "pattern-recognition") {
    return QUEST_PACKS["pattern-basics"];
  }

  return QUEST_PACKS["pattern-basics"];
}

function getQuestMetricValue(
  quest: QuestDefinition,
  signals: QuestSessionSignals,
): number {
  switch (quest.metric) {
    case "visited-modes":
      return signals.visitedModes.length;
    case "session-interactions":
      return signals.sessionInteractions;
    case "play-count":
      return signals.playCount;
    case "mode-interactions":
      return quest.mode ? signals.modeInteractions[quest.mode] ?? 0 : 0;
    case "mandala-strokes":
      return signals.mandalaStrokeCount;
    case "mandala-harmony-changes":
      return signals.mandalaHarmonyChangeCount;
    case "triangle-trace-steps":
      return signals.triangleTraceSteps;
    case "triangle-visited-sides":
      return signals.triangleVisitedSides;
    case "triangle-playback":
      return signals.trianglePlaybackCount;
    case "sound-playback":
      return signals.soundPlaybackCount;
    case "sound-tempo-changes":
      return signals.soundTempoChangeCount;
    case "sound-transform-changes":
      return signals.soundTransformChangeCount;
    case "reflection":
      return signals.reflectionSubmitted ? 1 : 0;
    default:
      return 0;
  }
}

export function evaluateQuestPack(
  pack: QuestPack,
  signals: QuestSessionSignals,
  persistedCompletedQuestIds: string[] = [],
): QuestPackProgress {
  const completedQuestIdSet = new Set(persistedCompletedQuestIds);
  const quests = pack.quests.map((quest) => {
    const current = getQuestMetricValue(quest, signals);
    const complete = current >= quest.target || completedQuestIdSet.has(quest.id);

    if (complete) {
      completedQuestIdSet.add(quest.id);
    }

    return {
      ...quest,
      current: complete ? quest.target : Math.min(current, quest.target),
      complete,
    };
  });

  const completedQuestIds = quests
    .filter((quest) => quest.complete)
    .map((quest) => quest.id);
  const completedCoreQuests = quests.filter(
    (quest) => quest.kind === "core" && quest.complete,
  ).length;
  const remainingCoreQuestTitles = quests
    .filter((quest) => quest.kind === "core" && !quest.complete)
    .map((quest) => quest.title);

  return {
    pack,
    quests,
    completedQuestIds,
    completedCoreQuests,
    requiredCoreQuests: pack.requiredCoreQuests,
    totalCompletedQuests: completedQuestIds.length,
    readyToComplete: completedCoreQuests >= pack.requiredCoreQuests,
    remainingCoreQuestTitles,
  };
}

export function buildLessonQuestSummary(
  progress: QuestPackProgress,
): LessonQuestSummary {
  return {
    packId: progress.pack.id,
    completedQuestIds: progress.completedQuestIds,
    requiredCoreQuests: progress.requiredCoreQuests,
    completedCoreQuests: progress.completedCoreQuests,
    totalCompletedQuests: progress.totalCompletedQuests,
    updatedAt: Date.now(),
  };
}

export function lessonNeedsQuestBoard(lesson: QueuedLesson | undefined): boolean {
  return Boolean(lesson?.dnaMode);
}

export function getLessonCompletionRequirements(
  lesson: QueuedLesson | undefined,
  progress: LessonProgress | undefined,
): LessonCompletionRequirements {
  if (!lesson || !lessonNeedsQuestBoard(lesson)) {
    return { ready: true, missingRequirements: [] };
  }

  const missingRequirements: string[] = [];
  const summary = progress?.questSummary;

  if (
    !summary ||
    summary.completedCoreQuests < summary.requiredCoreQuests ||
    summary.requiredCoreQuests === 0
  ) {
    missingRequirements.push("Complete 2 core quests on the Pattern Quest Board.");
  }

  if (lesson.postPrompt && !progress?.postResponse?.trim()) {
    missingRequirements.push("Submit the lesson reflection.");
  }

  return {
    ready: missingRequirements.length === 0,
    missingRequirements,
  };
}
