import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import { BlockType } from "@/types";

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { content, block_type, position, linked_insights, source_messages } = body as {
      content: string;
      block_type?: BlockType;
      position?: number;
      linked_insights?: string[];
      source_messages?: string[];
    };

    const block = await service.addBlock({
      content: content ?? "",
      block_type: block_type ?? "paragraph",
      position,
      linked_insights,
      source_messages,
    });
    return jsonOk({ block }, 201);
  });
}
