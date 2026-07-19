/**
 * PetRecordV2 — the single canonical source of truth for a registered pet
 * (Phase 1 of docs/planning/metapet-pipeline-audit.md).
 *
 * Everything the runtime, certificate, and breeding chamber know about a pet
 * flows from one of these records. The runtime store is a hydrated view of
 * the active record, never an independent authority.
 */

import type { EvolutionData } from '@/lib/evolution';
import type { DerivedTraits, Genome, GenomeHash } from '@/lib/genome';
import type { HeptaProfileV2 } from '@/lib/heptaProfile';
import type { HeptaDigits, PrimeTailID } from '@/lib/identity/types';
import type { Vitals } from '@metapet/core/vitals';

export const PET_RECORD_SCHEMA_VERSION = 2 as const;

/** Version of the whole derivation ruleset a record was minted under. */
export const RULESET_VERSION = 'bss-ruleset/v1';

/**
 * Version of the genome→geometry projection used for this pet's appearance.
 * v1 is the current passthrough: strand digits mod 10 fed straight to the
 * Sri Yantra display (Phase 3 introduces the chamber-aware fold as v2 for
 * newly registered pets; existing pets keep the version they were born with
 * so their appearance never silently changes).
 */
export const PROJECTION_VERSION_V1 = 'moss60-profile/v1';

/** Versions of the HeptaCode error-correction layer. V1 (single weighted
 * checksum) is read-only for codes minted before the V2 GF(7) code. */
export const HEPTA_CODE_VERSION_V1 = 'hepta-ecc/v1';
export const HEPTA_CODE_VERSION_V2 = 'hepta-ecc/v2';

/**
 * Digit base of the genome strands. Legacy genomes were generated in base 7
 * (digits 0–6); Genome V2 strands are decimal (digits 0–9). Legacy genomes
 * are migrated as-is — same digits, radix recorded — never rerolled.
 */
export type GenomeRadix = 7 | 10;

export interface PetLineage {
  generation: number;
  parentIds: string[];
  /** Transitive ancestry, oldest first. Empty for genesis pets. */
  ancestorIds: string[];
}

export interface MutationLogEntry {
  strand: 'red' | 'blue' | 'black';
  index: number;
  before: number;
  after: number;
  reason: string;
  at: number;
}

export interface HeptaCodeRecord {
  version: string;
  digits: HeptaDigits;
}

export interface PetRecordV2 {
  schemaVersion: typeof PET_RECORD_SCHEMA_VERSION;
  rulesetVersion: string;
  petId: string;
  name: string;
  createdAt: number;
  genome: Genome;
  genomeHash: GenomeHash;
  genomeRadix: GenomeRadix;
  traits: DerivedTraits;
  /**
   * Seven-axis inherited characteristic profile (hepta-profile/v2). Null
   * only for records minted before the ruleset landed; the repository
   * backfills those idempotently on load.
   */
  heptaProfile: HeptaProfileV2 | null;
  heptaCode: HeptaCodeRecord | null;
  crest: PrimeTailID | null;
  /** Crest HMAC over the registration payload; verification state for the certificate. */
  registrationSignature: string | null;
  projectionVersion: string;
  /** Hash of the exact strand packet the geometry engine receives. */
  geometryFingerprint: string;
  evolution: EvolutionData;
  vitals: Vitals;
  lineage: PetLineage;
  mutationLog: MutationLogEntry[];
}

function isDigitStrand(value: unknown, radix: GenomeRadix): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 60 &&
    value.every(
      (digit) => Number.isInteger(digit) && digit >= 0 && digit < radix,
    )
  );
}

export function isGenomeOfRadix(
  value: unknown,
  radix: GenomeRadix,
): value is Genome {
  if (typeof value !== 'object' || value === null) return false;
  const genome = value as Record<string, unknown>;
  return (
    isDigitStrand(genome.red60, radix) &&
    isDigitStrand(genome.blue60, radix) &&
    isDigitStrand(genome.black60, radix)
  );
}

/**
 * Radix for a genome whose provenance is unknown (legacy saves predate the
 * explicit field). A genome using only digits 0–6 is treated as legacy
 * base-7: for a genuine 180-digit decimal genome the odds of that are
 * (7/10)^180 ≈ 10⁻²⁸, and either way the digits are preserved unchanged.
 */
export function detectGenomeRadix(genome: Genome): GenomeRadix {
  const allBase7 = [genome.red60, genome.blue60, genome.black60].every(
    (strand) => strand.every((digit) => digit >= 0 && digit <= 6),
  );
  return allBase7 ? 7 : 10;
}

export function isPetRecordV2(value: unknown): value is PetRecordV2 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === PET_RECORD_SCHEMA_VERSION &&
    typeof record.rulesetVersion === 'string' &&
    typeof record.petId === 'string' &&
    record.petId.length > 0 &&
    typeof record.name === 'string' &&
    typeof record.createdAt === 'number' &&
    (record.genomeRadix === 7 || record.genomeRadix === 10) &&
    isGenomeOfRadix(record.genome, record.genomeRadix as GenomeRadix) &&
    typeof record.genomeHash === 'object' &&
    record.genomeHash !== null &&
    typeof record.traits === 'object' &&
    record.traits !== null &&
    typeof record.projectionVersion === 'string' &&
    typeof record.geometryFingerprint === 'string' &&
    typeof record.evolution === 'object' &&
    record.evolution !== null &&
    typeof record.vitals === 'object' &&
    record.vitals !== null &&
    typeof record.lineage === 'object' &&
    record.lineage !== null &&
    Array.isArray(record.mutationLog)
  );
}
