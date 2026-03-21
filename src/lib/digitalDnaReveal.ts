import {
  MOSS_DIGIT_COLORS,
  MOSS_DIGIT_SHAPES,
  MOSS_SCALE,
  MOSS_STRANDS,
  MOSS_STRAND_META,
  type MossStrandKey,
} from "@/lib/moss60/strandSequences";

type OwnershipLeader = {
  strand: MossStrandKey;
  count: number;
};

export type DigitalDNAConstellationNode = {
  digit: number;
  count: number;
  note: string;
  shape: string;
  color: string;
  strand: MossStrandKey;
  strandLabel: string;
  x: number;
  y: number;
  size: number;
};

export type DigitalDNARevealModel = {
  dominantStrand: MossStrandKey;
  dominantStrandLabel: string;
  resonanceClass: string;
  liveMutationSeed: string;
  dominantLattice: string;
  insight: string;
  progressionNote: string;
  nodes: DigitalDNAConstellationNode[];
};

function countDigits(sequence: string): number[] {
  const counts = Array.from({ length: 10 }, () => 0);
  for (const digit of sequence.split("").map(Number)) {
    counts[digit] += 1;
  }
  return counts;
}

function getOwnershipLeaders(): OwnershipLeader[] {
  const perStrandCounts = (Object.entries(MOSS_STRANDS) as [
    MossStrandKey,
    string,
  ][]).map(([strand, sequence]) => ({
    strand,
    counts: countDigits(sequence),
  }));

  const leaderCounts = {
    red: 0,
    black: 0,
    blue: 0,
  } satisfies Record<MossStrandKey, number>;

  for (let digit = 0; digit < 10; digit += 1) {
    const ranked = perStrandCounts
      .map(({ strand, counts }) => ({ strand, count: counts[digit] }))
      .sort((a, b) => b.count - a.count);

    const winningCount = ranked[0]?.count ?? 0;
    for (const item of ranked) {
      if (item.count !== winningCount) {
        break;
      }
      leaderCounts[item.strand] += 1;
    }
  }

  return (Object.entries(leaderCounts) as [MossStrandKey, number][])
    .map(([strand, count]) => ({ strand, count }))
    .sort((a, b) => b.count - a.count);
}

function buildResonanceClass(dominantStrand: MossStrandKey, spread: number) {
  if (spread <= 1) {
    return "Balanced Triad";
  }

  const names: Record<MossStrandKey, string> = {
    red: "Solar Chorus",
    blue: "Tidal Orbit",
    black: "Obsidian Lattice",
  };

  return names[dominantStrand];
}

export function buildDigitalDNARevealModel(): DigitalDNARevealModel {
  const strandCounts = (Object.entries(MOSS_STRANDS) as [
    MossStrandKey,
    string,
  ][]).map(([strand, sequence]) => ({
    strand,
    counts: countDigits(sequence),
  }));

  const nodes = Array.from({ length: 10 }, (_, digit) => {
    const owners = strandCounts
      .map(({ strand, counts }) => ({
        strand,
        count: counts[digit],
      }))
      .sort((a, b) => b.count - a.count);
    const leader = owners[0];
    const angle = (digit / 10) * Math.PI * 2 - Math.PI / 2;
    const radius = 34;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * 0.82;

    return {
      digit,
      count: leader.count,
      note: MOSS_SCALE[digit],
      shape: MOSS_DIGIT_SHAPES[digit],
      color: MOSS_DIGIT_COLORS[digit],
      strand: leader.strand,
      strandLabel: MOSS_STRAND_META[leader.strand].shortLabel,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      size: 8 + leader.count * 1.6,
    };
  }).sort((a, b) => b.count - a.count);

  const ownershipLeaders = getOwnershipLeaders();
  const dominantStrand = ownershipLeaders[0]?.strand ?? "red";
  const dominantStrandLabel = MOSS_STRAND_META[dominantStrand].label;
  const spread =
    (ownershipLeaders[0]?.count ?? 0) - (ownershipLeaders[1]?.count ?? 0);
  const resonanceClass = buildResonanceClass(dominantStrand, spread);
  const leadNodes = nodes.slice(0, 3);
  const dominantLattice = leadNodes
    .map((node) => `${node.digit} ${node.shape}`)
    .join(" · ");
  const liveMutationSeed = nodes
    .slice(0, 5)
    .map((node) => node.digit)
    .join("-");
  const insight = `${dominantStrandLabel} is leading the shared score, with digit ${nodes[0]?.digit ?? 0} shining brightest across the visible lattice.`;

  return {
    dominantStrand,
    dominantStrandLabel,
    resonanceClass,
    liveMutationSeed,
    dominantLattice,
    insight,
    progressionNote:
      "Pet care creates the bond, School teaches the patterns, Identity secures ownership, and DNA reveals the mechanism underneath all three.",
    nodes,
  };
}
