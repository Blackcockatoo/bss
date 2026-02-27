export type QuestInteraction = "open_node" | "run_lasso" | "sonify_compare" | "save_scenario";

export type QuestObjective = {
  id: string;
  description: string;
  requiredInteraction: QuestInteraction;
  minCount?: number;
  adaptiveHint?: string;
};

export type QuestChapter = {
  id: string;
  title: string;
  objectives: QuestObjective[];
  unlocks: string[];
  optionalMode: boolean;
};

export type QuestProgress = {
  chapterId: string;
  completedObjectives: string[];
  rewardIds: string[];
  interactionCounts: Partial<Record<QuestInteraction, number>>;
};

export function getAdaptiveHint(progress: QuestProgress, chapters: QuestChapter[]): string {
  const chapter = chapters.find((item) => item.id === progress.chapterId);
  if (!chapter) {
    return "Quest mode is optional. Start by opening a trait node when you want guided exploration.";
  }

  if (!chapter.optionalMode) {
    return "Guided mode is currently disabled for this chapter.";
  }

  const pending = chapter.objectives.find((objective) => !progress.completedObjectives.includes(objective.id));

  if (!pending) {
    return "Great work. Claim your reward and unlock the next chapter.";
  }

  const interactionCount = progress.interactionCounts[pending.requiredInteraction] ?? 0;
  const required = pending.minCount ?? 1;

  if (interactionCount < required) {
    const remaining = required - interactionCount;
    return pending.adaptiveHint ?? `Next high-value interaction: ${pending.description} (${remaining} remaining).`;
  }

  return `Next high-value interaction: ${pending.description}`;
}
