import Anthropic from "@anthropic-ai/sdk";
import { GURU_SYSTEM_PROMPT } from "@/lib/guru-system-prompt";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request): Promise<Response> {
  // Parse input
  let body: { messages: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages array required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Cap conversation length: this endpoint is unauthenticated, so bound the
  // worst-case cost of a single request against the paid Anthropic API.
  const MAX_MESSAGES = 20;
  if (messages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: `messages array must not exceed ${MAX_MESSAGES} entries` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Sanitize: only user/assistant, truncate long content
  const sanitized = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).slice(0, 4000),
    }));

  // Must start with user message
  if (sanitized[0]?.role !== "user") {
    return new Response(
      JSON.stringify({ error: "First message must be from user" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream Claude's response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: GURU_SYSTEM_PROMPT,
          messages: sanitized,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(event.delta.text)
            );
          }
        }
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Guru unavailable";
        controller.enqueue(
          new TextEncoder().encode(`\n\n[Error: ${msg}]`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// No OPTIONS/CORS handler: the dashboard calls this route same-origin
// ("/api/guru"), and this endpoint is unauthenticated, so it should not
// invite cross-site callers to spend this project's Anthropic API budget.
