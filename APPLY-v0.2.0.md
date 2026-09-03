# Scientific Workbench v0.2.0 anwenden

Dieses Paket ist ein gezieltes Update fuer das Repository `scientific-workbench`.
Es enthaelt keine Abhaengigkeiten, Build-Artefakte oder lokalen Laufdaten.

## 1. Update kopieren

Passe nur dann den Download-Pfad an, wenn der entpackte Ordner anders heisst:

```bash
export UPDATE_SOURCE="/Users/tristanwesendahlvelazquez/Downloads/scientific-workbench-v0.2.0-update"
export SCIENTIFIC_WORKSPACE="/Users/tristanwesendahlvelazquez/WebstormProjects/scientific"

rsync -av \
  "$UPDATE_SOURCE/scientific-workbench/" \
  "$SCIENTIFIC_WORKSPACE/scientific-workbench/"
```

`rsync` ersetzt dabei nur gleichnamige Dateien und fuegt neue hinzu. Es loescht
keine anderen Dateien aus deinem Repository.

## 2. Vor dem Commit pruefen

```bash
cd "$SCIENTIFIC_WORKSPACE/scientific-workbench"

git status --short
git diff --check
npm ci
npm run check
```

Erwarteter Gate:

- 9 Tests bestanden
- ESLint bestanden
- Next.js Production Build bestanden

## 3. Lokal ausprobieren

```bash
npm run dev
```

Dann `http://127.0.0.1:5174` oeffnen und mindestens pruefen:

- Command/Professional Mode umschalten
- BA Reference Mission auswaehlen
- Pipeline, Sweep Matrix, Run Browser und Anomaly Queue ansehen
- `ExperimentIntent` aus dem mitgelieferten Beispiel importieren
- `ExecutionResult` exportieren
- Seite neu laden und persistierten Zustand kontrollieren
- Reference State zuruecksetzen

Lokaler Zustand wird standardmaessig unter `.data/workbench-state.json`
gespeichert. `.data/` ist absichtlich von Git ausgeschlossen.

## 4. Commit und Push

Erst nach erfolgreichem lokalen Gate:

```bash
git add \
  .env.example \
  .gitignore \
  Dockerfile \
  README.md \
  app \
  components/workbench/project-workspace.tsx \
  contracts \
  docs \
  examples/experiment-intent.ba-reference.json \
  lib/workbench \
  package.json \
  package-lock.json \
  tests/workbench-engine.test.ts

git commit -m "feat: establish Scientific Workbench execution core v0.2.0"
git push
```

Optional danach ein eigener Workbench-Tag:

```bash
git tag -a v0.2.0 -m "Scientific Workbench v0.2.0"
git push origin v0.2.0
```

Den bestehenden `scientific-ecosystem`-Tag `v0.0.2` nicht nachtraeglich
verschieben. Nach dem Systemtest sollte dessen Lockfile in einem neuen Release
auf den neuen Workbench-Commit zeigen.
