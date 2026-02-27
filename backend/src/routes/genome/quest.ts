import { randomUUID } from "node:crypto";
import { questRepository } from "../../repositories/questRepository";

export type QuestCheckpoint = {
  id: string;
  chapterId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  roomVersion: number;
};

export type QuestState = {
  userId: string;
  currentChapterId: string;
  completedObjectiveIds: string[];
  rewardIds: string[];
  checkpoints: QuestCheckpoint[];
  createdAt: string;
  updatedAt: string;
  roomVersion: number;
};

function defaultQuest(userId: string): QuestState {
  const now = new Date().toISOString();
  return {
    userId,
    currentChapterId: "behavior-basics",
    completedObjectiveIds: [],
    rewardIds: [],
    checkpoints: [],
    createdAt: now,
    updatedAt: now,
    roomVersion: 1,
  };
}

const emptyInteractionCounts: Record<QuestInteraction, number> = {
  open_node: 0,
  run_lasso: 0,
  sonify_compare: 0,
  save_scenario: 0,
};

export function resumeQuest(userId: string): QuestState {
  return questRepository.findByUserId(userId) ?? defaultQuest(userId);
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
  patch: Partial<Omit<QuestState, "userId" | "checkpoints" | "createdAt" | "updatedAt" | "roomVersion">>,
): QuestState {
  const current = resumeQuest(userId);
  const next: QuestState = {
    ...current,
    ...patch,
    userId,
    roomVersion: current.roomVersion + 1,
    updatedAt: new Date().toISOString(),
  };
  return questRepository.save(next);
}

export function createQuestCheckpoint(userId: string, createdBy: string, chapterId?: string): QuestCheckpoint {
  const current = resumeQuest(userId);
  const now = new Date().toISOString();
  const checkpoint: QuestCheckpoint = {
    id: randomUUID(),
    chapterId: chapterId ?? current.currentChapterId,
    createdBy,
    createdAt: now,
    updatedAt: now,
    roomVersion: current.roomVersion,
  };

  const next: QuestState = {
    ...current,
    checkpoints: [...current.checkpoints, checkpoint],
    roomVersion: current.roomVersion + 1,
    updatedAt: now,
  };
  questRepository.save(next);
  return checkpoint;
}

export function getQuestRewards(userId: string): string[] {
  return resumeQuest(userId).rewardIds;
}
