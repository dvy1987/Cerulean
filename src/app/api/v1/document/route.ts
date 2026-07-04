import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({ document: workspace.document, blocks: workspace.blocks });
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { title } = body as { title: string };
    if (!title) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    const document = await service.setDocumentTitle(title);
    return jsonOk({ document });
  });
}
