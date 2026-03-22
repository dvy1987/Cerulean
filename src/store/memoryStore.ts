import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export interface DocumentMemory {
  memory_id: string;
  document_id: string;
  title: string;
  markdown: string;
  source_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface GeneralizedLearning {
  learning_id: string;
  title: string;
  markdown: string;
  source_document_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Exemplar {
  exemplar_id: string;
  title: string;
  markdown: string;
  userNotes: string;
  tags: string[];
  created_at: string;
}

interface MemoryState {
  documentMemories: DocumentMemory[];
  generalizedLearnings: GeneralizedLearning[];
  exemplars: Exemplar[];

  // Document memories
  addDocumentMemory: (params: {
    document_id: string;
    title: string;
    markdown: string;
    source_ids?: string[];
  }) => DocumentMemory;
  getDocumentMemories: (documentId: string) => DocumentMemory[];
  removeDocumentMemory: (memoryId: string) => void;

  // Generalized learnings
  addGeneralizedLearning: (params: {
    title: string;
    markdown: string;
    source_document_ids?: string[];
  }) => GeneralizedLearning;
  removeGeneralizedLearning: (learningId: string) => void;

  // Exemplars
  addExemplar: (params: {
    title: string;
    markdown: string;
    userNotes: string;
    tags?: string[];
  }) => Exemplar;
  removeExemplar: (exemplarId: string) => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  documentMemories: [],
  generalizedLearnings: [],
  exemplars: [],

  addDocumentMemory: ({ document_id, title, markdown, source_ids = [] }) => {
    const now = new Date().toISOString();
    const memory: DocumentMemory = {
      memory_id: uuidv4(),
      document_id,
      title,
      markdown,
      source_ids,
      created_at: now,
      updated_at: now,
    };
    set((state) => ({
      documentMemories: [...state.documentMemories, memory],
    }));
    return memory;
  },

  getDocumentMemories: (documentId) =>
    get().documentMemories.filter((m) => m.document_id === documentId),

  removeDocumentMemory: (memoryId) =>
    set((state) => ({
      documentMemories: state.documentMemories.filter(
        (m) => m.memory_id !== memoryId
      ),
    })),

  addGeneralizedLearning: ({ title, markdown, source_document_ids = [] }) => {
    const now = new Date().toISOString();
    const learning: GeneralizedLearning = {
      learning_id: uuidv4(),
      title,
      markdown,
      source_document_ids,
      created_at: now,
      updated_at: now,
    };
    set((state) => ({
      generalizedLearnings: [...state.generalizedLearnings, learning],
    }));
    return learning;
  },

  removeGeneralizedLearning: (learningId) =>
    set((state) => ({
      generalizedLearnings: state.generalizedLearnings.filter(
        (l) => l.learning_id !== learningId
      ),
    })),

  addExemplar: ({ title, markdown, userNotes, tags = [] }) => {
    const exemplar: Exemplar = {
      exemplar_id: uuidv4(),
      title,
      markdown,
      userNotes,
      tags,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      exemplars: [...state.exemplars, exemplar],
    }));
    return exemplar;
  },

  removeExemplar: (exemplarId) =>
    set((state) => ({
      exemplars: state.exemplars.filter((e) => e.exemplar_id !== exemplarId),
    })),
}));
