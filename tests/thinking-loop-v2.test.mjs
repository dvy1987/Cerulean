import test from "node:test";
import assert from "node:assert/strict";
import {
  proposeInsightsFromChat,
  headingsMatch,
  MIN_ASSISTANT_MESSAGE_LENGTH,
} from "./golden-helpers.mjs";

function findInsertionPosition(blocks, sectionName) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const heading = sorted.find(
    (b) =>
      (b.block_type === "heading" || b.block_type === "section") &&
      headingsMatch(b.content, sectionName)
  );
  if (heading) {
    return { placement_label: heading.content };
  }
  return { placement_label: "Open Questions" };
}

test("propose insights heuristic returns at most 3", () => {
  const proposals = proposeInsightsFromChat(
    "How should we price the product?",
    "Consider value-based pricing. Enterprise buyers care about ROI. Start with a pilot tier."
  );
  assert.ok(proposals.length <= 3);
  assert.ok(proposals.length >= 1);
});

test("propose insights noise gate at 80 chars", () => {
  assert.equal(proposeInsightsFromChat("question?", "x".repeat(MIN_ASSISTANT_MESSAGE_LENGTH - 1)).length, 0);
});

test("placement finds Open Questions section", () => {
  const blocks = [
    {
      block_id: "h-open",
      content: "Open Questions",
      block_type: "heading",
      position: 7,
    },
  ];
  const { placement_label } = findInsertionPosition(blocks, "Open Questions");
  assert.equal(placement_label, "Open Questions");
});

test("heading match is case insensitive", () => {
  assert.equal(headingsMatch("Problem", "problem"), true);
  assert.equal(headingsMatch("Users", "Solution"), false);
});
