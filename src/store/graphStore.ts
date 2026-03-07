import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  GraphNode,
  GraphEdge,
  GraphNodeType,
  GraphEdgeRelationship,
} from "@/types";

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];

  addNode: (params: {
    node_type: GraphNodeType;
    entity_id: string;
    label: string;
  }) => GraphNode;

  addEdge: (params: {
    source_node_id: string;
    target_node_id: string;
    relationship_type: GraphEdgeRelationship;
  }) => GraphEdge;

  findNodeByEntity: (entityId: string) => GraphNode | undefined;
  getEdgesForNode: (nodeId: string) => GraphEdge[];
  removeNodeByEntity: (entityId: string) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],

  addNode: ({ node_type, entity_id, label }) => {
    // Don't duplicate nodes for the same entity
    const existing = get().nodes.find((n) => n.entity_id === entity_id);
    if (existing) return existing;

    const node: GraphNode = {
      node_id: uuidv4(),
      node_type,
      entity_id,
      label: label.slice(0, 60),
      created_at: new Date().toISOString(),
    };
    set((state) => ({ nodes: [...state.nodes, node] }));
    return node;
  },

  addEdge: ({ source_node_id, target_node_id, relationship_type }) => {
    // Don't duplicate edges
    const existing = get().edges.find(
      (e) =>
        e.source_node_id === source_node_id &&
        e.target_node_id === target_node_id &&
        e.relationship_type === relationship_type
    );
    if (existing) return existing;

    const edge: GraphEdge = {
      edge_id: uuidv4(),
      source_node_id,
      target_node_id,
      relationship_type,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ edges: [...state.edges, edge] }));
    return edge;
  },

  findNodeByEntity: (entityId) =>
    get().nodes.find((n) => n.entity_id === entityId),

  getEdgesForNode: (nodeId) =>
    get().edges.filter(
      (e) => e.source_node_id === nodeId || e.target_node_id === nodeId
    ),

  removeNodeByEntity: (entityId) => {
    const node = get().nodes.find((n) => n.entity_id === entityId);
    if (!node) return;
    set((state) => ({
      nodes: state.nodes.filter((n) => n.entity_id !== entityId),
      edges: state.edges.filter(
        (e) =>
          e.source_node_id !== node.node_id &&
          e.target_node_id !== node.node_id
      ),
    }));
  },
}));
