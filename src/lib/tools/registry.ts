/**
 * Project Forge v1: bounded, offline-only learning instruments.
 * This is a metadata registry, NOT a remotely executable plugin system.
 */
export type ForgeToolId =
  | "pattern-forge"
  | "sound-studio"
  | "discovery-lab"
  | "story-workshop"
  | "maker-bench"
  | "life-compass";

export type ForgeTool = Readonly<{
  id: ForgeToolId;
  version: 1;
  title: string;
  learningOutcome: string;
  minAge: number;
  maxAge: number;
  offline: true;
  capabilities: readonly (
    | "local-pet-id"
    | "local-memory"
    | "user-gesture-audio"
  )[];
  safetyClass: "child-local";
}>;

export const FORGE_TOOLS: Readonly<Record<ForgeToolId, ForgeTool>> = {
  "pattern-forge": {
    id: "pattern-forge",
    version: 1,
    title: "Pattern Forge",
    learningOutcome: "Predict and explain sequences and repeating patterns.",
    minAge: 6,
    maxAge: 12,
    offline: true,
    capabilities: ["local-pet-id", "local-memory"],
    safetyClass: "child-local",
  },
  "sound-studio": {
    id: "sound-studio",
    version: 1,
    title: "Sound Studio",
    learningOutcome:
      "Explore how changing a pattern changes the rhythm and melody.",
    minAge: 6,
    maxAge: 12,
    offline: true,
    capabilities: ["local-pet-id", "local-memory", "user-gesture-audio"],
    safetyClass: "child-local",
  },
  "discovery-lab": {
    id: "discovery-lab",
    version: 1,
    title: "Discovery Lab",
    learningOutcome:
      "Predict and compare a falling-object model while controlling variables.",
    minAge: 6,
    maxAge: 12,
    offline: true,
    capabilities: ["local-pet-id", "local-memory"],
    safetyClass: "child-local",
  },
  "story-workshop": {
    id: "story-workshop",
    version: 1,
    title: "Story Workshop",
    learningOutcome: "Write, revise and compare your own branching story.",
    minAge: 6,
    maxAge: 12,
    offline: true,
    capabilities: ["local-pet-id", "local-memory"],
    safetyClass: "child-local",
  },
  "maker-bench": {
    id: "maker-bench",
    version: 1,
    title: "Maker Bench",
    learningOutcome:
      "Plan, test and revise a bounded robot instruction sequence.",
    minAge: 6,
    maxAge: 12,
    offline: true,
    capabilities: ["local-pet-id", "local-memory"],
    safetyClass: "child-local",
  },
  "life-compass": {
    id: "life-compass",
    version: 1,
    title: "Life Compass",
    learningOutcome:
      "Plan practical tasks and evaluate uncertainty in information.",
    minAge: 6,
    maxAge: 12,
    offline: true,
    capabilities: ["local-pet-id", "local-memory"],
    safetyClass: "child-local",
  },
};

export function getForgeTool(id: string): ForgeTool | null {
  return Object.prototype.hasOwnProperty.call(FORGE_TOOLS, id)
    ? FORGE_TOOLS[id as ForgeToolId]
    : null;
}

/** Static capabilities only. Importing a tool never grants it permissions. */
export type ForgeContext = "family" | "school" | "field" | "studio";
export function canUseForgeTool(id: string, context: ForgeContext): boolean {
  return getForgeTool(id) !== null && context === "family";
}
export function forgeContract(id: ForgeToolId) {
  return Object.freeze({
    ...FORGE_TOOLS[id],
    purpose: FORGE_TOOLS[id].learningOutcome,
    inputSchema: "ActivityInput@1",
    outputSchema: "ActivityResult@1",
    artefactSchema: "Project@1",
    allowedResources: ["active-pet-identity", "own-forge-records"] as const,
    reflection: "optional-local-text-or-child-led-verbal-explanation",
    migration: "validate Project@1; reject unsupported future versions",
    accessibility:
      "keyboard, labelled controls, visual results, optional audio; adult support for early readers",
    network: false,
    scripts: false,
    schoolApproved: false,
  });
}
