import { AiAction, RankingResult } from "./actions";
import { AgentContext, AgentId, AgentResult } from "./types";
import { agentRegistry } from "./registry";
import { useInsightStore } from "@/store/insightStore";
import { WorkspaceService } from "@/lib/db/workspace-service";

export function scheduleBackgroundAgents(
  agentIds: AgentId[],
  triggerAction: AiAction,
  context: AgentContext,
  userId?: string
): void {
  for (const agentId of agentIds) {
    setTimeout(async () => {
      const agent = agentRegistry.get(agentId);
      if (!agent) return;

      try {
        const result = await agent.run(
          { trigger: triggerAction.type, ...triggerAction.input },
          context
        );

        if (agentId === "ranking" && result.success) {
          const { scores } = (result as AgentResult<RankingResult>).data;

          if (userId) {
            const service = new WorkspaceService(userId);
            for (const [insightId, s] of Object.entries(scores)) {
              await service.updateInsight(insightId, {
                relevance: s.relevance,
                maturity: s.maturity,
              });
            }
          } else if (typeof window !== "undefined") {
            const { setInsightScores } = useInsightStore.getState();
            for (const [insightId, s] of Object.entries(scores)) {
              setInsightScores(insightId, s.relevance, s.maturity);
            }
          }
        }
      } catch (err) {
        console.warn(`Background agent "${agentId}" failed:`, err);
      }
    }, 100);
  }
}
