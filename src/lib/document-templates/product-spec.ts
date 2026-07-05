import type { DocumentType } from "@/types";

export const PRODUCT_SPEC_TYPE: DocumentType = "product_spec";

export const PRODUCT_SPEC_SECTIONS = [
  "Overview",
  "Problem",
  "Users",
  "Requirements",
  "Solution",
  "Success Metrics",
  "Non-Goals",
  "Open Questions",
] as const;

export const PRODUCT_SPEC_DEFAULT_TITLE = "Product Spec";

export const PRODUCT_SPEC_PLACEMENT_FALLBACK = "Open Questions";
