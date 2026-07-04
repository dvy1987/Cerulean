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
    const block = await service.updateBlock(id, content);
    return jsonOk({ block });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (service) => {
    await service.removeBlock(id);
    return jsonOk({ success: true });
  });
}
