import type { ScientificVisualizationArtifact } from "./schema";

export const rendererRegistry = {
  "embedding-space": "EmbeddingSpaceRenderer",
  scatter: "ScatterRenderer",
  graph: "GraphRenderer",
  hypergraph: "HypergraphRenderer",
  distribution: "DistributionRenderer",
  matrix: "MatrixRenderer",
} as const satisfies Record<ScientificVisualizationArtifact["type"], string>;

export function resolveRenderer(type: ScientificVisualizationArtifact["type"]) {
  return rendererRegistry[type];
}

