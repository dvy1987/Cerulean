import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    await service.rejectPatch();
    return jsonOk({ success: true, patch: null });
  });
}
