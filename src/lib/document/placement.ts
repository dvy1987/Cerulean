import { v4 as uuidv4 } from "uuid";
import type { DocumentBlock, DocumentType, PatchOperation } from "@/types";
import { getPlacementFallback, getSectionHeadings } from "@/lib/document-templates/registry";
import { headingsMatch } from "@/lib/document/heading-match";

function findSectionHeadingBlock(
  blocks: DocumentBlock[],
  sectionName: string
): DocumentBlock | undefined {
  return blocks.find(
    (b) =>
      (b.block_type === "heading" || b.block_type === "section") &&
      headingsMatch(b.content, sectionName)
  );
}

function findInsertionPosition(
  blocks: DocumentBlock[],
  sectionName: string,
  documentType: DocumentType
): { position: number; placementBlockId: string; placementLabel: string } {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const sections = getSectionHeadings(documentType);
  const targetIdx = sections.findIndex((s) => headingsMatch(s, sectionName));

  const heading = findSectionHeadingBlock(sorted, sectionName);
  if (heading) {
    let insertPos = heading.position + 1;
    for (const b of sorted) {
      if (b.position > heading.position && b.block_type !== "heading" && b.block_type !== "section") {
        insertPos = Math.max(insertPos, b.position + 1);
      }
      if (
        b.position > heading.position &&
        (b.block_type === "heading" || b.block_type === "section") &&
        b.block_id !== heading.block_id
      ) {
        break;
      }
    }
    return {
      position: insertPos,
      placementBlockId: heading.block_id,
      placementLabel: heading.content,
    };
  }

  if (targetIdx >= 0 && targetIdx < sections.length - 1) {
    for (let i = targetIdx + 1; i < sections.length; i++) {
      const later = findSectionHeadingBlock(sorted, sections[i]);
      if (later) {
        return {
          position: later.position,
          placementBlockId: later.block_id,
          placementLabel: sections[targetIdx],
        };
      }
    }
  }

  const fallback = getPlacementFallback(documentType);
  const fallbackHeading = findSectionHeadingBlock(sorted, fallback);
  if (fallbackHeading) {
    return {
      position: fallbackHeading.position + 1,
      placementBlockId: fallbackHeading.block_id,
      placementLabel: fallbackHeading.content,
    };
  }

  const maxPos = sorted.length > 0 ? Math.max(...sorted.map((b) => b.position)) + 1 : 0;
  return {
    position: maxPos,
    placementBlockId: sorted[0]?.block_id ?? "",
    placementLabel: fallback,
  };
}

export function buildPromotionPatch(opts: {
  text: string;
  blocks: DocumentBlock[];
  documentType: DocumentType;
  insightId?: string | null;
  sourceMessageIds: string[];
  targetSection?: string;
}): {
  operations: PatchOperation[];
  placement_label: string;
  placement_block_id: string;
} {
  const {
    text,
    blocks,
    documentType,
    insightId = null,
    sourceMessageIds,
    targetSection,
  } = opts;

  const operations: PatchOperation[] = [];
  const newBlockId = uuidv4();
  const sorted = [...blocks].sort((a, b) => a.position - b.position);

  if (sorted.length === 0 && documentType !== "blank") {
    const sections = getSectionHeadings(documentType);
    const section = targetSection && sections.some((s) => headingsMatch(s, targetSection))
      ? sections.find((s) => headingsMatch(s, targetSection))!
      : sections[0];

    for (let i = 0; i < sections.length; i++) {
      operations.push({
        type: "insert_block",
        block_id: uuidv4(),
        block: {
          content: sections[i],
          block_type: "heading",
          linked_insights: [],
          source_messages: [],
        },
        position: i,
      });
    }

    const sectionIdx = sections.findIndex((s) => headingsMatch(s, section));
    operations.push({
      type: "insert_block",
      block_id: newBlockId,
      block: {
        content: text,
        block_type: "paragraph",
        linked_insights: insightId ? [insightId] : [],
        source_messages: sourceMessageIds,
      },
      position: sectionIdx + 1,
    });

    const headingOp = operations[sectionIdx];
    return {
      operations,
      placement_label: section,
      placement_block_id: headingOp.block_id,
    };
  }

  const placement = findInsertionPosition(
    sorted,
    targetSection ?? getPlacementFallback(documentType),
    documentType
  );

  operations.push({
    type: "insert_block",
    block_id: newBlockId,
    block: {
      content: text,
      block_type: "paragraph",
      linked_insights: insightId ? [insightId] : [],
      source_messages: sourceMessageIds,
    },
    position: placement.position,
  });

  return {
    operations,
    placement_label: placement.placementLabel,
    placement_block_id: placement.placementBlockId,
  };
}
