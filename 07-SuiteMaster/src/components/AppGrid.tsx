import { SITES } from "@/lib/sites";
import AppTile from "@/components/AppTile";
import { SM } from "@/lib/tokens";

export default function AppGrid() {
  return (
    <section
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "0 24px 80px",
      }}
    >
      <div className="label-mono" style={{ marginBottom: "20px" }}>
        — Suite Applications
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "16px",
        }}
      >
        {SITES.map((site) => (
          <AppTile key={site.id} site={site} />
        ))}
      </div>

      {/* Bottom note */}
      <p
        style={{
          marginTop: "32px",
          fontSize: "12px",
          color: SM.faint,
          textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.5px",
        }}
      >
        All sites are ZCEA-compliant · No user data collected · Offline-capable
      </p>
    </section>
  );
}
