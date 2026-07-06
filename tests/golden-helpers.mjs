/** Test helpers mirroring production logic (no @/ imports — Node test runner). */

export const MIN_ASSISTANT_MESSAGE_LENGTH = 80;
export const MAX_PROPOSALS = 3;

const SECTION_KEYWORDS = {
  Overview: ["overview", "summary", "context", "background", "introduction"],
  Problem: ["problem", "pain", "challenge", "issue", "friction", "struggle"],
  Users: ["user", "persona", "customer", "audience", "stakeholder", "buyer"],
  Requirements: [
    "requirement",
    "must",
    "need",
    "feature",
    "capability",
    "functional",
    "acceptance",
  ],
  Solution: ["solution", "approach", "build", "implement", "design", "architecture", "how we"],
  "Success Metrics": ["metric", "kpi", "measure", "success", "goal", "north star", "target"],
  "Non-Goals": ["non-goal", "out of scope", "won't", "will not", "exclude", "not include"],
  "Open Questions": ["question", "unclear", "unknown", "decide", "tbd", "open"],
};

export function normalizeHeading(text) {
  return text.trim().toLowerCase();
}

export function headingsMatch(a, b) {
  const na = normalizeHeading(a);
  const nb = normalizeHeading(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function scoreSection(text, section) {
  const lower = text.toLowerCase();
  const keywords = SECTION_KEYWORDS[section] ?? [];
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += 1;
  }
  return score;
}

export function classifyPromotionSection(text, sections) {
  let best = sections[sections.length - 1];
  let bestScore = -1;
  for (const section of sections) {
    const s = scoreSection(text, section);
    if (s > bestScore) {
      bestScore = s;
      best = section;
    }
  }
  return bestScore > 0 ? best : sections[sections.length - 1];
}

export function proposeInsightsFromChat(userMessage, assistantMessage) {
  if (assistantMessage.trim().length < MIN_ASSISTANT_MESSAGE_LENGTH) {
    return [];
  }

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

  return proposals.slice(0, MAX_PROPOSALS);
}

function isHeadingBlock(block) {
  return block.block_type === "heading" || block.block_type === "section";
}

function sectionHasContent(blocks, headingBlock) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const headingPos = headingBlock.position;
  let nextHeadingPos = Infinity;
  for (const b of sorted) {
    if (b.position > headingPos && isHeadingBlock(b)) {
      nextHeadingPos = b.position;
      break;
    }
  }
  return sorted.some(
    (b) =>
      b.position > headingPos &&
      b.position < nextHeadingPos &&
      !isHeadingBlock(b) &&
      b.content.trim().length > 0
  );
}

export function countEmptySections(blocks, templateSections) {
  let count = 0;
  for (const section of templateSections) {
    const heading = blocks.find(
      (b) => isHeadingBlock(b) && headingsMatch(b.content, section)
    );
    if (!heading || !sectionHasContent(blocks, heading)) count += 1;
  }
  return count;
}
