// AI abstraction layer
// All AI integrations must go through this module.
// Currently uses dev-ai for development mode.
// External providers will be added later.

export {
  streamChatResponse,
  generatePromotionPatch,
  insightToPrompt,
} from "./dev-ai";
