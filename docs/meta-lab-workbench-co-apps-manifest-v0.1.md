# Meta-Lab × Scientific Workbench Co-Apps Manifest

**Version 0.1 · Co-App Architecture Manifest**  
**Status:** Working Manifest  
**Primary use case:** Bachelor Thesis  
**Leitsatz:** *One research process. Two applications. No duplicated truth.*

---

## Präambel

Meta-Lab und Scientific Workbench sind zwei eigenständige Systeme mit komplementären Aufgaben.

Sie bilden **keinen Parent-Child-Stack** und sollen nicht zu einer God App verschmelzen.

Die zentrale Trennung lautet:

> **Meta-Lab hält den epistemischen Forschungszustand.  
> Scientific Workbench hält den ausführbaren Experimentzustand.**

Gemeinsam bilden sie einen wissenschaftlichen Regelkreis:

```text
Question
→ Hypothesis
→ Protocol
→ Research Action
        │
        ▼
Scientific Workbench
→ Pipeline
→ Sweep
→ Run
→ Artifact / Raw Metric
        │
        ▼
Meta-Lab
→ Finding
→ Evidence Role
→ Revision / Decision
```

Beide Apps teilen denselben Forschungsprozess, aber nicht dieselbe Verantwortung.

---

# 1. Meta-Lab: Epistemic Control Plane

Meta-Lab beantwortet:

- Was untersuchen wir?
- Warum untersuchen wir es?
- Welche Hypothesen existieren?
- Welches Protocol gilt?
- Welche Findings wurden gewonnen?
- Welche Evidence Role haben sie?
- Welche Entscheidung oder Revision folgt daraus?
- Welche Literatur und Methoden tragen zum Forschungsstand bei?

Primäre Objekte:

```text
Program
Project
Question
Hypothesis
Protocol
Paper
Reading Record
Human Evaluation
Method
Finding
Evidence Role
Decision
Revision
Research Action
System
```

Meta-Lab ist die Source of Truth für **wissenschaftliche Bedeutung**.

---

# 2. Scientific Workbench: Execution Control Plane

Scientific Workbench beantwortet:

- Mit welchen Daten arbeiten wir?
- Wie ist die ausführbare Pipeline aufgebaut?
- Welche Komponenten werden verbunden?
- Welche Konfigurationen werden getestet?
- Welche Sweeps laufen?
- Welche Runs existieren?
- Welche Rohmetriken und Artefakte entstanden?
- Welche Runs sind auffällig?
- Welche experimentellen Bedingungen fehlen noch?

Primäre Objekte:

```text
Dataset Reference
Scientific Component
Pipeline Definition
Configuration
Sweep
Run
Artifact Reference
Raw Metric
Execution Log
Anomaly Flag
Mission
```

Scientific Workbench ist die Source of Truth für **operative Ausführung und Exploration**.

---

# 3. BA-Repository: Computational Source

Das Repository bleibt die Hauptquelle für:

```text
Python code
configs
scripts
tests
git commits
environment definitions
raw reports
model checkpoints
generated files
```

Weder Meta-Lab noch Scientific Workbench sollen den Codebestand duplizieren.

Beide referenzieren ihn.

---

# 4. Zotero und TristanOS bleiben getrennt

## Zotero

Source of Truth für:

```text
bibliographic metadata
PDFs
collections
citation data
```

Meta-Lab importiert oder referenziert daraus wissenschaftlich relevante Objekte.

## TristanOS

Source of Truth für:

```text
calendar
tasks
work blocks
daily execution
personal scheduling
```

Meta-Lab kann eine Research Action an TristanOS übergeben.

Scientific Workbench ist kein Task Manager.

---

# 5. Das Co-App-Prinzip

Die Systeme werden durch **Links und Übergaben** integriert, nicht durch Datenbankverschmelzung.

Grundsatz:

> **Each app owns its state. The other app owns a reference.**

Beispiel:

Meta-Lab besitzt:

```text
Hypothesis H1
Protocol P4
Research Action RA-12
```

Scientific Workbench besitzt:

```text
Mission M7
Pipeline PL-BA-01
Sweep SW-23
Run R142
```

Die Beziehung erfolgt über stabile IDs / References.

---

# 6. Handoff: Meta-Lab → Scientific Workbench

Meta-Lab kann einen ausführbaren Forschungsauftrag formulieren.

Minimaler Übergabetyp:

```text
ExperimentIntent
```

Beispielschema:

```yaml
experiment_intent:
  project_id: BA-HYPERGRAPH
  research_action_id: RA-12
  protocol_id: P4
  hypothesis_ids:
    - H1

  objective:
    Compare A0, A1 and A2 on Cora at rho=0.10.

  constraints:
    datasets:
      - Cora
    methods:
      - A0
      - A1
      - A2
    rho:
      - 0.10
    seeds:
      - 0
      - 1
      - 2
      - 3
      - 4

  repository_ref:
    branch: main
```

Meta-Lab sagt damit:

> **Was soll untersucht werden und unter welchen wissenschaftlichen Constraints?**

Scientific Workbench entscheidet daraus:

> **Wie wird dies operativ als Pipeline, Sweep und Runs umgesetzt?**

---

# 7. Mission: operative Projektion eines Research Actions

Scientific Workbench darf einen Meta-Lab-Auftrag als **Mission** darstellen.

Beispiel:

```text
MISSION M7

Objective:
Compare structural preservation
of A0 / A1 / A2 on Cora.

Linked Meta-Lab:
Project BA-HYPERGRAPH
Research Action RA-12
Protocol P4
Hypothesis H1
```

Mission ist nur eine UI-/Execution-Abstraktion.

Sie ersetzt keine Meta-Lab-Entität.

---

# 8. Handoff: Scientific Workbench → Meta-Lab

Nach Ausführung liefert Scientific Workbench strukturierte Resultatreferenzen zurück.

Minimaler Typ:

```text
ExecutionResult
```

Beispielschema:

```yaml
execution_result:
  mission_id: M7
  research_action_id: RA-12

  pipeline_id: PL-BA-01
  sweep_id: SW-23

  runs:
    - run_id: R142
      status: completed
      dataset: Cora
      method: A2
      rho: 0.10
      seed: 3
      git_commit: 81e9a...
      config_ref: configs/cora/a2/rho_010_seed_3.yaml
      artifacts:
        - reports/cora/a2/rho_010_seed_3.json
      metrics:
        degree_jsd: 0.041
        hyperedge_w1: 1.72
        macro_f1: 0.781
```

Meta-Lab darf daraus:

- Run References anlegen
- Artifact References anlegen
- Research Action als ausgeführt markieren
- menschliche Interpretation vorbereiten

Aber:

> **ExecutionResult erzeugt nicht automatisch ein Finding.**

---

# 9. Die wichtigste semantische Grenze

```text
Metric ≠ Finding
Finding ≠ Evidence Role
Artifact ≠ Finding
Run ≠ Conclusion
```

Beispiel:

Scientific Workbench darf sagen:

```text
Macro-F1 = 0.824
```

oder:

```text
A2 had lower W1 than A0 in 8/10 completed seeds.
```

Meta-Lab formuliert anschließend gegebenenfalls:

```text
Finding F17:
Under the tested Cora configuration at rho=0.10,
A2 preserved the hyperedge-size distribution more closely than A0.
```

und verknüpft:

```text
Finding F17
SUPPORTS
Hypothesis H1
```

Diese Trennung ist nicht optional.

Sie verhindert, dass operative Outputs automatisch zu wissenschaftlichen Behauptungen werden.

---

# 10. Protocol vs Pipeline

Die beiden Begriffe bleiben bewusst getrennt.

## Protocol — Meta-Lab

Der wissenschaftliche Vertrag:

- Daten
- Intervention
- Baseline
- Metriken
- Seeds
- statistische Auswertung
- Ausschlussregeln
- Gültigkeitsbedingungen

## Pipeline — Scientific Workbench

Die ausführbare Struktur:

```text
Load Dataset
→ Star Expansion
→ Augmentation
→ Metric Computation
→ Model Training
→ Evaluation
```

Ein Protocol kann verschiedene Pipelines zulassen.

Eine Pipeline muss auf ein Protocol referenzieren können.

---

# 11. Research Action vs Mission vs Run

```text
Research Action
Meta-Lab
= wissenschaftlich begründete nächste Operation

Mission
Scientific Workbench
= operative Session / ausführbares Ziel

Run
Scientific Workbench / Tracker
= konkrete Ausführung einer Konfiguration
```

Beispiel:

```text
Research Action:
Test A2 against A0 on Cora.

        ↓

Mission:
Execute configured Cora comparison sweep.

        ↓

Runs:
A0 seed 0
A0 seed 1
...
A2 seed 4
```

---

# 12. Artifact vs Finding

Artifact:

```text
metrics.json
plot.png
model.pt
log.txt
```

Finding:

```text
A2 reduced hyperedge-size W1 relative to A0
under the tested Cora conditions.
```

Artifact ist ein Ergebnisobjekt.

Finding ist eine interpretierbare wissenschaftliche Aussage.

Scientific Workbench erzeugt primär das erste.

Meta-Lab verwaltet das zweite.

---

# 13. Anomaly vs Scientific Interpretation

Scientific Workbench darf Anomalien markieren.

Beispiel:

```text
⚠ RUN R142
Macro-F1 is 2.8σ below sibling runs.
```

Das bedeutet:

```text
Inspect.
```

Nicht:

```text
Hypothesis contradicted.
```

Meta-Lab entscheidet nach Prüfung, ob daraus entsteht:

- Finding
- new Question
- Research Action
- Method issue
- Revision
- no relevant scientific consequence

---

# 14. Cross-App Navigation

Die Apps sollten sich gegenseitig tief verlinken können.

Meta-Lab:

```text
Protocol P4
→ Open in Scientific Workbench
```

Scientific Workbench:

```text
Mission M7
→ Open Research Action in Meta-Lab

Run R142
→ Open linked Protocol
→ Open linked Hypothesis
```

Dadurch fühlt sich das System integriert an, ohne seine Grenzen zu verlieren.

---

# 15. Gemeinsame IDs und Referenzen

Cross-App-Objekte benötigen stabile IDs.

Beispiel:

```text
project_id
protocol_id
research_action_id
hypothesis_id
pipeline_id
mission_id
run_id
artifact_id
```

IDs sollen nicht aus UI-Namen abgeleitet werden.

Eine spätere Umbenennung darf keine Relation brechen.

---

# 16. Shared Contract, getrennte Datenmodelle

Für die Integration wird ein kleines gemeinsames Contract-Paket empfohlen.

Beispiel:

```text
scientific-contracts/
├── experiment-intent.schema.json
├── execution-result.schema.json
├── artifact-ref.schema.json
├── run-ref.schema.json
└── identifiers.md
```

Meta-Lab und Scientific Workbench implementieren diese Contracts unabhängig.

Keine gemeinsame God Database.

---

# 17. Sync-Regel

Synchronisation soll möglichst **ereignis- oder benutzergetrieben** sein.

Beispiele:

```text
Send to Workbench
Import execution result
Refresh linked run
Open external object
```

Nicht sofort nötig:

- permanenter bidirektionaler Live-Sync
- gemeinsame Datenbank
- verteilte Transaktionen
- Event-Bus-Infrastruktur

BA-first bedeutet:

> **Start with explicit handoffs. Automate only repeated friction.**

---

# 18. Fehlerstrategie

Wenn ein Cross-App-Link fehlt oder veraltet ist:

```text
External reference unavailable.
```

Die lokale App muss weiterhin funktionieren.

Meta-Lab darf nicht unbrauchbar werden, nur weil die Workbench offline ist.

Scientific Workbench darf nicht unbrauchbar werden, nur weil Meta-Lab offline ist.

Loose coupling ist Absicht.

---

# 19. Gamification-Aufteilung

## Scientific Workbench visualisiert operative Progression

```text
Experiment Coverage
Run Integrity
Sweep Completion
Pipeline Validation
Dataset Readiness
Anomaly Queue
Reproduction Status
```

## Meta-Lab visualisiert epistemische Progression

```text
Question Coverage
Hypothesis State
Evidence Gaps
Contradictions
Revision History
Protocol Completeness
Research Actions
```

Diese Progressionsarten dürfen sich ergänzen, aber nicht vermischen.

---

# 20. Tony-Stark-Co-App-Feeling

Die beiden Systeme dürfen unterschiedliche Rollen inszenieren.

## Meta-Lab

**Research Intelligence / Strategic Display**

```text
What do we know?
What is uncertain?
What should we investigate?
What changed our belief?
```

## Scientific Workbench

**Experimental Control System**

```text
What is configured?
What is running?
What failed?
What changed structurally?
What should I inspect?
```

Die Gesamtwirkung entsteht aus dem Wechsel zwischen beiden Apps.

Nicht daraus, beide zu einer Oberfläche zu verschmelzen.

---

# 21. BA-End-to-End-Workflow

```text
1. Meta-Lab
Question + Hypothesis

2. Meta-Lab
Protocol einfrieren

3. Meta-Lab
Research Action erstellen

4. Send to Scientific Workbench

5. Scientific Workbench
Mission erzeugen

6. Scientific Workbench
Pipeline konfigurieren

7. Scientific Workbench
Experiment Matrix / Sweep definieren

8. Scientific Workbench
Runs ausführen

9. Scientific Workbench
Compare / Analysis / Anomaly Inspection

10. Return ExecutionResult

11. Meta-Lab
Run / Artifact refs übernehmen

12. Human interpretation

13. Meta-Lab
Finding erstellen

14. Meta-Lab
Evidence Role setzen

15. Meta-Lab
Decision / Revision / next Research Action
```

Das ist der gemeinsame Hauptloop.

---

# 22. BA-Ready Integrationsminimum

Für die erste produktive Version reichen:

### Meta-Lab → Workbench

- Project ID
- Research Action ID
- Protocol ID
- optional Hypothesis IDs
- Objective
- constraints
- Repository reference

### Workbench → Meta-Lab

- Mission ID
- Pipeline ID
- Sweep ID
- Run IDs
- Status
- Config refs
- Git commits
- Artifact refs
- Raw metrics

### Navigation

- Open in Meta-Lab
- Open in Scientific Workbench

Mehr ist für BA-Ready nicht notwendig.

---

# 23. Was ausdrücklich noch nicht gebaut wird

Nicht BA-ready-relevant:

- gemeinsame Datenbank
- universeller Agent Orchestrator
- autonom erzeugte Findings
- automatisch gesetzte Evidence Roles
- automatisches Hypothesis Revisioning
- Full live sync
- universelle Ontologie
- komplexes distributed event sourcing
- eigenes Experiment-Tracking-System, wenn ein bestehendes integrierbar ist

Diese Dinge dürfen später anhand beobachteter Friction neu bewertet werden.

---

# 24. Architectural Invariants

Folgende Regeln dürfen nur bewusst gebrochen werden:

### Invariant 1

```text
Meta-Lab owns scientific meaning.
```

### Invariant 2

```text
Scientific Workbench owns executable experiment state.
```

### Invariant 3

```text
Repository owns code and raw computational artifacts.
```

### Invariant 4

```text
Metric does not automatically become Finding.
```

### Invariant 5

```text
Anomaly does not automatically become Evidence.
```

### Invariant 6

```text
Cross-app integration uses references and contracts,
not duplicated truth.
```

### Invariant 7

```text
Either app must remain usable if the other is offline.
```

### Invariant 8

```text
BA progress outranks platform elegance.
```

---

# 25. Co-App Definition of Done für die BA

Meta-Lab × Scientific Workbench ist BA-ready, wenn:

- eine Research Action aus Meta-Lab an die Workbench übergeben werden kann
- Protocol und Projektkontext erhalten bleiben
- die Workbench daraus eine Mission erzeugen kann
- die BA-Pipeline ausführbar ist
- Sweeps und Runs mit reproduzierbaren Metadaten existieren
- Runs und Artefakte zurückreferenziert werden können
- Meta-Lab aus Outputs nicht automatisch wissenschaftliche Wahrheit erzeugt
- ein Mensch Findings und Evidence Roles bewusst formuliert
- beide Systeme unabhängig startbar bleiben
- keine wesentliche Source of Truth dupliziert wird

---

# Schlussformel

Meta-Lab und Scientific Workbench sind zwei Apps, weil wissenschaftliche Bedeutung und wissenschaftliche Ausführung zwei verschiedene Verantwortlichkeiten sind.

Meta-Lab fragt:

> **What do we know, why do we believe it, and what should change?**

Scientific Workbench fragt:

> **What exactly did we run, how did it behave, and what should we inspect?**

Gemeinsam entsteht ein geschlossener wissenschaftlicher Arbeitskreis:

```text
Meaning
→ Intent
→ Execution
→ Observation
→ Interpretation
→ Meaning
```

**One research loop. Two control planes. No God App.**
