import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#030712",
        deep: "#080f1e",
        "sm-card": "#0e1b30",
        chrome: "#9ba3af",
        electric: "#60a5fa",
        gold: "#f5c84c",
        teal: "#4dd6c8",
        violet: "#a78bfa",
        live: "#22c55e",
        "sm-text": "#e8eef7",
        "sm-muted": "#7a8da8",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "'Courier New'", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "guru-pulse": "guru-pulse 2.5s ease-in-out infinite",
        "slide-up": "slide-up .25s cubic-bezier(.32,.72,0,1) both",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        "guru-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".65", transform: "scale(1.1)" },
        },
        "slide-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
