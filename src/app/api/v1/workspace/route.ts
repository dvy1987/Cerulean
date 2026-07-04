import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk(workspace);
  });
}
