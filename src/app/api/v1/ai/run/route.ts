import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { runAiAction } from "@/lib/ai/orchestrator";
import { resolveAiRunAction } from "@/lib/ai/runtime-router";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service, auth) => {
    const body = await request.json();

    let action;
    try {
      action = resolveAiRunAction(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid request";
      return Response.json({ error: message }, { status: 400 });
    }

    const result = await runAiAction(action, { userId: auth.userId });
    return jsonOk({ result });
  });
}
