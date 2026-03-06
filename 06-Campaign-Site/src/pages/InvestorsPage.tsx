import CampaignLayout from "../components/CampaignLayout";
import StatBlock from "../components/StatBlock";
import { Link } from "wouter";

export default function InvestorsPage() {
  return (
    <CampaignLayout>
      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "92px 20px 60px" }}>
        <div style={{ maxWidth: "900px" }}>
          <div style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", display: "inline-block", padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(167,139,250,.25)", color: "#a78bfa", marginBottom: "20px" }}>
            Investment Thesis
          </div>
          <h1 style={{ fontSize: "clamp(38px,6vw,72px)", lineHeight: 0.96, letterSpacing: "-1.5px", fontWeight: 900, marginBottom: "16px" }}>
            Loyal beats viral.<br />
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#4dd6c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Privacy beats surveillance.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(15px,2.2vw,19px)", color: "#7a8da8", lineHeight: 1.65, maxWidth: "660px", margin: "0 auto 32px" }}>
            Jewble is building the reference implementation for children's digital privacy in Australia —
            positioned ahead of COPC 2025, with a business model that doesn't depend on your attention.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/elevator">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "13px 24px", borderRadius: "14px", background: "#a78bfa", color: "#0a0a0a", fontWeight: 700, textDecoration: "none", fontSize: "14px", cursor: "pointer" }}>
                See the Elevator Pitch →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Market */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px" }}>
          <StatBlock stat="1,200+" label="independent & Catholic schools in addressable AU market" color="violet" />
          <StatBlock stat="94%" label="of children's apps exfiltrate data — this one structurally can't" color="gold" />
          <StatBlock stat="COPC 2025" label="reference implementation — ahead of the compliance curve" color="teal" />
          <StatBlock stat="Zero VC" label="non-extractive model — community partnerships, not data monetisation" color="violet" />
        </div>
      </section>

      {/* Thesis */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <p style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#a78bfa", marginBottom: "10px" }}>
          The Thesis
        </p>
        <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 850, letterSpacing: "-1px", marginBottom: "24px" }}>
          The privacy-first moment in edtech is now.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px" }}>
          {[
            {
              color: "#a78bfa",
              dim: "rgba(167,139,250,.12)",
              border: "rgba(167,139,250,.25)",
              title: "Regulatory tailwind",
              body: "Australia's Children's Online Privacy Code (COPC 2025) mandates privacy-by-default for services targeting children. Jewble is the only edtech tool in market built to this standard from inception. Competitors face retrofit costs. Jewble ships compliant.",
            },
            {
              color: "#4dd6c8",
              dim: "rgba(77,214,200,.12)",
              border: "rgba(77,214,200,.25)",
              title: "Structural moat",
              body: "The offline-first, zero-account architecture isn't a feature toggle — it's the product. Replicating it means rebuilding the entire data model. Incumbents (ClassDojo, Seesaw, Gonoodle) are structurally incapable of matching this without destroying their business models.",
            },
            {
              color: "#f5c84c",
              dim: "rgba(245,200,76,.12)",
              border: "rgba(245,200,76,.25)",
              title: "Loyalty economics",
              body: "Products that genuinely serve users — rather than extract from them — build durable relationships. Schools that adopt Jewble don't abandon it when the marketing budget dries up. They advocate for it. Word-of-mouth inside school networks is the acquisition channel.",
            },
            {
              color: "#a78bfa",
              dim: "rgba(167,139,250,.12)",
              border: "rgba(167,139,250,.25)",
              title: "Therapeutic dimension",
              body: "The Mirror System, Dream Archaeology, and Genome Sonification make Jewble a consciousness development tool — not just a game. This creates clinical research partnership potential and positions the product in the emerging EdPsych tech category.",
            },
          ].map((card) => (
            <div key={card.title} style={{ background: "#111f3a", border: `1px solid ${card.border}`, borderRadius: "16px", padding: "24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,${card.color},transparent)` }} />
              <p style={{ color: card.color, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{card.title}</p>
              <p style={{ color: "#7a8da8", fontSize: "14px", lineHeight: 1.7 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business model */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <p style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#f5c84c", marginBottom: "10px" }}>
          Business Model
        </p>
        <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 850, letterSpacing: "-1px", marginBottom: "16px" }}>
          Non-extractive by design.
        </h2>
        <p style={{ color: "#7a8da8", lineHeight: 1.7, fontSize: "16px", maxWidth: "680px", marginBottom: "28px" }}>
          Standard edtech monetises attention and data. Jewble monetises outcomes. The business model
          isn't "free until addicted" — it's institution licensing, research partnerships, and therapeutic modules.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px" }}>
          {[
            { tier: "Pilot tier", desc: "Free to trial. Community-funded. School advocates become the sales team." },
            { tier: "Institution licensing", desc: "Annual per-school fee for deployment across year groups with teacher dashboard access." },
            { tier: "Research partnerships", desc: "University and clinical partnership revenue for anonymised aggregate pattern data (opt-in, school-level only)." },
            { tier: "Therapeutic modules", desc: "Premium modules for occupational therapy, school counselling, and SEL programs." },
          ].map((row) => (
            <div key={row.tier} style={{ padding: "16px", borderRadius: "12px", background: "rgba(245,200,76,.06)", border: "1px solid rgba(245,200,76,.15)" }}>
              <p style={{ fontWeight: 700, color: "#f5c84c", marginBottom: "6px", fontSize: "13px" }}>{row.tier}</p>
              <p style={{ color: "#7a8da8", fontSize: "12px", lineHeight: 1.6 }}>{row.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: "700px", margin: "0 auto 100px", padding: "0 18px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 850, letterSpacing: "-0.5px", marginBottom: "12px" }}>
          See the full pitch.
        </h2>
        <p style={{ color: "#7a8da8", lineHeight: 1.7, marginBottom: "24px" }}>
          The 8-floor elevator pitch covers the full investment thesis — market size, regulatory landscape,
          business model, and why the first companion that keeps its mouth shut wins.
        </p>
        <Link href="/elevator">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 28px", borderRadius: "14px", background: "#a78bfa", color: "#0a0a0a", fontWeight: 700, textDecoration: "none", fontSize: "15px", cursor: "pointer" }}>
            Enter the Building →
          </span>
        </Link>
      </section>
    </CampaignLayout>
  );
}
