import { Link, useLocation } from "wouter";
import CampaignLayout from "../components/CampaignLayout";
import StatBlock from "../components/StatBlock";
import { tokens } from "../tokens";

const btnGold: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px 26px",
  borderRadius: "14px",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
  border: "1px solid transparent",
  background: "#f5c84c",
  color: "#0a0a0a",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px 26px",
  borderRadius: "14px",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.15)",
  background: "transparent",
  color: "#e8eef7",
  cursor: "pointer",
};

const audienceCards = [
  {
    href: "/app",
    label: "For App Users",
    color: "#f5c84c",
    dim: "rgba(245,200,76,.12)",
    border: "rgba(245,200,76,.25)",
    desc: "Why your kid's digital companion is different from everything else they use.",
  },
  {
    href: "/schools",
    label: "For Schools",
    color: "#4dd6c8",
    dim: "rgba(77,214,200,.12)",
    border: "rgba(77,214,200,.25)",
    desc: "7 sessions. Aligned to curriculum. Zero data. Full teacher support.",
  },
  {
    href: "/investors",
    label: "For Investors",
    color: "#a78bfa",
    dim: "rgba(167,139,250,.12)",
    border: "rgba(167,139,250,.25)",
    desc: "The privacy-first edtech thesis. Why loyal beats viral.",
  },
];

export default function IndexPage() {
  const [, navigate] = useLocation();

  return (
    <CampaignLayout>
      {/* Hero */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "92px 20px 60px",
      }}>
        <div style={{ maxWidth: "960px" }}>
          <div style={{
            fontFamily: "ui-monospace, 'Courier New', monospace",
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,.10)",
            color: tokens.muted,
            marginBottom: "20px",
          }}>
            Zero-Collection Educational Architecture
          </div>

          <h1 style={{
            fontSize: "clamp(42px, 7vw, 84px)",
            lineHeight: 0.95,
            letterSpacing: "-2px",
            fontWeight: 900,
            marginBottom: "16px",
          }}>
            The first companion<br />
            <span style={{
              background: "linear-gradient(135deg,#f5c84c,#4dd6c8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              that keeps its mouth shut.
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(15px,2.4vw,20px)",
            color: "#a7b6cb",
            lineHeight: 1.65,
            maxWidth: "680px",
            margin: "0 auto 32px",
          }}>
            Jewble Meta-Pet — a digital companion with{" "}
            <em style={{ fontStyle: "normal", color: "#e8eef7", fontWeight: 650 }}>180-digit DNA</em>,{" "}
            <em style={{ fontStyle: "normal", color: "#e8eef7", fontWeight: 650 }}>15 emotional states</em>, and{" "}
            <em style={{ fontStyle: "normal", color: "#e8eef7", fontWeight: 650 }}>zero data collection.</em>{" "}
            Built for classrooms. Designed without compromise.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/elevator">
              <span style={btnGold}>Watch the Pitch →</span>
            </Link>
            <Link href="/app">
              <span style={btnGhost}>Explore the App</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px" }}>
          <StatBlock stat="94%" label="of children's apps share data with third parties" color="gold" />
          <StatBlock stat="180-digit" label="cryptographic genome — more unique than your fingerprint" color="teal" />
          <StatBlock stat="1,200+" label="independent & Catholic schools in target market" color="violet" />
          <StatBlock stat="Zero" label="accounts, logins, or data ever transmitted" color="gold" />
        </div>
      </section>

      {/* Audience selector */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 18px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#f5c84c", marginBottom: "10px" }}>
            Who are you?
          </p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 850, letterSpacing: "-1px" }}>
            Find your lane.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "14px" }}>
          {audienceCards.map((card) => (
            <button
              key={card.href}
              onClick={() => navigate(card.href)}
              style={{
                background: "#111f3a",
                border: `1px solid ${card.border}`,
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                transition: "transform .15s",
                textAlign: "left",
                width: "100%",
              }}>
                <div style={{
                  position: "absolute" as const,
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: `linear-gradient(90deg,${card.color},transparent)`,
                  borderRadius: "16px 16px 0 0",
                }} />
                <p style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: card.color, marginBottom: "8px" }}>
                  {card.label}
                </p>
                <p style={{ color: tokens.muted, fontSize: "14px", lineHeight: 1.65 }}>{card.desc}</p>
                <p style={{ color: card.color, fontSize: "13px", marginTop: "16px", fontWeight: 700 }}>
                  Read more →
                </p>
            </button>
          ))}
        </div>
      </section>
    </CampaignLayout>
  );
}
