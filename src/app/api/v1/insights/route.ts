import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({ insights: workspace.insights });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { title, content, conversationId, sourceMessageIds } = body as {
      title: string;
      content: string;
      conversationId?: string | null;
      sourceMessageIds?: string[];
    };

    if (!title || !content) {
      return Response.json({ error: "title and content are required" }, { status: 400 });
    }

    const insight = await service.addInsight({
      title,
      content,
      conversationId,
      sourceMessageIds,
    });
    return jsonOk({ insight }, 201);
  });
}
