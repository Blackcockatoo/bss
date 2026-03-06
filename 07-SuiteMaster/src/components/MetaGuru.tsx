"use client";

import { useState, useCallback } from "react";
import GuruButton from "@/components/GuruButton";
import GuruPanel from "@/components/GuruPanel";
import { GuruMessage } from "@/types/guru";

export default function MetaGuru() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GuruMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: GuruMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: GuruMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Cap at last 20 messages to avoid token overflow
      const recent = history.slice(-20);

      const response = await fetch("/api/guru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: recent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Sorry — I couldn't reach the Guru right now. Check your connection and try again.",
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setInput("");
  }, []);

  return (
    <>
      {isOpen && (
        <GuruPanel
          messages={messages}
          input={input}
          streaming={streaming}
          onInputChange={setInput}
          onSend={sendMessage}
          onClear={clearMessages}
        />
      )}
      <GuruButton
        isOpen={isOpen}
        onClick={() => setIsOpen((o) => !o)}
      />
    </>
  );
}
