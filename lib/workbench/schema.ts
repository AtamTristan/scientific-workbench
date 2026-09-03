import { z } from "zod";

export const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);

export const dataTypeSchema = z.enum([
  "hypergraph-dataset", "graph-dataset", "star-expansion", "augmented-incidence-graph",
  "graph-text", "structural-metrics", "trained-model", "evaluation-metrics", "embedding-space",
  "selection-ranking", "artifact-set", "any",
]);

export const componentTypeSchema = z.enum([
  "dataset", "representation", "augmentation", "model", "metric", "analysis", "visualization",
]);

export const portSchema = z.object({
  id: z.string().min(1), label: z.string().min(1), dataType: dataTypeSchema, required: z.boolean().default(true),
});

export const scientificComponentSchema = z.object({
  id: z.string().min(1),
  type: componentTypeSchema,
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().default(""),
  inputs: z.array(portSchema),
  outputs: z.array(portSchema),
  configurationSchema: z.record(z.string(), z.unknown()).default({}),
  implementationRef: z.string().optional(),
});

export const pipelineNodeSchema = z.object({
  id: z.string().min(1),
  componentId: z.string().min(1),
  position: z.object({ x: z.number(), y: z.number() }),
  configuration: z.record(z.string(), z.unknown()).default({}),
});

export const pipelineEdgeSchema = z.object({
  id: z.string().min(1), sourceNodeId: z.string().min(1), sourcePortId: z.string().min(1),
  targetNodeId: z.string().min(1), targetPortId: z.string().min(1),
});

export const pipelineDefinitionSchema = z.object({
  id: z.string().min(1), projectId: z.string().min(1), name: z.string().min(1), version: z.string().min(1),
  protocolRef: z.string().optional(), nodes: z.array(pipelineNodeSchema).min(1), edges: z.array(pipelineEdgeSchema),
  status: z.enum(["draft", "validated"]),
});

export const projectBindingSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), repositoryPath: z.string().min(1),
  repositoryUrl: z.string().url().optional(), defaultBranch: z.string().min(1),
  adapter: z.enum(["fixture", "python-cli", "external"]),
  adapterId: z.string().min(1).optional(), profileId: z.string().min(1).optional(),
  status: z.enum(["ready", "adapter-required", "unavailable"]), capabilities: z.array(z.string()),
});

export const experimentIntentSchema = z.object({
  schemaVersion: z.literal("1.0"), id: z.string().min(1), projectId: z.string().min(1),
  researchActionId: z.string().min(1), protocolId: z.string().min(1), hypothesisIds: z.array(z.string()).default([]),
  objective: z.string().min(1), constraints: z.record(z.string(), z.array(scalarSchema).min(1)),
  repositoryRef: z.object({ branch: z.string().min(1), commit: z.string().optional() }),
  createdAt: z.string().datetime({ offset: true }),
});

export const missionSchema = z.object({
  id: z.string().min(1), projectId: z.string().min(1), intentId: z.string().min(1),
  title: z.string().min(1), objective: z.string().min(1), researchActionRef: z.string().min(1),
  protocolRef: z.string().min(1), hypothesisRefs: z.array(z.string()),
  status: z.enum(["draft", "ready", "active", "completed", "blocked"]),
  createdAt: z.string().datetime({ offset: true }),
});

export const sweepDefinitionSchema = z.object({
  id: z.string().min(1), missionId: z.string().min(1), pipelineId: z.string().min(1), name: z.string().min(1),
  dimensions: z.record(z.string(), z.array(scalarSchema).min(1)),
  status: z.enum(["draft", "materialized", "running", "completed"]),
});

export const artifactReferenceSchema = z.object({
  id: z.string().min(1), role: z.string().min(1), uri: z.string().min(1), mediaType: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export const runManifestSchema = z.object({
  schemaVersion: z.literal("1.0"), id: z.string().min(1), missionId: z.string().min(1),
  pipelineId: z.string().min(1), sweepId: z.string().min(1), projectId: z.string().min(1),
  status: z.enum(["planned", "running", "completed", "failed", "cancelled"]),
  configuration: z.record(z.string(), scalarSchema), seed: z.number().int().optional(),
  gitCommit: z.string().regex(/^[a-f0-9]{7,40}$/).optional(), configRef: z.string().optional(),
  environment: z.string().optional(), startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(), metrics: z.record(z.string(), z.number()).default({}),
  artifacts: z.array(artifactReferenceSchema).default([]), logRef: z.string().optional(),
});

export const workbenchStateSchema = z.object({
  schemaVersion: z.literal("1.0"), mode: z.enum(["professional", "command"]),
  projects: z.array(projectBindingSchema), intents: z.array(experimentIntentSchema), missions: z.array(missionSchema),
  components: z.array(scientificComponentSchema), pipelines: z.array(pipelineDefinitionSchema),
  sweeps: z.array(sweepDefinitionSchema), runs: z.array(runManifestSchema),
  updatedAt: z.string().datetime({ offset: true }),
});

export const workbenchActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("set-mode"), mode: z.enum(["professional", "command"]) }),
  z.object({ type: z.literal("materialize-sweep"), sweepId: z.string().min(1) }),
  z.object({ type: z.literal("import-intent"), intent: experimentIntentSchema }),
  z.object({ type: z.literal("import-run-manifest"), run: runManifestSchema }),
  z.object({ type: z.literal("reset-reference-state") }),
]);

export type ScientificComponent = z.infer<typeof scientificComponentSchema>;
export type PipelineDefinition = z.infer<typeof pipelineDefinitionSchema>;
export type ProjectBinding = z.infer<typeof projectBindingSchema>;
export type ExperimentIntent = z.infer<typeof experimentIntentSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type SweepDefinition = z.infer<typeof sweepDefinitionSchema>;
export type ArtifactReference = z.infer<typeof artifactReferenceSchema>;
export type RunManifest = z.infer<typeof runManifestSchema>;
export type WorkbenchState = z.infer<typeof workbenchStateSchema>;
export type WorkbenchAction = z.infer<typeof workbenchActionSchema>;
