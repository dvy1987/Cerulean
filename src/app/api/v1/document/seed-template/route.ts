import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const blocks = await service.seedTemplateIfNeeded();
    const workspace = await service.getWorkspace();
    return jsonOk({
      blocks: blocks ?? workspace.blocks,
      document: workspace.document,
    });
  });
}
