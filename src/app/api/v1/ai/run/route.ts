import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { runAiAction } from "@/lib/ai/orchestrator";
import { AiAction } from "@/lib/ai/actions";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service, auth) => {
    const body = await request.json();
    const { action } = body as { action: AiAction };

    if (!action?.type) {
      return Response.json({ error: "action is required" }, { status: 400 });
    }

    const result = await runAiAction(action, { userId: auth.userId });
    return jsonOk({ result });
  });
}
