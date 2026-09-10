import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as contracts from "../src/services/contracts.ts";

// This test-only fixture is captured from authenticated FastAPI HTTP responses.
const responses = JSON.parse(
  readFileSync(
    new URL("./fixtures/backend-contracts.json", import.meta.url),
    "utf8",
  ),
);
for (const [name, response] of Object.entries(responses)) {
  test(`${name} accepts the backend's exact serialized response without dropping fields`, () => {
    assert.deepEqual(contracts[name].parse(response), response);
  });
}
test("a renamed profile field cannot silently appear as an empty patient", () => {
  const { preferredName, ...rest } = responses.patientSchema;
  assert.throws(() =>
    contracts.patientSchema.parse({ ...rest, preferred_name: preferredName }),
  );
});
test("patient contracts strip private metadata before UI use", () => {
  const result = contracts.memorySchema.parse({
    ...responses.memorySchema,
    sensitivity: "HIGH",
    privateNotes: "test-only",
    vectorEmbedding: [1],
  });
  assert.deepEqual(result, responses.memorySchema);
});
test("unknown conversation modes and contextual actions are rejected", () => {
  assert.throws(() =>
    contracts.conversationSchema.parse({
      ...responses.conversationSchema,
      uiMode: "internal_distress",
    }),
  );
  assert.throws(() =>
    contracts.actionSchema.parse({ type: "UNRECOGNIZED", label: "test" }),
  );
});
test("empty responses remain empty and recommendations can be absent", () => {
  assert.equal(contracts.recommendationSchema.parse(null), null);
  assert.deepEqual(contracts.familySchema.array().parse([]), []);
  assert.deepEqual(contracts.memorySchema.array().parse([]), []);
  assert.deepEqual(contracts.comfortSchema.array().parse([]), []);
  assert.deepEqual(contracts.activitySchema.array().parse([]), []);
});
