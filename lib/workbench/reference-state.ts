import { materializeSweep } from "./engine";
import {
  scientificComponentSchema,
  workbenchStateSchema,
  type Mission,
  type PipelineDefinition,
  type RunManifest,
  type ScientificComponent,
  type SweepDefinition,
  type WorkbenchState,
} from "./schema";

const port = (id: string, label: string, dataType: "hypergraph-dataset" | "graph-dataset" | "graph-text" | "star-expansion" | "augmented-incidence-graph" | "structural-metrics" | "trained-model" | "evaluation-metrics" | "embedding-space" | "selection-ranking" | "artifact-set", required = true) => ({ id, label, dataType, required });
const requiredPort = (id: string, label: string, dataType: Parameters<typeof port>[2]) => port(id, label, dataType, true);

export const referenceComponents: ScientificComponent[] = scientificComponentSchema.array().parse([
  { id: "hypergraph-dataset", type: "dataset", name: "Hypergraph Dataset", version: "1.0.0", description: "Versioned dataset reference and structural inventory.", inputs: [], outputs: [port("dataset", "Hypergraph", "hypergraph-dataset")], configurationSchema: { dataset: ["Cora", "Citeseer", "PubMed", "DBLP"] }, implementationRef: "adapters/datasets.py" },
  { id: "star-expansion", type: "representation", name: "Star Expansion", version: "1.0.0", description: "Information-preserving bipartite representation.", inputs: [requiredPort("dataset", "Hypergraph", "hypergraph-dataset")], outputs: [port("graph", "Star expansion", "star-expansion")], configurationSchema: {}, implementationRef: "src/representations/star_expansion.py" },
  { id: "incidence-augmentation", type: "augmentation", name: "Incidence Augmentation", version: "1.0.0", description: "Strategy-bound A0, A1 or A2 incidence transformation.", inputs: [requiredPort("graph", "Star expansion", "star-expansion")], outputs: [port("augmented", "Augmented graph", "augmented-incidence-graph")], configurationSchema: { strategy: ["A0", "A1", "A2"], rho: { minimum: 0, maximum: 1 }, seed: "integer" }, implementationRef: "src/augmentations/incidence.py" },
  { id: "structural-metrics", type: "metric", name: "Structural Metrics", version: "1.0.0", description: "Degree JSD, hyperedge W1, overlap, Gini and top-share.", inputs: [requiredPort("graph", "Augmented graph", "augmented-incidence-graph")], outputs: [port("metrics", "Structural metrics", "structural-metrics")], configurationSchema: { metrics: ["degreeJsd", "hyperedgeW1", "overlapJaccard", "giniDelta", "top10ShareDelta"] }, implementationRef: "src/metrics/structure.py" },
  { id: "supervised-model", type: "model", name: "Supervised Hypergraph Model", version: "1.0.0", description: "Simple supervised downstream evaluation model.", inputs: [requiredPort("graph", "Augmented graph", "augmented-incidence-graph")], outputs: [port("model", "Trained model", "trained-model")], configurationSchema: { architecture: ["HypergraphConv-2L"] }, implementationRef: "src/models/supervised.py" },
  { id: "macro-f1", type: "metric", name: "Macro-F1 Evaluation", version: "1.0.0", description: "Downstream performance evaluation.", inputs: [requiredPort("model", "Trained model", "trained-model")], outputs: [port("metrics", "Evaluation metrics", "evaluation-metrics")], configurationSchema: {}, implementationRef: "src/evaluation/classification.py" },
  { id: "structure-performance", type: "analysis", name: "Structure → Performance", version: "1.0.0", description: "Relates structural deltas to downstream performance without causal claims.", inputs: [requiredPort("structure", "Structural metrics", "structural-metrics"), requiredPort("performance", "Evaluation metrics", "evaluation-metrics")], outputs: [port("artifacts", "Analysis artifacts", "artifact-set")], configurationSchema: {}, implementationRef: "src/analysis/structure_performance.py" },
  { id: "wild-graph-dataset", type: "dataset", name: "Attributed Graph Dataset", version: "1.0.0", description: "Graph and node attributes prepared for the historical WILD-GAD study.", inputs: [], outputs: [port("dataset", "Attributed graph", "graph-dataset")], configurationSchema: { dataset: ["cora", "amazon_computers", "wikics", "pubmed", "webkb", "yelp_s50000", "reddit2_s50000"] }, implementationRef: "research/scripts/prepare_datasets.py" },
  { id: "wild-text-view", type: "representation", name: "Node Text View", version: "1.0.0", description: "Builds deterministic node-level text views from graph attributes.", inputs: [requiredPort("dataset", "Attributed graph", "graph-dataset")], outputs: [port("text", "Node text", "graph-text")], configurationSchema: {}, implementationRef: "research/scripts/build_text_views.py" },
  { id: "wild-lm-embedding", type: "model", name: "Language Model Encoder", version: "1.0.0", description: "Produces node embeddings with one of six inspected encoder configurations.", inputs: [requiredPort("text", "Node text", "graph-text")], outputs: [port("embeddings", "Embedding space", "embedding-space")], configurationSchema: { model: ["mbert", "scibert", "roberta", "e5-small", "sbert-minilm", "sbert-specter"] }, implementationRef: "research/scripts/embed_with_lm.py" },
  { id: "wild-selection", type: "analysis", name: "WILD-GAD Dataset Selection", version: "1.0.0", description: "Ranks candidate datasets using the original cal_distance_unlabeled score.", inputs: [requiredPort("embeddings", "Embedding space", "embedding-space")], outputs: [port("ranking", "Selection ranking", "selection-ranking")], configurationSchema: { eta: [0.5], topk: [3], maxRows: [3000, 4000] }, implementationRef: "research/scripts/run_wildgad_selection.py" },
  { id: "wild-stability", type: "metric", name: "Sampling Stability", version: "1.0.0", description: "Compares selection rankings across the historical 3000/4000 sampling budgets.", inputs: [requiredPort("ranking", "Selection ranking", "selection-ranking")], outputs: [port("artifacts", "Stability artifacts", "artifact-set")], configurationSchema: {}, implementationRef: "research/scripts/compare_sampling_stability.py" },
]);

const mission: Mission = {
  id: "mission-ba-reference",
  projectId: "ba-hypergraph-augmentations",
  intentId: "intent-ba-reference",
  title: "Compare A0, A1 and A2 under a fixed incidence budget",
  objective: "Compare structural preservation and downstream performance of A0, A1 and A2 across datasets, rho values and seeds.",
  researchActionRef: "RA-BA-REFERENCE",
  protocolRef: "P-BA-REFERENCE",
  hypothesisRefs: ["H-BA-STRUCTURE"],
  status: "active",
  createdAt: "2026-09-03T00:00:00Z",
};

const pipeline: PipelineDefinition = {
  id: "pipeline-ba-structure-performance",
  projectId: mission.projectId,
  name: "BA Structure → Performance",
  version: "0.2.0",
  protocolRef: mission.protocolRef,
  status: "validated",
  nodes: [
    { id: "dataset", componentId: "hypergraph-dataset", position: { x: 0, y: 80 }, configuration: { dataset: "$dataset" } },
    { id: "representation", componentId: "star-expansion", position: { x: 190, y: 80 }, configuration: {} },
    { id: "augmentation", componentId: "incidence-augmentation", position: { x: 380, y: 80 }, configuration: { strategy: "$strategy", rho: "$rho", seed: "$seed" } },
    { id: "structure", componentId: "structural-metrics", position: { x: 590, y: 10 }, configuration: {} },
    { id: "model", componentId: "supervised-model", position: { x: 590, y: 150 }, configuration: { architecture: "HypergraphConv-2L" } },
    { id: "evaluation", componentId: "macro-f1", position: { x: 790, y: 150 }, configuration: {} },
    { id: "analysis", componentId: "structure-performance", position: { x: 990, y: 80 }, configuration: {} },
  ],
  edges: [
    { id: "e1", sourceNodeId: "dataset", sourcePortId: "dataset", targetNodeId: "representation", targetPortId: "dataset" },
    { id: "e2", sourceNodeId: "representation", sourcePortId: "graph", targetNodeId: "augmentation", targetPortId: "graph" },
    { id: "e3", sourceNodeId: "augmentation", sourcePortId: "augmented", targetNodeId: "structure", targetPortId: "graph" },
    { id: "e4", sourceNodeId: "augmentation", sourcePortId: "augmented", targetNodeId: "model", targetPortId: "graph" },
    { id: "e5", sourceNodeId: "model", sourcePortId: "model", targetNodeId: "evaluation", targetPortId: "model" },
    { id: "e6", sourceNodeId: "structure", sourcePortId: "metrics", targetNodeId: "analysis", targetPortId: "structure" },
    { id: "e7", sourceNodeId: "evaluation", sourcePortId: "metrics", targetNodeId: "analysis", targetPortId: "performance" },
  ],
};

const sweep: SweepDefinition = {
  id: "sweep-ba-reference",
  missionId: mission.id,
  pipelineId: pipeline.id,
  name: "Reference matrix",
  dimensions: { dataset: ["Cora", "Citeseer"], strategy: ["A0", "A1", "A2"], rho: [0.05, 0.1], seed: [0, 1, 2] },
  status: "materialized",
};

const wildMission: Mission = {
  id: "mission-wild-gad-multi-llm",
  projectId: "wild-gad-multi-llm",
  intentId: "intent-wild-gad-multi-llm",
  title: "Reproduce WILD-GAD selection across six language models",
  objective: "Re-run the inspected WILD-GAD candidate-selection matrix and quantify stability between 3000 and 4000 sampled embeddings.",
  researchActionRef: "RA-WILD-GAD-REPRODUCTION",
  protocolRef: "P-WILD-GAD-LEGACY-RECONSTRUCTION",
  hypothesisRefs: [],
  status: "blocked",
  createdAt: "2026-09-03T10:00:00Z",
};

const wildPipeline: PipelineDefinition = {
  id: "pipeline-wild-gad-multi-llm",
  projectId: wildMission.projectId,
  name: "WILD-GAD Multi-LLM Selection",
  version: "0.3.0",
  protocolRef: wildMission.protocolRef,
  status: "validated",
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

const wildSweep: SweepDefinition = {
  id: "sweep-wild-gad-multi-llm",
  missionId: wildMission.id,
  pipelineId: wildPipeline.id,
  name: "Legacy seminar reproduction matrix",
  dimensions: {
    downstream: ["cora", "amazon_computers", "wikics", "pubmed", "webkb", "yelp_s50000", "reddit2_s50000"],
    model: ["mbert", "scibert", "roberta", "e5-small", "sbert-minilm", "sbert-specter"],
    eta: [0.5], topk: [3], maxRows: [3000, 4000], seed: [42],
  },
  status: "materialized",
};

function referenceRuns(): RunManifest[] {
  const runs = materializeSweep(sweep, mission, []);
  const scoreByStrategy = { A0: 0.742, A1: 0.756, A2: 0.769 };
  for (const [index, run] of runs.entries()) {
    if (index >= 15) continue;
    const strategy = String(run.configuration.strategy) as keyof typeof scoreByStrategy;
    const rho = Number(run.configuration.rho);
    const seed = Number(run.configuration.seed);
    run.status = index === 13 ? "failed" : "completed";
    run.gitCommit = "81e9a4fc6b2";
    run.configRef = `configs/reference/${String(run.configuration.dataset).toLowerCase()}-${strategy.toLowerCase()}-${rho}-${seed}.yaml`;
    run.environment = index === 4 ? undefined : "uv.lock@sha256:reference-fixture";
    run.startedAt = `2026-09-03T00:${String(index).padStart(2, "0")}:00Z`;
    run.completedAt = run.status === "completed" ? `2026-09-03T00:${String(index + 1).padStart(2, "0")}:00Z` : undefined;
    run.logRef = `logs/${run.id}.log`;
    if (run.status === "completed") {
      run.metrics = {
        degreeJsd: Number((0.082 - (scoreByStrategy[strategy] - 0.74) + seed * 0.002).toFixed(3)),
        hyperedgeW1: Number((2.1 - (scoreByStrategy[strategy] - 0.74) * 12 + rho * 2).toFixed(3)),
        macroF1: Number((scoreByStrategy[strategy] - rho * 0.04 + seed * 0.003).toFixed(3)),
        budgetDelta: index === 10 ? 1 : 0,
      };
      run.artifacts = [{ id: `${run.id}-metrics`, role: "raw-metrics", uri: `reports/${run.id}.json`, mediaType: "application/json", sha256: "0".repeat(64) }];
    }
  }
  return runs;
}

export function referenceWorkbenchState(): WorkbenchState {
  return workbenchStateSchema.parse({
    schemaVersion: "1.0",
    mode: "command",
    projects: [
      { id: mission.projectId, name: "BA Hypergraph Augmentations", repositoryPath: "../bachelor-hypergraph-augmentations", defaultBranch: "main", adapter: "python-cli", adapterId: "ba-hypergraph-python-v1", profileId: "hypergraph-augmentations", status: "adapter-required", capabilities: ["plan", "validate", "local-execution", "import-runs", "export-results"] },
      { id: wildMission.projectId, name: "WILD-GAD Multi-LLM Enhanced", repositoryPath: "../WILD-GAD-multi-LLM-Enhanced", defaultBranch: "main", adapter: "python-cli", adapterId: "wild-gad-multi-llm-python-v1", profileId: "embedding-space-analysis", status: "adapter-required", capabilities: ["plan", "validate", "selection-matrix", "historical-import", "export-results"] },
    ],
    intents: [
      { schemaVersion: "1.0", id: mission.intentId, projectId: mission.projectId, researchActionId: mission.researchActionRef, protocolId: mission.protocolRef, hypothesisIds: mission.hypothesisRefs, objective: mission.objective, constraints: sweep.dimensions, repositoryRef: { branch: "main" }, createdAt: mission.createdAt },
      { schemaVersion: "1.0", id: wildMission.intentId, projectId: wildMission.projectId, researchActionId: wildMission.researchActionRef, protocolId: wildMission.protocolRef, hypothesisIds: [], objective: wildMission.objective, constraints: wildSweep.dimensions, repositoryRef: { branch: "main" }, createdAt: wildMission.createdAt },
    ],
    missions: [mission, wildMission],
    components: referenceComponents,
    pipelines: [pipeline, wildPipeline],
    sweeps: [sweep, wildSweep],
    runs: [...referenceRuns(), ...materializeSweep(wildSweep, wildMission, [])],
    updatedAt: "2026-09-03T00:20:00Z",
  });
}
