export type QuestState = {
  userId: string;
  currentChapterId: string;
  completedObjectiveIds: string[];
  rewardIds: string[];
};

const questStore = new Map<string, QuestState>();

export function resumeQuest(userId: string): QuestState {
  return (
    questStore.get(userId) ?? {
      userId,
      currentChapterId: "behavior-basics",
      completedObjectiveIds: [],
      rewardIds: [],
    }
  );
}

export function updateQuestProgress(
  userId: string,
  patch: Partial<Omit<QuestState, "userId">>,
): QuestState {
  const current = resumeQuest(userId);
  const next: QuestState = {
    ...current,
    ...patch,
    userId,
  };
  questStore.set(userId, next);
  return next;
}

export function getQuestRewards(userId: string): string[] {
  return resumeQuest(userId).rewardIds;
}
