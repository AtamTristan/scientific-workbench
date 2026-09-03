# Scientific Workbench Manifest

**Version 0.1 · BA-Ready Architecture Manifest**  
**Status:** Working Manifest  
**Primary use case:** Bachelor Thesis — Structure-Oriented Hypergraph Augmentations  
**Leitsatz:** *Execute science visibly. Preserve rigor underneath. Make experimentation feel powerful.*

---

## Präambel

Scientific Workbench ist die operative Forschungsumgebung für ausführbare wissenschaftliche Arbeit.

Sie verwaltet **nicht den epistemischen Zustand der Forschung**. Dafür existiert Meta-Lab.

Scientific Workbench beantwortet stattdessen Fragen wie:

- Welche Daten werden verwendet?
- Wie sieht die ausführbare Experiment-Pipeline aus?
- Welche Komponenten dürfen miteinander verbunden werden?
- Welche Konfigurationen und Sweeps sollen laufen?
- Welche Runs sind abgeschlossen, fehlgeschlagen oder auffällig?
- Welche Artefakte und Rohmetriken wurden erzeugt?
- Wie unterscheiden sich Runs und Bedingungen?
- Welche operativen Anomalien verdienen menschliche Aufmerksamkeit?

Kurz:

> **Meta-Lab verwaltet, warum wir etwas untersuchen und was wir daraus glauben.  
> Scientific Workbench verwaltet, wie wir es ausführbar untersuchen.**

Scientific Workbench ist damit weder zweites Meta-Lab noch Jupyter-Ersatz noch eigenes MLflow. Sie ist ein **Scientific IDE / Experiment Cockpit**, das etablierte wissenschaftliche Infrastruktur integriert und eine visuelle, typisierte und explorierbare Oberfläche darüber legt.

---

# 1. Kernrolle

Scientific Workbench ist das **Execution Control Plane** der wissenschaftlichen Arbeit.

```text
Dataset
→ Representation
→ Transform / Augmentation
→ Model
→ Metric
→ Sweep
→ Run
→ Artifact
→ Analysis
```

Die Workbench hält die ausführbare Struktur dieser Kette zusammen und macht sie beobachtbar.

Sie besitzt drei Kernaufgaben:

1. **Compose**  
   Wissenschaftliche Komponenten zu gültigen Experiment-Pipelines verbinden.

2. **Execute**  
   Konfigurationen, Sweeps und Runs reproduzierbar ausführen oder an bestehende Runner übergeben.

3. **Inspect**  
   Daten, Zwischenzustände, Runs, Metriken, Artefakte und Anomalien sichtbar machen.

---

# 2. Harte Systemgrenzen

Scientific Workbench ist **nicht zuständig** für:

- Forschungsfragen
- Hypothesen-Lebenszyklus
- Evidence Roles
- epistemische Revisionen
- Paper Pool / Reading / Human Evaluation
- Literaturverwaltung
- Projektstrategie
- wissenschaftliche Entscheidungen als Source of Truth

Diese Dinge gehören primär zu **Meta-Lab**.

Scientific Workbench ist außerdem **nicht die Hauptquelle** für:

- Quellcode
- Git-Historie
- große Modelle
- große Rohartefakte
- Notebook-Dateien
- Rohdaten

Dafür bleiben Repository, Dateisystem, Artefaktspeicher, Jupyter und etablierte Tools zuständig.

Die Workbench darf diese Dinge **referenzieren, öffnen, ausführen und visualisieren**, aber nicht unnötig duplizieren.

---

# 3. Source-of-Truth-Regel

| Inhalt | Hauptquelle |
|---|---|
| Forschungsfragen, Hypothesen, Evidenzbedeutung, Revisionen | Meta-Lab |
| Ausführbare Pipeline-Struktur und Workbench-Views | Scientific Workbench |
| Code, Git-Commits, Configs, Scripts | BA-Repository |
| Rohmetriken, Reports, Checkpoints, große Artefakte | Repository / Artifact Store |
| Tracking von Parametern, Metriken und Runs | integrierter Experiment-Tracker, z. B. MLflow-kompatibel |
| Daten- und Experimentversionen | Git / DVC-artige Infrastruktur |
| Literatur und PDFs | Zotero |
| Aufgaben und Zeitplanung | TristanOS |

Grundsatz:

> **Scientific Workbench orchestriert und projiziert. Sie ersetzt etablierte Sources of Truth nur dann, wenn es einen klaren, belegten Grund gibt.**

---

# 4. Designprinzip: Tony Stark außen, Laborstandard innen

Scientific Workbench darf sich wie ein Research Command Deck anfühlen.

Aber:

> **Die visuelle Inszenierung ist eine Projektion des wissenschaftlichen Zustands, nicht dessen Quelle.**

Formal:

\[
GameState = f(ScientificExecutionState)
\]

niemals:

\[
ScientificExecutionState = f(GameState)
\]

Das bedeutet:

- keine XP für bloße Run-Menge
- keine Streaks als Qualitätsersatz
- keine „AI discovered science“-Behauptungen
- keine dramatischen Labels ohne reale Metrik dahinter

Erlaubt und erwünscht sind dagegen:

- Experiment Coverage
- Run Integrity
- Sweep Completion
- Pipeline Validation
- Reproducibility Checks
- Anomaly Queues
- Dataset Readiness
- Resource Status
- Missing Metadata
- Failed / blocked experiment conditions

Die Oberfläche darf spektakulär sein. Die wissenschaftliche Semantik bleibt nüchtern.

---

# 5. Zwei UI-Projektionen, ein Zustand

Scientific Workbench kann zwei Darstellungsmodi besitzen.

## Professional Mode

Für konzentriertes Arbeiten:

- Tabellen
- Konfigurationen
- Metriken
- Confidence Intervals
- Logs
- Artefakte
- Run-Vergleiche

## Command Mode

Für Überblick und Steuerung:

- Current Mission
- Experiment Coverage
- Active Sweep
- Anomaly Queue
- GPU / CPU / Runtime
- Pipeline State
- Next Executable Action

Beide Modi lesen denselben Zustand.

Es gibt keine getrennte „seriöse“ und „spielerische“ Wahrheit.

---

# 6. Scientific Components

Die zentrale Abstraktion der Workbench ist die **Scientific Component**.

Starttypen:

```text
Dataset
Representation
Transform
Augmentation
Model
Metric
Analysis
Visualization
```

Später möglich:

```text
Sampler
Preprocessor
Trainer
Evaluator
StatisticalTest
Exporter
ExternalTool
```

Eine Component besitzt mindestens:

```text
id
type
name
version
input ports
output ports
configuration schema
implementation reference
validation rules
```

---

# 7. Typed Scientific Pipelines

Pipelines sind nicht bloß Diagramme.

Sie sind **typisierte ausführbare wissenschaftliche Protokolle**.

Beispiel:

```text
Dataset<Hypergraph>
        ↓
Representation<StarExpansion>
        ↓
Augmentation<IncidenceGraph>
        ↓
Metric<StructuralComparison>
```

Ungültige Verbindung:

```text
MacroF1 → DatasetLoader
```

muss früh scheitern.

Prinzip:

> **Visual Programming ohne Typsystem wird schnell zu hübschem Kabelsalat.**

Die Workbench soll deshalb Inputs und Outputs explizit modellieren und inkompatible Verbindungen verhindern.

---

# 8. BA-Referenzpipeline

Die erste vollständige Referenzpipeline ist die Bachelorarbeit.

```text
Hypergraph Dataset
→ Star Expansion
→ Incidence Augmentation
   ├── A0 Uniform
   ├── A1 Hyperedge-Balanced
   └── A2 Pareto-Weighted
→ Structural Metrics
   ├── Degree JSD
   ├── Hyperedge-Size W1
   ├── Overlap / Jaccard
   ├── Gini
   └── Top-10%-Share
→ Supervised Model
→ Macro-F1
→ Structure ↔ Performance Analysis
```

Diese Pipeline ist der erste reale Dogfooding-Workflow.

Die Workbench wird **BA-ready**, wenn dieser Workflow zuverlässig funktioniert.

---

# 9. BA-Ready Kernmodule

## 9.1 Dataset Inspector

Für Cora, Citeseer, PubMed, DBLP:

- Nodes
- Hyperedges
- Incidences
- Features
- Classes
- Degree distribution
- Hyperedge-size distribution
- Overlap distribution
- Connected components
- Class balance

Optional:

- Hypergraph View
- Star Expansion
- Incidence Matrix

Ziel:

> Struktur zuerst sichtbar machen, bevor sie verändert wird.

---

## 9.2 Star-Expansion Inspector

Für kleine und reale Beispiele:

```text
Hypergraph
↕
Star Expansion
↕
Incidence Matrix
```

Die Repräsentation soll nicht nur erzeugt, sondern nachvollziehbar werden.

---

## 9.3 Augmentation Playground

Konfiguration:

```text
Dataset
Operation
Global budget ρ
Strategy A0 / A1 / A2
Seed
Strategy-specific parameters
```

Vor dem Run sichtbar:

- erwartete Allokation
- Hyperedge-Gewichte
- Budgetverteilung
- Rundung
- Kapazitätsgrenzen
- Umverteilung

Ziel:

> Die eigene Methode darf keine Black Box sein.

---

## 9.4 Visual Pipeline Editor

Node-basierte Pipeline mit:

- typed ports
- Component Inspector
- Config Editor
- Validation
- execution state
- implementation link
- notebook / source link

Die Pipeline dokumentiert nicht nur Code. Sie beschreibt die **wissenschaftliche Ausführungsstruktur**.

---

## 9.5 Experiment Matrix / Sweep Builder

Für Kombinationen wie:

```text
Dataset × Augmentation × ρ × Seed
```

Die Workbench berechnet:

- Anzahl geplanter Runs
- vollständige Kombinationen
- fehlende Kombinationen
- laufende Kombinationen
- fehlgeschlagene Kombinationen

BA-Beispiel:

```text
4 datasets
× 3 augmentations
× 3 rho values
× 5 seeds
= 180 runs
```

---

## 9.6 Execution Console

Für laufende Experimente:

- Current Run
- Pipeline Stage
- Startzeit
- Laufzeit
- Logs
- Resource Usage
- Status
- Retry / cancel where safe

Die Console ist Steuerung, nicht Source of Truth für wissenschaftliche Interpretation.

---

## 9.7 Run Browser

Jeder Run zeigt mindestens:

```text
Run ID
Pipeline
Dataset
Method
Parameters
Seed
Git Commit
Config Reference
Environment
Status
Artifacts
Raw metrics
```

Aktionen:

```text
re-run
clone config
compare
open artifacts
open implementation
open tracker
```

---

## 9.8 Compare & Analysis View

Vergleich von zwei oder mehreren Runs:

```text
Configuration Differences
Structural Metrics
Downstream Metrics
Artifacts
Runtime
Seed / Dataset / Method
```

BA-relevant:

```text
A0 vs A1 vs A2
Cora vs Citeseer vs PubMed vs DBLP
ρ values
seed distributions
```

---

## 9.9 Structure → Performance Analysis

Zentrale BA-Ansicht:

\[
\Delta Structure \rightarrow \Delta Performance
\]

Beispiele:

```text
Degree JSD vs Δ Macro-F1
Hyperedge W1 vs Δ Macro-F1
Gini Δ vs Δ Macro-F1
Top-10%-Share Δ vs Δ Macro-F1
```

Die Workbench darf Korrelationen und Muster anzeigen.

Sie erklärt daraus **nicht automatisch Kausalität oder Evidenzbedeutung**.

---

## 9.10 Run Scanner / Anomaly Queue

Deterministische und statistische Checks:

```text
config complete
git commit recorded
dataset hash verified
seed recorded
artifact present
metrics complete
neighboring-seed deviation
budget invariant
pipeline invariant
```

Beispiel:

```text
⚠ RUN-142

DBLP · A2 · rho=.10 · seed=3

Structural preservation: high
Macro-F1: unusually low
Deviation from sibling runs: 2.8σ
```

Output:

> **Inspect this run.**

Nicht:

> **We discovered a new scientific phenomenon.**

---

# 10. Mission-Konzept

Eine **Mission** ist eine operative Workbench-Session oder ein ausführbares Ziel.

Beispiel:

```text
MISSION
Complete structural comparison
for A0 / A1 / A2 on Cora.

Linked:
Meta-Lab Research Action RA-12
Protocol P4
Hypothesis H1
```

Mission ist **keine Hypothese** und **kein Finding**.

Sie ist eine Ausführungsprojektion.

---

# 11. Integration statt Reinvention

Scientific Workbench soll etablierte Tools integrieren.

Mögliche Integrationen:

```text
Git
Docker
Python
PyTorch
PyG
Jupyter
MLflow-compatible tracking
DVC-compatible versioning
Optuna later
```

Grundsatz:

> **The Workbench is the cockpit, not every engine.**

Wenn ein vorhandenes Werkzeug ein Problem gut löst, soll die Workbench es aufrufen, beobachten oder referenzieren.

---

# 12. Jupyter und IDE bleiben First-Class Citizens

Scientific Workbench ersetzt nicht:

- PyCharm
- Jupyter
- Python scripts

Stattdessen:

```text
Workbench Component
├── Open Implementation
├── Open Notebook
├── Open Config
├── Open Run
└── Open Artifact
```

Wissenschaftliche Arbeit bleibt zwischen visueller Workbench und normalem Code bidirektional.

---

# 13. Reproduzierbarkeit

Jeder ausführbare Run soll rekonstruierbar sein.

Mindestens:

```text
dataset/version
pipeline/version
parameters
seed
git commit
config reference
environment
artifacts
```

Die Workbench zeigt fehlende Metadaten sichtbar an.

Beispiel:

```text
RUN INTEGRITY
94%

Missing:
- environment hash
- artifact checksum
```

---

# 14. Scientific Gamification

Erlaubte Progression:

```text
Dataset Ready
Pipeline Validated
Sweep Defined
Runs Completed
Run Integrity
Experiment Coverage
Anomaly Reviewed
Reproduction Complete
```

Nicht erlaubte primäre Ziele:

```text
number of clicks
number of runs
daily streak
total experiments
XP for activity
```

Gamification soll **gute wissenschaftliche Ausführung** verstärken, nicht Output aufblasen.

---

# 15. BA-Ready Definition of Done

Scientific Workbench ist für die BA ausreichend bereit, wenn:

- Cora, Citeseer, PubMed und DBLP geladen und inspiziert werden können
- Star Expansion dargestellt und ausgeführt werden kann
- A0, A1 und A2 als Components existieren
- zentrale Strukturmetriken als Components existieren
- eine typisierte BA-Pipeline erstellt werden kann
- Experiment-Matrizen über Dataset × Methode × ρ × Seed erzeugt werden können
- Runs reproduzierbar gestartet oder importiert werden können
- Git Commit, Config, Seed und Artifacts sichtbar sind
- Runs miteinander verglichen werden können
- Structure→Performance-Analysen möglich sind
- Anomalien und fehlende Metadaten sichtbar werden
- Meta-Lab-Kontext verknüpft werden kann
- die Workbench keine Meta-Lab-Funktionen dupliziert

---

# 16. Anti-Regeln

### Scientific Workbench wird kein zweites Meta-Lab.

Keine eigene Hypothesen- oder Evidence-Wahrheit.

### Scientific Workbench wird kein Jupyter-Klon.

Code bleibt Code.

### Scientific Workbench wird kein MLflow-Klon.

Tracking-Infrastruktur wird integriert, nicht aus Eitelkeit neu gebaut.

### Visualisierung ist kein Selbstzweck.

Jede Ansicht beantwortet eine konkrete operative Forschungsfrage.

### Mehr Runs sind nicht automatisch Fortschritt.

Coverage und Integrität zählen mehr als Aktivität.

### Automatische Mustererkennung ist keine automatische wissenschaftliche Schlussfolgerung.

Anomalien werden markiert, nicht interpretiert.

### BA zuerst.

Neue Abstraktionen werden nur gebaut, wenn sie den BA-Workflow ermöglichen oder eine klar wiederkehrende Reibung lösen.

---

# 17. Langfristige Generalisierung

Die BA ist Referenzworkflow Nummer 1.

Später sollen dieselben Abstraktionen auch andere Workflows tragen können:

```text
Wild-GAD
GraphDataset
→ TextEncoder
→ Embedding
→ PCA
→ Anomaly Detection
→ Metric
```

oder:

```text
Classical ML
CSV
→ Imputation
→ Scaling
→ PCA
→ Model
→ Cross Validation
```

Die Generalisierung erfolgt **nach** erfolgreichem BA-Dogfooding.

Nicht vorher.

---

# Schlussformel

Scientific Workbench ist die ausführbare Seite wissenschaftlicher Arbeit.

Sie soll wissenschaftliche Pipelines so sichtbar machen, dass man sie verstehen, konfigurieren, ausführen, vergleichen und überprüfen kann.

Sie darf sich futuristisch anfühlen.

Sie darf das Gefühl erzeugen, ein Forschungsinstrument zu steuern.

Aber unter jedem leuchtenden Panel liegt ein nüchterner Zustand:

> **Daten. Konfiguration. Code. Seed. Run. Artefakt. Metrik. Provenienz.**

**Make experimentation exciting. Keep evidence boringly trustworthy.**
