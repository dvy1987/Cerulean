import type { DocumentBlock, DocumentType } from "@/types";
import { getSectionHeadings } from "@/lib/document-templates/registry";
import { headingsMatch } from "@/lib/document/heading-match";

export function isHeadingBlock(block: DocumentBlock): boolean {
  return block.block_type === "heading" || block.block_type === "section";
}

export function sectionHasContent(
  blocks: DocumentBlock[],
  headingBlock: DocumentBlock
): boolean {
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

export function getEmptySectionHeadings(
  blocks: DocumentBlock[],
  documentType: DocumentType
): string[] {
  if (documentType === "blank") return [];

  const sections = getSectionHeadings(documentType);
  const empty: string[] = [];

  for (const section of sections) {
    const heading = blocks.find(
      (b) => isHeadingBlock(b) && headingsMatch(b.content, section)
    );
    if (!heading || !sectionHasContent(blocks, heading)) {
      empty.push(section);
    }
  }

  return empty;
}

export function countEmptySections(
  blocks: DocumentBlock[],
  documentType: DocumentType
): number {
  return getEmptySectionHeadings(blocks, documentType).length;
}
