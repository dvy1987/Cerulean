import { AgentDefinition, AgentContext, AgentResult } from "../types";
import { DocumentExpandAction, DocumentExpandResult } from "../actions";
import { agentRegistry } from "../registry";
import { PatchOperation } from "@/types";
import { callAI } from "../call-ai";

type ExpandInput = DocumentExpandAction["input"];

const SYSTEM_PROMPT = `You are a document expansion specialist inside Cerulean, a structured thinking workspace.

You work on existing document blocks to deepen and refine their content. Your operations:
- **Expand argument**: Add depth, supporting reasoning, and analysis to strengthen the block's core claim.
- **Add example**: Provide a concrete, illustrative example that makes the abstract idea tangible.
- **Add counterpoint**: Surface a thoughtful opposing perspective or limitation to create intellectual balance.
- **Clarify language**: Simplify phrasing, remove jargon, and improve readability without changing meaning.

Guidelines:
- Always preserve the original content. Append or refine — never delete the user's words.
- Keep expansions focused and proportional. A one-sentence block doesn't need a five-paragraph expansion.
- Counterpoints should be genuine and thought-provoking, not strawman arguments.
- Language clarification should make text more direct without losing nuance.
- Return ONLY the final block content — no meta-commentary, no labels, just the text.`;

const OPERATION_INSTRUCTIONS: Record<ExpandInput["operation"], string> = {
  expand_argument:
    "Expand this argument by adding depth, supporting reasoning, and analysis. Preserve the original text and append the expansion naturally.",
  add_example:
    "Add a concrete, illustrative example to make this idea tangible. Preserve the original text and append the example as a clearly marked section.",
  add_counterpoint:
    "Surface a thoughtful opposing perspective or limitation. Preserve the original text and append the counterpoint as a clearly marked section.",
  clarify_language:
    "Rewrite this text to be clearer, more direct, and free of jargon — while preserving every idea and its meaning.",
};

function devExpand(operation: ExpandInput["operation"], content: string): string {
  switch (operation) {
    case "expand_argument":
      return `${content}\n\nTo elaborate further: this point rests on the assumption that the core premise holds under varying conditions. When stress-tested, the argument strengthens with concrete evidence and weakens when left abstract.`;
    case "add_example":
      return `${content}\n\n**Example:** Consider a scenario where a team adopts this approach incrementally. In the first week, they focus on the simplest use case. By week three, the pattern naturally extends to cover edge cases, validating the original design.`;
    case "add_counterpoint":
      return `${content}\n\n**Counterpoint:** This perspective has limitations. Critics argue the approach optimizes for short-term clarity at the expense of long-term flexibility. This tension between focus and adaptability deserves explicit consideration.`;
    case "clarify_language": {
      const clarified = content
        .replace(/utilize/gi, "use")
        .replace(/in order to/gi, "to")
        .replace(/at this point in time/gi, "now")
        .replace(/due to the fact that/gi, "because")
        .replace(/a large number of/gi, "many");
      return clarified !== content ? clarified : `${content}\n\n[Language clarified for directness and readability.]`;
    }
  }
}

const documentExpansionAgent: AgentDefinition<ExpandInput, DocumentExpandResult> = {
  id: "document_expansion",
  name: "Document Expansion Agent",
  description:
    "Deepens and refines existing document blocks through expansion, examples, counterpoints, and language clarification.",
  systemPrompt: SYSTEM_PROMPT,

  async run(input: ExpandInput, context: AgentContext): Promise<AgentResult<DocumentExpandResult>> {
    const targetBlock = context.stores.blocks.find((b) => b.block_id === input.blockId);

    if (!targetBlock) {
      return {
        agentId: "document_expansion",
        success: false,
        data: { operations: [] },
        error: `Block not found: ${input.blockId}`,
      };
    }

    const instruction = OPERATION_INSTRUCTIONS[input.operation];
    const expandedContent =
      (await callAI({
        systemPrompt: SYSTEM_PROMPT,
        userMessage: `${instruction}\n\nBlock content:\n${targetBlock.content}`,
      })) ?? devExpand(input.operation, targetBlock.content);

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
