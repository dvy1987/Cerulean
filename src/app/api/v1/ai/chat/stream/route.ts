import { NextRequest } from "next/server";
import { requireAuthWithRateLimit } from "@/lib/auth/rate-limit";
import { unauthorizedResponse } from "@/lib/auth/request-auth";
import { WorkspaceService } from "@/lib/db/workspace-service";
import { buildAgentContextFromDb } from "@/lib/ai/context-from-db";
import { runAiAction } from "@/lib/ai/orchestrator";
import { runPostChatPipeline } from "@/lib/ai/post-chat-pipeline";
import { ChatRespondResult } from "@/lib/ai/actions";
import { resolveProviderConfig } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  const result = await requireAuthWithRateLimit(request);
  if (!result.auth) {
    return result.response ?? unauthorizedResponse();
  }

  const userId = result.auth.userId;
  const service = new WorkspaceService(userId);

  let body: { userMessage?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userMessage = body.userMessage?.trim();
  if (!userMessage) {
    return Response.json({ error: "userMessage is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const workspace = await service.getWorkspace();
        const userMsg = await service.addMessage("user", userMessage);
        const assistantMsg = await service.addMessage("assistant", "");

        send({
          type: "init",
          userMessage: userMsg,
          assistantMessage: assistantMsg,
        });

        const context = await buildAgentContextFromDb(userId);
        const providerConfig = resolveProviderConfig(
          workspace.settings.customProvider && workspace.settings.customModel
            ? {
                customProvider: workspace.settings.customProvider,
                customModel: workspace.settings.customModel,
                customApiKey: "",
              }
            : undefined
        );

        let accumulated = "";
        const chatResult = await runAiAction<ChatRespondResult>(
          { type: "chat.respond", input: { userMessage } },
          {
            userId,
            context,
            providerConfig:
              providerConfig.provider !== "dev" ? providerConfig : undefined,
            onChunk: (chunk) => {
              accumulated += chunk;
              send({ type: "chunk", text: chunk });
            },
          }
        );

        if (!chatResult.success) {
          send({ type: "error", message: chatResult.error ?? "Chat failed" });
          return;
        }

        if (!accumulated && chatResult.data?.response) {
          accumulated = chatResult.data.response;
          send({ type: "chunk", text: accumulated });
        }

        await service.updateMessage(assistantMsg.message_id, accumulated);

        send({
          type: "done",
          assistantMessageId: assistantMsg.message_id,
        });

        const postChat = await runPostChatPipeline({
          userId,
          context: await buildAgentContextFromDb(userId),
          assistantMessageId: assistantMsg.message_id,
          userMessage,
          assistantMessage: accumulated,
          settings: {
            backgroundAgents: workspace.settings.backgroundAgents,
            suggestInsights: workspace.settings.suggestInsights,
          },
        });

        send({
          type: "postChat",
          proposals: postChat.proposals,
          suggestions: postChat.suggestions,
          contradictions: postChat.contradictions,
          insightScores: postChat.insightScores,
        });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Stream failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
