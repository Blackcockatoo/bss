import { genomeQuestChapters, type QuestInteraction } from "../../content/genomeQuest/schema";

export type QuestState = {
  userId: string;
  currentChapterId: string;
  completedObjectiveIds: string[];
  rewardIds: string[];
  interactionCounts: Record<QuestInteraction, number>;
};

const questStore = new Map<string, QuestState>();

const emptyInteractionCounts: Record<QuestInteraction, number> = {
  open_node: 0,
  run_lasso: 0,
  sonify_compare: 0,
  save_scenario: 0,
};

export function resumeQuest(userId: string): QuestState {
  return (
    questStore.get(userId) ?? {
      userId,
      currentChapterId: "behavior-basics",
      completedObjectiveIds: [],
      rewardIds: [],
      interactionCounts: { ...emptyInteractionCounts },
    }
  );
}

export function recordQuestInteraction(userId: string, interaction: QuestInteraction): QuestState {
  const current = resumeQuest(userId);
  const interactionCounts = {
    ...current.interactionCounts,
    [interaction]: (current.interactionCounts[interaction] ?? 0) + 1,
  };

  const chapter = genomeQuestChapters.find((item) => item.id === current.currentChapterId);
  const completedFromInteractions =
    chapter?.objectives
      .filter((objective) => {
        const count = interactionCounts[objective.requiredInteraction] ?? 0;
        return count >= (objective.minCount ?? 1);
      })
      .map((objective) => objective.id) ?? [];

  const completedObjectiveIds = Array.from(new Set([...current.completedObjectiveIds, ...completedFromInteractions]));
  const rewardIds = chapter && completedObjectiveIds.length === chapter.objectives.length ? chapter.rewards : current.rewardIds;

  const next: QuestState = {
    ...current,
    interactionCounts,
    completedObjectiveIds,
    rewardIds,
  };

  questStore.set(userId, next);
  return next;
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
    interactionCounts: {
      ...current.interactionCounts,
      ...patch.interactionCounts,
    },
  };
  questStore.set(userId, next);
  return next;
}

export function getQuestRewards(userId: string): string[] {
  return resumeQuest(userId).rewardIds;
}
