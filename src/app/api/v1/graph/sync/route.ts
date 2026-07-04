import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const stats = await service.rebuildGraph();
    const workspace = await service.getWorkspace();
    return jsonOk({
      stats,
      graphNodes: workspace.graphNodes,
      graphEdges: workspace.graphEdges,
    });
  });
}
