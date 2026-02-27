import {
  type GraphChunkRequest,
  type GraphChunkResponse,
  normalizeGraphChunkRequest,
} from "../../domain/genomeContracts";

const MOCK_NODES = Array.from({ length: 120 }, (_, index) => ({
  id: `gene-${index + 1}`,
  chromosome: `chr${(index % 12) + 1}`,
  cluster: `cluster-${(index % 6) + 1}`,
}));

export function getConstellationGraphChunk(request: GraphChunkRequest): GraphChunkResponse {
  const normalizedRequest = normalizeGraphChunkRequest(request);

  // Filter precedence is explicit:
  // 1) chromosome filter is applied first
  // 2) cluster filter refines that result set
  const chromosomeFiltered = normalizedRequest.chromosome
    ? MOCK_NODES.filter((node) => node.chromosome === normalizedRequest.chromosome)
    : MOCK_NODES;

  const filtered = normalizedRequest.cluster
    ? chromosomeFiltered.filter((node) => node.cluster === normalizedRequest.cluster)
    : chromosomeFiltered;

  const nodes = filtered.slice(
    normalizedRequest.cursor,
    normalizedRequest.cursor + normalizedRequest.limit,
  );

  const edges = nodes.slice(1).map((node, idx) => ({
    source: nodes[idx].id,
    target: node.id,
    weight: 0.3 + (idx % 3) * 0.2,
  }));

  const nextCursor =
    normalizedRequest.cursor + normalizedRequest.limit < filtered.length
      ? normalizedRequest.cursor + normalizedRequest.limit
      : null;

  return {
    nodes,
    edges,
    nextCursor,
  };
}
