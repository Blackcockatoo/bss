"use client";

import { useRef, useEffect } from "react";
import { SM } from "@/lib/tokens";
import { GuruMessage as GuruMessageType } from "@/types/guru";
import GuruMessage from "@/components/GuruMessage";

interface GuruPanelProps {
  messages: GuruMessageType[];
  input: string;
  streaming: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onClear: () => void;
}

const WELCOME: GuruMessageType = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello. I'm Meta Guru — I know the full Jewble ecosystem inside out.\n\nAsk me about the Meta-Pet, the Teacher Veil curriculum, the ZCEA privacy architecture, the investor thesis, or anything else.",
};

export default function GuruPanel({
  messages,
  input,
  streaming,
  onInputChange,
  onSend,
  onClear,
}: GuruPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayMessages = messages.length === 0 ? [WELCOME] : messages;
  const lastMsg = displayMessages[displayMessages.length - 1];
  const isLastStreaming = streaming && lastMsg?.role === "assistant";

  return (
    <div
      className="guru-panel"
      style={{
        position: "fixed",
        bottom: "88px",
        right: "16px",
        width: "min(420px, calc(100vw - 32px))",
        height: "clamp(400px, 60vh, 600px)",
        zIndex: 999,
        borderRadius: "20px",
        background: "rgba(8,15,30,.94)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        border: `1px solid ${SM.lineBright}`,
        boxShadow: "0 24px 60px rgba(0,0,0,.65), 0 0 0 1px rgba(96,165,250,.08)",
        display: "flex",
        flexDirection: "column",
        animation: "slide-up .25s cubic-bezier(.32,.72,0,1) both",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: `1px solid ${SM.line}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: SM.electric,
              display: "inline-block",
              boxShadow: `0 0 8px ${SM.guruGlow}`,
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: SM.electric,
            }}
          >
            META GURU
          </span>
          {streaming && (
            <span className="label-mono" style={{ color: SM.muted, fontSize: "9px" }}>
              THINKING…
            </span>
          )}
        </div>

        <button
          onClick={onClear}
          disabled={messages.length === 0}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: messages.length === 0 ? SM.faint : SM.muted,
            background: "none",
            border: "none",
            cursor: messages.length === 0 ? "default" : "pointer",
            padding: "4px 8px",
            borderRadius: "4px",
            transition: "color .15s",
          }}
          onMouseOver={(e) => {
            if (messages.length > 0) e.currentTarget.style.color = SM.text;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = messages.length === 0 ? SM.faint : SM.muted;
          }}
        >
          CLEAR
        </button>
      </div>

      {/* Messages */}
      <div
        className="scrollbar-thin"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px 8px",
        }}
      >
        {displayMessages.map((msg, i) => (
          <GuruMessage
            key={msg.id}
            message={msg}
            streaming={isLastStreaming && i === displayMessages.length - 1}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          borderTop: `1px solid ${SM.line}`,
          padding: "12px",
          display: "flex",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask about Jewble…"
          rows={1}
          style={{
            flex: 1,
            background: "rgba(14,27,48,.8)",
            border: `1px solid ${SM.line}`,
            borderRadius: "10px",
            padding: "10px 14px",
            color: SM.text,
            fontSize: "14px",
            lineHeight: 1.5,
            fontFamily: "Inter, ui-sans-serif, sans-serif",
            resize: "none",
            outline: "none",
            transition: "border-color .15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(96,165,250,.4)")}
          onBlur={(e) => (e.target.style.borderColor = SM.line)}
        />
        <button
          onClick={onSend}
          disabled={streaming || !input.trim()}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: streaming || !input.trim() ? "rgba(96,165,250,.15)" : SM.electric,
            border: "none",
            cursor: streaming || !input.trim() ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: streaming || !input.trim() ? SM.faint : SM.void,
            fontSize: "16px",
            fontWeight: 700,
            transition: "background .15s",
            flexShrink: 0,
            alignSelf: "flex-end",
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
