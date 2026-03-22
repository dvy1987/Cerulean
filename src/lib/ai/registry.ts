import { AgentDefinition, AgentId } from "./types";

/**
 * Central registry of all agent definitions.
 * Agents register themselves here; the orchestrator looks them up.
 */
class AgentRegistry {
  private agents = new Map<AgentId, AgentDefinition>();

  register<TInput, TOutput>(agent: AgentDefinition<TInput, TOutput>): void {
    this.agents.set(agent.id, agent as AgentDefinition);
  }

  get(id: AgentId): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAll(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  has(id: AgentId): boolean {
    return this.agents.has(id);
  }
}

export const agentRegistry = new AgentRegistry();
