"use client";

import { SM } from "@/lib/tokens";

interface GuruButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function GuruButton({ isOpen, onClick }: GuruButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close Meta Guru" : "Open Meta Guru"}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 1000,
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        background: SM.electric,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: isOpen ? "18px" : "9px",
        fontWeight: 800,
        letterSpacing: isOpen ? "0" : "1.5px",
        color: SM.void,
        boxShadow: `0 0 0 0 ${SM.guruGlow}`,
        animation: isOpen ? "none" : "guru-pulse 2.5s ease-in-out infinite",
        transition: "background .2s, transform .15s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.08)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {isOpen ? "×" : "GURU"}
    </button>
  );
}
