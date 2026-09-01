import type { ScientificVisualizationArtifact } from "@/lib/scientific-artifacts/schema";

export const wildGadExampleArtifact: ScientificVisualizationArtifact = {
  schemaVersion: "1.1",
  id: "wild-gad-embedding-space-v1",
  type: "embedding-space",
  title: "WILD-GAD Embedding Space Analysis",
  description: "PCA projections of six language-model embedding spaces across seven graph datasets.",
  source: { projectId: "wild-gad", experimentId: "embedding-space-analysis", runId: "legacy-seminar-matrix" },
  data: {
    projectionIndex: { uri: "/data/projections/index.json", sha256: "bdba8b11daa084691a198bd530abd47e340a29acbbf681c7c429f1176a6a4605", mediaType: "application/json", sizeBytes: 1377 },
    projectionE5Small: { uri: "/data/projections/e5-small.json", sha256: "064adef53fc934eba600e7109773e3874f5d4a32a248bf4303d570e4d6c3f737", mediaType: "application/json", sizeBytes: 2140912 },
    projectionMbert: { uri: "/data/projections/mbert.json", sha256: "c16866da23601f1481477dcd7cd6ec36f36b197c9c57f504334b0f07dc706532", mediaType: "application/json", sizeBytes: 2125135 },
    projectionRoberta: { uri: "/data/projections/roberta.json", sha256: "e31541ad86d0fdfb0075b70bd5889db6c93bb867ade0ea0db37d772568c33431", mediaType: "application/json", sizeBytes: 2140678 },
    projectionSbertMinilm: { uri: "/data/projections/sbert-minilm.json", sha256: "a443168531f6d6c02e84f7cc731f6b5592aed5c3d5e477b4775a7727e23dbf35", mediaType: "application/json", sizeBytes: 2130657 },
    projectionSbertSpecter: { uri: "/data/projections/sbert-specter.json", sha256: "aa23897792ac8ec682d7d8a122b5a23e1ff5c51e7be3e27596c061f8dba9fcc5", mediaType: "application/json", sizeBytes: 2140040 },
    projectionScibert: { uri: "/data/projections/scibert.json", sha256: "d204e037f5f7dc38b440d186ea6505977d1b32f55508d47b5ed07516c4afa0a0", mediaType: "application/json", sizeBytes: 2129016 },
  },
  visualization: { renderer: "embedding-space", dimensions: 3, defaults: { model: "scibert", maxPoints: 10500 } },
  provenance: { createdAt: "2026-08-31T00:00:00Z", generatedBy: "curated example from Research Gym export", claimStatus: "exploratory" },
};
