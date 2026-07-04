import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { extractInsightsFromText } from "@/lib/ai/dev-ai";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== "string") {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const extracted = extractInsightsFromText(text);
    const insights = [];
    for (const item of extracted) {
      const insight = await service.addInsight({
        title: item.title,
        content: item.content,
      });
      insights.push(insight);
    }

    return jsonOk({ insights, count: insights.length }, 201);
  });
}
