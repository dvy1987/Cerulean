import test from "node:test";
import assert from "node:assert/strict";

function proposeInsightsFromChat(userMessage, assistantMessage) {
  const proposals = [];
  const sentences = assistantMessage
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  for (const sentence of sentences.slice(0, 2)) {
    if (proposals.length >= 2) break;
    const clean = sentence.replace(/\*\*/g, "").trim();
    if (clean.length < 25) continue;
    proposals.push({
      title: clean.slice(0, 60) + (clean.length > 60 ? "..." : ""),
      content: clean,
      confidence: 0.6,
    });
  }

  if (proposals.length === 0 && userMessage.length > 20) {
    proposals.push({
      title: userMessage.slice(0, 60) + (userMessage.length > 60 ? "..." : ""),
      content: `User raised: ${userMessage.slice(0, 200)}`,
      confidence: 0.5,
    });
  }

  return proposals.slice(0, 2);
}

function normalizeHeading(text) {
  return text.trim().toLowerCase();
}

function headingsMatch(a, b) {
  const na = normalizeHeading(a);
  const nb = normalizeHeading(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

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

test("propose insights heuristic returns at most 2", () => {
  const proposals = proposeInsightsFromChat(
    "How should we price the product?",
    "Consider value-based pricing. Enterprise buyers care about ROI. Start with a pilot tier."
  );
  assert.ok(proposals.length <= 2);
  assert.ok(proposals.length >= 1);
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
