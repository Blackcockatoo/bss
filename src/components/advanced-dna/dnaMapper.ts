import type {
  DnaBase,
  DnaVisualModel,
  DnaVisualSource,
  GeneExpressionState,
  GeneGroup,
  GeneLocus,
  GenomeStrand,
  TraitWeights,
} from "./types";

export const DNA_BASE_COLORS: Record<DnaBase, string> = {
  A: "#5CF2D6",
  T: "#FF3C78",
  C: "#379BFF",
  G: "#F4D35E",
};

export const DNA_BASE_LABELS: Record<DnaBase, string> = {
  A: "Adenine",
  T: "Thymine",
  C: "Cytosine",
  G: "Guanine",
};

const BASES: readonly DnaBase[] = ["A", "T", "C", "G"];
const STRANDS: readonly GenomeStrand[] = ["red", "blue", "black"];
const GROUP_LABELS = [
  ["Origin field", "Origin"],
  ["Chromatic signal", "Colour"],
  ["Mirror signal", "Mirror"],
  ["Pattern memory", "Pattern"],
  ["Surface code", "Surface"],
  ["Scale gate", "Scale"],
  ["Cranial frame", "Frame"],
  ["Motion lattice", "Motion"],
  ["Tail vector", "Tail"],
  ["Feature gate", "Feature"],
  ["Rare channel", "Rare"],
  ["Latent chamber", "Latent"],
] as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mean(values: readonly number[], fallback = 0.5): number {
  if (!values.length) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** FNV-1a: stable in browsers, Node, tests and exported screenshots. */
export function hashDnaString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function seededUnit(seed: number, index: number, salt = 0): number {
  let value =
    seed ^ Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0x100000000;
}

export function genomeToIdentityString(source: DnaVisualSource): string {
  return [
    source.genome.red60.join(""),
    source.genome.blue60.join(""),
    source.genome.black60.join(""),
  ].join(":");
}

function deriveTraitWeights(source: DnaVisualSource): TraitWeights {
  const { traits, vitals } = source;
  const physical = traits
    ? clamp01(
        mean([
          traits.physical.size / 2,
          traits.physical.features.length / 5,
          traits.physical.proportions.headRatio,
          traits.physical.proportions.limbRatio,
          traits.elementWeb.coverage,
        ]),
      )
    : 0.5;
  const personality = traits
    ? clamp01(
        mean([
          traits.personality.energy,
          traits.personality.social,
          traits.personality.curiosity,
          traits.personality.discipline,
          traits.personality.affection,
          traits.personality.independence,
          traits.personality.playfulness,
          traits.personality.loyalty,
        ]) / 100,
      )
    : 0.5;
  const latent = traits
    ? clamp01(
        mean([
          traits.latent.potential.physical,
          traits.latent.potential.mental,
          traits.latent.potential.social,
        ]) /
          100 +
          traits.latent.rareAbilities.length * 0.025,
      )
    : 0.5;
  const health = clamp01(
    mean([100 - vitals.hunger, vitals.hygiene, vitals.mood, vitals.energy]) /
      100 -
      (vitals.isSick ? vitals.sicknessSeverity / 250 : 0),
  );

  return {
    physical,
    personality,
    latent,
    health,
    mood: clamp01(vitals.mood / 100),
    energy: clamp01(vitals.energy / 100),
  };
}

function expressionFor(
  strand: GenomeStrand,
  explicitMutation: boolean,
): GeneExpressionState {
  if (explicitMutation) return "mutated";
  if (strand === "red") return "inherited";
  if (strand === "blue") return "expressed";
  return "dormant";
}

function strandDigits(source: DnaVisualSource, strand: GenomeStrand): number[] {
  if (strand === "red") return source.genome.red60;
  if (strand === "blue") return source.genome.blue60;
  return source.genome.black60;
}

function traitWeightForStrand(
  strand: GenomeStrand,
  weights: TraitWeights,
): number {
  if (strand === "red") return weights.physical;
  if (strand === "blue") return weights.personality;
  return weights.latent;
}

function mutationKey(strand: GenomeStrand, index: number): string {
  return `${strand}:${index}`;
}

export function buildDnaVisualModel(source: DnaVisualSource): DnaVisualModel {
  const identity = genomeToIdentityString(source);
  const numericSeed = hashDnaString(identity);
  const fingerprint =
    `${numericSeed.toString(16).padStart(8, "0")}-${hashDnaString(
      identity.split("").reverse().join(""),
    )
      .toString(16)
      .padStart(8, "0")}`.toUpperCase();
  const traitWeights = deriveTraitWeights(source);
  const explicitMutations = new Set(
    source.mutationLog.map((entry) => mutationKey(entry.strand, entry.index)),
  );
  const baseCounts: Record<DnaBase, number> = { A: 0, T: 0, C: 0, G: 0 };
  const loci: GeneLocus[] = [];

  for (let strandOffset = 0; strandOffset < STRANDS.length; strandOffset += 1) {
    const strand = STRANDS[strandOffset];
    const digits = strandDigits(source, strand).slice(0, 60);
    const strandTraitWeight = traitWeightForStrand(strand, traitWeights);

    for (let strandIndex = 0; strandIndex < digits.length; strandIndex += 1) {
      const index = strandOffset * 60 + strandIndex;
      const digit = Math.max(0, Math.min(9, Math.round(digits[strandIndex])));
      const base = BASES[digit % BASES.length];
      const group = Math.min(11, Math.floor(strandIndex / 5));
      const previous =
        digits[(strandIndex + digits.length - 1) % digits.length];
      const next = digits[(strandIndex + 1) % digits.length];
      const localDifference =
        (Math.abs(digit - previous) + Math.abs(digit - next)) / 18;
      const explicitMutation = explicitMutations.has(
        mutationKey(strand, strandIndex),
      );
      const rarity = clamp01(
        digit / 14 +
          Math.abs(previous - next) / 18 +
          seededUnit(numericSeed, index, 7) * 0.16 +
          (strand === "black" ? traitWeights.latent * 0.18 : 0),
      );
      const stability = clamp01(
        0.76 - localDifference * 0.48 + strandTraitWeight * 0.24,
      );
      const weight = clamp01(
        0.18 +
          digit / 18 +
          strandTraitWeight * 0.32 +
          (1 - localDifference) * 0.12,
      );
      const mutationPotential = explicitMutation
        ? 1
        : clamp01(
            localDifference * 0.52 +
              rarity * 0.28 +
              seededUnit(numericSeed, index, 17) * 0.2,
          );

      baseCounts[base] += 1;
      loci.push({
        index,
        strandIndex,
        strand,
        digit,
        base,
        color: DNA_BASE_COLORS[base],
        group,
        weight,
        stability,
        rarity,
        mutationPotential,
        explicitMutation,
        expression: expressionFor(strand, explicitMutation),
        phase: seededUnit(numericSeed, index, 23) * Math.PI * 2,
        radialBias: seededUnit(numericSeed, index, 29),
        angleBias: seededUnit(numericSeed, index, 31) * 2 - 1,
      });
    }
  }

  const groups: GeneGroup[] = GROUP_LABELS.map(([label, shortLabel], index) => {
    const groupLoci = loci.filter((locus) => locus.group === index);
    const groupBaseCounts: Record<DnaBase, number> = { A: 0, T: 0, C: 0, G: 0 };
    groupLoci.forEach((locus) => {
      groupBaseCounts[locus.base] += 1;
    });
    const dominantBase = (
      Object.entries(groupBaseCounts) as [DnaBase, number][]
    ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];

    return {
      index,
      label,
      shortLabel,
      weight: mean(groupLoci.map((locus) => locus.weight)),
      stability: mean(groupLoci.map((locus) => locus.stability)),
      rarity: mean(groupLoci.map((locus) => locus.rarity)),
      dominantBase,
      locusIndices: groupLoci.map((locus) => locus.index),
    };
  });

  return {
    fingerprint,
    numericSeed,
    petId: source.petId,
    petName: source.petName,
    isFallback: source.isFallback,
    loci,
    groups,
    traitWeights,
    baseCounts,
    mutationCount: loci.filter((locus) => locus.explicitMutation).length,
  };
}

export function mutationSignal(
  locus: GeneLocus,
  mutationLevel: number,
): number {
  if (locus.explicitMutation) return 1;
  return clamp01(locus.mutationPotential * mutationLevel * 1.45);
}
