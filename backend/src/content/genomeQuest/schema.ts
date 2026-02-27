export type QuestObjective = {
  id: string;
  description: string;
  requiredInteraction: "open_node" | "run_lasso" | "sonify_compare" | "save_scenario";
};

export type QuestChapter = {
  id: string;
  title: string;
  objectives: QuestObjective[];
  educationalCards: Array<{ id: string; title: string; body: string }>;
  rewards: string[];
};

export const genomeQuestChapters: QuestChapter[] = [
  {
    id: "behavior-basics",
    title: "Behavior Resonance",
    objectives: [
      {
        id: "obj-open-node",
        description: "Inspect a behavior trait node in the constellation.",
        requiredInteraction: "open_node",
      },
      {
        id: "obj-run-lasso",
        description: "Run lasso enrichment for a trait cluster.",
        requiredInteraction: "run_lasso",
      },
    ],
    educationalCards: [
      {
        id: "card-epistasis",
        title: "Hidden Interactions",
        body: "Some traits depend on gene partnerships, not single markers.",
      },
    ],
    rewards: ["badge:cluster-scout"],
  },
];
