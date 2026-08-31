import { z } from "zod";

export const artifactTypeSchema = z.enum([
  "embedding-space",
  "scatter",
  "graph",
  "hypergraph",
  "distribution",
  "matrix",
]);

export const scientificVisualizationArtifactSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().min(1),
  type: artifactTypeSchema,
  title: z.string().min(1),
  description: z.string().default(""),
  source: z.object({
    projectId: z.string().min(1),
    experimentId: z.string().optional(),
    runId: z.string().optional(),
  }),
  data: z.record(z.string(), z.string()),
  visualization: z.object({
    renderer: z.string().min(1),
    dimensions: z.number().int().positive().optional(),
    defaults: z.record(z.string(), z.unknown()).optional(),
  }),
  provenance: z.object({
    createdAt: z.string(),
    generatedBy: z.string(),
    claimStatus: z.enum(["demo", "exploratory", "controlled", "robust"]),
  }),
});

export type ScientificVisualizationArtifact = z.infer<
  typeof scientificVisualizationArtifactSchema
>;

export function parseArtifact(input: unknown) {
  return scientificVisualizationArtifactSchema.safeParse(input);
}

