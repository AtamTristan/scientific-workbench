import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { executionResult, materializeSweep, missionFromIntent, runIntegrity, scanAnomalies, sweepCombinations, validatePipeline } from "./engine";
import { referenceWorkbenchState } from "./reference-state";
import { workbenchStateSchema, type WorkbenchAction, type WorkbenchState } from "./schema";
import { inspectAdapters } from "./adapters";

const dataDirectory = process.env.SCIENTIFIC_WORKBENCH_DATA_DIR
  ? path.resolve(process.env.SCIENTIFIC_WORKBENCH_DATA_DIR)
  : path.resolve(process.cwd(), ".data");
const statePath = path.join(dataDirectory, "workbench-state.json");
let mutationQueue: Promise<unknown> = Promise.resolve();

async function persist(state: WorkbenchState) {
  await mkdir(dataDirectory, { recursive: true });
  const next = workbenchStateSchema.parse({ ...state, updatedAt: new Date().toISOString() });
  const temporary = `${statePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await rename(temporary, statePath);
  return next;
}

export async function readWorkbenchState(): Promise<WorkbenchState> {
  try {
    const state = workbenchStateSchema.parse(JSON.parse(await readFile(statePath, "utf8")));
    const adapterRuntimePresent = state.projects.every((project) => project.adapterId)
      && state.pipelines.some((pipeline) => pipeline.id === "pipeline-wild-gad-multi-llm");
    if (adapterRuntimePresent) return state;
    const reference = referenceWorkbenchState();
    const mergeById = <T extends { id: string }>(current: T[], defaults: T[]) => [
      ...current,
      ...defaults.filter((candidate) => !current.some((item) => item.id === candidate.id)),
    ];
    return persist({
      ...state,
      projects: [
        ...reference.projects.map((project) => ({ ...state.projects.find((candidate) => candidate.id === project.id), ...project })),
        ...state.projects.filter((project) => !reference.projects.some((candidate) => candidate.id === project.id)),
      ],
      intents: mergeById(state.intents, reference.intents),
      missions: mergeById(state.missions, reference.missions),
      components: mergeById(state.components, reference.components),
      pipelines: mergeById(state.pipelines, reference.pipelines),
      sweeps: mergeById(state.sweeps, reference.sweeps),
      runs: mergeById(state.runs, reference.runs),
    });
  } catch (error) {
    const missing = error && typeof error === "object" && "code" in error && error.code === "ENOENT";
    if (!missing) console.warn("Workbench state was invalid and has been replaced with the reference state.", error);
    return persist(referenceWorkbenchState());
  }
}

export async function applyWorkbenchAction(action: WorkbenchAction) {
  const operation = mutationQueue.then(async () => {
    if (action.type === "reset-reference-state") return persist(referenceWorkbenchState());
    const state = await readWorkbenchState();
    if (action.type === "set-mode") return persist({ ...state, mode: action.mode });
    if (action.type === "import-intent") {
      const existing = state.intents.some((intent) => intent.id === action.intent.id);
      if (existing) throw new Error(`ExperimentIntent ${action.intent.id} already exists.`);
      const mission = missionFromIntent(action.intent);
      return persist({ ...state, intents: [...state.intents, action.intent], missions: [...state.missions, mission] });
    }
    if (action.type === "import-run-manifest") {
      const planned = state.runs.find((run) => run.id === action.run.id);
      if (!planned) throw new Error(`Run ${action.run.id} was not planned by this Workbench.`);
      for (const key of ["missionId", "projectId", "pipelineId", "sweepId"] as const) {
        if (planned[key] !== action.run[key]) throw new Error(`Run ${action.run.id} has a mismatched ${key}.`);
      }
      return persist({ ...state, runs: state.runs.map((run) => run.id === action.run.id ? action.run : run) });
    }
    const sweep = state.sweeps.find((candidate) => candidate.id === action.sweepId);
    if (!sweep) throw new Error(`Sweep ${action.sweepId} does not exist.`);
    const mission = state.missions.find((candidate) => candidate.id === sweep.missionId);
    if (!mission) throw new Error(`Mission ${sweep.missionId} does not exist.`);
    const retained = state.runs.filter((run) => run.sweepId !== sweep.id);
    const materialized = materializeSweep(sweep, mission, state.runs.filter((run) => run.sweepId === sweep.id));
    return persist({
      ...state,
      sweeps: state.sweeps.map((candidate) => candidate.id === sweep.id ? { ...candidate, status: "materialized" as const } : candidate),
      runs: [...retained, ...materialized],
    });
  });
  mutationQueue = operation.catch(() => undefined);
  return operation;
}

export async function workbenchSnapshot() {
  const state = await readWorkbenchState();
  const adapterDiagnostics = await inspectAdapters(state.projects);
  const pipelineIssues = Object.fromEntries(state.pipelines.map((pipeline) => [pipeline.id, validatePipeline(pipeline, state.components)]));
  const sweepSizes = Object.fromEntries(state.sweeps.map((sweep) => [sweep.id, sweepCombinations(sweep.dimensions).length]));
  const integrity = Object.fromEntries(state.runs.map((run) => [run.id, runIntegrity(run)]));
  const anomalies = scanAnomalies(state.runs);
  const totals = {
    planned: state.runs.length,
    completed: state.runs.filter((run) => run.status === "completed").length,
    failed: state.runs.filter((run) => run.status === "failed").length,
    running: state.runs.filter((run) => run.status === "running").length,
    validPipelines: state.pipelines.filter((pipeline) => pipelineIssues[pipeline.id]?.length === 0).length,
  };
  return { ...state, derived: { pipelineIssues, sweepSizes, integrity, anomalies, totals, adapterDiagnostics } };
}

export async function exportedExecutionResult(missionId: string) {
  const state = await readWorkbenchState();
  const mission = state.missions.find((candidate) => candidate.id === missionId);
  if (!mission) throw new Error(`Mission ${missionId} does not exist.`);
  const sweep = state.sweeps.find((candidate) => candidate.missionId === missionId);
  if (!sweep) throw new Error(`Mission ${missionId} has no sweep.`);
  const pipeline = state.pipelines.find((candidate) => candidate.id === sweep.pipelineId);
  if (!pipeline) throw new Error(`Pipeline ${sweep.pipelineId} does not exist.`);
  return executionResult(mission, pipeline, sweep, state.runs);
}

export type WorkbenchSnapshot = Awaited<ReturnType<typeof workbenchSnapshot>>;
