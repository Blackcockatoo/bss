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
  educationalCards: Array<{ id: string; title: string; body: string }>;
  rewards: string[];
  optionalMode: true;
  recommendedFor: "novice" | "all";
};

export const genomeQuestChapters: QuestChapter[] = [
  {
    id: "behavior-basics",
    title: "Behavior Resonance",
    optionalMode: true,
    recommendedFor: "all",
    objectives: [
      {
        id: "obj-open-node",
        description: "Inspect a behavior trait node in the constellation.",
        requiredInteraction: "open_node",
        minCount: 1,
        adaptiveHint: "Open any highlighted node to reveal allele context.",
      },
      {
        id: "obj-run-lasso",
        description: "Run lasso enrichment for a trait cluster.",
        requiredInteraction: "run_lasso",
        minCount: 1,
        adaptiveHint: "Use lasso around 3+ linked nodes for better enrichment confidence.",
      },
      {
        id: "obj-compare-sonification",
        description: "Compare two sonification profiles for contrast.",
        requiredInteraction: "sonify_compare",
        minCount: 1,
        adaptiveHint: "Try compare mode on two nearby clusters to hear epistasis patterns.",
      },
      {
        id: "obj-save-scenario",
        description: "Save one exploratory scenario with your findings.",
        requiredInteraction: "save_scenario",
        minCount: 1,
        adaptiveHint: "Saving a scenario unlocks later chapter shortcuts.",
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
