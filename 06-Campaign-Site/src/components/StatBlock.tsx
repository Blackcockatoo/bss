interface StatBlockProps {
  stat: string;
  label: string;
  color?: "gold" | "teal" | "violet";
}

const colorMap = {
  gold: { border: "rgba(245,200,76,.35)", text: "#f5c84c", bg: "rgba(245,200,76,.06)" },
  teal: { border: "rgba(77,214,200,.35)", text: "#4dd6c8", bg: "rgba(77,214,200,.06)" },
  violet: { border: "rgba(167,139,250,.35)", text: "#a78bfa", bg: "rgba(167,139,250,.06)" },
};

export default function StatBlock({ stat, label, color = "gold" }: StatBlockProps) {
  const c = colorMap[color];
  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: "14px",
      padding: "20px 24px",
      background: c.bg,
      textAlign: "center",
    }}>
      <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: c.text, letterSpacing: "-1px" }}>
        {stat}
      </div>
      <div style={{ fontSize: "13px", color: "#a7b6cb", marginTop: "6px", lineHeight: 1.5 }}>
        {label}
      </div>
    </div>
  );
}
