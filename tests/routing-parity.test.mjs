import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

test("orchestrator uses resolveRouting for all AI entry points", () => {
  const orchestrator = readFileSync(join(root, "src/lib/ai/orchestrator.ts"), "utf8");
  assert.match(orchestrator, /resolveRouting/);
  assert.doesNotMatch(orchestrator, /routeThroughRuntime\(action/);
});

test("MCP client calls /api/v1/ai/run (same orchestrator path)", () => {
  const mcpClient = readFileSync(join(root, "packages/cerulean-mcp/src/client.ts"), "utf8");
  assert.match(mcpClient, /\/api\/v1\/ai\/run/);
});

test("chat stream route uses runAiAction (same orchestrator path)", () => {
  const streamRoute = readFileSync(
    join(root, "src/app/api/v1/ai/chat/stream/route.ts"),
    "utf8"
  );
  assert.match(streamRoute, /runAiAction/);
});

test("llm-router respects smartRouting off and dev provider", () => {
  const llmRouter = readFileSync(join(root, "src/lib/ai/llm-router.ts"), "utf8");
  assert.match(llmRouter, /smartRouting !== false/);
  assert.match(llmRouter, /provider === "dev"/);
  assert.match(llmRouter, /400/);
});

test("dev-router rules map key actions to expected agents", () => {
  const devRouter = readFileSync(join(root, "src/lib/ai/dev-router.ts"), "utf8");
  assert.match(devRouter, /case "chat.respond":/);
  assert.match(devRouter, /primaryAgent: "chat"/);
  assert.match(devRouter, /case "document.promote":/);
  assert.match(devRouter, /primaryAgent: "document_integration"/);
});
