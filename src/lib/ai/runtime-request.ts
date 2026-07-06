import {
  AiAction,
  DocumentExpandAction,
  GraphUpdateAction,
} from "./actions";

export type RuntimeRoute =
  | "conversation.respond"
  | "conversation.propose_insights"
  | "document.integrate"
  | "document.expand"
  | "graph.refresh";

export interface RuntimeRequest {
  route: RuntimeRoute;
  input: Record<string, unknown>;
  background?: boolean;
}

export function isRuntimeRequestBody(
  body: unknown
): body is { runtime: RuntimeRequest } {
  return (
    typeof body === "object" &&
    body !== null &&
    "runtime" in body &&
    typeof (body as { runtime: RuntimeRequest }).runtime?.route === "string"
  );
}

const EXPAND_OPS = new Set<DocumentExpandAction["input"]["operation"]>([
  "expand_argument",
  "add_example",
  "add_counterpoint",
  "clarify_language",
]);

const GRAPH_TRIGGERS = new Set<GraphUpdateAction["input"]["trigger"]>([
  "message_added",
  "insight_added",
  "patch_accepted",
  "insight_promoted",
]);

export function runtimeRequestToAction(runtime: RuntimeRequest): AiAction {
  const { route, input } = runtime;

  switch (route) {
    case "conversation.respond":
      return {
        type: "chat.respond",
        input: { userMessage: String(input.userMessage ?? "") },
      };
    case "conversation.propose_insights":
      return {
        type: "insight.propose",
        input: {
          userMessage: String(input.userMessage ?? ""),
          assistantMessage: String(input.assistantMessage ?? ""),
          assistantMessageId: String(input.assistantMessageId ?? ""),
        },
      };
    case "document.integrate":
      return {
        type: "document.promote",
        input: {
          text: String(input.text ?? ""),
          insightId: (input.insightId as string | null) ?? null,
          sourceMessageIds: Array.isArray(input.sourceMessageIds)
            ? (input.sourceMessageIds as string[])
            : [],
          documentType:
            typeof input.documentType === "string"
              ? input.documentType
              : undefined,
          targetSection:
            typeof input.targetSection === "string"
              ? input.targetSection
              : undefined,
        },
      };
    case "document.expand": {
      const op = input.operation as DocumentExpandAction["input"]["operation"];
      if (!EXPAND_OPS.has(op)) {
        throw new Error(`Invalid document.expand operation: ${String(op)}`);
      }
      return {
        type: "document.expand",
        input: {
          blockId: String(input.blockId ?? ""),
          operation: op,
        },
      };
    }
    case "graph.refresh": {
      const trigger = (input.trigger ??
        "message_added") as GraphUpdateAction["input"]["trigger"];
      if (!GRAPH_TRIGGERS.has(trigger)) {
        throw new Error(`Invalid graph.refresh trigger: ${String(trigger)}`);
      }
      return {
        type: "graph.update",
        input: {
          trigger,
          entityId:
            typeof input.entityId === "string" ? input.entityId : undefined,
          entityType:
            input.entityType === "message" ||
            input.entityType === "insight" ||
            input.entityType === "document_block"
              ? input.entityType
              : undefined,
        },
      };
    }
    default: {
      const _exhaustive: never = route;
      throw new Error(`Unknown runtime route: ${String(_exhaustive)}`);
    }
  }
}

export function actionToRuntimeRoute(action: AiAction): RuntimeRoute | null {
  const map: Partial<Record<AiAction["type"], RuntimeRoute>> = {
    "chat.respond": "conversation.respond",
    "insight.propose": "conversation.propose_insights",
    "document.promote": "document.integrate",
    "document.expand": "document.expand",
    "graph.update": "graph.refresh",
  };
  return map[action.type] ?? null;
}
