import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { PatchOperation } from "@/types";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({ patch: workspace.pendingPatch });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { operations, sourceInsightId, sourceText, text, insightId } = body as {
      operations?: PatchOperation[];
      sourceInsightId?: string | null;
      sourceText?: string | null;
      text?: string;
      insightId?: string | null;
    };

    if (text) {
      const patch = await service.promoteText(
        text,
        insightId ?? sourceInsightId ?? null
      );
      return jsonOk({ patch }, 201);
    }

    if (!operations?.length) {
      return Response.json(
        { error: "operations array or text is required" },
        { status: 400 }
      );
    }

    const patch = await service.createPatch({
      operations,
      sourceInsightId: sourceInsightId ?? insightId ?? null,
      sourceText,
    });
    return jsonOk({ patch }, 201);
  });
}
