import { NextRequest } from "next/server";
import {
  authenticateRequest,
  unauthorizedResponse,
} from "@/lib/auth/request-auth";
import { rateLimitResponse } from "@/lib/auth/rate-limit";
import {
  createApiKeyForUser,
  listApiKeysForUser,
  deleteApiKeyForUser,
} from "@/lib/db/workspace-service";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();
  const limited = rateLimitResponse(request, auth.userId);
  if (limited) return limited;

  try {
    const keys = await listApiKeysForUser(auth.userId);
    return Response.json({ keys });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list keys";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();
  const limited = rateLimitResponse(request, auth.userId);
  if (limited) return limited;

  if (auth.method === "api_key") {
    return Response.json(
      { error: "Create API keys from the web app while logged in" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const name = (body as { name?: string }).name ?? "MCP / CLI";
    const result = await createApiKeyForUser(auth.userId, name);

    return Response.json(
      {
        key: {
          id: result.id,
          name: result.name,
          prefix: result.prefix,
          rawKey: result.rawKey,
        },
        message: "Save this key now — it will not be shown again.",
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create key";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorizedResponse();
  const limited = rateLimitResponse(request, auth.userId);
  if (limited) return limited;

  if (auth.method === "api_key") {
    return Response.json({ error: "Use the web app to revoke keys" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id query param required" }, { status: 400 });
  }

  try {
    await deleteApiKeyForUser(auth.userId, id);
    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete key";
    return Response.json({ error: message }, { status: 400 });
  }
}
