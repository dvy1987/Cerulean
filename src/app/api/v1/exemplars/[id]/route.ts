import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (service) => {
    await service.removeExemplar(id);
    return jsonOk({ success: true });
  });
}
