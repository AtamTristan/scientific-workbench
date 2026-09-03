# Scientific Workbench v0.2.0 – Candidate Handoff

## Ausgangspunkt

- Snapshot-Repository: `scientific-workbench`
- Snapshot-Commit: `72074365b1f7619005e21a82c87384b20341a6cf`
- Ausgangsversion: `0.1.0`
- Zielversion: `0.2.0`

## Ergebnis

Die Workbench ist jetzt ein persistenter, typisierter Execution Core statt
einer reinen statischen Demo. Die BA ist als bewusst gekennzeichnete Reference
Fixture enthalten; WILD-GAD ist als naechster Adapter vorgesehen.

Enthalten sind:

- typisierte Scientific Components mit Ports und Datentypen
- Pipeline-Graph mit Topologie-, Port-, Typ- und Zyklusvalidierung
- deterministische kartesische Sweep-Materialisierung
- Missions, Run Manifests, Metriken, Artefakt- und Provenienzreferenzen
- persistenter serverseitiger JSON Store mit atomaren Schreibvorgaengen
- Run Integrity Scoring und operative Anomaly Queue
- Command und Professional Mode
- Mission Selector, Pipeline View, Component Registry, Sweep Matrix und Run Browser
- deskriptive Structure-to-Performance-Auswertung
- versionierte `ExperimentIntent`- und `ExecutionResult`-Vertraege
- Import von `ExperimentIntent` und Export von `ExecutionResult`
- BA Reference Fixture mit 36 deterministisch materialisierten Runs
- persistente API-Endpunkte fuer Workbench State und Execution Result
- Docker-Persistenzpfad `/data`

## Wissenschaftliche Grenze

Die Workbench verwaltet Ausfuehrungszustand. Sie erzeugt keine Findings und
deklariert keine Evidence. Insbesondere gilt:

- Metric ist kein Finding.
- Run ist keine Conclusion.
- Anomaly ist keine Evidence.
- Structure-to-Performance bleibt deskriptiv, bis Meta-Lab die epistemische
  Interpretation uebernimmt.
- Die mitgelieferten BA-Werte sind eine Reference Fixture und kein behauptetes
  Forschungsergebnis.

Der Export `ExecutionResult` enthaelt daher Run-, Metrik-, Artefakt- und
Provenienzreferenzen, aber keine Findings.

## Verifikation in der Build-Umgebung

`npm run check` wurde erfolgreich ausgefuehrt:

- 9 von 9 Tests bestanden
- ESLint bestanden
- Next.js 16 Production Build bestanden
- beide dynamischen API-Routen gebaut

Zusaetzlich wurden die persistente State-API, Mode-Mutation,
`ExperimentIntent`-Import, Reset und `ExecutionResult`-Export gegen den
Standalone-Server getestet.

Ein Docker-Build konnte in dieser Umgebung nicht ausgefuehrt werden, weil hier
kein Docker-Binary installiert ist. Der Containerpfad wurde vorbereitet, muss
aber lokal oder ueber den Ecosystem Manager verifiziert werden.

## Bewusste Nicht-Ziele dieser Version

- noch keine echte lokale Prozess- oder Container-Ausfuehrung
- noch kein BA-Repository-Adapter
- noch kein WILD-GAD-Adapter
- keine Live-Synchronisation mit Meta-Lab
- keine automatische Finding- oder Evidence-Erzeugung
- keine zentrale God Database

## Empfohlene naechste Reihenfolge

1. v0.2.0 lokal anwenden, Gate ausfuehren und UI akzeptieren.
2. BA-Repository als ersten echten `ProjectBinding`-Adapter anbinden.
3. Einen kleinen BA-Sweep real ausfuehren und das komplette Run Manifest
   inklusive Provenienz pruefen.
4. `ExecutionResult` an Meta-Lab uebergeben und dort explizit in Findings
   ueberfuehren.
5. WILD-GAD-multi-LLM-Enhanced als zweiten, strukturell anderen Adapter
   anbinden und damit die Generalisierbarkeit testen.
6. Erst danach den Ecosystem Lock in einem neuen Ecosystem Release aktualisieren.
