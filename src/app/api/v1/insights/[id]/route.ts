import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { InsightStatus } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, async (service) => {
    const body = await request.json();
    const updates = body as Partial<{
      title: string;
      content: string;
      status: InsightStatus;
      relevance: number;
      maturity: number;
    }>;

    const insight = await service.updateInsight(id, updates);
    return jsonOk({ insight });
  });
}
