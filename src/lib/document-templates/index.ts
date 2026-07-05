import { v4 as uuidv4 } from "uuid";
import type { BlockType, DocumentBlock, DocumentType } from "@/types";
import {
  DEFAULT_DOCUMENT_TYPE,
  getDefaultTitle,
  getSectionHeadings,
  getTemplate,
} from "./registry";

export * from "./registry";
export * from "./product-spec";
export * from "./strategy-memo";
export * from "./product-analysis";
export { changeDocumentTemplate, previewTemplateChange } from "./change-template";

/** Create heading-only seed blocks for a template. */
export function seedBlocks(
  documentId: string,
  documentType: DocumentType = DEFAULT_DOCUMENT_TYPE
): DocumentBlock[] {
  const template = getTemplate(documentType);
  if (template.sections.length === 0) return [];

  const now = new Date().toISOString();
  return template.sections.map((heading, index) => ({
    block_id: uuidv4(),
    document_id: documentId,
    content: heading,
    block_type: "heading" as BlockType,
    position: index,
    linked_insights: [],
    source_messages: [],
    created_at: now,
    updated_at: now,
  }));
}

export function exportByTemplate(
  doc: { title: string; document_type?: DocumentType },
  blocks: DocumentBlock[]
): string {
  const documentType = doc.document_type ?? DEFAULT_DOCUMENT_TYPE;
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  let md = `# ${doc.title || getDefaultTitle(documentType)}\n\n`;

  if (sorted.length === 0) {
    for (const section of getSectionHeadings(documentType)) {
      md += `## ${section}\n\n_To be defined._\n\n`;
    }
    return md.trim();
  }

  for (const block of sorted) {
    switch (block.block_type) {
      case "heading":
        md += `## ${block.content}\n\n`;
        break;
      case "section":
        md += `### ${block.content}\n\n`;
        break;
      case "paragraph":
        md += `${block.content}\n\n`;
        break;
      case "bullet":
        md += `- ${block.content}\n`;
        break;
    }
  }

  for (const section of getSectionHeadings(documentType)) {
    const exists = sorted.some(
      (b) =>
        (b.block_type === "heading" || b.block_type === "section") &&
        b.content.toLowerCase() === section.toLowerCase()
    );
    if (!exists) {
      md += `## ${section}\n\n_To be defined._\n\n`;
    }
  }

  return md.trim();
}
