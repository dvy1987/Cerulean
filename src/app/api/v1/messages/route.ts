import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({ messages: workspace.messages });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { role, content } = body as { role: "user" | "assistant"; content: string };

    if (!role || !["user", "assistant"].includes(role)) {
      return Response.json({ error: "role must be user or assistant" }, { status: 400 });
    }
    if (typeof content !== "string") {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const message = await service.addMessage(role, content);
    return jsonOk({ message }, 201);
  });
}
