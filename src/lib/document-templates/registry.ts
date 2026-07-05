import type { DocumentType } from "@/types";
import {
  PRODUCT_SPEC_DEFAULT_TITLE,
  PRODUCT_SPEC_PLACEMENT_FALLBACK,
  PRODUCT_SPEC_SECTIONS,
  PRODUCT_SPEC_TYPE,
} from "./product-spec";
import {
  STRATEGY_MEMO_DEFAULT_TITLE,
  STRATEGY_MEMO_PLACEMENT_FALLBACK,
  STRATEGY_MEMO_SECTIONS,
  STRATEGY_MEMO_TYPE,
} from "./strategy-memo";
import {
  PRODUCT_ANALYSIS_DEFAULT_TITLE,
  PRODUCT_ANALYSIS_PLACEMENT_FALLBACK,
  PRODUCT_ANALYSIS_SECTIONS,
  PRODUCT_ANALYSIS_TYPE,
} from "./product-analysis";

export interface DocumentTemplate {
  type: DocumentType;
  label: string;
  defaultTitle: string;
  sections: readonly string[];
  placementFallback: string;
}

export const DOCUMENT_TEMPLATES: Record<DocumentType, DocumentTemplate> = {
  product_spec: {
    type: PRODUCT_SPEC_TYPE,
    label: "Product Spec",
    defaultTitle: PRODUCT_SPEC_DEFAULT_TITLE,
    sections: PRODUCT_SPEC_SECTIONS,
    placementFallback: PRODUCT_SPEC_PLACEMENT_FALLBACK,
  },
  strategy_memo: {
    type: STRATEGY_MEMO_TYPE,
    label: "Strategy Memo",
    defaultTitle: STRATEGY_MEMO_DEFAULT_TITLE,
    sections: STRATEGY_MEMO_SECTIONS,
    placementFallback: STRATEGY_MEMO_PLACEMENT_FALLBACK,
  },
  product_analysis: {
    type: PRODUCT_ANALYSIS_TYPE,
    label: "Product Analysis",
    defaultTitle: PRODUCT_ANALYSIS_DEFAULT_TITLE,
    sections: PRODUCT_ANALYSIS_SECTIONS,
    placementFallback: PRODUCT_ANALYSIS_PLACEMENT_FALLBACK,
  },
  blank: {
    type: "blank",
    label: "Blank",
    defaultTitle: "Untitled Document",
    sections: [],
    placementFallback: "Content",
  },
};

export const DEFAULT_DOCUMENT_TYPE: DocumentType = "product_spec";

export function getTemplate(documentType: DocumentType): DocumentTemplate {
  return DOCUMENT_TEMPLATES[documentType] ?? DOCUMENT_TEMPLATES.product_spec;
}

export function getSectionHeadings(documentType: DocumentType): string[] {
  return [...getTemplate(documentType).sections];
}

export function getDefaultTitle(documentType: DocumentType): string {
  return getTemplate(documentType).defaultTitle;
}

export function getPlacementFallback(documentType: DocumentType): string {
  return getTemplate(documentType).placementFallback;
}
