/**
 * Build agent context from Zustand stores (client / in-memory mode).
 * Alias for buildAgentContext — used by ChatPanel when persistence is off.
 */
export { buildAgentContext as buildAgentContextFromStores } from "./context";
