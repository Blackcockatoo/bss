// SuiteMaster design token constants
// Use these in inline styles and component logic
// CSS variables are also available via globals.css

export const SM = {
  // Base surfaces
  void:    "#030712",
  deep:    "#080f1e",
  card:    "#0e1b30",
  glass:   "rgba(14,27,48,.88)",

  // Borders
  line:    "rgba(255,255,255,.08)",
  lineBright: "rgba(255,255,255,.14)",

  // SuiteMaster-specific accents
  chrome:  "#9ba3af",
  electric: "#60a5fa",

  // Site identity colors (inherited from Campaign)
  gold:    "#f5c84c",
  goldDim: "rgba(245,200,76,.10)",
  goldBorder: "rgba(245,200,76,.28)",

  teal:    "#4dd6c8",
  tealDim: "rgba(77,214,200,.10)",
  tealBorder: "rgba(77,214,200,.28)",

  violet:  "#a78bfa",
  violetDim: "rgba(167,139,250,.10)",
  violetBorder: "rgba(167,139,250,.28)",

  chromeDim: "rgba(155,163,175,.10)",
  chromeBorder: "rgba(155,163,175,.25)",

  // Status
  live:    "#22c55e",
  liveDim: "rgba(34,197,94,.12)",
  liveBorder: "rgba(34,197,94,.22)",

  // Guru-specific
  guruBg:   "#60a5fa",
  guruGlow: "rgba(96,165,250,.35)",

  // Typography
  text:    "#e8eef7",
  muted:   "#7a8da8",
  faint:   "#3d5166",
} as const;
