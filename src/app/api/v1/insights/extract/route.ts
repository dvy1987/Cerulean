import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { runAiAction } from "@/lib/ai/orchestrator";
import { InsightExtractResult } from "@/lib/ai/actions";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service, auth) => {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== "string") {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const result = await runAiAction<InsightExtractResult>(
      { type: "insight.extract", input: { text, source: "document_import" } },
      { userId: auth.userId }
    );

    if (!result.success) {
      return Response.json({ error: result.error ?? "Extraction failed" }, { status: 500 });
    }

    const insights = [];
    for (const item of result.data.insights) {
      const insight = await service.addInsight({
        title: item.title,
        content: item.content,
      });
      insights.push(insight);
    }

    return jsonOk({ insights, count: insights.length }, 201);
  });
}
