import { NextRequest } from "next/server";
import { requireAuthWithRateLimit } from "@/lib/auth/rate-limit";
import { unauthorizedResponse } from "@/lib/auth/request-auth";
import { WorkspaceService } from "@/lib/db/workspace-service";

export async function withAuth(
  request: NextRequest,
  handler: (service: WorkspaceService, auth: { userId: string }) => Promise<Response>
): Promise<Response> {
  const result = await requireAuthWithRateLimit(request);
  if (!result.auth) {
    return result.response ?? unauthorizedResponse();
  }

  try {
    const service = new WorkspaceService(result.auth.userId);
    return await handler(service, result.auth);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return Response.json({ error: message }, { status: 400 });
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
