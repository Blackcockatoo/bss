"use client";

import { SM } from "@/lib/tokens";

const LINKS = [
  { label: "MetaPet ↗", href: "https://bluesnakestudios.com" },
  { label: "Teacher Hub ↗", href: "https://teachers-meta-pet-mr-brand.vercel.app" },
  { label: "Campaign ↗", href: "https://elevator-pitch-seven.vercel.app" },
  { label: "Elevator →", href: "https://elevator-pitch-seven.vercel.app/elevator" },
];

export default function SuiteFooter() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${SM.line}`,
        padding: "48px 24px 40px",
        textAlign: "center",
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 800,
          fontSize: "15px",
          letterSpacing: "1px",
          color: SM.chrome,
          marginBottom: "8px",
        }}
      >
        JEWBLE SUITEMASTER
        <span style={{ color: SM.gold }}>.</span>
      </div>

      <p
        className="label-mono"
        style={{ marginBottom: "28px" }}
      >
        Universal Suite Board · Blue Snake Studios
      </p>

      {/* Cross-site links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "8px 24px",
          marginBottom: "32px",
        }}
      >
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: SM.muted,
              textDecoration: "none",
              transition: "color .15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = SM.text)}
            onMouseOut={(e) => (e.currentTarget.style.color = SM.muted)}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Legal */}
      <p
        className="label-mono"
        style={{ fontSize: "9px", letterSpacing: "1px", lineHeight: 1.8 }}
      >
        © 2026 Blue Snake Studios · Zero-Collection Educational Architecture
        <br />
        SuiteMaster v1.0 · Powered by Claude (Anthropic)
      </p>
    </footer>
  );
}
