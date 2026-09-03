import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("concurrent first reads initialize state without sharing a temporary file", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "scientific-workbench-state-"));
  process.env.SCIENTIFIC_WORKBENCH_DATA_DIR = directory;

  try {
    const { readWorkbenchState } = await import(`../lib/workbench/store.ts?race=${Date.now()}`);
    const states = await Promise.all(Array.from({ length: 24 }, () => readWorkbenchState()));
    assert.equal(states.length, 24);
    assert.ok(states.every((state) => state.schemaVersion === "1.0"));

    const persisted = JSON.parse(await readFile(path.join(directory, "workbench-state.json"), "utf8"));
    assert.equal(persisted.schemaVersion, "1.0");
  } finally {
    delete process.env.SCIENTIFIC_WORKBENCH_DATA_DIR;
    await rm(directory, { recursive: true, force: true });
  }
});
