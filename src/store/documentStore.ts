import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  Document,
  DocumentBlock,
  BlockType,
  Patch,
  PatchOperation,
  DocumentType,
} from "@/types";
import {
  changeDocumentTemplate,
  DEFAULT_DOCUMENT_TYPE,
  getDefaultTitle,
  seedBlocks,
  exportByTemplate,
} from "@/lib/document-templates";

interface DocumentState {
  document: Document;
  blocks: DocumentBlock[];
  pendingPatch: Patch | null;

  addBlock: (params: {
    content: string;
    block_type: BlockType;
    position?: number;
    linked_insights?: string[];
    source_messages?: string[];
  }) => DocumentBlock;

  updateBlockContent: (blockId: string, content: string) => void;
  removeBlock: (blockId: string) => void;
  setDocumentTitle: (title: string) => void;

  // Patch system (AI_DOCUMENT_PATCH_RULE)
  setPendingPatch: (patch: Patch) => void;
  acceptPatch: () => void;
  rejectPatch: () => void;
  applyPatchOperations: (operations: PatchOperation[]) => void;

  getBlocksSorted: () => DocumentBlock[];
  exportMarkdown: () => string;
  exportPlainText: () => string;
  exportPRD: () => string;
  applyTemplate: (documentType: DocumentType) => void;
  changeTemplate: (documentType: DocumentType) => void;
}

const createDocument = (): Document => ({
  document_id: uuidv4(),
  title: "Product Spec",
  document_type: DEFAULT_DOCUMENT_TYPE,
  template_version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const initialDocument = createDocument();

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: initialDocument,
  blocks: seedBlocks(initialDocument.document_id, DEFAULT_DOCUMENT_TYPE),
  pendingPatch: null,

  addBlock: ({
    content,
    block_type,
    position,
    linked_insights = [],
    source_messages = [],
  }) => {
    const now = new Date().toISOString();
    const blocks = get().blocks;
    const pos = position ?? blocks.length;
    const block: DocumentBlock = {
      block_id: uuidv4(),
      document_id: get().document.document_id,
      content,
      block_type,
      position: pos,
      linked_insights,
      source_messages,
      created_at: now,
      updated_at: now,
    };
    set((state) => ({
      blocks: [...state.blocks, block].sort((a, b) => a.position - b.position),
      document: { ...state.document, updated_at: now },
    }));
    return block;
  },

  updateBlockContent: (blockId, content) => {
    const now = new Date().toISOString();
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.block_id === blockId ? { ...b, content, updated_at: now } : b
      ),
      document: { ...state.document, updated_at: now },
    }));
  },

  removeBlock: (blockId) => {
    const now = new Date().toISOString();
    set((state) => ({
      blocks: state.blocks.filter((b) => b.block_id !== blockId),
      document: { ...state.document, updated_at: now },
    }));
  },

  setDocumentTitle: (title) => {
    set((state) => ({
      document: {
        ...state.document,
        title,
        updated_at: new Date().toISOString(),
      },
    }));
  },

  setPendingPatch: (patch) => set({ pendingPatch: patch }),

  acceptPatch: () => {
    const patch = get().pendingPatch;
    if (!patch) return;
    get().applyPatchOperations(patch.operations);
    set({ pendingPatch: null });
  },

  rejectPatch: () => set({ pendingPatch: null }),

  applyPatchOperations: (operations) => {
    const now = new Date().toISOString();
    set((state) => {
      let newBlocks = [...state.blocks];

      for (const op of operations) {
        switch (op.type) {
          case "insert_block": {
            if (op.block) {
              const newBlock: DocumentBlock = {
                block_id: op.block_id,
                document_id: state.document.document_id,
                content: op.block.content || "",
                block_type: op.block.block_type || "paragraph",
                position: op.position ?? newBlocks.length,
                linked_insights: op.block.linked_insights || [],
                source_messages: op.block.source_messages || [],
                created_at: now,
                updated_at: now,
              };
              newBlocks.push(newBlock);
            }
            break;
          }
          case "update_block": {
            newBlocks = newBlocks.map((b) =>
              b.block_id === op.block_id
                ? { ...b, ...op.block, updated_at: now }
                : b
            );
            break;
          }
          case "delete_block": {
            newBlocks = newBlocks.filter((b) => b.block_id !== op.block_id);
            break;
          }
          case "move_block": {
            // move_block: not needed for MVP
            break;
          }
        }
      }

      return {
        blocks: newBlocks.sort((a, b) => a.position - b.position),
        document: { ...state.document, updated_at: now },
      };
    });
  },

  getBlocksSorted: () =>
    [...get().blocks].sort((a, b) => a.position - b.position),

  exportMarkdown: () => {
    const doc = get().document;
    const blocks = get().getBlocksSorted();
    let md = `# ${doc.title}\n\n`;
    for (const block of blocks) {
      switch (block.block_type) {
        case "heading":
          md += `## ${block.content}\n\n`;
          break;
        case "paragraph":
          md += `${block.content}\n\n`;
          break;
        case "bullet":
          md += `- ${block.content}\n`;
          break;
        case "section":
          md += `### ${block.content}\n\n`;
          break;
      }
    }
    return md.trim();
  },

  exportPlainText: () => {
    const doc = get().document;
    const blocks = get().getBlocksSorted();
    let text = `${doc.title}\n${"=".repeat(doc.title.length)}\n\n`;
    for (const block of blocks) {
      switch (block.block_type) {
        case "heading":
          text += `${block.content}\n${"-".repeat(block.content.length)}\n\n`;
          break;
        case "bullet":
          text += `• ${block.content}\n`;
          break;
        default:
          text += `${block.content}\n\n`;
          break;
      }
    }
    return text.trim();
  },

  exportPRD: () => exportByTemplate(get().document, get().getBlocksSorted()),

  applyTemplate: (documentType) => {
    const doc = get().document;
    const blocks = seedBlocks(doc.document_id, documentType);
    set({
      document: {
        ...doc,
        title: getDefaultTitle(documentType),
        document_type: documentType,
        template_version: doc.template_version + 1,
        updated_at: new Date().toISOString(),
      },
      blocks,
    });
  },

  changeTemplate: (documentType) => {
    const doc = get().document;
    const { blocks, title, documentType: newType } = changeDocumentTemplate(
      doc.document_id,
      get().blocks,
      documentType
    );
    set({
      document: {
        ...doc,
        title,
        document_type: newType,
        template_version: doc.template_version + 1,
        updated_at: new Date().toISOString(),
      },
      blocks,
    });
  },
}));
