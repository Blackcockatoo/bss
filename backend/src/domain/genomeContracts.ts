export const TRAIT_FAMILIES = ["behavior", "health", "athletic", "cognition"] as const;
export type TraitFamily = (typeof TRAIT_FAMILIES)[number];

export const DIET_CHOICES = ["standard", "high-protein", "balanced"] as const;
export const ACTIVITY_CHOICES = ["low", "medium", "high"] as const;
export const ENRICHMENT_CHOICES = ["low", "medium", "high"] as const;

export type ConstellationNode = {
  id: string;
  chromosome: string;
  cluster: string;
};

export type ConstellationEdge = {
  source: string;
  target: string;
  weight: number;
};

export type GraphChunkRequest = {
  petId: string;
  chromosome?: string;
  cluster?: string;
  cursor?: number;
  limit?: number;
};

export type NormalizedGraphChunkRequest = {
  petId: string;
  chromosome?: string;
  cluster?: string;
  cursor: number;
  limit: number;
};

export type GraphChunkResponse = {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  nextCursor: number | null;
};

export type TraitVectorEntry = {
  traitId: string;
  family: TraitFamily;
  value: number;
  confidence: number;
};

export type SonifySummaryResponse = {
  petId: string;
  normalizedTraitVector: TraitVectorEntry[];
  interactionMatrix: Record<string, Record<string, number>>;
};

export type EnvironmentChoice = {
  diet: (typeof DIET_CHOICES)[number];
  activity: (typeof ACTIVITY_CHOICES)[number];
  enrichment: (typeof ENRICHMENT_CHOICES)[number];
};

export type FutureBranch = {
  id: string;
  label: string;
  confidence: number;
  divergenceSummary: string;
};

const MAX_CONSTELLATION_LIMIT = 100;

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

function assertInRange(value: number, min: number, max: number, field: string): void {
  assert(Number.isFinite(value), `${field} must be a finite number`);
  assert(value >= min && value <= max, `${field} must be between ${min} and ${max}`);
}

export function validatePetId(petId: string): string {
  assert(isNonEmptyString(petId), "petId must be a non-empty string");
  return petId.trim();
}

export function normalizeGraphChunkRequest(request: GraphChunkRequest): NormalizedGraphChunkRequest {
  const petId = validatePetId(request.petId);
  const cursor = request.cursor ?? 0;
  const limit = request.limit ?? 24;

  assert(Number.isInteger(cursor), "cursor must be an integer");
  assert(cursor >= 0, "cursor must be greater than or equal to 0");
  assert(Number.isInteger(limit), "limit must be an integer");
  assert(limit > 0 && limit <= MAX_CONSTELLATION_LIMIT, `limit must be between 1 and ${MAX_CONSTELLATION_LIMIT}`);

  if (request.chromosome !== undefined) {
    assert(/^chr\d+$/.test(request.chromosome), "chromosome must match pattern chr<number>");
  }

  if (request.cluster !== undefined) {
    assert(/^cluster-\d+$/.test(request.cluster), "cluster must match pattern cluster-<number>");
  }

  return {
    petId,
    chromosome: request.chromosome,
    cluster: request.cluster,
    cursor,
    limit,
  };
}

export function validateEnvironmentChoice(env: EnvironmentChoice): EnvironmentChoice {
  assert(DIET_CHOICES.includes(env.diet), `diet must be one of: ${DIET_CHOICES.join(", ")}`);
  assert(ACTIVITY_CHOICES.includes(env.activity), `activity must be one of: ${ACTIVITY_CHOICES.join(", ")}`);
  assert(ENRICHMENT_CHOICES.includes(env.enrichment), `enrichment must be one of: ${ENRICHMENT_CHOICES.join(", ")}`);

  return env;
}

export function validateTraitVectorEntry(entry: TraitVectorEntry): TraitVectorEntry {
  assert(isNonEmptyString(entry.traitId), "traitId must be a non-empty string");
  assert(TRAIT_FAMILIES.includes(entry.family), `family must be one of: ${TRAIT_FAMILIES.join(", ")}`);
  assertInRange(entry.value, 0, 1, "value");
  assertInRange(entry.confidence, 0, 1, "confidence");
  return entry;
}

export function parseGraphChunkResponse(value: string): GraphChunkResponse {
  const parsed = JSON.parse(value) as GraphChunkResponse;
  assert(Array.isArray(parsed.nodes), "nodes must be an array");
  assert(Array.isArray(parsed.edges), "edges must be an array");
  assert(parsed.nextCursor === null || Number.isInteger(parsed.nextCursor), "nextCursor must be integer or null");
  return parsed;
}

export function parseSonifySummaryResponse(value: string): SonifySummaryResponse {
  const parsed = JSON.parse(value) as SonifySummaryResponse;
  validatePetId(parsed.petId);
  assert(Array.isArray(parsed.normalizedTraitVector), "normalizedTraitVector must be an array");
  parsed.normalizedTraitVector.forEach(validateTraitVectorEntry);
  assert(typeof parsed.interactionMatrix === "object" && parsed.interactionMatrix !== null, "interactionMatrix must be an object");
  return parsed;
}

export function parseFutureBranches(value: string): FutureBranch[] {
  const parsed = JSON.parse(value) as FutureBranch[];
  assert(Array.isArray(parsed), "future branches payload must be an array");
  parsed.forEach((branch, idx) => {
    assert(isNonEmptyString(branch.id), `branches[${idx}].id must be a non-empty string`);
    assert(isNonEmptyString(branch.label), `branches[${idx}].label must be a non-empty string`);
    assertInRange(branch.confidence, 0, 1, `branches[${idx}].confidence`);
    assert(isNonEmptyString(branch.divergenceSummary), `branches[${idx}].divergenceSummary must be a non-empty string`);
  });
  return parsed;
}
