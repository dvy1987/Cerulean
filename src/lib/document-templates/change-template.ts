import { v4 as uuidv4 } from "uuid";
import type { BlockType, DocumentBlock, DocumentType } from "@/types";
import { getTemplate } from "./registry";
import { headingsMatch } from "@/lib/document/heading-match";

const CARRYOVER_HEADING = "Carryover";

function isContentBlock(block: DocumentBlock): boolean {
  return block.block_type !== "heading" && block.block_type !== "section";
}

function hasWrittenContent(blocks: DocumentBlock[]): boolean {
  return blocks.some(
    (b) => isContentBlock(b) && b.content.trim().length > 0
  );
}

export interface TemplateChangePreview {
  summary: string;
  carryoverCount: number;
  newHeadings: string[];
}

export function previewTemplateChange(
  blocks: DocumentBlock[],
  targetType: DocumentType
): TemplateChangePreview {
  const { merged, carryoverCount, newHeadings } = mergeBlocksForTemplate(
    blocks,
    targetType
  );
  void merged;
  const template = getTemplate(targetType);
  return {
    summary: `Switch to ${template.label}: keep your content, add ${newHeadings.length} section heading(s)${
      carryoverCount > 0 ? `, move ${carryoverCount} block(s) to Carryover` : ""
    }.`,
    carryoverCount,
    newHeadings,
  };
}

export function changeDocumentTemplate(
  documentId: string,
  blocks: DocumentBlock[],
  targetType: DocumentType
): { blocks: DocumentBlock[]; title: string; documentType: DocumentType } {
  const template = getTemplate(targetType);
  const { merged } = mergeBlocksForTemplate(blocks, targetType);
  const now = new Date().toISOString();

  const withIds = merged.map((b, i) => ({
    ...b,
    block_id: b.block_id || uuidv4(),
    document_id: documentId,
    position: i,
    updated_at: now,
    created_at: b.created_at || now,
  }));

  return {
    blocks: withIds,
    title: template.defaultTitle,
    documentType: targetType,
  };
}

function mergeBlocksForTemplate(
  blocks: DocumentBlock[],
  targetType: DocumentType
): {
  merged: DocumentBlock[];
  carryoverCount: number;
  newHeadings: string[];
} {
  const template = getTemplate(targetType);
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const targetSections = [...template.sections];

  if (targetType === "blank") {
    const contentOnly = sorted.filter(
      (b) => isContentBlock(b) && b.content.trim().length > 0
    );
    return {
      merged: contentOnly.map((b, i) => ({ ...b, position: i })),
      carryoverCount: 0,
      newHeadings: [],
    };
  }

  if (!hasWrittenContent(sorted) && sorted.every((b) => b.block_type === "heading")) {
    const now = new Date().toISOString();
    const seeded = targetSections.map((heading, i) => ({
      block_id: uuidv4(),
      document_id: sorted[0]?.document_id ?? "",
      content: heading,
      block_type: "heading" as BlockType,
      position: i,
      linked_insights: [] as string[],
      source_messages: [] as string[],
      created_at: now,
      updated_at: now,
    }));
    return { merged: seeded, carryoverCount: 0, newHeadings: targetSections };
  }

  const sectionBuckets = new Map<string, DocumentBlock[]>();
  for (const section of targetSections) {
    sectionBuckets.set(section, []);
  }
  const carryover: DocumentBlock[] = [];

  let currentTargetSection: string | null = null;

  for (const block of sorted) {
    if (block.block_type === "heading" || block.block_type === "section") {
      const matched = targetSections.find((s) => headingsMatch(block.content, s));
      if (matched) {
        currentTargetSection = matched;
        const bucket = sectionBuckets.get(matched)!;
        if (!bucket.some((b) => b.block_type === "heading" && headingsMatch(b.content, matched))) {
          bucket.push({ ...block, content: matched, block_type: "heading" });
        }
      } else {
        currentTargetSection = null;
      }
      continue;
    }

    if (!isContentBlock(block) || !block.content.trim()) continue;

    if (currentTargetSection && sectionBuckets.has(currentTargetSection)) {
      sectionBuckets.get(currentTargetSection)!.push(block);
    } else {
      carryover.push(block);
    }
  }

  const merged: DocumentBlock[] = [];
  const newHeadings: string[] = [];

  for (const section of targetSections) {
    const bucket = sectionBuckets.get(section)!;
    const hasHeading = bucket.some((b) => b.block_type === "heading");
    if (!hasHeading) {
      newHeadings.push(section);
      merged.push({
        block_id: uuidv4(),
        document_id: sorted[0]?.document_id ?? "",
        content: section,
        block_type: "heading",
        position: merged.length,
        linked_insights: [],
        source_messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    for (const b of bucket) {
      merged.push({ ...b, position: merged.length });
    }
  }

  if (carryover.length > 0) {
    merged.push({
      block_id: uuidv4(),
      document_id: sorted[0]?.document_id ?? "",
      content: CARRYOVER_HEADING,
      block_type: "heading",
      position: merged.length,
      linked_insights: [],
      source_messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    for (const b of carryover) {
      merged.push({ ...b, position: merged.length });
    }
  }

  return {
    merged: merged.map((b, i) => ({ ...b, position: i })),
    carryoverCount: carryover.length,
    newHeadings,
  };
}
