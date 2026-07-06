import type { AiAction } from "./actions";
import type { RoutingSource } from "./llm-router";
import type { AgentId } from "./types";

export function logRoutingDecision(opts: {
  action: AiAction["type"];
  primaryAgent: AgentId;
  source: RoutingSource;
  latencyMs?: number;
}): void {
  if (process.env.NODE_ENV === "production") return;
  const payload = {
    action: opts.action,
    agent: opts.primaryAgent,
    source: opts.source,
    latencyMs: opts.latencyMs,
  };
  console.debug("[cerulean:route]", JSON.stringify(payload));
}
