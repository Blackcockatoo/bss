import { SM } from "@/lib/tokens";

export default function HeroBanner() {
  return (
    <section
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "120px 24px 72px",
      }}
    >
      {/* Label */}
      <div
        className="label-mono"
        style={{
          display: "inline-block",
          background: "rgba(96,165,250,.08)",
          border: "1px solid rgba(96,165,250,.18)",
          borderRadius: "4px",
          padding: "5px 12px",
          marginBottom: "32px",
          color: SM.chrome,
        }}
      >
        UNIVERSAL SUITE BOARD · v1.0
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "Inter, ui-sans-serif, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(52px, 9vw, 96px)",
          lineHeight: 1.0,
          letterSpacing: "-2px",
          margin: "0 0 20px",
          color: SM.text,
        }}
      >
        JEWBLE
        <br />
        <span className="text-gradient-suite">SUITEMASTER.</span>
      </h1>

      {/* Subhead */}
      <p
        style={{
          fontSize: "17px",
          color: SM.muted,
          lineHeight: 1.6,
          maxWidth: "520px",
          margin: "0 0 16px",
        }}
      >
        Mission control for the Jewble ecosystem. Launch your tools, talk to the
        Guru, go.
      </p>

      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          color: SM.faint,
          letterSpacing: "1px",
        }}
      >
        ↓ All systems operational
      </p>
    </section>
  );
}
