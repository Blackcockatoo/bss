"use client";

import { SM } from "@/lib/tokens";

export default function SuiteNav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: SM.glass,
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        borderBottom: `1px solid ${SM.line}`,
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 800,
          fontSize: "13px",
          letterSpacing: "1px",
          color: SM.text,
          display: "flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        <span>JEWBLE</span>
        <span style={{ color: SM.gold }}>.</span>
        <span style={{ color: SM.chrome, fontWeight: 400, marginLeft: "6px" }}>
          SUITEMASTER
        </span>
      </div>

      {/* Right links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <a
          href="https://bluesnakestudios.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: SM.muted,
            textDecoration: "none",
            opacity: 0.8,
            transition: "opacity .15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          MetaPet ↗
        </a>
        <a
          href="https://teachers-meta-pet-mr-brand.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: SM.muted,
            textDecoration: "none",
            opacity: 0.8,
            transition: "opacity .15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          Teacher Hub ↗
        </a>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: SM.electric,
            background: "rgba(96,165,250,.12)",
            border: "1px solid rgba(96,165,250,.25)",
            borderRadius: "4px",
            padding: "3px 8px",
          }}
        >
          GURU ●
        </div>
      </div>
    </nav>
  );
}
