import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    await service.acceptPatch();
    const workspace = await service.getWorkspace();
    return jsonOk({
      success: true,
      document: workspace.document,
      blocks: workspace.blocks,
    });
  });
}
