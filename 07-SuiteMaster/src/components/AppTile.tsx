"use client";

import { SiteEntry } from "@/lib/sites";
import { SM } from "@/lib/tokens";

interface AppTileProps {
  site: SiteEntry;
}

export default function AppTile({ site }: AppTileProps) {
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "28px",
        background: site.accentDim,
        border: `1px solid ${site.accentBorder}`,
        borderTop: `2px solid ${site.accent}`,
        borderRadius: "14px",
        textDecoration: "none",
        color: SM.text,
        transition: "transform .15s, box-shadow .15s, border-color .15s",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,.35)`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top row: icon + badge */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <span
          style={{
            fontSize: "28px",
            lineHeight: 1,
            color: site.accent,
            fontWeight: 900,
          }}
        >
          {site.icon}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: SM.live,
              display: "inline-block",
            }}
          />
          <span
            className="label-mono"
            style={{ color: SM.live, fontSize: "9px" }}
          >
            {site.badge}
          </span>
        </div>
      </div>

      {/* Name + tagline */}
      <h2
        style={{
          fontWeight: 800,
          fontSize: "20px",
          lineHeight: 1.2,
          margin: "0 0 6px",
          color: SM.text,
          fontFamily: "Inter, ui-sans-serif, sans-serif",
        }}
      >
        {site.name}
      </h2>
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          letterSpacing: "1px",
          color: site.accent,
          margin: "0 0 14px",
          textTransform: "uppercase",
        }}
      >
        {site.tagline}
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: "13px",
          color: SM.muted,
          lineHeight: 1.6,
          margin: "0 0 24px",
          flex: 1,
        }}
      >
        {site.description}
      </p>

      {/* Footer: launch + framework */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: site.accent,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          LAUNCH ↗
        </span>
        <span className="label-mono" style={{ fontSize: "9px" }}>
          {site.framework}
        </span>
      </div>
    </a>
  );
}
