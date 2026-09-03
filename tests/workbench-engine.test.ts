import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { executionResult, runIntegrity, scanAnomalies, sweepCombinations, validatePipeline } from "../lib/workbench/engine";
import { referenceWorkbenchState } from "../lib/workbench/reference-state";
import { experimentIntentSchema, pipelineDefinitionSchema } from "../lib/workbench/schema";
import { createExperimentPlan, repositoryAdapterSchema, repositoryAdapters } from "../lib/workbench/adapters";

test("reference pipeline validates typed ports and topology", () => {
  const state = referenceWorkbenchState();
  for (const pipeline of state.pipelines) assert.deepEqual(validatePipeline(pipeline, state.components), []);
});

test("both repository adapters satisfy the versioned adapter contract", () => {
  assert.equal(repositoryAdapters.length, 2);
  for (const adapter of repositoryAdapters) assert.equal(repositoryAdapterSchema.safeParse(adapter).success, true);
});

test("BA adapter emits the repository-owned thesis plan invocation", () => {
  const state = referenceWorkbenchState();
  const project = state.projects.find((candidate) => candidate.id === "ba-hypergraph-augmentations")!;
  const run = state.runs.find((candidate) => candidate.projectId === project.id)!;
  const plan = createExperimentPlan(project, run);
  assert.deepEqual(plan.invocation.command.slice(0, 4), ["python", "-m", "thesis.run", "--plan"]);
  assert.equal(plan.invocation.command[4], `.scientific/plans/${run.id}.experiment-plan.json`);
});

test("WILD-GAD adapter maps inspected CLI parameters without shell interpolation", () => {
  const state = referenceWorkbenchState();
  const project = state.projects.find((candidate) => candidate.id === "wild-gad-multi-llm")!;
  const run = state.runs.find((candidate) => candidate.projectId === project.id)!;
  const plan = createExperimentPlan(project, run);
  assert.equal(plan.invocation.command[1], "research/scripts/workbench_adapter.py");
  assert.equal(plan.invocation.command[2], "--plan");
  assert.equal(plan.invocation.command[3], `.scientific/plans/${run.id}.experiment-plan.json`);
  assert.equal(plan.configuration.seed, 42);
});

test("pipeline validation rejects a type mismatch", () => {
  const state = referenceWorkbenchState();
  const pipeline = pipelineDefinitionSchema.parse(structuredClone(state.pipelines[0]));
  pipeline.edges[1] = { id: "bad-edge", sourceNodeId: "representation", sourcePortId: "graph", targetNodeId: "structure", targetPortId: "graph" };
  assert.ok(validatePipeline(pipeline, state.components).some((issue) => issue.code === "TYPE_MISMATCH"));
});

test("reference sweep materializes the complete deterministic matrix", () => {
  const state = referenceWorkbenchState();
  const combinations = sweepCombinations(state.sweeps[0].dimensions);
  assert.equal(combinations.length, 36);
  assert.deepEqual(combinations[0], { dataset: "Cora", strategy: "A0", rho: 0.05, seed: 0 });
  assert.deepEqual(combinations.at(-1), { dataset: "Citeseer", strategy: "A2", rho: 0.1, seed: 2 });
});

test("integrity and anomaly scanning remain operational, not epistemic", () => {
  const state = referenceWorkbenchState();
  const incomplete = state.runs.find((run) => run.status === "completed" && !run.environment);
  assert.ok(incomplete);
  assert.ok(runIntegrity(incomplete).score < 100);
  const anomalies = scanAnomalies(state.runs);
  assert.ok(anomalies.some((anomaly) => anomaly.code === "RUN_FAILED"));
  assert.ok(anomalies.some((anomaly) => anomaly.code === "BUDGET_INVARIANT"));
  assert.ok(anomalies.every((anomaly) => !("finding" in anomaly) && !("evidenceRole" in anomaly)));
});

test("ExecutionResult exports references and raw metrics without Findings", () => {
  const state = referenceWorkbenchState();
  const result = executionResult(state.missions[0], state.pipelines[0], state.sweeps[0], state.runs);
  assert.equal(result.runs.length, 36);
  assert.ok(result.runs.some((run) => Object.keys(run.metrics).length > 0));
  assert.equal("findings" in result, false);
  assert.equal("evidenceRoles" in result, false);
});

test("example ExperimentIntent satisfies the handoff contract", async () => {
  const raw = await readFile(new URL("../examples/experiment-intent.ba-reference.json", import.meta.url), "utf8");
  assert.equal(experimentIntentSchema.safeParse(JSON.parse(raw)).success, true);
});
