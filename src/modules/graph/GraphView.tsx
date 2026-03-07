"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { useGraphStore } from "@/store/graphStore";
import { useInsightStore } from "@/store/insightStore";
import { useDocumentStore } from "@/store/documentStore";

// Simple force-directed layout positions
interface NodePosition {
  node_id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COLORS: Record<string, string> = {
  insight: "#f59e0b",
  document_block: "#0090f0",
  topic: "#8b5cf6",
  message: "#6b7280",
};

const EDGE_COLORS: Record<string, string> = {
  supports: "#22c55e",
  contradicts: "#ef4444",
  expands: "#0090f0",
  references: "#94a3b8",
  derived_from: "#f59e0b",
};

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { nodes, edges, addNode, addEdge } = useGraphStore();
  const insights = useInsightStore((s) => s.insights);
  const blocks = useDocumentStore((s) => s.blocks);

  // Auto-populate graph from current state
  useEffect(() => {
    // Add insight nodes
    for (const insight of insights) {
      if (insight.status !== "archived") {
        addNode({
          node_type: "insight",
          entity_id: insight.insight_id,
          label: insight.title,
        });
      }
    }

    // Add document block nodes
    for (const block of blocks) {
      if (block.content) {
        addNode({
          node_type: "document_block",
          entity_id: block.block_id,
          label: block.content.slice(0, 40),
        });

        // Create edges from linked insights to blocks
        for (const insightId of block.linked_insights) {
          const insightNode = useGraphStore
            .getState()
            .findNodeByEntity(insightId);
          const blockNode = useGraphStore
            .getState()
            .findNodeByEntity(block.block_id);
          if (insightNode && blockNode) {
            addEdge({
              source_node_id: insightNode.node_id,
              target_node_id: blockNode.node_id,
              relationship_type: "supports",
            });
          }
        }
      }
    }
  }, [insights, blocks, addNode, addEdge]);

  // Compute positions using simple force-directed placement
  const positions = useMemo(() => {
    if (nodes.length === 0) return [];

    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const pos: NodePosition[] = nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const radius = Math.min(width, height) * 0.3;
      return {
        node_id: node.node_id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      };
    });

    // Simple force simulation (few iterations for static layout)
    for (let iter = 0; iter < 50; iter++) {
      // Repulsion between all nodes
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          pos[i].vx -= fx;
          pos[i].vy -= fy;
          pos[j].vx += fx;
          pos[j].vy += fy;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const source = pos.find((p) => p.node_id === edge.source_node_id);
        const target = pos.find((p) => p.node_id === edge.target_node_id);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = (dist - 100) * 0.01;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      }

      // Center gravity
      for (const p of pos) {
        p.vx += (centerX - p.x) * 0.005;
        p.vy += (centerY - p.y) * 0.005;
      }

      // Apply velocities with damping
      for (const p of pos) {
        p.x += p.vx * 0.5;
        p.y += p.vy * 0.5;
        p.vx *= 0.8;
        p.vy *= 0.8;
        // Constrain to bounds
        p.x = Math.max(30, Math.min(width - 30, p.x));
        p.y = Math.max(30, Math.min(height - 30, p.y));
      }
    }

    return pos;
  }, [nodes, edges]);

  const getPos = useCallback(
    (nodeId: string) => {
      return positions.find((p) => p.node_id === nodeId) || { x: 300, y: 200 };
    },
    [positions]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted text-sm">
        <p>Knowledge graph is empty</p>
        <p className="text-xs mt-1">
          Add insights and promote them to see relationships
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-gray-100">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-muted">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* Graph SVG */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 600 400"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Edges */}
          {edges.map((edge) => {
            const source = getPos(edge.source_node_id);
            const target = getPos(edge.target_node_id);
            return (
              <g key={edge.edge_id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={EDGE_COLORS[edge.relationship_type] || "#94a3b8"}
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                />
                {/* Edge label */}
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 4}
                  fontSize={8}
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {edge.relationship_type}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = getPos(node.node_id);
            const color = NODE_COLORS[node.node_type] || "#6b7280";
            return (
              <g key={node.node_id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.node_type === "insight" ? 8 : 6}
                  fill={color}
                  fillOpacity={0.8}
                  stroke="white"
                  strokeWidth={2}
                />
                <text
                  x={pos.x}
                  y={pos.y + 16}
                  fontSize={9}
                  fill="#475569"
                  textAnchor="middle"
                  className="select-none"
                >
                  {node.label.length > 25
                    ? node.label.slice(0, 25) + "..."
                    : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
