import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import type { DocumentType } from "@/types";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({ document: workspace.document, blocks: workspace.blocks });
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { title, documentType } = body as {
      title?: string;
      documentType?: DocumentType;
    };

    if (documentType) {
      const result = await service.changeDocumentTemplate(documentType);
      return jsonOk(result);
    }

    if (title) {
      const document = await service.setDocumentTitle(title);
      const workspace = await service.getWorkspace();
      return jsonOk({ document, blocks: workspace.blocks });
    }

    return Response.json({ error: "title or documentType is required" }, { status: 400 });
  });
}
