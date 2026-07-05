import type { DocumentType } from "@/types";

export const PRODUCT_ANALYSIS_TYPE: DocumentType = "product_analysis";

export const PRODUCT_ANALYSIS_SECTIONS = [
  "Summary",
  "Market",
  "Users",
  "Competitive Landscape",
  "Opportunities",
  "Risks",
  "Open Questions",
] as const;

export const PRODUCT_ANALYSIS_DEFAULT_TITLE = "Product Analysis";

export const PRODUCT_ANALYSIS_PLACEMENT_FALLBACK = "Open Questions";
