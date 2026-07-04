import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { insightToPrompt } from "@/lib/ai/dev-ai";

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    const body = await request.json();
    const { insightTitle, insightContent, insightId } = body as {
      insightTitle?: string;
      insightContent?: string;
      insightId?: string;
    };

    if (insightId) {
      return jsonOk({
        prompt: null,
        insightId,
        message: "Use workspace insights list to resolve content by id in MCP",
      });
    }

    if (!insightTitle || !insightContent) {
      return Response.json(
        { error: "insightTitle and insightContent are required" },
        { status: 400 }
      );
    }

    const prompt = insightToPrompt(insightTitle, insightContent);
    return jsonOk({ prompt });
  });
}
