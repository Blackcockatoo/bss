import { SM } from "@/lib/tokens";
import { GuruMessage as GuruMessageType } from "@/types/guru";

interface GuruMessageProps {
  message: GuruMessageType;
  streaming?: boolean;
}

export default function GuruMessage({ message, streaming }: GuruMessageProps) {
  const isUser = message.role === "user";
  const showCursor = !isUser && streaming && message.content;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          maxWidth: isUser ? "78%" : "85%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "rgba(96,165,250,.15)"
            : "rgba(14,27,48,.85)",
          border: isUser
            ? "1px solid rgba(96,165,250,.28)"
            : `1px solid ${SM.line}`,
          fontSize: "14px",
          lineHeight: 1.6,
          color: SM.text,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content || (
          <span style={{ color: SM.muted, fontStyle: "italic" }}>Thinking…</span>
        )}
        {showCursor && (
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "14px",
              background: SM.electric,
              marginLeft: "2px",
              verticalAlign: "middle",
              borderRadius: "1px",
              animation: "blink 1s step-end infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}
