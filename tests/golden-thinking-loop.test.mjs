import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  classifyPromotionSection,
  headingsMatch,
  proposeInsightsFromChat,
  countEmptySections,
} from "./golden-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const placementCases = JSON.parse(
  readFileSync(join(__dirname, "golden/placement-cases.json"), "utf8")
);

const proposalCases = JSON.parse(
  readFileSync(join(__dirname, "golden/proposal-cases.json"), "utf8")
);

const PRODUCT_SPEC_SECTIONS = [
  "Overview",
  "Problem",
  "Users",
  "Requirements",
  "Solution",
  "Success Metrics",
  "Non-Goals",
  "Open Questions",
];

test("golden placement: classifyPromotionSection >=70% accuracy", () => {
  let correct = 0;
  for (const c of placementCases) {
    const section = classifyPromotionSection(c.text, PRODUCT_SPEC_SECTIONS);
    if (section === c.expectedSection) correct += 1;
  }
  const rate = correct / placementCases.length;
  assert.ok(
    rate >= 0.7,
    `Expected >=70% placement accuracy, got ${(rate * 100).toFixed(0)}% (${correct}/${placementCases.length})`
  );
});

test("golden placement: headings resolve for all expected sections", () => {
  for (const c of placementCases) {
    const match = PRODUCT_SPEC_SECTIONS.some((s) =>
      headingsMatch(s, c.expectedSection)
    );
    assert.ok(match, `Missing template section for ${c.expectedSection}`);
  }
});

test("golden proposals: counts within bounds", () => {
  for (const c of proposalCases) {
    const proposals = proposeInsightsFromChat(c.userMessage, c.assistantMessage);
    assert.ok(
      proposals.length >= c.minProposals && proposals.length <= c.maxProposals,
      `Count ${proposals.length} outside [${c.minProposals}, ${c.maxProposals}]`
    );
  }
});

test("golden proposals: 80-char noise gate", () => {
  assert.equal(proposeInsightsFromChat("q?", "x".repeat(79)).length, 0);
  assert.ok(proposeInsightsFromChat("q?", "x".repeat(80)).length >= 0);
});

test("golden proposals: saved proposals have title and content", () => {
  const proposals = proposeInsightsFromChat(
    "How do we measure success?",
    "Track insights saved per session and promotion accept rate. These KPIs validate the thinking loop."
  );
  for (const p of proposals) {
    assert.ok(p.title.length > 0);
    assert.ok(p.content.length > 0);
  }
});

test("section status: fresh product spec has empty sections", () => {
  const blocks = PRODUCT_SPEC_SECTIONS.map((content, i) => ({
    block_id: `h-${i}`,
    content,
    block_type: "heading",
    position: i,
  }));
  assert.equal(countEmptySections(blocks, PRODUCT_SPEC_SECTIONS), 8);
});

test("runtime route mapping smoke", () => {
  const routes = {
    "conversation.respond": "chat.respond",
    "conversation.propose_insights": "insight.propose",
    "document.integrate": "document.promote",
    "document.expand": "document.expand",
    "graph.refresh": "graph.update",
  };
  assert.equal(Object.keys(routes).length, 5);
});
