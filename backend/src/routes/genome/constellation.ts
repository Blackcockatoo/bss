export type GraphChunkRequest = {
  petId: string;
  chromosome?: string;
  cluster?: string;
  cursor?: number;
  limit?: number;
};

export type GraphChunkResponse = {
  nodes: Array<{ id: string; chromosome: string; cluster: string }>;
  edges: Array<{ source: string; target: string; weight: number }>;
  nextCursor: number | null;
};

const MOCK_NODES = Array.from({ length: 120 }, (_, index) => ({
  id: `gene-${index + 1}`,
  chromosome: `chr${(index % 12) + 1}`,
  cluster: `cluster-${(index % 6) + 1}`,
}));

export function getConstellationGraphChunk(request: GraphChunkRequest): GraphChunkResponse {
  const start = request.cursor ?? 0;
  const limit = request.limit ?? 24;

  const filtered = MOCK_NODES.filter((node) => {
    if (request.chromosome && node.chromosome !== request.chromosome) {
      return false;
    }
    if (request.cluster && node.cluster !== request.cluster) {
      return false;
    }
    return true;
  });

  const nodes = filtered.slice(start, start + limit);
  const edges = nodes.slice(1).map((node, idx) => ({
    source: nodes[idx].id,
    target: node.id,
    weight: 0.3 + (idx % 3) * 0.2,
  }));

  return {
    nodes,
    edges,
    nextCursor: start + limit < filtered.length ? start + limit : null,
  };
}
