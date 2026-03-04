import { ReactNode } from "react";
import CampaignNav from "./CampaignNav";
import { TEACHER_HUB_URL, METAPET_APP_URL } from "../tokens";

interface CampaignLayoutProps {
  children: ReactNode;
}

const ambientStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(900px 600px at 15% 20%, rgba(77,214,200,.06), transparent 60%),
    radial-gradient(700px 500px at 80% 15%, rgba(245,200,76,.05), transparent 60%),
    radial-gradient(500px 500px at 50% 80%, rgba(167,139,250,.04), transparent 60%)
  `,
};

const grainStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1,
  pointerEvents: "none",
  opacity: 0.035,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundRepeat: "repeat",
};

export default function CampaignLayout({ children }: CampaignLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: "#050a12", color: "#e8eef7", overflowX: "hidden" }}>
      <div style={ambientStyle} />
      <div style={grainStyle} />
      <CampaignNav />
      <div style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>
      <footer style={{
        position: "relative",
        zIndex: 2,
        padding: "54px 18px 40px",
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,.10)",
      }}>
        <div style={{ fontWeight: 900, fontSize: "clamp(18px,3vw,30px)", marginBottom: "6px" }}>
          JEWBLE<span style={{ color: "#f5c84c" }}>.</span>
        </div>
        <p style={{ color: "#7a8da8", fontSize: "13px", marginBottom: "18px" }}>
          Zero-Collection Educational Architecture · Blue Snake Studios
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", fontSize: "13px" }}>
          <a href={TEACHER_HUB_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#f5c84c", textDecoration: "none" }}>
            Teacher Hub ↗
          </a>
          <a href={METAPET_APP_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#4dd6c8", textDecoration: "none" }}>
            Launch the App ↗
          </a>
          <a href="/elevator" style={{ color: "#a78bfa", textDecoration: "none" }}>
            Elevator Pitch →
          </a>
        </div>
        <p style={{ color: "#7a8da8", fontSize: "11px", marginTop: "24px", opacity: 0.6 }}>
          The first companion that keeps its mouth shut. © 2026 Blue Snake Studios.
        </p>
      </footer>
    </div>
  );
}
