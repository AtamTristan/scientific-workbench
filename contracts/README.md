# Meta-Lab × Scientific Workbench contracts

These contracts define explicit, user-driven handoffs. They do not imply a shared database or live synchronization.

| Contract | Direction | Meaning |
|---|---|---|
| `ExperimentIntent 1.0` | Meta-Lab → Workbench | Scientific objective, constraints and stable references |
| `ExperimentPlan 1.0` | Workbench → Scientific Repository | One deterministic run plus a registered tokenized invocation |
| `RunManifest 1.0` | Scientific Repository → Workbench | Execution status, provenance, artifacts and raw metrics |
| `ExecutionResult 1.0` | Workbench → Meta-Lab | Operational run, artifact and raw-metric references |

Stable identifiers are opaque strings. UI labels and object names must never be used as relation keys. Optional external references may become unavailable without invalidating local state.

The contracts intentionally contain no Finding or Evidence Role fields.
