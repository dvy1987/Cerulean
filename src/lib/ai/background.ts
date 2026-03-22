import { AiAction } from "./actions";
import { AgentContext, AgentId } from "./types";
import { agentRegistry } from "./registry";

/**
 * Schedule background agents to run asynchronously.
 * These agents run after the primary agent completes and are non-blocking.
 * Users can toggle these on/off via Settings.
 */
export function scheduleBackgroundAgents(
  agentIds: AgentId[],
  triggerAction: AiAction,
  context: AgentContext
): void {
  for (const agentId of agentIds) {
    // Use setTimeout to make background agents non-blocking
    setTimeout(async () => {
      const agent = agentRegistry.get(agentId);
      if (!agent) return;

      try {
        await agent.run(
          { trigger: triggerAction.type, ...triggerAction.input },
          context
        );
      } catch (err) {
        console.warn(`Background agent "${agentId}" failed:`, err);
      }
    }, 100);
  }
}
