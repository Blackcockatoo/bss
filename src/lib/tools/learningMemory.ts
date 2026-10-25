import { validProject, type Project } from "./activities";
import { getForgeTool, type ForgeToolId } from "./registry";

export const FORGE_MEMORY_VERSION = 1 as const;
export const MAX_FORGE_DISCOVERIES = 50;
export type CompanionMotif = "Orbit" | "Ripple" | "Bloom" | "Pulse";

export type ForgeDiscovery = {
  id: string;
  toolId: ForgeToolId;
  createdAt: number;
  sequence: [number, number, number, number];
  tempo: number;
  prediction: string;
  reflection: string;
  motif: CompanionMotif;
};

export type ForgeMemory = {
  version: typeof FORGE_MEMORY_VERSION;
  petId: string;
  discoveries: ForgeDiscovery[];
  projects?: Project[];
};

export function emptyForgeMemory(petId: string): ForgeMemory {
  return {
    version: FORGE_MEMORY_VERSION,
    petId,
    discoveries: [],
    projects: [],
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isSequence(
  value: unknown,
): value is [number, number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every(
      (number) => Number.isInteger(number) && number >= 1 && number <= 7,
    )
  );
}

export function normaliseForgeMemory(
  value: unknown,
  petId: string,
): ForgeMemory {
  if (
    !isPlainObject(value) ||
    value.version !== 1 ||
    value.petId !== petId ||
    !Array.isArray(value.discoveries)
  ) {
    return emptyForgeMemory(petId);
  }
  const discoveries: ForgeDiscovery[] = [];
  for (const item of value.discoveries.slice(-MAX_FORGE_DISCOVERIES)) {
    if (
      !isPlainObject(item) ||
      typeof item.id !== "string" ||
      item.id.length > 100 ||
      !getForgeTool(String(item.toolId)) ||
      typeof item.createdAt !== "number" ||
      !Number.isSafeInteger(item.createdAt) ||
      !isSequence(item.sequence) ||
      typeof item.tempo !== "number" ||
      !Number.isInteger(item.tempo) ||
      item.tempo < 50 ||
      item.tempo > 160 ||
      typeof item.reflection !== "string" ||
      typeof item.prediction !== "string" ||
      !["Orbit", "Ripple", "Bloom", "Pulse"].includes(String(item.motif))
    ) {
      continue;
    }
    discoveries.push({
      id: item.id,
      toolId: item.toolId as ForgeToolId,
      createdAt: item.createdAt as number,
      sequence: item.sequence,
      tempo: item.tempo,
      prediction: item.prediction.slice(0, 160),
      reflection: item.reflection.slice(0, 160),
      motif: item.motif as CompanionMotif,
    });
  }
  const projects = Array.isArray(value.projects)
    ? value.projects
        .filter(
          (p): p is Project =>
            validProject(p) && !!getForgeTool(String(p.toolId)),
        )
        .slice(-50)
    : [];
  return { version: 1, petId, discoveries, projects };
}

export function companionMotif(
  seed: string,
  sequence: readonly number[],
  tempo: number,
): CompanionMotif {
  // Deterministic and inspectable, not a claim of sentience or psychological insight.
  const text = [seed, sequence.join("-"), String(tempo)].join(":");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  const motifs: CompanionMotif[] = ["Orbit", "Ripple", "Bloom", "Pulse"];
  return motifs[(hash >>> 0) % motifs.length];
}

export function addForgeDiscovery(
  memory: ForgeMemory,
  discovery: ForgeDiscovery,
): ForgeMemory {
  if (
    !isSequence(discovery.sequence) ||
    !getForgeTool(discovery.toolId) ||
    !Number.isInteger(discovery.tempo) ||
    discovery.tempo < 50 ||
    discovery.tempo > 160
  ) {
    throw new Error("Invalid Forge discovery.");
  }
  return {
    ...memory,
    discoveries: [
      ...memory.discoveries,
      {
        ...discovery,
        prediction: discovery.prediction.trim().slice(0, 160),
        reflection: discovery.reflection.trim().slice(0, 160),
      },
    ].slice(-MAX_FORGE_DISCOVERIES),
  };
}
