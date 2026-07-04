import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({ exemplars: workspace.exemplars });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { title, markdown, userNotes, tags } = body as {
      title: string;
      markdown: string;
      userNotes?: string;
      tags?: string[];
    };

    if (!title || !markdown) {
      return Response.json({ error: "title and markdown are required" }, { status: 400 });
    }

    const exemplar = await service.addExemplar({
      title,
      markdown,
      userNotes: userNotes ?? "",
      tags,
    });
    return jsonOk({ exemplar }, 201);
  });
}
