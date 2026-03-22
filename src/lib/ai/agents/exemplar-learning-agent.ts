import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { ExemplarLearnAction, ExemplarLearnResult } from "../actions";
import { agentRegistry } from "../registry";

const exemplarLearningAgent: AgentDefinition<
  ExemplarLearnAction["input"],
  ExemplarLearnResult
> = {
  id: "exemplar_learning",
  name: "Exemplar Learning Agent",
  description:
    "Ingests example outputs with user quality notes. Draws generalized insights and distributes relevant learnings to other agents.",
  systemPrompt: `You are the Exemplar Learning Agent for Cerulean.
Your role is to ingest example outputs along with user notes on quality.
You draw generalized insights from these exemplars and distribute relevant learnings to other agents.
Each learning should specify which agents would benefit from it.
Dedicated UI allows users to upload exemplar documents.`,

  async run(
    input: ExemplarLearnAction["input"],
    context: AgentContext
  ): Promise<AgentResult<ExemplarLearnResult>> {
    const { exemplarId } = input;

    // Find the exemplar from context
    const exemplar = context.stores.exemplars.find(
      (e) => e.exemplar_id === exemplarId
    );

    if (!exemplar) {
      return {
        agentId: "exemplar_learning",
        success: false,
        data: { learnings: [] },
        error: `Exemplar "${exemplarId}" not found`,
      };
    }

    // Dev mode: generate learnings from exemplar title and user notes
    const learnings: ExemplarLearnResult["learnings"] = [];

    // Extract style preference from title
    const titleWords = exemplar.title.split(/\s+/).filter((w) => w.length > 3);
    if (titleWords.length > 0) {
      const keyword = titleWords[0];
      learnings.push({
        title: `User prefers ${keyword} style`,
        content: `Based on exemplar "${exemplar.title}", the user values a ${keyword.toLowerCase()}-oriented approach in their documents.`,
        targetAgents: ["tonal_adjustment", "document_integration"],
      });
    }

    // Extract pattern avoidance from user notes
    if (exemplar.userNotes && exemplar.userNotes.length > 0) {
      const noteWords = exemplar.userNotes
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const avoidWord = noteWords.length > 0 ? noteWords[0] : "generic";
      learnings.push({
        title: `Avoid ${avoidWord} patterns`,
        content: `User notes on exemplar "${exemplar.title}" indicate preference: "${exemplar.userNotes}". Apply this quality standard to future outputs.`,
        targetAgents: [
          "chat",
          "document_expansion",
          "tonal_adjustment",
          "document_integration",
        ],
      });
    }

    // If no learnings could be extracted, add a generic one
    if (learnings.length === 0) {
      learnings.push({
        title: "Reference exemplar noted",
        content: `Exemplar "${exemplar.title}" has been processed. No specific patterns extracted — additional user notes would help refine learnings.`,
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
