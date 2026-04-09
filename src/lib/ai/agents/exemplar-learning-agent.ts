import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { ExemplarLearnAction, ExemplarLearnResult } from "../actions";
import { agentRegistry } from "../registry";
import { callAIForJSON } from "../call-ai";

const SYSTEM_PROMPT = `You are the Exemplar Learning Agent inside Cerulean, a structured thinking workspace.

Your role is to analyze example documents along with user quality notes, then extract generalized learnings about the user's preferences and style. These learnings will be distributed to other agents to improve future outputs.

For each learning:
- "title": a short, descriptive label for this preference
- "content": a clear description of what was learned and how to apply it
- "targetAgents": array of agent IDs that should apply this learning (choose from: "chat", "document_expansion", "tonal_adjustment", "document_integration")

Return a JSON array of 1-4 learnings.`;

const exemplarLearningAgent: AgentDefinition<ExemplarLearnAction["input"], ExemplarLearnResult> = {
  id: "exemplar_learning",
  name: "Exemplar Learning Agent",
  description:
    "Ingests example outputs with user quality notes. Draws generalized insights and distributes relevant learnings to other agents.",
  systemPrompt: SYSTEM_PROMPT,

  async run(input: ExemplarLearnAction["input"], context: AgentContext): Promise<AgentResult<ExemplarLearnResult>> {
    const exemplar = context.stores.exemplars.find((e) => e.exemplar_id === input.exemplarId);

    if (!exemplar) {
      return {
        agentId: "exemplar_learning",
        success: false,
        data: { learnings: [] },
        error: `Exemplar "${input.exemplarId}" not found`,
      };
    }

    const userMessage = [
      `Exemplar title: ${exemplar.title}`,
      exemplar.userNotes ? `User quality notes: ${exemplar.userNotes}` : "",
      `Exemplar content:\n${exemplar.markdown}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const aiLearnings = await callAIForJSON<ExemplarLearnResult["learnings"]>({
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      fallback: [],
    });

    if (aiLearnings.length > 0) {
      return {
        agentId: "exemplar_learning",
        success: true,
        data: { learnings: aiLearnings },
      };
    }

    const learnings: ExemplarLearnResult["learnings"] = [];
    const titleWords = exemplar.title.split(/\s+/).filter((w) => w.length > 3);
    if (titleWords.length > 0) {
      learnings.push({
        title: `User prefers ${titleWords[0]} style`,
        content: `Based on exemplar "${exemplar.title}", the user values a ${titleWords[0].toLowerCase()}-oriented approach.`,
        targetAgents: ["tonal_adjustment", "document_integration"],
      });
    }
    if (exemplar.userNotes) {
      learnings.push({
        title: `Quality standard from user notes`,
        content: `User notes on exemplar "${exemplar.title}": "${exemplar.userNotes}". Apply this standard to future outputs.`,
        targetAgents: ["chat", "document_expansion", "tonal_adjustment", "document_integration"],
      });
    }
    if (learnings.length === 0) {
      learnings.push({
        title: "Reference exemplar noted",
        content: `Exemplar "${exemplar.title}" processed. Add user notes to refine learnings.`,
        targetAgents: ["chat"],
      });
    }

    return {
      agentId: "exemplar_learning",
      success: true,
      data: { learnings },
    };
  },
};

agentRegistry.register(exemplarLearningAgent);

export default exemplarLearningAgent;
