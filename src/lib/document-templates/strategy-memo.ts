import type { DocumentType } from "@/types";

export const STRATEGY_MEMO_TYPE: DocumentType = "strategy_memo";

export const STRATEGY_MEMO_SECTIONS = [
  "Context",
  "Strategic Question",
  "Options",
  "Recommendation",
  "Risks",
  "Next Steps",
] as const;

export const STRATEGY_MEMO_DEFAULT_TITLE = "Strategy Memo";

export const STRATEGY_MEMO_PLACEMENT_FALLBACK = "Next Steps";
