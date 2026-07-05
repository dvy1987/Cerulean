import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api/route-helpers";

export async function GET(request: NextRequest) {
  return withAuth(request, async (service) => {
    const workspace = await service.getWorkspace();
    return jsonOk({ settings: workspace.settings });
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (service) => {
    const body = await request.json();
    const { backgroundAgents, customProvider, customModel, suggestInsights, advancedMode } = body as {
      backgroundAgents?: {
        knowledgeGraph?: boolean;
        ranking?: boolean;
        suggestion?: boolean;
        tonalAdjustment?: boolean;
      };
      customProvider?: string;
      customModel?: string;
      suggestInsights?: boolean;
      advancedMode?: boolean;
    };

    const updates: Record<string, unknown> = {};
    if (backgroundAgents) {
      if (backgroundAgents.knowledgeGraph !== undefined) {
        updates.background_knowledge_graph = backgroundAgents.knowledgeGraph;
      }
      if (backgroundAgents.ranking !== undefined) {
        updates.background_ranking = backgroundAgents.ranking;
      }
      if (backgroundAgents.suggestion !== undefined) {
        updates.background_suggestion = backgroundAgents.suggestion;
      }
      if (backgroundAgents.tonalAdjustment !== undefined) {
        updates.background_tonal_adjustment = backgroundAgents.tonalAdjustment;
      }
    }
    if (customProvider !== undefined) updates.custom_provider = customProvider;
    if (customModel !== undefined) updates.custom_model = customModel;
    if (suggestInsights !== undefined) updates.suggest_insights = suggestInsights;
    if (advancedMode !== undefined) updates.advanced_mode = advancedMode;

    await service.updateSettings(updates);
    const workspace = await service.getWorkspace();
    return jsonOk({ settings: workspace.settings });
  });
}
