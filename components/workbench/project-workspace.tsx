"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity, AlertTriangle, ArrowRight, Boxes, Braces, Check, CheckCircle2, CircleDot,
  Download, ExternalLink, FileJson, FlaskConical, Gauge, GitCommit, Import, Layers3,
  Play, RefreshCw, ScanSearch, ServerCog, ShieldCheck, Table2, Workflow, XCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { wildGadExampleArtifact as wildGadArtifact } from "@/examples/artifacts/wild-gad";
import { publishArtifact, type PublicationResult } from "@/lib/publication-api";
import type { ExperimentIntent, RunManifest, WorkbenchAction } from "@/lib/workbench/schema";
import type { WorkbenchSnapshot } from "@/lib/workbench/store";

const sections = [
  { id: "command", icon: Gauge, label: "Command" },
  { id: "pipeline", icon: Workflow, label: "Pipeline" },
  { id: "matrix", icon: Table2, label: "Sweep Matrix" },
  { id: "runs", icon: Play, label: "Runs" },
  { id: "analysis", icon: ScanSearch, label: "Analysis" },
  { id: "handoffs", icon: Braces, label: "Handoffs" },
] as const;
type Section = typeof sections[number]["id"];

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function percent(value: number, total: number) { return total === 0 ? 0 : Math.round((value / total) * 100); }

export function ProjectWorkspace() {
  const [snapshot, setSnapshot] = useState<WorkbenchSnapshot | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("command");
  const [activeMissionId, setActiveMissionId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [publication, setPublication] = useState<PublicationResult | null>(null);
  const intentInput = useRef<HTMLInputElement>(null);
  const runInput = useRef<HTMLInputElement>(null);
  const visualizerUrl = process.env.NEXT_PUBLIC_VISUALIZER_URL ?? "http://127.0.0.1:5173";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/workbench/state", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Workbench state could not be loaded.");
        return response.json();
      })
      .then((state) => { if (!cancelled) setSnapshot(state); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Load failed."); });
    return () => { cancelled = true; };
  }, []);

  const act = async (action: WorkbenchAction, label: string) => {
    setBusy(label); setError("");
    try {
      const response = await fetch("/api/workbench/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Workbench action failed.");
      setSnapshot(body);
      if (action.type === "import-intent") setActiveMissionId(`mission-${action.intent.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Workbench action failed."); }
    finally { setBusy(""); }
  };

  const importIntent = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { await act({ type: "import-intent", intent: JSON.parse(await file.text()) as ExperimentIntent }, "import"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Intent JSON could not be read."); }
  };

  const importRun = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { await act({ type: "import-run-manifest", run: JSON.parse(await file.text()) as RunManifest }, "run-import"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Run Manifest JSON could not be read."); }
  };

  if (!snapshot) return <div className="workspace-loading"><Activity/><span>{error || "Initializing Scientific Workbench…"}</span></div>;

  const mission = snapshot.missions.find((candidate) => candidate.id === activeMissionId) ?? snapshot.missions[0];
  const pipeline = snapshot.pipelines.find((candidate) => candidate.projectId === mission?.projectId);
  const sweep = snapshot.sweeps.find((candidate) => candidate.missionId === mission?.id);
  const pipelineIssues = pipeline ? snapshot.derived.pipelineIssues[pipeline.id] ?? [] : [];
  const sweepSize = sweep ? snapshot.derived.sweepSizes[sweep.id] ?? 0 : 0;
  const missionRuns = snapshot.runs.filter((run) => run.missionId === mission?.id);
  const missionCompleted = missionRuns.filter((run) => run.status === "completed").length;
  const missionFailed = missionRuns.filter((run) => run.status === "failed").length;
  const missionAnomalies = snapshot.derived.anomalies.filter((anomaly) => missionRuns.some((run) => run.id === anomaly.runId));
  const currentProject = snapshot.projects.find((project) => project.id === mission?.projectId);
  const adapterDiagnostic = currentProject ? snapshot.derived.adapterDiagnostics[currentProject.id] : undefined;
  const completion = percent(missionCompleted, sweepSize);
  const averageIntegrity = missionRuns.length ? Math.round(missionRuns.reduce((sum, run) => sum + (snapshot.derived.integrity[run.id]?.score ?? 0), 0) / missionRuns.length) : 0;
  const componentById = new Map(snapshot.components.map((component) => [component.id, component]));
  const completedRuns = missionRuns.filter((run) => run.status === "completed");
  const strategySummary = ["A0", "A1", "A2"].map((strategy) => {
    const runs = completedRuns.filter((run) => run.configuration.strategy === strategy);
    const mean = (metric: string) => runs.length ? runs.reduce((sum, run) => sum + (run.metrics[metric] ?? 0), 0) / runs.length : null;
    return { strategy, runs: runs.length, degreeJsd: mean("degreeJsd"), hyperedgeW1: mean("hyperedgeW1"), macroF1: mean("macroF1") };
  });

  const exportResult = async () => {
    if (!mission) return;
    setBusy("export"); setError("");
    try {
      const response = await fetch(`/api/workbench/execution-result?missionId=${encodeURIComponent(mission.id)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Export failed.");
      downloadJson(`${mission.id}.execution-result.json`, body);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Export failed."); }
    finally { setBusy(""); }
  };

  const exportFirstPlan = async () => {
    const run = missionRuns.find((candidate) => candidate.status === "planned");
    if (!mission || !run) return;
    setBusy("plan"); setError("");
    try {
      const response = await fetch(`/api/workbench/adapters?projectId=${encodeURIComponent(mission.projectId)}&runId=${encodeURIComponent(run.id)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Adapter plan failed.");
      downloadJson(`${run.id}.experiment-plan.json`, body.plan);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Adapter plan failed."); }
    finally { setBusy(""); }
  };

  const publish = async () => {
    setBusy("publish"); setError("");
    try { setPublication(await publishArtifact(wildGadArtifact, "wild-gad")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Publication failed."); }
    finally { setBusy(""); }
  };

  return <div className={`workspace mode-${snapshot.mode}`}>
    <aside className="work-nav">
      <div className="work-brand"><Image className="work-brand-logo" src="/scientific-platform-mark-64.png" width={38} height={38} alt=""/><span>Scientific<br/><b>Workbench</b><small>ADAPTER RUNTIME · 0.3</small></span></div>
      <nav>{sections.map(({ id, icon: Icon, label }) => <button key={id} className={activeSection === id ? "active" : ""} onClick={() => setActiveSection(id)}><Icon size={16}/>{label}</button>)}</nav>
      <div className="system-boundary"><ShieldCheck size={15}/><div><b>Execution truth only</b><span>Metrics never become findings automatically.</span></div></div>
      <Link href={visualizerUrl}>Science Visualizer <ExternalLink size={12}/></Link>
    </aside>

    <main className="work-main">
      <header className="command-header"><div><span className="eyebrow">{snapshot.mode.toUpperCase()} MODE · EXECUTION STATE</span><h1>{mission?.title ?? "No active mission"}</h1><p>{mission?.objective}</p></div><div className="header-actions"><label className="mission-select"><span>Mission</span><select value={mission?.id ?? ""} onChange={(event) => setActiveMissionId(event.target.value)}>{snapshot.missions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></label><Button variant="outline" onClick={() => act({ type: "set-mode", mode: snapshot.mode === "command" ? "professional" : "command" }, "mode")} disabled={Boolean(busy)}><Layers3/> {snapshot.mode === "command" ? "Professional mode" : "Command mode"}</Button><input ref={intentInput} type="file" accept="application/json,.json" hidden onChange={importIntent}/><Button variant="outline" onClick={() => intentInput.current?.click()} disabled={Boolean(busy)}><Import/> Import Intent</Button><input ref={runInput} type="file" accept="application/json,.json" hidden onChange={importRun}/><Button variant="outline" onClick={() => runInput.current?.click()} disabled={Boolean(busy)}><Import/> Import Run</Button></div></header>
      {error && <div className="error-banner"><AlertTriangle/>{error}<button onClick={() => setError("")}>×</button></div>}

      <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as Section)}>
        <TabsList>{sections.map(({ id, label }) => <TabsTrigger key={id} value={id}>{label}</TabsTrigger>)}</TabsList>
        <TabsContent value="command">
          <div className="telemetry-grid"><Telemetry label="Sweep completion" value={`${completion}%`} detail={`${missionCompleted}/${sweepSize} completed`} tone="cyan"/><Telemetry label="Run integrity" value={`${averageIntegrity}%`} detail="required metadata" tone={averageIntegrity > 90 ? "green" : "amber"}/><Telemetry label="Pipeline validation" value={pipeline ? pipelineIssues.length ? "Blocked" : "Valid" : "Missing"} detail={pipeline ? `${pipelineIssues.length} validation issues` : "pipeline definition required"} tone={!pipeline || pipelineIssues.length ? "red" : "green"}/><Telemetry label="Anomaly queue" value={String(missionAnomalies.length)} detail={`${missionFailed} failed runs`} tone={missionAnomalies.length ? "amber" : "green"}/></div>
          <div className="command-grid"><section className="panel mission-panel"><PanelTitle icon={CircleDot} title="Current Mission" meta={mission?.status ?? "none"}/><dl><Row label="Project" value={mission?.projectId}/><Row label="Research action" value={mission?.researchActionRef}/><Row label="Protocol" value={mission?.protocolRef}/><Row label="Hypotheses" value={mission?.hypothesisRefs.join(", ") || "None linked"}/></dl><div className="next-action"><Play/><div><small>NEXT EXECUTABLE ACTION</small><b>{adapterDiagnostic?.status === "ready" ? "Validate repository, then execute an exported plan" : "Place the scientific repository at its configured path"}</b><span>{adapterDiagnostic?.message ?? "A registered adapter is required before this mission can execute."}</span></div></div></section><section className="panel"><PanelTitle icon={AlertTriangle} title="Anomaly Queue" meta={`${missionAnomalies.length} inspect`}/><div className="anomaly-list">{missionAnomalies.length ? missionAnomalies.map((anomaly) => <button key={anomaly.id} onClick={() => setActiveSection("runs")} className={anomaly.severity}><span>{anomaly.code}</span><b>{anomaly.runId}</b><small>{anomaly.message}</small></button>) : <Empty label="No anomalies detected."/>}</div></section></div>
          <section className="panel adapters"><PanelTitle icon={ServerCog} title="Scientific Projects" meta={`${snapshot.projects.length} bindings`}/><div className="adapter-grid">{snapshot.projects.map((project) => { const diagnostic = snapshot.derived.adapterDiagnostics[project.id]; const status = diagnostic?.status ?? project.status; return <div key={project.id}><span className={`adapter-status ${status === "ready" ? "ready" : "adapter-required"}`}>{status}</span><h3>{project.name}</h3><code>{project.repositoryPath}</code><p>{diagnostic?.message ?? project.capabilities.join(" · ")}</p><small>{project.adapterId ?? project.adapter}</small></div>; })}</div></section>
        </TabsContent>

        <TabsContent value="pipeline">
          <section className="panel pipeline-panel"><PanelTitle icon={Workflow} title={pipeline?.name ?? "Pipeline"} meta={pipelineIssues.length ? "invalid" : `validated · ${pipeline?.version}`}/><div className="pipeline-canvas"><div className="pipeline-stage"><svg className="pipeline-lines" viewBox="0 0 1160 290" aria-hidden="true"><defs><marker id="pipeline-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker></defs>{pipeline?.edges.map((edge) => { const source = pipeline.nodes.find((node) => node.id === edge.sourceNodeId); const target = pipeline.nodes.find((node) => node.id === edge.targetNodeId); return source && target ? <line key={edge.id} x1={source.position.x + 158} y1={source.position.y + 64} x2={target.position.x} y2={target.position.y + 64} markerEnd="url(#pipeline-arrowhead)"/> : null; })}</svg>{pipeline?.nodes.map((node) => { const component = componentById.get(node.componentId); return <div className={`pipeline-node type-${component?.type}`} style={{ left: node.position.x, top: node.position.y }} key={node.id}><span>{component?.type}</span><b>{component?.name ?? node.componentId}</b><small>{component?.inputs.map((port) => port.dataType).join(" + ") || "source"}</small><code>{component?.implementationRef ?? "adapter pending"}</code></div>; })}</div></div><div className="validation-strip">{pipelineIssues.length ? pipelineIssues.map((issue) => <span key={`${issue.code}:${issue.nodeId}:${issue.edgeId}`}><XCircle/>{issue.message}</span>) : <span className="valid"><CheckCircle2/>Typed ports, required inputs and acyclic topology validated.</span>}</div></section>
          <section className="panel catalog"><PanelTitle icon={Boxes} title="Component Registry" meta={`${snapshot.components.length} versioned`}/><div className="component-grid">{snapshot.components.map((component) => <div key={component.id}><span>{component.type}</span><b>{component.name}</b><small>v{component.version}</small><p>{component.description}</p><code>{component.inputs.length} in · {component.outputs.length} out</code></div>)}</div></section>
        </TabsContent>

        <TabsContent value="matrix"><div className="matrix-layout"><section className="panel"><PanelTitle icon={Table2} title={sweep?.name ?? "Sweep required"} meta={`${sweepSize} deterministic runs`}/><div className="dimension-list">{Object.entries(sweep?.dimensions ?? {}).map(([name, values]) => <div key={name}><span>{name}</span><div>{values.map((value) => <code key={String(value)}>{String(value)}</code>)}</div><b>×{values.length}</b></div>)}</div><div className="coverage"><div><span style={{ width: `${completion}%` }}/></div><p><b>{missionCompleted}</b> completed · <b>{missionFailed}</b> failed · <b>{Math.max(0, sweepSize - missionCompleted - missionFailed)}</b> awaiting adapter</p></div><Button onClick={() => sweep && act({ type: "materialize-sweep", sweepId: sweep.id }, "materialize")} disabled={!sweep || Boolean(busy)}><RefreshCw/> Materialize deterministically</Button></section><section className="panel matrix-note"><FlaskConical/><h2>Trusted adapter plan</h2><p>The adapter converts one deterministic run into a versioned ExperimentPlan and a fixed repository command. Execution stays an explicit terminal action.</p><code>{currentProject?.adapterId ?? "adapter required"} · {sweepSize} runs</code><Button variant="outline" onClick={exportFirstPlan} disabled={!missionRuns.some((run) => run.status === "planned") || busy === "plan"}><Download/> Export first plan</Button></section></div></TabsContent>

        <TabsContent value="runs"><section className="panel"><PanelTitle icon={Play} title="Run Browser" meta={`${missionRuns.length} manifests`}/><div className="run-table"><div className="run-table-head"><span>Run</span><span>Configuration</span><span>Provenance</span><span>Metrics</span><span>Integrity</span><span>Status</span></div>{missionRuns.map((run) => { const integrity = snapshot.derived.integrity[run.id]; return <div className="run-table-row" key={run.id}><div><b>{run.id}</b><small>{run.configRef ?? "config pending"}</small></div><div className="run-config">{Object.entries(run.configuration).map(([key, value]) => <code key={key}>{key}={String(value)}</code>)}</div><div><span className="commit"><GitCommit/>{run.gitCommit?.slice(0, 8) ?? "missing"}</span><small>{run.environment ?? "environment missing"}</small></div><div><b>{run.metrics.macroF1?.toFixed(3) ?? "—"}</b><small>Macro-F1</small></div><div><b className={(integrity?.score ?? 0) === 100 ? "good" : "warn"}>{integrity?.score ?? 0}%</b><small>{integrity?.checks.filter((check) => check.required && !check.passed).length ?? 0} missing</small></div><span className={`run-status ${run.status}`}>{run.status}</span></div>; })}</div></section></TabsContent>

        <TabsContent value="analysis"><div className="analysis-grid"><section className="panel"><PanelTitle icon={Activity} title="Structure → Performance" meta="descriptive only"/><div className="strategy-table"><div><span>Strategy</span><span>Runs</span><span>Degree JSD ↓</span><span>Hyperedge W1 ↓</span><span>Macro-F1 ↑</span></div>{strategySummary.map((row) => <div key={row.strategy}><b>{row.strategy}</b><span>{row.runs}</span><code>{row.degreeJsd?.toFixed(3) ?? "—"}</code><code>{row.hyperedgeW1?.toFixed(3) ?? "—"}</code><code>{row.macroF1?.toFixed(3) ?? "—"}</code></div>)}</div></section><section className="panel epistemic-guard"><ShieldCheck/><h2>Operational observation</h2><p>The Workbench may display differences and flag unusual runs. It does not convert these values into a Finding, Evidence Role or causal conclusion.</p><div><span>Metric</span><ArrowRight/><span>Human inspection</span><ArrowRight/><span>Meta-Lab Finding</span></div></section></div></TabsContent>

        <TabsContent value="handoffs"><div className="handoff-grid"><section className="panel"><PanelTitle icon={Import} title="Meta-Lab → Workbench" meta="ExperimentIntent 1.0"/><p className="panel-copy">Import a versioned research action as an operational Mission. The original Protocol and Hypothesis remain owned by Meta-Lab.</p><dl><Row label="Research action" value={mission?.researchActionRef}/><Row label="Protocol" value={mission?.protocolRef}/><Row label="Intent" value={mission?.intentId}/></dl><Button variant="outline" onClick={() => intentInput.current?.click()}><Import/> Import ExperimentIntent</Button></section><section className="panel"><PanelTitle icon={Download} title="Workbench → Meta-Lab" meta="ExecutionResult 1.0"/><p className="panel-copy">Export run, artifact and raw-metric references. No Finding is generated.</p><Button onClick={exportResult} disabled={busy === "export"}><Download/> Export ExecutionResult</Button></section><section className="panel publication-card"><PanelTitle icon={FileJson} title="Public boundary" meta="Artifact 1.1"/><p className="panel-copy">The separate Publication API freezes a reviewed visualization artifact for the standalone Visualizer.</p><div><Button variant="outline" onClick={() => downloadJson("wild-gad-embedding-space.artifact.json", wildGadArtifact)}><Download/> Artifact JSON</Button><Button onClick={publish} disabled={busy === "publish"}>Publish via API</Button></div>{publication && <a href={publication.bundleUrl}>Published v{publication.publication.version} <ExternalLink/></a>}</section></div><div className="reset-line"><span>Reference state lives locally and can be restored without Meta-Lab or a repository.</span><Button variant="outline" onClick={() => act({ type: "reset-reference-state" }, "reset")} disabled={Boolean(busy)}><RefreshCw/> Reset reference state</Button></div></TabsContent>
      </Tabs>
    </main>
  </div>;
}

function Telemetry({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={`telemetry ${tone}`}><small>{label}</small><b>{value}</b><span>{detail}</span></div>; }
function PanelTitle({ icon: Icon, title, meta }: { icon: typeof Activity; title: string; meta: string }) { return <div className="panel-title"><div><Icon/><h2>{title}</h2></div><span>{meta}</span></div>; }
function Row({ label, value }: { label: string; value?: string }) { return <div><dt>{label}</dt><dd>{value ?? "Not linked"}</dd></div>; }
function Empty({ label }: { label: string }) { return <div className="empty"><Check/>{label}</div>; }
