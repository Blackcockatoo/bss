/**
 * Project Forge v1: bounded, offline-only learning instruments.
 * This is a metadata registry, NOT a remotely executable plugin system.
 */
export type ForgeToolId = "pattern-forge" | "sound-studio";

export type ForgeTool = Readonly<{
  id: ForgeToolId;
  version: 1;
  title: string;
  learningOutcome: string;
  minAge: number;
  maxAge: number;
  offline: true;
  capabilities: readonly ("local-pet-id" | "local-memory" | "user-gesture-audio")[];
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
    learningOutcome: "Explore how changing a pattern changes the rhythm and melody.",
    minAge: 6,
    maxAge: 12,
    offline: true,
    capabilities: ["local-pet-id", "local-memory", "user-gesture-audio"],
    safetyClass: "child-local",
  },
};

export function getForgeTool(id: string): ForgeTool | null {
  return Object.prototype.hasOwnProperty.call(FORGE_TOOLS, id)
    ? FORGE_TOOLS[id as ForgeToolId]
    : null;
}
