import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseArtifact } from "../lib/scientific-artifacts/schema";
import { wildGadExampleArtifact as wildGadArtifact } from "../examples/artifacts/wild-gad";

test("WILD-GAD handoff satisfies the public artifact contract", () => {
  assert.equal(parseArtifact(wildGadArtifact).success, true);
});

test("shared Scientific Platform mark is wired into the Workbench", async () => {
  const workspace = await readFile(new URL("../components/workbench/project-workspace.tsx", import.meta.url), "utf8");
  const mark = await readFile(new URL("../public/scientific-platform-mark-64.png", import.meta.url));
  assert.match(workspace, /scientific-platform-mark-64\.png/);
  assert.ok(mark.byteLength > 1_000);
});
