import { resolve } from "node:path";
import type { QuestState } from "../routes/genome/quest";
import { JsonFileStore } from "./fileStore";

type QuestStore = Record<string, QuestState>;

const store = new JsonFileStore<QuestStore>(resolve(process.cwd(), "backend/data/quests.json"), {});

export const questRepository = {
  findByUserId(userId: string): QuestState | undefined {
    return store.read()[userId];
  },
  save(state: QuestState): QuestState {
    const quests = store.read();
    quests[state.userId] = state;
    store.write(quests);
    return state;
  },
};
