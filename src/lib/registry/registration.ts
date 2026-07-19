/**
 * Atomic pet registration (Phase 1 of the MetaPet pipeline plan).
 *
 * One transaction produces the complete PetRecordV2:
 *   genome (fresh V2 or migrated legacy, never rerolled) → hash → traits →
 *   geometry projection fingerprint → pet ID + crest + HeptaCode → record.
 *
 * Persisting and store hydration are the repository's and bootstrap's jobs;
 * this module only builds records, deterministically where the inputs are.
 */

import { decodeGenome, hashGenome, type Genome } from "@/lib/genome";
import { deriveHeptaProfile } from "@/lib/heptaProfile";
import { getDeviceHmacKey, mintPrimeTailId } from "@/lib/identity/crest";
import { createHeptaPayload, heptaEncode42V2 } from "@/lib/identity/hepta";
import type { Rotation, Vault } from "@/lib/identity/types";
import { initializeEvolution } from "@/lib/evolution";
import {
  deriveSriYantraProjection,
  fingerprintSriYantraProjection,
} from "@/lib/geometry/projection";
import { DEFAULT_VITALS, type Vitals } from "@metapet/core/vitals";

import { generateGenomeV2, genomeDnaString } from "./genesis";
import {
  detectGenomeRadix,
  HEPTA_CODE_VERSION_V2,
  PET_RECORD_SCHEMA_VERSION,
  PROJECTION_VERSION_V1,
  PROJECTION_VERSION_V2,
  RULESET_VERSION,
  type GenomeRadix,
  type MutationLogEntry,
  type PetLineage,
  type PetRecordV2,
} from "./record";
import { createRegistrationProof } from "./attestation";

export interface RegisterPetOptions {
  name?: string;
  /**
   * Existing genome to register (legacy migration or offspring). When
   * omitted a fresh decimal Genome V2 is rolled. An explicit genome is NEVER
   * modified or rerolled — its digits are the pet's identity.
   */
  genome?: Genome;
  /** Digit base of the supplied genome; auto-detected when omitted. */
  genomeRadix?: GenomeRadix;
  /** Preserve a legacy pet ID during migration; minted from the genome hash otherwise. */
  petId?: string;
  /** Preserve a legacy creation time during migration. */
  createdAt?: number;
  vitals?: Vitals;
  lineage?: PetLineage;
  mutationLog?: MutationLogEntry[];
  /** Injectable for tests; defaults to the persisted device key. */
  hmacKey?: CryptoKey;
  random?: () => number;
}

const GENESIS_LINEAGE: PetLineage = {
  generation: 0,
  parentIds: [],
  ancestorIds: [],
};

/**
 * The exact red/blue/black packet the geometry engine will receive for this
 * genome under projection v1, plus its fingerprint. Kept beside registration
 * so record and renderer can never disagree about what the pet looks like.
 */
export async function deriveGeometryProjectionV1(genome: Genome): Promise<{
  strands: { red: string; blue: string; black: string };
  fingerprint: string;
}> {
  const projection = deriveSriYantraProjection(genome, PROJECTION_VERSION_V1);
  const fingerprint = await fingerprintSriYantraProjection(projection);
  return {
    strands: projection.strands,
    fingerprint,
  };
}

export async function deriveGeometryProjectionV2(genome: Genome): Promise<{
  strands: { red: string; blue: string; black: string };
  fingerprint: string;
}> {
  const projection = deriveSriYantraProjection(genome, PROJECTION_VERSION_V2);
  return {
    strands: projection.strands,
    fingerprint: await fingerprintSriYantraProjection(projection),
  };
}

/** Deterministic crest coordinates so the same genome always mints the same identity. */
function crestCoordinatesFromHash(redHash: string): {
  vault: Vault;
  rotation: Rotation;
  tail: [number, number, number, number];
} {
  const nibble = (index: number) =>
    Number.parseInt(redHash.slice(index * 2, index * 2 + 2), 16) || 0;
  const vaults: Vault[] = ["red", "blue", "black"];
  return {
    vault: vaults[nibble(0) % 3],
    rotation: nibble(1) % 2 === 0 ? "CW" : "CCW",
    tail: [nibble(2) % 60, nibble(3) % 60, nibble(4) % 60, nibble(5) % 60],
  };
}

export async function buildPetRecord(
  options: RegisterPetOptions = {},
): Promise<PetRecordV2> {
  const createdAt = options.createdAt ?? Date.now();
  // 1. Produce or accept the genome. Explicit genomes are identity: no reroll.
  const genome = options.genome ?? generateGenomeV2(options.random);
  const genomeRadix =
    options.genomeRadix ?? (options.genome ? detectGenomeRadix(genome) : 10);

  // 2. Hash it.
  const genomeHash = await hashGenome(genome);

  // 3. Birth traits and the seven-axis Hepta profile come from the genome
  //    digits alone.
  const traits = decodeGenome(genome);
  const heptaProfile = deriveHeptaProfile(genome);

  // 4. Geometry projection fingerprint under the pinned projection version.
  const projection = await deriveGeometryProjectionV2(genome);

  // 5. Mint pet ID, crest, and HeptaCode.
  const petId =
    options.petId ??
    `mp2-${genomeHash.redHash.slice(0, 8)}${genomeHash.blackHash.slice(0, 8)}`;
  const hmacKey = options.hmacKey ?? (await getDeviceHmacKey());
  const crest = await mintPrimeTailId({
    dna: genomeDnaString(genome),
    ...crestCoordinatesFromHash(genomeHash.redHash),
    hmacKey,
    coronatedAt: createdAt,
  });
  const heptaDigits = await heptaEncode42V2(
    createHeptaPayload(crest, "standard", {
      now: createdAt,
      random: options.random,
    }),
    hmacKey,
  );

  // 6. Assemble the complete record.
  const record: PetRecordV2 = {
    schemaVersion: PET_RECORD_SCHEMA_VERSION,
    rulesetVersion: RULESET_VERSION,
    petId,
    name: options.name?.trim() || "Meta-Pet",
    createdAt,
    genome,
    genomeHash,
    genomeRadix,
    traits,
    heptaProfile,
    heptaCode: { version: HEPTA_CODE_VERSION_V2, digits: heptaDigits },
    crest,
    registrationSignature: crest.signature,
    registrationProof: null,
    projectionVersion: PROJECTION_VERSION_V2,
    geometryFingerprint: projection.fingerprint,
    evolution: initializeEvolution(),
    vitals: { ...DEFAULT_VITALS, ...options.vitals },
    lineage: options.lineage ?? {
      ...GENESIS_LINEAGE,
      parentIds: [],
      ancestorIds: [],
    },
    mutationLog: options.mutationLog ?? [],
  };
  record.registrationProof = await createRegistrationProof(record);
  return record;
}
