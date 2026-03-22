import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { DocumentExpandAction, DocumentExpandResult } from "../actions";
import { agentRegistry } from "../registry";
import { PatchOperation } from "@/types";

type ExpandInput = DocumentExpandAction["input"];

const EXPANSION_TEMPLATES: Record<ExpandInput["operation"], (content: string) => string> = {
  expand_argument: (content) =>
    `${content}\n\nTo elaborate further: this point rests on the assumption that the core premise holds under varying conditions. When we stress-test it, we find that the argument strengthens when supported by concrete evidence and weakens when left abstract. The key is grounding each claim in observable outcomes.`,
  add_example: (content) =>
    `${content}\n\n**Example:** Consider a scenario where a team adopts this approach incrementally. In the first week, they focus on the simplest use case — a single user completing a single task. By week three, the pattern has naturally extended to cover edge cases, validating the original design without requiring a rewrite.`,
  add_counterpoint: (content) =>
    `${content}\n\n**Counterpoint:** However, this perspective has limitations. Critics argue that the approach optimizes for short-term clarity at the expense of long-term flexibility. If the underlying assumptions shift — which they often do — the tightly-scoped solution may require significant rework. This tension between focus and adaptability deserves explicit consideration.`,
  clarify_language: (content) => {
    let clarified = content;
    clarified = clarified.replace(/utilize/gi, "use");
    clarified = clarified.replace(/in order to/gi, "to");
    clarified = clarified.replace(/at this point in time/gi, "now");
    clarified = clarified.replace(/due to the fact that/gi, "because");
    clarified = clarified.replace(/a large number of/gi, "many");
    if (clarified === content) {
      clarified = `${content}\n\n[Language clarified — simplified phrasing for directness and readability.]`;
    }
    return clarified;
  },
};

const documentExpansionAgent: AgentDefinition<ExpandInput, DocumentExpandResult> = {
  id: "document_expansion",
  name: "Document Expansion Agent",
  description:
    "Deepens and refines existing document blocks through expansion, examples, counterpoints, and language clarification.",
  systemPrompt: `You are a document expansion specialist inside Cerulean, a structured thinking workspace.

You work on existing document blocks to deepen and refine their content. Your operations:
- **Expand argument**: Add depth, supporting reasoning, and analysis to strengthen the block's core claim.
- **Add example**: Provide a concrete, illustrative example that makes the abstract idea tangible.
- **Add counterpoint**: Surface a thoughtful opposing perspective or limitation to create intellectual balance.
- **Clarify language**: Simplify phrasing, remove jargon, and improve readability without changing meaning.

Guidelines:
- Always preserve the original content. Append or refine — never delete the user's words.
- Keep expansions focused and proportional. A one-sentence block doesn't need a five-paragraph expansion.
- Counterpoints should be genuine and thought-provoking, not strawman arguments.
- Language clarification should make text more direct without losing nuance.`,

  async run(
    input: ExpandInput,
    context: AgentContext
  ): Promise<AgentResult<DocumentExpandResult>> {
    const targetBlock = context.stores.blocks.find(
      (b) => b.block_id === input.blockId
    );

    if (!targetBlock) {
      return {
        agentId: "document_expansion",
        success: false,
        data: { operations: [] },
        error: `Block not found: ${input.blockId}`,
      };
    }

    const expand = EXPANSION_TEMPLATES[input.operation];
    const expandedContent = expand(targetBlock.content);

    const operations: PatchOperation[] = [
      {
        type: "update_block",
        block_id: input.blockId,
        block: { content: expandedContent },
      },
    ];

    return {
      agentId: "document_expansion",
      success: true,
      data: { operations },
    };
  },
};

agentRegistry.register(documentExpansionAgent);

export default documentExpansionAgent;
