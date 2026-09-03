import type { ExperimentIntent, Mission, PipelineDefinition, RunManifest, ScientificComponent, SweepDefinition } from "./schema";

export type PipelineIssue = { code: string; nodeId?: string; edgeId?: string; message: string };
export type IntegrityCheck = { id: string; label: string; passed: boolean; required: boolean };
export type RunIntegrity = { runId: string; score: number; checks: IntegrityCheck[] };
export type Anomaly = { id: string; runId: string; severity: "info" | "warning" | "critical"; code: string; message: string };

export function validatePipeline(pipeline: PipelineDefinition, components: ScientificComponent[]): PipelineIssue[] {
  const issues: PipelineIssue[] = [];
  const componentById = new Map(components.map((component) => [component.id, component]));
  const nodeById = new Map(pipeline.nodes.map((node) => [node.id, node]));
  const incoming = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of pipeline.nodes) {
    if (!componentById.has(node.componentId)) issues.push({ code: "COMPONENT_MISSING", nodeId: node.id, message: `Component ${node.componentId} is not registered.` });
    adjacency.set(node.id, []);
  }

  for (const edge of pipeline.edges) {
    const sourceNode = nodeById.get(edge.sourceNodeId);
    const targetNode = nodeById.get(edge.targetNodeId);
    if (!sourceNode || !targetNode) {
      issues.push({ code: "NODE_MISSING", edgeId: edge.id, message: "Edge references a node that does not exist." });
      continue;
    }
    const sourceComponent = componentById.get(sourceNode.componentId);
    const targetComponent = componentById.get(targetNode.componentId);
    const sourcePort = sourceComponent?.outputs.find((port) => port.id === edge.sourcePortId);
    const targetPort = targetComponent?.inputs.find((port) => port.id === edge.targetPortId);
    if (!sourcePort || !targetPort) {
      issues.push({ code: "PORT_MISSING", edgeId: edge.id, message: "Edge references a port that does not exist." });
      continue;
    }
    if (sourcePort.dataType !== targetPort.dataType && sourcePort.dataType !== "any" && targetPort.dataType !== "any") {
      issues.push({ code: "TYPE_MISMATCH", edgeId: edge.id, message: `${sourcePort.dataType} cannot connect to ${targetPort.dataType}.` });
    }
    const targetKey = `${edge.targetNodeId}:${edge.targetPortId}`;
    incoming.set(targetKey, (incoming.get(targetKey) ?? 0) + 1);
    adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  }

  for (const node of pipeline.nodes) {
    const component = componentById.get(node.componentId);
    for (const port of component?.inputs ?? []) {
      const count = incoming.get(`${node.id}:${port.id}`) ?? 0;
      if (port.required && count === 0) issues.push({ code: "INPUT_MISSING", nodeId: node.id, message: `${component?.name ?? node.componentId} requires ${port.label}.` });
      if (count > 1) issues.push({ code: "INPUT_DUPLICATED", nodeId: node.id, message: `${port.label} accepts only one connection.` });
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) if (visit(next)) return true;
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  if (pipeline.nodes.some((node) => visit(node.id))) issues.push({ code: "CYCLE", message: "Pipeline must be acyclic." });
  return issues;
}

export function sweepCombinations(dimensions: SweepDefinition["dimensions"]): Array<Record<string, string | number | boolean>> {
  return Object.entries(dimensions).reduce<Array<Record<string, string | number | boolean>>>((combinations, [key, values]) => (
    combinations.flatMap((combination) => values.map((value) => ({ ...combination, [key]: value })))
  ), [{}]);
}

export function materializeSweep(sweep: SweepDefinition, mission: Mission, existingRuns: RunManifest[]): RunManifest[] {
  const existingById = new Map(existingRuns.map((run) => [run.id, run]));
  return sweepCombinations(sweep.dimensions).map((configuration, index) => {
    const id = `${sweep.id}-run-${String(index + 1).padStart(3, "0")}`;
    return existingById.get(id) ?? {
      schemaVersion: "1.0",
      id,
      missionId: mission.id,
      pipelineId: sweep.pipelineId,
      sweepId: sweep.id,
      projectId: mission.projectId,
      status: "planned",
      configuration,
      seed: typeof configuration.seed === "number" ? configuration.seed : undefined,
      metrics: {},
      artifacts: [],
    };
  });
}

export function runIntegrity(run: RunManifest): RunIntegrity {
  const executed = run.status === "completed" || run.status === "failed";
  const checks: IntegrityCheck[] = [
    { id: "seed", label: "Seed recorded", passed: run.seed !== undefined, required: true },
    { id: "commit", label: "Git commit recorded", passed: Boolean(run.gitCommit), required: executed },
    { id: "config", label: "Config reference recorded", passed: Boolean(run.configRef), required: executed },
    { id: "environment", label: "Environment recorded", passed: Boolean(run.environment), required: executed },
    { id: "metrics", label: "Raw metrics present", passed: Object.keys(run.metrics).length > 0, required: run.status === "completed" },
    { id: "artifacts", label: "Artifact references present", passed: run.artifacts.length > 0, required: run.status === "completed" },
  ];
  const required = checks.filter((check) => check.required);
  const score = required.length ? Math.round((required.filter((check) => check.passed).length / required.length) * 100) : 100;
  return { runId: run.id, score, checks };
}

export function scanAnomalies(runs: RunManifest[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  for (const run of runs) {
    if (run.status === "failed") anomalies.push({ id: `${run.id}:failed`, runId: run.id, severity: "critical", code: "RUN_FAILED", message: "Execution failed; inspect the linked log." });
    if (run.status === "completed") {
      const integrity = runIntegrity(run);
      if (integrity.score < 100) anomalies.push({ id: `${run.id}:integrity`, runId: run.id, severity: "warning", code: "INCOMPLETE_PROVENANCE", message: `Run integrity is ${integrity.score}%.` });
      if (Math.abs(run.metrics.budgetDelta ?? 0) > 0) anomalies.push({ id: `${run.id}:budget`, runId: run.id, severity: "critical", code: "BUDGET_INVARIANT", message: "Observed incidence budget differs from the configured budget." });
    }
  }

  const completed = runs.filter((run) => run.status === "completed" && Number.isFinite(run.metrics.macroF1));
  if (completed.length >= 4) {
    const values = completed.map((run) => run.metrics.macroF1);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
    if (deviation > 0) for (const run of completed) {
      const z = Math.abs((run.metrics.macroF1 - mean) / deviation);
      if (z >= 2) anomalies.push({ id: `${run.id}:macro-f1`, runId: run.id, severity: "warning", code: "METRIC_OUTLIER", message: `Macro-F1 deviates ${z.toFixed(1)}σ from completed sibling runs.` });
    }
  }
  return anomalies;
}

export function missionFromIntent(intent: ExperimentIntent): Mission {
  return {
    id: `mission-${intent.id}`,
    projectId: intent.projectId,
    intentId: intent.id,
    title: intent.objective.length > 72 ? `${intent.objective.slice(0, 69)}…` : intent.objective,
    objective: intent.objective,
    researchActionRef: intent.researchActionId,
    protocolRef: intent.protocolId,
    hypothesisRefs: intent.hypothesisIds,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

export function executionResult(mission: Mission, pipeline: PipelineDefinition, sweep: SweepDefinition, runs: RunManifest[]) {
  return {
    schemaVersion: "1.0" as const,
    missionId: mission.id,
    projectId: mission.projectId,
    researchActionId: mission.researchActionRef,
    protocolId: mission.protocolRef,
    pipeline: { id: pipeline.id, version: pipeline.version },
    sweep: { id: sweep.id, status: sweep.status },
    generatedAt: new Date().toISOString(),
    runs: runs.filter((run) => run.missionId === mission.id).map((run) => ({
      runId: run.id, status: run.status, configuration: run.configuration, gitCommit: run.gitCommit,
      configRef: run.configRef, artifacts: run.artifacts, metrics: run.metrics, integrity: runIntegrity(run).score,
    })),
  };
}
