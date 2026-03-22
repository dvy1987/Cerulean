import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { MemoryManageAction, MemoryManageResult } from "../actions";
import { agentRegistry } from "../registry";

const MEMORY_COMPACTION_THRESHOLD = 20;

const memoryManagementAgent: AgentDefinition<
  MemoryManageAction["input"],
  MemoryManageResult
> = {
  id: "memory_management",
  name: "Memory Management Agent",
  description:
    "Manages per-document agent memories and generalized cross-document learnings. Compacts old/irrelevant memories, promotes document-specific learnings to generalized learnings.",
  systemPrompt: `You are the Memory Management Agent for Cerulean.
Your role is to manage per-document agent memories and generalized cross-document learnings.
You compact old or irrelevant memories to keep the context window efficient.
You promote document-specific learnings to generalized learnings when patterns are detected across multiple documents.
Memories are stored as markdown files.`,

  async run(
    input: MemoryManageAction["input"],
    context: AgentContext
  ): Promise<AgentResult<MemoryManageResult>> {
    const { trigger } = input;
    const { documentId, stores } = context;
    const docMemories = stores.documentMemories.filter(
      (m) => m.title.includes(documentId) || true // dev: use all for simulation
    );

    let memoriesCompacted = 0;
    let learningsPromoted = 0;

    switch (trigger) {
      case "message_complete": {
        // Check if document memories exceed threshold — simulate compaction
        if (docMemories.length > MEMORY_COMPACTION_THRESHOLD) {
          // In dev mode, mark half the oldest memories as compacted
          memoriesCompacted = Math.floor(docMemories.length / 2);
        }
        break;
      }

      case "insight_added": {
        // Check for cross-document patterns by looking at insight title words
        // appearing across multiple document memories
        const insightWords = new Set(
          stores.insights
            .flatMap((i) => i.title.toLowerCase().split(/\W+/))
            .filter((w) => w.length > 3)
        );

        const matchingMemories = docMemories.filter((m) => {
          const memWords = m.title.toLowerCase().split(/\W+/);
          return memWords.some((w) => insightWords.has(w));
        });

        if (matchingMemories.length >= 2) {
          // Pattern detected across memories — promote one learning
          learningsPromoted = 1;
        }
        break;
      }

      case "patch_accepted": {
        // Record a memory about the accepted patch (simulate success)
        // The orchestrator/UI will use this result to actually store the memory
        memoriesCompacted = 0;
        learningsPromoted = 0;
        break;
      }

      case "session_end": {
        // Promote document-specific learnings to generalized learnings
        // if patterns are detected
        if (docMemories.length > 0 && stores.generalizedLearnings.length > 0) {
          // Check for overlapping themes between doc memories and existing learnings
          const learningWords = new Set(
            stores.generalizedLearnings
              .flatMap((l) => l.title.toLowerCase().split(/\W+/))
              .filter((w) => w.length > 3)
          );

          const promotable = docMemories.filter((m) => {
            const memWords = m.title.toLowerCase().split(/\W+/);
            return memWords.some((w) => learningWords.has(w));
          });

          learningsPromoted = Math.min(promotable.length, 3);
        } else if (docMemories.length >= 5) {
          // Even without existing learnings, promote if enough doc memories exist
          learningsPromoted = 1;
        }

        // Compact old memories at session end
        if (docMemories.length > MEMORY_COMPACTION_THRESHOLD) {
          memoriesCompacted = Math.floor(docMemories.length / 3);
        }
        break;
      }
    }

    return {
      agentId: "memory_management",
      success: true,
      data: { memoriesCompacted, learningsPromoted },
    };
  },
};

agentRegistry.register(memoryManagementAgent);

export default memoryManagementAgent;
