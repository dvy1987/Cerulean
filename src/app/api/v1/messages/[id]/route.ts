import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { content } = body as { content: string };
    if (typeof content !== "string") {
      return Response.json({ error: "content is required" }, { status: 400 });
    }
    const message = await service.updateMessage(id, content);
    return jsonOk({ message });
  });
}
