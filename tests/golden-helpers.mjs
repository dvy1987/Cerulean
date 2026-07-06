/** Test helpers mirroring production logic (no @/ imports — Node test runner). */

export const MIN_ASSISTANT_MESSAGE_LENGTH = 80;
export const MAX_PROPOSALS = 3;

const TEMPLATE_SECTIONS = {
  product_spec: [
    "Overview",
    "Problem",
    "Users",
    "Requirements",
    "Solution",
    "Success Metrics",
    "Non-Goals",
    "Open Questions",
  ],
  strategy_memo: [
    "Context",
    "Strategic Question",
    "Options",
    "Recommendation",
    "Risks",
    "Next Steps",
  ],
  product_analysis: [
    "Summary",
    "Market",
    "Users",
    "Competitive Landscape",
    "Opportunities",
    "Risks",
    "Open Questions",
  ],
};

const PLACEMENT_FALLBACK = {
  product_spec: "Open Questions",
  strategy_memo: "Next Steps",
  product_analysis: "Open Questions",
};

const SECTION_KEYWORDS = {
  Overview: ["overview", "summary", "introduction", "cerulean is", "workspace that"],
  Problem: ["problem", "pain", "challenge", "issue", "friction", "struggle", "pain point"],
  Users: ["user", "persona", "customer", "audience", "stakeholder", "buyer", "primary users", "target users"],
  Requirements: [
    "requirement",
    "must-have",
    "must have",
    "need",
    "sso",
    "audit",
    "functional requirement",
    "enterprise buyers need",
  ],
  Solution: [
    "solution",
    "approach",
    "build",
    "implement",
    "design",
    "architecture",
    "we should build",
    "recommended approach",
    "wizard",
  ],
  "Success Metrics": [
    "metric",
    "kpi",
    "measure",
    "success",
    "goal",
    "north star",
    "target",
    "insights saved",
    "accept rate",
  ],
  "Non-Goals": ["non-goal", "out of scope", "won't", "will not", "exclude", "not support", "desktop only"],
  "Open Questions": ["open question", "unclear", "unknown", "decide", "tbd", "still unclear"],
  Context: ["context:", "background:", "situation summary", "background:"],
  "Strategic Question": [
    "strategic question",
    "key question",
    "hypothesis to test",
    "question we must answer",
  ],
  Options: ["option a", "option b", "alternative:", "tradeoff", "option two"],
  Recommendation: ["recommendation:", "we should recommend", "recommend focusing", "thesis:"],
  Risks: ["risk:", "downside", "threat:", "concern:"],
  "Next Steps": ["next step", "action item", "milestone:", "interview five"],
  Summary: ["summary:", "executive summary", "finding:"],
  Market: ["market size", "market trend", "tam analysis", "market for"],
  "Competitive Landscape": [
    "competitive landscape",
    "competitor analysis",
    "compared to",
    "incumbents",
  ],
  Opportunities: ["opportunity:", "whitespace opportunity", "gap in the market"],
  Question: ["question", "hypothesis", "ask"],
  Findings: ["finding", "observation", "discovered", "learned"],
};

const PREFIX_RULES = [
  { prefix: /^context:/i, section: "Context" },
  { prefix: /^background:/i, section: "Context" },
  { prefix: /^strategic question:/i, section: "Strategic Question" },
  { prefix: /^option a:/i, section: "Options" },
  { prefix: /^alternative:/i, section: "Options" },
  { prefix: /^recommendation:/i, section: "Recommendation" },
  { prefix: /^risk:/i, section: "Risks" },
  { prefix: /^threat:/i, section: "Risks" },
  { prefix: /^concern:/i, section: "Risks" },
  { prefix: /^next step:/i, section: "Next Steps" },
  { prefix: /^action item:/i, section: "Next Steps" },
  { prefix: /^milestone:/i, section: "Next Steps" },
  { prefix: /^summary:/i, section: "Summary" },
  { prefix: /^executive summary:/i, section: "Summary" },
  { prefix: /^market /i, section: "Market" },
  { prefix: /^competitive landscape/i, section: "Competitive Landscape" },
  { prefix: /^competitor analysis/i, section: "Competitive Landscape" },
  { prefix: /^opportunity:/i, section: "Opportunities" },
  { prefix: /^open question:/i, section: "Open Questions" },
  { prefix: /^pain point:/i, section: "Problem" },
  { prefix: /^persona:/i, section: "Users" },
  { prefix: /^must-have requirement/i, section: "Requirements" },
  { prefix: /^functional requirement/i, section: "Requirements" },
  { prefix: /^north star metric/i, section: "Success Metrics" },
  { prefix: /^kpi target/i, section: "Success Metrics" },
  { prefix: /^out of scope/i, section: "Non-Goals" },
  { prefix: /^we will not support/i, section: "Non-Goals" },
  { prefix: /^the core problem/i, section: "Problem" },
  { prefix: /^primary users/i, section: "Users" },
  { prefix: /^target users/i, section: "Users" },
  { prefix: /^we should build/i, section: "Solution" },
  { prefix: /^recommended approach/i, section: "Solution" },
  { prefix: /^architecture:/i, section: "Solution" },
  { prefix: /^thesis:/i, section: "Recommendation" },
  { prefix: /^hypothesis to test/i, section: "Strategic Question" },
  { prefix: /^the key question/i, section: "Strategic Question" },
  { prefix: /^finding:/i, section: "Summary" },
  { prefix: /^gap in the market/i, section: "Opportunities" },
  { prefix: /^whitespace opportunity/i, section: "Opportunities" },
  { prefix: /^compared to/i, section: "Competitive Landscape" },
  { prefix: /^tam analysis/i, section: "Market" },
  { prefix: /^market trend/i, section: "Market" },
  { prefix: /^enterprise buyers need/i, section: "Requirements" },
  { prefix: /^still unclear/i, section: "Open Questions" },
  { prefix: /^unclear whether/i, section: "Open Questions" },
];

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
    if (lower.includes(kw)) score += kw.includes(" ") ? 3 : 1;
  }
  const firstPart = lower.split(/[.:]/)[0]?.trim() ?? "";
  if (headingsMatch(section, firstPart)) score += 2;
  return score;
}

export function classifyPromotionSectionWithConfidence(text, documentType) {
  const sections = TEMPLATE_SECTIONS[documentType] ?? [];
  const fallback = PLACEMENT_FALLBACK[documentType] ?? "Open Questions";
  const trimmed = text.trim();

  if (sections.length === 0) {
    return { targetSection: "Content", confidence: "high" };
  }

  if (trimmed.length < 20) {
    return { targetSection: fallback, confidence: "low" };
  }

  for (const rule of PREFIX_RULES) {
    if (rule.prefix.test(trimmed) && sections.some((s) => headingsMatch(s, rule.section))) {
      const match = sections.find((s) => headingsMatch(s, rule.section));
      return { targetSection: match, confidence: "high" };
    }
  }

  const scores = sections.map((section) => ({
    section,
    score: scoreSection(trimmed, section),
  }));
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1] ?? { score: 0 };
  let confidence = "low";
  if (best.score >= 4 && best.score - second.score >= 2) confidence = "high";
  else if (best.score >= 2 && best.score - second.score >= 1) confidence = "medium";
  else if (best.score >= 1) confidence = "medium";

  const targetSection = best.score > 0 ? best.section : fallback;
  return { targetSection, confidence };
}

export function classifyPromotionSection(text, documentType) {
  return classifyPromotionSectionWithConfidence(text, documentType).targetSection;
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

export function getTemplateSections(documentType) {
  return TEMPLATE_SECTIONS[documentType] ?? [];
}
