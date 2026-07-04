import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { GraphEdgeRelationship, GraphNodeType } from "@/types";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({
      nodes: workspace.graphNodes,
      edges: workspace.graphEdges,
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { action } = body as { action: "add_node" | "add_edge" };

    if (action === "add_node") {
      const { node_type, entity_id, label } = body as {
        node_type: GraphNodeType;
        entity_id: string;
        label: string;
      };
      const node = await service.addGraphNode({ node_type, entity_id, label });
      return jsonOk({ node }, 201);
    }

    if (action === "add_edge") {
      const { source_node_id, target_node_id, relationship_type } = body as {
        source_node_id: string;
        target_node_id: string;
        relationship_type: GraphEdgeRelationship;
      };
      const edge = await service.addGraphEdge({
        source_node_id,
        target_node_id,
        relationship_type,
      });
      return jsonOk({ edge }, 201);
    }

    return Response.json({ error: "action must be add_node or add_edge" }, { status: 400 });
  });
}
