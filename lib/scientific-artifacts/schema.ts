import { z } from "zod";

export const artifactTypeSchema = z.enum([
  "embedding-space",
  "scatter",
  "graph",
  "hypergraph",
  "distribution",
  "matrix",
]);

const artifactFields = {
  id: z.string().min(1),
  type: artifactTypeSchema,
  title: z.string().min(1),
  description: z.string().default(""),
  source: z.object({
    projectId: z.string().min(1),
    experimentId: z.string().optional(),
    runId: z.string().optional(),
  }),
  visualization: z.object({
    renderer: z.string().min(1),
    dimensions: z.number().int().positive().optional(),
    defaults: z.record(z.string(), z.unknown()).optional(),
  }),
  provenance: z.object({
    createdAt: z.string().datetime({ offset: true }),
    generatedBy: z.string(),
    claimStatus: z.enum(["demo", "exploratory", "controlled", "robust"]),
  }),
};

export const assetReferenceSchema = z.object({
  uri: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  mediaType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export const scientificVisualizationArtifactSchema = z.discriminatedUnion("schemaVersion", [
  z.object({ schemaVersion: z.literal("1.0"), ...artifactFields, data: z.record(z.string(), z.string()) }),
  z.object({ schemaVersion: z.literal("1.1"), ...artifactFields, data: z.record(z.string(), assetReferenceSchema) }),
]);

export const supportedArtifactSchemaVersions = ["1.0", "1.1"] as const;

export function unsupportedArtifactVersion(input: unknown): string | null {
  if (!input || typeof input !== "object" || !("schemaVersion" in input)) return null;
  const version = String((input as { schemaVersion?: unknown }).schemaVersion);
  return supportedArtifactSchemaVersions.includes(version as "1.0" | "1.1") ? null : version;
}

export type ScientificVisualizationArtifact = z.infer<
  typeof scientificVisualizationArtifactSchema
>;

export function parseArtifact(input: unknown) {
  return scientificVisualizationArtifactSchema.safeParse(input);
}
