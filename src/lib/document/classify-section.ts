import type { DocumentType } from "@/types";
import { getSectionHeadings } from "@/lib/document-templates/registry";
import { headingsMatch } from "@/lib/document/heading-match";

const SECTION_KEYWORDS: Record<string, string[]> = {
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
  Context: ["context", "background", "situation"],
  Thesis: ["thesis", "claim", "position", "argument"],
  Evidence: ["evidence", "data", "research", "finding", "proof"],
  Implications: ["implication", "impact", "consequence", "means"],
  Risks: ["risk", "downside", "threat", "concern"],
  "Next Steps": ["next step", "action", "roadmap", "timeline", "milestone"],
  Question: ["question", "hypothesis", "ask"],
  Findings: ["finding", "observation", "discovered", "learned"],
  Options: ["option", "alternative", "tradeoff", "choice"],
  Recommendation: ["recommend", "should", "propose", "suggest we"],
};

function scoreSection(text: string, section: string): number {
  const lower = text.toLowerCase();
  const keywords = SECTION_KEYWORDS[section] ?? [];
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += 1;
  }
  if (headingsMatch(section, lower.split(/[.:]/)[0]?.trim() ?? "")) {
    score += 2;
  }
  return score;
}

/**
 * Rule-based section classifier for dev fallback and golden evals.
 * Returns the best-matching template section for promoted text.
 */
export function classifyPromotionSection(
  text: string,
  documentType: DocumentType
): string {
  const sections = getSectionHeadings(documentType);
  if (sections.length === 0) return "Content";

  let best = sections[sections.length - 1];
  let bestScore = -1;

  for (const section of sections) {
    const score = scoreSection(text, section);
    if (score > bestScore) {
      bestScore = score;
      best = section;
    }
  }

  return bestScore > 0 ? best : sections[sections.length - 1];
}
