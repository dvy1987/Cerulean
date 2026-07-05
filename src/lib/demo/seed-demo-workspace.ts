import { useChatStore } from "@/store/chatStore";
import { useInsightStore } from "@/store/insightStore";
import { useDocumentStore } from "@/store/documentStore";
import { DEFAULT_DOCUMENT_TYPE } from "@/lib/document-templates/registry";

/** Seed demo workspace when NEXT_PUBLIC_CERULEAN_DEMO_MODE=true (local dev). */
export function seedDemoWorkspaceIfEnabled() {
  if (process.env.NEXT_PUBLIC_CERULEAN_DEMO_MODE !== "true") return;

  const chat = useChatStore.getState();
  if (chat.messages.length > 0) return;

  const doc = useDocumentStore.getState();
  const insights = useInsightStore.getState();

  chat.addMessage("user", "What problem are we solving for product managers?");
  chat.addMessage(
    "assistant",
    "PMs lose ideas between chat and structured docs. Cerulean captures insights automatically and places them into a Product Spec."
  );

  if (insights.insights.length === 0) {
    insights.addInsight({
      title: "Ideas get lost between chat and docs",
      content: "Manual highlight-to-save is too much friction for busy PMs.",
      conversationId: chat.conversation.conversation_id,
    });
    insights.addInsight({
      title: "PMs think in artifact types",
      content: "Product specs and strategy memos beat blank pages.",
      conversationId: chat.conversation.conversation_id,
    });
  }

  if (doc.document.document_type === DEFAULT_DOCUMENT_TYPE) {
    const problemBlock = doc.blocks.find((b) => b.content === "Problem");
    if (problemBlock && !doc.blocks.some((b) => b.position === problemBlock.position + 1 && b.block_type === "paragraph")) {
      doc.addBlock({
        content: "Product managers lose structured thinking between exploratory chat and final deliverables.",
        block_type: "paragraph",
        position: problemBlock.position + 0.5,
      });
    }
  }
}
