// AI abstraction layer
// All AI integrations must go through this module.
// Currently uses dev-ai for development mode.
// External providers will be added later.

// Side-effect imports to register all agents with the orchestrator
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

// Orchestrator — new API for multi-agent routing
export { runAiAction } from "./orchestrator";

// Backward-compatible direct exports — existing components use these
export {
  streamChatResponse,
  generatePromotionPatch,
  insightToPrompt,
  extractInsightsFromText,
  detectContradictions,
  generateThinkingSuggestions,
  computeRelevanceScores,
} from "./dev-ai";
