import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (service) => {
    const patch = await service.promoteInsight(id);
    return jsonOk({ patch }, 201);
  });
}
