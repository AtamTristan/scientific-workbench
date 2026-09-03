import { access } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { ProjectBinding, RunManifest } from "./schema";

const commandTokenSchema = z.string().min(1);
export const repositoryAdapterSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  source: z.enum(["ecosystem-contract", "inspected-legacy-code"]),
  requiredFiles: z.array(z.string().min(1)).min(1),
  environment: z.object({ type: z.enum(["conda", "venv", "system"]), name: z.string().optional() }),
  validateCommand: z.array(commandTokenSchema).min(1),
  runCommand: z.array(commandTokenSchema).min(1),
  outputPatterns: z.array(z.string().min(1)),
  notes: z.array(z.string()),
});

export type RepositoryAdapter = z.infer<typeof repositoryAdapterSchema>;
export type AdapterDiagnostic = {
  adapterId: string;
  projectId: string;
  repositoryPath: string;
  status: "ready" | "missing-repository" | "contract-mismatch";
  requiredFiles: Array<{ path: string; present: boolean }>;
  message: string;
};

const datasets = "cora amazon_computers wikics pubmed webkb yelp_s50000 reddit2_s50000";

export const repositoryAdapters: RepositoryAdapter[] = repositoryAdapterSchema.array().parse([
  {
    schemaVersion: "1.0",
    id: "ba-hypergraph-python-v1",
    projectId: "bachelor-hypergraph-augmentations",
    name: "BA Hypergraph Augmentations · Python CLI",
    source: "ecosystem-contract",
    requiredFiles: [".scientific/repository.json", "environment.yml", "src/hypergraph_ba/cli.py", "data/fixtures/toy_hypergraph.json"],
    environment: { type: "conda", name: "hypergraph-ba" },
    validateCommand: ["python", "-m", "hypergraph_ba.cli", "validate"],
    runCommand: ["python", "-m", "hypergraph_ba.cli", "run-plan", "--plan", "{plan}"],
    outputPatterns: ["reports/runs/{runId}/run-manifest.json", "reports/runs/{runId}/report.json", "reports/runs/{runId}/metrics.csv"],
    notes: [
      "Mapped to the executable Pre-BA reference repository and its Conda environment.",
      "The first matrix is instrument validation on a versioned toy hypergraph, not thesis evidence.",
    ],
  },
  {
    schemaVersion: "1.0",
    id: "wild-gad-multi-llm-python-v1",
    projectId: "wild-gad-multi-llm",
    name: "WILD-GAD Multi-LLM Enhanced · Legacy-compatible CLI",
    source: "inspected-legacy-code",
    requiredFiles: [
      "research/scripts/run_wildgad_selection.py",
      "research/scripts/workbench_adapter.py",
      "research/scripts/embed_with_lm.py",
      "research/scripts/cross_dataset_matrix_analysis.py",
      "research/configs/legacy-seminar.json",
    ],
    environment: { type: "conda", name: "wild-gad" },
    validateCommand: ["python", "research/scripts/smoke_test.py"],
    runCommand: ["python", "research/scripts/workbench_adapter.py", "--plan", "{plan}"],
    outputPatterns: ["outs/workbench/{runId}/*__ranked.csv", "outs/workbench/{runId}/*__top*.csv"],
    notes: [
      "Mapped from the inspected Research Gym scripts; no fresh reproduction is claimed.",
      `The repository wrapper maps plans to the inspected CLI with the fixed candidate set: ${datasets}.`,
      "Sampling inside the legacy selection script is fixed to seed 42.",
      "Self-selection is skipped by the original implementation.",
    ],
  },
]);

function workspaceRoot() {
  return path.resolve(process.env.SCIENTIFIC_WORKSPACE_ROOT ?? path.join(process.cwd(), ".."));
}

function resolveRepository(project: ProjectBinding) {
  const root = workspaceRoot();
  const workspaceRelative = project.repositoryPath.replace(/^(\.\.\/)+/, "");
  const candidate = path.resolve(/* turbopackIgnore: true */ root, workspaceRelative);
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Repository ${project.id} resolves outside SCIENTIFIC_WORKSPACE_ROOT.`);
  return candidate;
}

async function present(file: string) {
  try { await access(file); return true; } catch { return false; }
}

export async function inspectAdapter(project: ProjectBinding): Promise<AdapterDiagnostic | undefined> {
  const adapter = repositoryAdapters.find((candidate) => candidate.id === project.adapterId);
  if (!adapter) return undefined;
  const repositoryPath = resolveRepository(project);
  if (!await present(repositoryPath)) return {
    adapterId: adapter.id, projectId: project.id, repositoryPath, status: "missing-repository", requiredFiles: [],
    message: "Repository checkout is not present at the configured path.",
  };
  const requiredFiles = await Promise.all(adapter.requiredFiles.map(async (file) => ({ path: file, present: await present(path.join(/* turbopackIgnore: true */ repositoryPath, file)) })));
  const missing = requiredFiles.filter((file) => !file.present);
  return {
    adapterId: adapter.id, projectId: project.id, repositoryPath,
    status: missing.length ? "contract-mismatch" : "ready", requiredFiles,
    message: missing.length ? `Missing ${missing.map((file) => file.path).join(", ")}.` : "Repository adapter contract is satisfied.",
  };
}

export async function inspectAdapters(projects: ProjectBinding[]) {
  const diagnostics = await Promise.all(projects.map(inspectAdapter));
  return Object.fromEntries(diagnostics.filter(Boolean).map((diagnostic) => [diagnostic!.projectId, diagnostic!]));
}

export function createExperimentPlan(project: ProjectBinding, run: RunManifest) {
  const adapter = repositoryAdapters.find((candidate) => candidate.id === project.adapterId);
  if (!adapter) throw new Error(`Project ${project.id} has no registered adapter.`);
  const placeholders: Record<string, string> = { plan: `.scientific/plans/${run.id}.experiment-plan.json`, runId: run.id };
  for (const key of ["downstream", "model", "eta", "topk", "maxRows"]) {
    const found = run.configuration[key];
    if (found !== undefined) placeholders[key] = String(found);
  }
  const substitute = (token: string) => token.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_, key: string) => {
    if (!(key in placeholders)) throw new Error(`Unknown adapter placeholder {${key}}.`);
    return placeholders[key];
  });
  return {
    schemaVersion: "1.0" as const,
    id: `plan-${run.id}`,
    adapter: { id: adapter.id, version: adapter.schemaVersion, source: adapter.source },
    projectId: project.id,
    missionId: run.missionId,
    runId: run.id,
    pipelineId: run.pipelineId,
    sweepId: run.sweepId,
    configuration: run.configuration,
    expected: { outputPatterns: adapter.outputPatterns.map(substitute), runManifestVersion: "1.0" },
    invocation: { cwd: project.repositoryPath, validate: adapter.validateCommand, command: adapter.runCommand.map(substitute), environment: adapter.environment },
    generatedAt: new Date().toISOString(),
  };
}
