import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { runAiAction } from "@/lib/ai/orchestrator";
import { InsightToPromptResult } from "@/lib/ai/actions";

export async function POST(request: NextRequest) {
  return withAuth(request, async (_service, auth) => {
    const body = await request.json();
    const { insightTitle, insightContent } = body as {
      insightTitle?: string;
      insightContent?: string;
    };

    if (!insightTitle || !insightContent) {
      return Response.json(
        { error: "insightTitle and insightContent are required" },
        { status: 400 }
      );
    }

    const result = await runAiAction<InsightToPromptResult>(
      {
        type: "insight.to_prompt",
        input: { insightTitle, insightContent },
      },
      { userId: auth.userId }
    );

    if (!result.success) {
      return Response.json({ error: result.error ?? "Failed" }, { status: 500 });
    }

    return jsonOk({ prompt: result.data.prompt });
  });
}
