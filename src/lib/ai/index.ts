// AI abstraction layer — all AI integrations go through the orchestrator.
// Side-effect imports register agents with the orchestrator.
import "./agents/chat-agent";
import "./agents/document-integration-agent";
import "./agents/document-expansion-agent";
import "./agents/insight-extraction-agent";
import "./agents/suggestion-agent";
import "./agents/knowledge-graph-agent";
import "./agents/ranking-agent";
import "./agents/tonal-adjustment-agent";
import "./agents/memory-management-agent";
import "./agents/exemplar-learning-agent";

export { runAiAction } from "./orchestrator";
