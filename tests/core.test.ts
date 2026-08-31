import assert from "node:assert/strict";
import test from "node:test";
import { parseArtifact } from "../lib/scientific-artifacts/schema";
import { wildGadArtifact } from "../lib/data/wild-gad";

test("WILD-GAD handoff satisfies the public artifact contract", () => {
  assert.equal(parseArtifact(wildGadArtifact).success, true);
});
