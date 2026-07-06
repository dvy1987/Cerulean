import type { DocumentType } from "@/types";
import { getPlacementFallback, getSectionHeadings } from "@/lib/document-templates/registry";
import { headingsMatch } from "@/lib/document/heading-match";

export type PlacementConfidence = "high" | "medium" | "low";

export interface SectionClassification {
  targetSection: string;
  confidence: PlacementConfidence;
  score: number;
  source: "heuristic";
}

const SECTION_KEYWORDS: Record<string, string[]> = {
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

/** Strong prefix patterns — checked before keyword scoring. */
const PREFIX_RULES: Array<{ prefix: RegExp; section: string }> = [
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

function scoreSection(text: string, section: string): number {
  const lower = text.toLowerCase();
  const keywords = SECTION_KEYWORDS[section] ?? [];
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += kw.includes(" ") ? 3 : 1;
  }
  if (headingsMatch(section, lower.split(/[.:]/)[0]?.trim() ?? "")) {
    score += 2;
  }
  return score;
}

function confidenceFromScores(
  bestScore: number,
  secondScore: number,
  documentType: DocumentType
): PlacementConfidence {
  if (bestScore >= 4 && bestScore - secondScore >= 2) return "high";
  if (bestScore >= 2 && bestScore - secondScore >= 1) return "medium";
  if (bestScore >= 1) return "medium";
  return documentType === "blank" ? "high" : "low";
}

export function classifyPromotionSectionWithConfidence(
  text: string,
  documentType: DocumentType
): SectionClassification {
  const sections = getSectionHeadings(documentType);
  const fallback = getPlacementFallback(documentType);

  if (sections.length === 0) {
    return {
      targetSection: "Content",
      confidence: "high",
      score: 0,
      source: "heuristic",
    };
  }

  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return {
      targetSection: fallback,
      confidence: "low",
      score: 0,
      source: "heuristic",
    };
  }

  for (const rule of PREFIX_RULES) {
    if (rule.prefix.test(trimmed) && sections.some((s) => headingsMatch(s, rule.section))) {
      const match = sections.find((s) => headingsMatch(s, rule.section))!;
      return {
        targetSection: match,
        confidence: "high",
        score: 10,
        source: "heuristic",
      };
    }
  }

  const scores = sections.map((section) => ({
    section,
    score: scoreSection(trimmed, section),
  }));
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1] ?? { score: 0 };
  const confidence = confidenceFromScores(best.score, second.score, documentType);
  const targetSection =
    best.score > 0 ? best.section : fallback;

  return {
    targetSection,
    confidence,
    score: best.score,
    source: "heuristic",
  };
}

/** Rule-based section classifier for dev fallback and golden evals. */
export function classifyPromotionSection(
  text: string,
  documentType: DocumentType
): string {
  return classifyPromotionSectionWithConfidence(text, documentType).targetSection;
}
