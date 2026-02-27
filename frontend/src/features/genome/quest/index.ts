export type QuestChapter = {
  id: string;
  title: string;
  objectives: string[];
  unlocks: string[];
};

export type QuestProgress = {
  chapterId: string;
  completedObjectives: string[];
  rewardIds: string[];
};

export function getAdaptiveHint(progress: QuestProgress, chapters: QuestChapter[]): string {
  const chapter = chapters.find((item) => item.id === progress.chapterId);
  if (!chapter) {
    return "Start the first chapter by exploring trait nodes in the constellation view.";
  }

  const pending = chapter.objectives.find(
    (objective) => !progress.completedObjectives.includes(objective),
  );

  return pending
    ? `Next high-value interaction: ${pending}`
    : "Great work. Claim your reward and unlock the next chapter.";
}
