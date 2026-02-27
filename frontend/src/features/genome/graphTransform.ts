export type GenomeNode = {
  id: string;
  chromosome: string;
  traitFamily: string;
  effectSize: number;
  confidence: number;
  stageActivation: Record<DevelopmentStage, number>;
};

export type GenomeEdge = {
  source: string;
  target: string;
  weight: number;
  interactionType: "coexpression" | "inhibition" | "support";
};

export type DevelopmentStage =
  | "kitten_puppy"
  | "adolescent"
  | "adult"
  | "senior";

export type ConstellationPoint = {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
};

export type ConstellationLink = {
  source: string;
  target: string;
  opacity: number;
  width: number;
};

export type ConstellationGraph = {
  nodes: ConstellationPoint[];
  links: ConstellationLink[];
};

const FAMILY_COLOR: Record<string, string> = {
  behavior: "#7dd3fc",
  health: "#fb7185",
  athletic: "#34d399",
  cognition: "#fbbf24",
};

export const stageOrder: DevelopmentStage[] = [
  "kitten_puppy",
  "adolescent",
  "adult",
  "senior",
];

export function transformToConstellationGraph(
  nodes: GenomeNode[],
  edges: GenomeEdge[],
  stage: DevelopmentStage,
): ConstellationGraph {
  const points = nodes.map((node, index) => {
    const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;
    const radial = 20 + node.effectSize * 50;
    const stageBoost = node.stageActivation[stage] ?? 0.2;

    return {
      id: node.id,
      x: Math.cos(angle) * radial,
      y: Math.sin(angle) * radial,
      z: (node.confidence - 0.5) * 40,
      radius: 1 + stageBoost * 4,
      color: FAMILY_COLOR[node.traitFamily] ?? "#e2e8f0",
    } satisfies ConstellationPoint;
  });

  const links = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    opacity: Math.max(0.1, Math.min(1, edge.weight)),
    width: 1 + Math.abs(edge.weight) * 3,
  }));

  return { nodes: points, links };
}

export function clusterByChromosome(nodes: GenomeNode[]): Record<string, GenomeNode[]> {
  return nodes.reduce<Record<string, GenomeNode[]>>((acc, node) => {
    acc[node.chromosome] ??= [];
    acc[node.chromosome].push(node);
    return acc;
  }, {});
}
