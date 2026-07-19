/** Registered, chamber-aware MetaPet breeding (MPB1 / breeding-ruleset v2). */

import { decodeGenome, type Genome, type GenomeHash } from "@/lib/genome";
import {
  deriveSriYantraProjectionV2,
  fingerprintSriYantraProjection,
  type SriYantraProjection,
} from "@/lib/geometry/projection";
import { deriveHeptaProfile, type HeptaProfileV2 } from "@/lib/heptaProfile";
import {
  buildPetRecord,
  type MutationLogEntry,
  type PetLineage,
  type PetRecordV2,
  type PetRepository,
} from "@/lib/registry";

export const BREEDING_PACKET_PROTOCOL = "MPB1" as const;
export const BREEDING_RULESET_VERSION = "metapet-breeding/v2";

export type RegisteredBreedingMode = "BALANCED" | "DOMINANT" | "MUTATION";
export type StrandKey = "red" | "blue" | "black";
export type ParentSlot = "parent1" | "parent2";

export interface BreedingPacketV1 {
  protocol: typeof BREEDING_PACKET_PROTOCOL;
  rulesetVersion: typeof BREEDING_RULESET_VERSION;
  parentIds: [string, string];
  parentGenomeHashes: [GenomeHash, GenomeHash];
  mode: RegisteredBreedingMode;
  conceptionNonce: string;
  conceivedAt: number;
  mutationRate: number;
  checksum: string;
}

export interface ChamberProvenance {
  strand: StrandKey;
  chamber: number;
  start: number;
  end: number;
  source: ParentSlot;
  parentId: string;
}

export type CrownwheelBody = "RB" | "BC" | "CW";
export type CrownwheelTail = "A" | "B" | "C";
export type CrownwheelOutcome =
  | "stable"
  | "tail-mutation"
  | "body-shift"
  | "wild"
  | "mythic-prime";

export interface CrownwheelCompatibility {
  parent1: { body: CrownwheelBody; tail: CrownwheelTail };
  parent2: { body: CrownwheelBody; tail: CrownwheelTail };
  forwardEdgeValid: boolean;
  reverseEdgeValid: boolean;
  compatibility: number;
  outcome: CrownwheelOutcome;
}

export interface RegisteredBreedingPreview {
  packet: BreedingPacketV1;
  offspring: Genome;
  traits: ReturnType<typeof decodeGenome>;
  heptaProfile: HeptaProfileV2;
  projection: SriYantraProjection;
  geometryFingerprint: string;
  lineage: PetLineage;
  chamberProvenance: ChamberProvenance[];
  mutations: MutationLogEntry[];
  crownwheel: CrownwheelCompatibility;
  contribution: { parent1: number; parent2: number };
}

const STRANDS = ["red", "blue", "black"] as const;
const BODY_CLASSES = ["RB", "BC", "CW"] as const;
const TAIL_CLASSES = ["A", "B", "C"] as const;

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function checksum(input: string): string {
  return `${fnv1a(input)}${fnv1a([...input].reverse().join(""))}`;
}

function seededRng(seed: string): () => number {
  let state = Number.parseInt(fnv1a(seed), 16) >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomNonce(): string {
  const values = new Uint32Array(3);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(36)).join("-");
}

function hashKey(hash: GenomeHash): string {
  return `${hash.redHash}:${hash.blueHash}:${hash.blackHash}`;
}

function packetBody(packet: Omit<BreedingPacketV1, "checksum">): string {
  return JSON.stringify(packet);
}

export interface CreateBreedingPacketOptions {
  mode?: RegisteredBreedingMode;
  conceptionNonce?: string;
  conceivedAt?: number;
  mutationRate?: number;
}

export function createBreedingPacket(
  left: PetRecordV2,
  right: PetRecordV2,
  options: CreateBreedingPacketOptions = {},
): BreedingPacketV1 {
  if (left.petId === right.petId) {
    throw new Error("Breeding requires two different registered pets");
  }
  const [parent1, parent2] = [left, right].sort((a, b) =>
    a.petId.localeCompare(b.petId),
  );
  const mode = options.mode ?? "BALANCED";
  const defaultMutationRate =
    mode === "MUTATION" ? 0.075 : mode === "DOMINANT" ? 0.015 : 0.01;
  const body: Omit<BreedingPacketV1, "checksum"> = {
    protocol: BREEDING_PACKET_PROTOCOL,
    rulesetVersion: BREEDING_RULESET_VERSION,
    parentIds: [parent1.petId, parent2.petId] as [string, string],
    parentGenomeHashes: [parent1.genomeHash, parent2.genomeHash] as [
      GenomeHash,
      GenomeHash,
    ],
    mode,
    conceptionNonce: options.conceptionNonce ?? randomNonce(),
    conceivedAt: options.conceivedAt ?? Date.now(),
    mutationRate: Math.max(
      0,
      Math.min(0.2, options.mutationRate ?? defaultMutationRate),
    ),
  };
  return { ...body, checksum: checksum(packetBody(body)) };
}

export function verifyBreedingPacket(packet: BreedingPacketV1): boolean {
  const { checksum: supplied, ...body } = packet;
  return (
    packet.protocol === BREEDING_PACKET_PROTOCOL &&
    packet.rulesetVersion === BREEDING_RULESET_VERSION &&
    supplied === checksum(packetBody(body))
  );
}

function strand(genome: Genome, key: StrandKey): number[] {
  return key === "red"
    ? genome.red60
    : key === "blue"
      ? genome.blue60
      : genome.black60;
}

function shuffle<T>(values: readonly T[], rng: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function classIndex(values: readonly number[]): number {
  return (
    values.reduce(
      (sum, value, index) => sum + (index + 1) * Math.abs(Math.trunc(value)),
      0,
    ) % 3
  );
}

function crownwheelIdentity(record: PetRecordV2): {
  body: CrownwheelBody;
  tail: CrownwheelTail;
} {
  return {
    body: BODY_CLASSES[classIndex(record.genome.red60.slice(0, 45))],
    tail: TAIL_CLASSES[classIndex(record.genome.black60.slice(45, 60))],
  };
}

/** K3,3 minus the matching diagonal: RB-A, BC-B and CW-C are absent. */
export function isCrownwheelEdge(
  body: CrownwheelBody,
  tail: CrownwheelTail,
): boolean {
  return BODY_CLASSES.indexOf(body) !== TAIL_CLASSES.indexOf(tail);
}

export function evaluateCrownwheel(
  parent1: PetRecordV2,
  parent2: PetRecordV2,
  seed: string,
): CrownwheelCompatibility {
  const one = crownwheelIdentity(parent1);
  const two = crownwheelIdentity(parent2);
  const forwardEdgeValid = isCrownwheelEdge(one.body, two.tail);
  const reverseEdgeValid = isCrownwheelEdge(two.body, one.tail);
  const validEdges = Number(forwardEdgeValid) + Number(reverseEdgeValid);
  const compatibility = validEdges === 2 ? 100 : validEdges === 1 ? 65 : 30;
  let outcome: CrownwheelOutcome = "stable";

  if (validEdges < 2) {
    const roll = seededRng(`${seed}|crownwheel`)();
    outcome =
      roll < 0.04
        ? "mythic-prime"
        : roll < 0.36
          ? "tail-mutation"
          : roll < 0.68
            ? "body-shift"
            : "wild";
  }

  return {
    parent1: one,
    parent2: two,
    forwardEdgeValid,
    reverseEdgeValid,
    compatibility,
    outcome,
  };
}

function canonicalParents(
  left: PetRecordV2,
  right: PetRecordV2,
  packet: BreedingPacketV1,
): [PetRecordV2, PetRecordV2] {
  if (!verifyBreedingPacket(packet)) throw new Error("Invalid MPB1 checksum");
  const byId = new Map([
    [left.petId, left],
    [right.petId, right],
  ]);
  const parent1 = byId.get(packet.parentIds[0]);
  const parent2 = byId.get(packet.parentIds[1]);
  if (!parent1 || !parent2) throw new Error("MPB1 parent IDs do not match");
  if (
    hashKey(parent1.genomeHash) !== hashKey(packet.parentGenomeHashes[0]) ||
    hashKey(parent2.genomeHash) !== hashKey(packet.parentGenomeHashes[1])
  ) {
    throw new Error("MPB1 parent genome hash mismatch");
  }
  return [parent1, parent2];
}

function lineageFor(parent1: PetRecordV2, parent2: PetRecordV2): PetLineage {
  const ancestorIds = [
    ...parent1.lineage.ancestorIds,
    ...parent2.lineage.ancestorIds,
    parent1.petId,
    parent2.petId,
  ].filter((value, index, all) => all.indexOf(value) === index);
  return {
    generation:
      Math.max(parent1.lineage.generation, parent2.lineage.generation) + 1,
    parentIds: [parent1.petId, parent2.petId],
    ancestorIds,
  };
}

export async function breedRegisteredPets(
  left: PetRecordV2,
  right: PetRecordV2,
  packet: BreedingPacketV1,
): Promise<RegisteredBreedingPreview> {
  const [parent1, parent2] = canonicalParents(left, right, packet);
  const seed = `${packet.checksum}|${packet.conceptionNonce}`;
  const rng = seededRng(seed);
  const offspring: Genome = { red60: [], blue60: [], black60: [] };
  const chamberProvenance: ChamberProvenance[] = [];

  for (const key of STRANDS) {
    const child = strand(offspring, key);
    const p1 = strand(parent1.genome, key);
    const p2 = strand(parent2.genome, key);
    let parent1Chambers = packet.mode === "DOMINANT" ? 8 : 6;
    if (packet.mode === "DOMINANT" && rng() < 0.5) parent1Chambers = 4;
    const chosen = new Set(
      shuffle(
        Array.from({ length: 12 }, (_, index) => index),
        rng,
      ).slice(0, parent1Chambers),
    );

    for (let chamber = 0; chamber < 12; chamber += 1) {
      const source: ParentSlot = chosen.has(chamber) ? "parent1" : "parent2";
      const parent = source === "parent1" ? parent1 : parent2;
      const genes = source === "parent1" ? p1 : p2;
      const start = chamber * 5;
      child.push(...genes.slice(start, start + 5));
      chamberProvenance.push({
        strand: key,
        chamber,
        start,
        end: start + 4,
        source,
        parentId: parent.petId,
      });
    }
  }

  const crownwheel = evaluateCrownwheel(parent1, parent2, seed);
  const mutations: MutationLogEntry[] = [];
  const usedLoci = new Set<number>();
  const radix = parent1.genomeRadix === 7 && parent2.genomeRadix === 7 ? 7 : 10;

  const mutate = (flatIndex: number, reason: string): boolean => {
    if (usedLoci.has(flatIndex)) return false;
    usedLoci.add(flatIndex);
    const key = STRANDS[Math.floor(flatIndex / 60)];
    const index = flatIndex % 60;
    const values = strand(offspring, key);
    const before = values[index];
    let after = Math.floor(rng() * radix);
    if (after === before) after = (after + 1) % radix;
    values[index] = after;
    mutations.push({
      strand: key,
      index,
      before,
      after,
      reason,
      at: packet.conceivedAt,
    });
    return true;
  };

  if (crownwheel.outcome === "tail-mutation") {
    mutate(120 + 45 + Math.floor(rng() * 15), "crownwheel:tail-mutation");
  } else if (crownwheel.outcome === "body-shift") {
    mutate(Math.floor(rng() * 45), "crownwheel:body-shift");
  } else if (crownwheel.outcome === "wild") {
    let wildMutations = 0;
    for (const locus of shuffle(
      Array.from({ length: 180 }, (_, index) => index),
      rng,
    )) {
      if (wildMutations >= Math.round(180 * 0.03)) break;
      if (mutate(locus, "crownwheel:wild")) wildMutations += 1;
    }
  } else if (crownwheel.outcome === "mythic-prime") {
    // One prime-indexed locus in each strand keeps the rare event visible
    // across the complete red/blue/black geometry packet.
    for (const prime of [7, 60 + 13, 120 + 43]) {
      mutate(prime, "crownwheel:mythic-prime");
    }
  }

  const targetMutationCount = Math.round(180 * packet.mutationRate);
  const candidateLoci = shuffle(
    Array.from({ length: 180 }, (_, index) => index),
    rng,
  );
  let breedingMutationCount = 0;
  for (const locus of candidateLoci) {
    if (breedingMutationCount >= targetMutationCount) break;
    if (mutate(locus, `breeding:${packet.mode.toLowerCase()}`)) {
      breedingMutationCount += 1;
    }
  }

  const parent1Count = chamberProvenance.filter(
    (entry) => entry.source === "parent1",
  ).length;
  const contribution = {
    parent1: Math.round((parent1Count / chamberProvenance.length) * 100),
    parent2: Math.round(
      ((chamberProvenance.length - parent1Count) / chamberProvenance.length) *
        100,
    ),
  };
  const projection = deriveSriYantraProjectionV2(offspring);

  return {
    packet,
    offspring,
    traits: decodeGenome(offspring),
    heptaProfile: deriveHeptaProfile(offspring),
    projection,
    geometryFingerprint: await fingerprintSriYantraProjection(projection),
    lineage: lineageFor(parent1, parent2),
    chamberProvenance,
    mutations,
    crownwheel,
    contribution,
  };
}

export async function registerOffspring(
  left: PetRecordV2,
  right: PetRecordV2,
  packet: BreedingPacketV1,
  repository: PetRepository,
  name?: string,
): Promise<{ record: PetRecordV2; preview: RegisteredBreedingPreview }> {
  const preview = await breedRegisteredPets(left, right, packet);
  const random = seededRng(`${packet.checksum}|identity`);
  const record = await buildPetRecord({
    name: name?.trim() || `Generation ${preview.lineage.generation} Meta-Pet`,
    genome: preview.offspring,
    genomeRadix: left.genomeRadix === 7 && right.genomeRadix === 7 ? 7 : 10,
    createdAt: packet.conceivedAt,
    lineage: preview.lineage,
    mutationLog: preview.mutations,
    random,
  });
  await repository.saveRecord(record, { activate: false });
  return { record, preview };
}
