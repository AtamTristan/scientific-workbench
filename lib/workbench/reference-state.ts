import { materializeSweep } from "./engine";
import { scientificComponentSchema, workbenchStateSchema, type Mission, type PipelineDefinition, type ScientificComponent, type SweepDefinition, type WorkbenchState } from "./schema";

type PortType = "hypergraph-dataset" | "graph-dataset" | "graph-text" | "star-expansion" | "augmented-incidence-graph" | "structural-metrics" | "embedding-space" | "selection-ranking" | "artifact-set";
const port = (id: string, label: string, dataType: PortType, required = true) => ({ id, label, dataType, required });

export const referenceComponents: ScientificComponent[] = scientificComponentSchema.array().parse([
  { id: "hypergraph-dataset", type: "dataset", name: "Hypergraph Dataset", version: "0.1.0", description: "Computed inventory; the first executable source is an instrument-validation fixture.", inputs: [], outputs: [port("dataset", "Hypergraph", "hypergraph-dataset")], configurationSchema: { dataset: ["fixture:toy", "cora_cocitation", "citeseer_cocitation", "pubmed_cocitation", "dblp_coauthorship"] }, implementationRef: "src/hypergraph_ba/datasets.py" },
  { id: "star-expansion", type: "representation", name: "Star Expansion", version: "0.1.0", description: "Deterministic information-preserving bipartite representation.", inputs: [port("dataset", "Hypergraph", "hypergraph-dataset")], outputs: [port("graph", "Star expansion", "star-expansion")], configurationSchema: {}, implementationRef: "src/hypergraph_ba/representations.py" },
  { id: "uniform-incidence-removal", type: "augmentation", name: "A0 · Uniform Incidence Removal", version: "0.1.0", description: "Exact global budget b=floor(rho·|I|), deterministic by seed.", inputs: [port("graph", "Star expansion", "star-expansion")], outputs: [port("augmented", "Augmented graph", "augmented-incidence-graph")], configurationSchema: { strategy: ["A0"], rho: { minimum: 0, maximum: 1 }, seed: "integer" }, implementationRef: "src/hypergraph_ba/augmentations.py" },
  { id: "structural-metrics", type: "metric", name: "Structural Metrics", version: "0.1.0", description: "Degree JSD, hyperedge W1, overlap including zero, Gini and top-share.", inputs: [port("graph", "Augmented graph", "augmented-incidence-graph")], outputs: [port("metrics", "Structural metrics", "structural-metrics")], configurationSchema: {}, implementationRef: "src/hypergraph_ba/metrics.py" },
  { id: "wild-graph-dataset", type: "dataset", name: "Attributed Graph Dataset", version: "1.0.0", description: "Historical WILD-GAD dataset pool.", inputs: [], outputs: [port("dataset", "Attributed graph", "graph-dataset")], configurationSchema: {}, implementationRef: "research/scripts/prepare_datasets.py" },
  { id: "wild-text-view", type: "representation", name: "Node Text View", version: "1.0.0", description: "Node-level text views.", inputs: [port("dataset", "Attributed graph", "graph-dataset")], outputs: [port("text", "Node text", "graph-text")], configurationSchema: {}, implementationRef: "research/scripts/build_text_views.py" },
  { id: "wild-lm-embedding", type: "model", name: "Language Model Encoder", version: "1.0.0", description: "Six inspected encoder configurations.", inputs: [port("text", "Node text", "graph-text")], outputs: [port("embeddings", "Embedding space", "embedding-space")], configurationSchema: {}, implementationRef: "research/scripts/embed_with_lm.py" },
  { id: "wild-selection", type: "analysis", name: "WILD-GAD Dataset Selection", version: "1.0.0", description: "Candidate ranking through cal_distance_unlabeled.", inputs: [port("embeddings", "Embedding space", "embedding-space")], outputs: [port("ranking", "Selection ranking", "selection-ranking")], configurationSchema: {}, implementationRef: "research/scripts/run_wildgad_selection.py" },
  { id: "wild-stability", type: "metric", name: "Sampling Stability", version: "1.0.0", description: "3000/4000 sampling comparison.", inputs: [port("ranking", "Selection ranking", "selection-ranking")], outputs: [port("artifacts", "Stability artifacts", "artifact-set")], configurationSchema: {}, implementationRef: "research/scripts/compare_sampling_stability.py" },
]);

const baMission: Mission = { id: "mission-pre-ba-instrument-validation", projectId: "bachelor-hypergraph-augmentations", intentId: "intent-pre-ba-instrument-validation", title: "Validate the BA experiment instrument end to end", objective: "Verify deterministic Star Expansion, A0 budget preservation, structural metrics and provenance before using claim-bearing datasets.", researchActionRef: "RA-PRE-BA-INSTRUMENT", protocolRef: "P-PRE-BA-INSTRUMENT", hypothesisRefs: [], status: "ready", createdAt: "2026-09-03T12:00:00Z" };
const baPipeline: PipelineDefinition = {
  id: "pipeline-ba-pre-ba-a0", projectId: baMission.projectId, name: "Pre-BA A0 Structural Vertical Slice", version: "0.4.0", protocolRef: baMission.protocolRef, status: "validated",
  nodes: [
    { id: "dataset", componentId: "hypergraph-dataset", position: { x: 0, y: 80 }, configuration: { dataset: "$dataset" } },
    { id: "representation", componentId: "star-expansion", position: { x: 260, y: 80 }, configuration: {} },
    { id: "augmentation", componentId: "uniform-incidence-removal", position: { x: 520, y: 80 }, configuration: { strategy: "$strategy", rho: "$rho", seed: "$seed" } },
    { id: "metrics", componentId: "structural-metrics", position: { x: 800, y: 80 }, configuration: {} },
  ],
  edges: [
    { id: "b1", sourceNodeId: "dataset", sourcePortId: "dataset", targetNodeId: "representation", targetPortId: "dataset" },
    { id: "b2", sourceNodeId: "representation", sourcePortId: "graph", targetNodeId: "augmentation", targetPortId: "graph" },
    { id: "b3", sourceNodeId: "augmentation", sourcePortId: "augmented", targetNodeId: "metrics", targetPortId: "graph" },
  ],
};
const baSweep: SweepDefinition = { id: "sweep-ba-pre-ba-a0", missionId: baMission.id, pipelineId: baPipeline.id, name: "Instrument-validation matrix", dimensions: { dataset: ["fixture:toy"], strategy: ["A0"], rho: [0.1, 0.25], seed: [0, 1, 42] }, status: "materialized" };

const wildMission: Mission = { id: "mission-wild-gad-multi-llm", projectId: "wild-gad-multi-llm", intentId: "intent-wild-gad-multi-llm", title: "Reproduce WILD-GAD selection across six language models", objective: "Re-run the inspected WILD-GAD selection matrix and quantify stability between 3000 and 4000 sampled embeddings.", researchActionRef: "RA-WILD-GAD-REPRODUCTION", protocolRef: "P-WILD-GAD-LEGACY-RECONSTRUCTION", hypothesisRefs: [], status: "blocked", createdAt: "2026-09-03T10:00:00Z" };
const wildPipeline: PipelineDefinition = {
  id: "pipeline-wild-gad-multi-llm", projectId: wildMission.projectId, name: "WILD-GAD Multi-LLM Selection", version: "0.4.0", protocolRef: wildMission.protocolRef, status: "validated",
  nodes: [
    { id: "dataset", componentId: "wild-graph-dataset", position: { x: 0, y: 80 }, configuration: { dataset: "$downstream" } },
    { id: "text", componentId: "wild-text-view", position: { x: 220, y: 80 }, configuration: {} },
    { id: "embedding", componentId: "wild-lm-embedding", position: { x: 440, y: 80 }, configuration: { model: "$model" } },
    { id: "selection", componentId: "wild-selection", position: { x: 680, y: 80 }, configuration: { eta: "$eta", topk: "$topk", maxRows: "$maxRows" } },
    { id: "stability", componentId: "wild-stability", position: { x: 930, y: 80 }, configuration: {} },
  ],
  edges: [
    { id: "w1", sourceNodeId: "dataset", sourcePortId: "dataset", targetNodeId: "text", targetPortId: "dataset" },
    { id: "w2", sourceNodeId: "text", sourcePortId: "text", targetNodeId: "embedding", targetPortId: "text" },
    { id: "w3", sourceNodeId: "embedding", sourcePortId: "embeddings", targetNodeId: "selection", targetPortId: "embeddings" },
    { id: "w4", sourceNodeId: "selection", sourcePortId: "ranking", targetNodeId: "stability", targetPortId: "ranking" },
  ],
};
const wildSweep: SweepDefinition = { id: "sweep-wild-gad-multi-llm", missionId: wildMission.id, pipelineId: wildPipeline.id, name: "Legacy seminar reproduction matrix", dimensions: { downstream: ["cora", "amazon_computers", "wikics", "pubmed", "webkb", "yelp_s50000", "reddit2_s50000"], model: ["mbert", "scibert", "roberta", "e5-small", "sbert-minilm", "sbert-specter"], eta: [0.5], topk: [3], maxRows: [3000, 4000], seed: [42] }, status: "materialized" };

export function referenceWorkbenchState(): WorkbenchState {
  const projects = [
    { id: baMission.projectId, name: "BA Hypergraph Augmentations", programId: "semantic-information-systems", repositoryPath: "research-programs/semantic-information-systems/projects/bachelor-hypergraph-augmentations", defaultBranch: "main", adapter: "python-cli" as const, adapterId: "ba-hypergraph-python-v1", profileId: "hypergraph-augmentations", status: "ready" as const, capabilities: ["hypergraph-analysis", "star-expansion", "uniform-incidence-removal", "structural-metrics", "experiment-runs"] },
    { id: wildMission.projectId, name: "WILD-GAD Multi-LLM Enhanced", programId: "semantic-information-systems", repositoryPath: "research-programs/semantic-information-systems/projects/WILD-GAD-multi-LLM-Enhanced", defaultBranch: "main", adapter: "python-cli" as const, adapterId: "wild-gad-multi-llm-python-v1", profileId: "embedding-space-analysis", status: "adapter-required" as const, capabilities: ["embedding-projections", "selection-matrix", "experiment-runs", "historical-import"] },
  ];
  const intents = [
    { schemaVersion: "1.0" as const, id: baMission.intentId, projectId: baMission.projectId, researchActionId: baMission.researchActionRef, protocolId: baMission.protocolRef, hypothesisIds: [], objective: baMission.objective, constraints: baSweep.dimensions, repositoryRef: { branch: "main" }, createdAt: baMission.createdAt },
    { schemaVersion: "1.0" as const, id: wildMission.intentId, projectId: wildMission.projectId, researchActionId: wildMission.researchActionRef, protocolId: wildMission.protocolRef, hypothesisIds: [], objective: wildMission.objective, constraints: wildSweep.dimensions, repositoryRef: { branch: "main" }, createdAt: wildMission.createdAt },
  ];
  return workbenchStateSchema.parse({ schemaVersion: "1.0", mode: "command", projects, intents, missions: [baMission, wildMission], components: referenceComponents, pipelines: [baPipeline, wildPipeline], sweeps: [baSweep, wildSweep], runs: [...materializeSweep(baSweep, baMission, []), ...materializeSweep(wildSweep, wildMission, [])], updatedAt: "2026-09-03T12:00:00Z" });
}
