import Anthropic from "@anthropic-ai/sdk";
import { GURU_SYSTEM_PROMPT } from "@/lib/guru-system-prompt";

const MAX_MESSAGES = 20;

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

  // Sanitize: only user/assistant, truncate long content, and keep only the
  // most recent turns. This endpoint is unauthenticated and calls a paid API,
  // so request size is bounded.
  const sanitized = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).slice(0, 4000),
    }));

  // Keep the most recent turns only, starting on a user turn.
  if (sanitized.length > MAX_MESSAGES) {
    sanitized.splice(0, sanitized.length - MAX_MESSAGES);
    while (sanitized.length > 0 && sanitized[0].role !== "user") {
      sanitized.shift();
    }
  }

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
        // Log the detail server-side; never echo upstream error text (which
        // can include provider or key details) back to the browser.
        console.error("[guru] upstream error", error);
        controller.enqueue(
          new TextEncoder().encode("\n\n[Error: Guru unavailable]")
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

// No OPTIONS/CORS handler: the guru is only called same-origin by this app.
// A wildcard Access-Control-Allow-Origin previously let any website drive
// this paid, unauthenticated endpoint from a visitor's browser.
