# Scientific Workbench

Scientific Workbench is the private-oriented execution control plane of the Scientific Ecosystem. Version 0.3 adds trusted scientific-repository adapters to the persistent, contract-driven execution core.

It owns executable experiment state. It does **not** own hypotheses, Findings, Evidence Roles, source code or raw computational artifacts.

## Start

```bash
npm ci
npm run dev
```

Open <http://127.0.0.1:5174>. The first start creates an ignored local state file at `.data/workbench-state.json`. Set `SCIENTIFIC_WORKBENCH_DATA_DIR` to move that state; the production container uses `/data`.

## v0.3 capabilities

- versioned `ExperimentIntent`, Mission, Component, Pipeline, Sweep and Run schemas;
- portable JSON Schemas for both Meta-Lab handoff directions in `contracts/`;
- typed-port, required-input and cycle validation;
- deterministic Cartesian sweep materialization;
- persistent server-side state with atomic writes;
- Run provenance integrity scoring;
- deterministic failure, metadata and budget-invariant anomaly checks;
- descriptive Structure → Performance comparison;
- `ExecutionResult` export for human-reviewed import into Meta-Lab;
- retained Scientific Visualization Artifact publication boundary;
- Command and Professional projections of the same state.
- repository preflight against required adapter files;
- deterministic `ExperimentPlan 1.0` generation without arbitrary shell input;
- a BA Python adapter based on the existing ecosystem repository contract;
- a WILD-GAD Multi-LLM adapter mapped to the inspected historical scripts;
- a second typed pipeline and an 84-run WILD-GAD reproduction matrix.

The adapters generate exact commands and plans, but execution remains an explicit terminal action. The BA adapter blocks until the repository satisfies `.scientific/repository.json`. The WILD-GAD mapping is marked as a historical reconstruction until a fresh run has been completed.

## API

```text
GET  /api/workbench/state
POST /api/workbench/state
GET  /api/workbench/execution-result?missionId=...
GET  /api/workbench/adapters?projectId=...&runId=...
```

Supported state actions:

```text
set-mode
materialize-sweep
import-intent
import-run-manifest
reset-reference-state
```

## Adapter roundtrip

1. Select a mission and export the first planned run from **Sweep Matrix**.
2. Put the downloaded JSON into the target repository at `.scientific/plans/<run-id>.experiment-plan.json`.
3. Run the exact `invocation.validate` and `invocation.command` token arrays shown in the plan from the repository root.
4. Import the generated `run-manifest.json` with **Import Run**.
5. Inspect integrity and anomalies before exporting an `ExecutionResult` to Meta-Lab.

The Workbench never evaluates a user-provided shell string. Adapter commands are registered token arrays, and imported manifests must match an existing planned run across run, mission, project, pipeline and sweep identity.

## Boundaries

```text
Meta-Lab                  Scientific Workbench             Scientific Repository
meaning and protocol  →   execution state and inspection  → code and raw artifacts
```

`Metric ≠ Finding`, `Artifact ≠ Finding`, and `Anomaly ≠ Evidence` are architectural invariants. Either application remains usable while the other is offline.

The complete product and co-app boundaries are recorded in [the Workbench manifest](docs/scientific-workbench-manifest-v0.1.md) and [the Meta-Lab × Workbench manifest](docs/meta-lab-workbench-co-apps-manifest-v0.1.md).

FastAPI publication is expected at `NEXT_PUBLIC_SCIENTIFIC_API_URL`, defaulting to <http://127.0.0.1:8000>. The standalone Visualizer URL defaults to <http://127.0.0.1:5173>.

## Verification

```bash
npm run check
```

Set `SCIENTIFIC_WORKSPACE_ROOT` when the repositories are not sibling directories below the same `scientific/` workspace. Adapter paths are rejected when they resolve outside this root.
