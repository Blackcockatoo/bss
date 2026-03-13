import { Link, useLocation } from "wouter";
import { TEACHER_HUB_URL, METAPET_APP_URL } from "../tokens";

const NAV_LINKS = [
  { label: "Parents", href: "/parents" },
  { label: "Schools", href: "/schools" },
  { label: "Investors", href: "/investors" },
  { label: "Elevator Pitch", href: "/elevator" },
  { label: "References", href: "/references" },
];

const navStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  backdropFilter: "blur(18px) saturate(1.4)",
  WebkitBackdropFilter: "blur(18px) saturate(1.4)",
  background: "rgba(5,10,18,.85)",
  borderBottom: "1px solid rgba(255,255,255,.10)",
  height: "56px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 20px",
  gap: "12px",
};

export default function CampaignNav() {
  const [location] = useLocation();

  return (
    <nav style={navStyle}>
      <Link href="/">
        <span style={{ fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase", fontSize: "13px", cursor: "pointer" }}>
          JEWBLE<span style={{ color: "#f5c84c" }}>.</span>
        </span>
      </Link>

      <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <span style={{
              fontSize: "11px",
              letterSpacing: ".9px",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: "10px",
              color: location === link.href ? "#e8eef7" : "#7a8da8",
              border: "1px solid transparent",
              background: location === link.href ? "rgba(255,255,255,.08)" : "transparent",
              cursor: "pointer",
            }}>
              {link.label}
            </span>
          </Link>
        ))}
        <a
          href={TEACHER_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "11px",
            letterSpacing: ".9px",
            textTransform: "uppercase",
            textDecoration: "none",
            padding: "7px 12px",
            borderRadius: "10px",
            color: "#f5c84c",
            border: "1px solid rgba(245,200,76,.25)",
            background: "rgba(245,200,76,.06)",
            cursor: "pointer",
          }}
        >
          Teacher Hub ↗
        </a>
      </div>
    </nav>
  );
}
