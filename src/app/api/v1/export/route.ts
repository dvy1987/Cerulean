import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";
import {
  exportDocumentMarkdown,
  exportDocumentPlainText,
  exportDocumentPRD,
} from "@/lib/db/workspace-service";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "markdown";

    const workspace = await service.getWorkspace();
    let content: string;

    if (format === "text") {
      content = exportDocumentPlainText(workspace.document, workspace.blocks);
    } else if (format === "markdown") {
      content = exportDocumentMarkdown(workspace.document, workspace.blocks);
    } else if (format === "prd") {
      content = exportDocumentPRD(workspace.document, workspace.blocks);
    } else {
      return Response.json(
        { error: "format must be markdown, text, or prd" },
        { status: 400 }
      );
    }

    return jsonOk({ format, content, title: workspace.document.title });
  });
}
