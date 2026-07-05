import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import type { DocumentType } from "@/types";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { documentType } = body as { documentType: DocumentType };
    if (!documentType) {
      return Response.json({ error: "documentType is required" }, { status: 400 });
    }
    const preview = await service.previewTemplateChange(documentType);
    return jsonOk(preview);
  });
}
