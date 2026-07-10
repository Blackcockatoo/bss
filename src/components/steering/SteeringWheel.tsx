"use client";

/**
 * The Library Wheel — a category navigator, not a labyrinth.
 *
 * One labelled sector per library shelf. Pick a sector, and its shelf opens
 * below as an ordered, described list of destinations. A slow ring of the
 * pet's genome digits (or the MossPrimeSeed before a pet exists) keeps the
 * MOSS60 identity without hiding the map behind it.
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { R as SEED_RED } from "@/lib/qr-messaging/crypto";
import { LIBRARY_SHELVES, type LibraryShelf } from "@/lib/siteLibrary";
import { useStore } from "@/lib/store";

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_R = 132;
const INNER_R = 78;
const DIGIT_R = 150;

const TAU = Math.PI * 2;

function polar(radius: number, angle: number): { x: number; y: number } {
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

/** Donut-sector path between two angles (radians). */
function sectorPath(a0: number, a1: number): string {
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  const p0 = polar(OUTER_R, a0);
  const p1 = polar(OUTER_R, a1);
  const p2 = polar(INNER_R, a1);
  const p3 = polar(INNER_R, a0);
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

export function SteeringWheel() {
  const genome = useStore((state) => state.genome);
  const [selectedId, setSelectedId] = useState<LibraryShelf["id"]>(
    LIBRARY_SHELVES[0].id,
  );

  const selected =
    LIBRARY_SHELVES.find((shelf) => shelf.id === selectedId) ??
    LIBRARY_SHELVES[0];

  // Decorative digit ring: live genome if a pet exists, MossPrimeSeed otherwise.
  const digitRing = useMemo(() => {
    const digits = genome ? genome.red60.join("") : SEED_RED.join("");
    return digits.slice(0, 60).split("");
  }, [genome]);

  const sectorAngle = TAU / LIBRARY_SHELVES.length;
  const startOffset = -Math.PI / 2 - sectorAngle / 2;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-100">The Library Wheel</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Six shelves, every destination. Pick a shelf, browse its titles.
        </p>
      </div>

      {/* Wheel */}
      <div className="relative aspect-square w-full max-w-[340px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-full w-full"
          role="presentation"
        >
          {/* Slow genome digit ring */}
          <g
            className="origin-center"
            style={{ animation: "wheel-spin 120s linear infinite" }}
          >
            {digitRing.map((digit, i) => {
              const angle = (i / digitRing.length) * TAU - Math.PI / 2;
              const pos = polar(DIGIT_R, angle);
              return (
                <text
                  key={i}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-600 font-mono"
                  fontSize={7}
                >
                  {digit}
                </text>
              );
            })}
          </g>

          {/* Shelf sectors */}
          {LIBRARY_SHELVES.map((shelf, i) => {
            const a0 = startOffset + i * sectorAngle + 0.02;
            const a1 = startOffset + (i + 1) * sectorAngle - 0.02;
            const isSelected = shelf.id === selectedId;
            return (
              <path
                key={shelf.id}
                d={sectorPath(a0, a1)}
                fill={shelf.accent}
                fillOpacity={isSelected ? 0.3 : 0.08}
                stroke={shelf.accent}
                strokeOpacity={isSelected ? 0.9 : 0.35}
                strokeWidth={isSelected ? 2 : 1}
                style={{
                  filter: isSelected
                    ? `drop-shadow(0 0 10px ${shelf.accent}88)`
                    : undefined,
                  transition: "fill-opacity 200ms, stroke-opacity 200ms",
                }}
              />
            );
          })}
        </svg>

        {/* Sector buttons (HTML for a11y + crisp labels) */}
        {LIBRARY_SHELVES.map((shelf, i) => {
          const mid = startOffset + (i + 0.5) * sectorAngle;
          const pos = polar((OUTER_R + INNER_R) / 2, mid);
          const Icon = shelf.icon;
          const isSelected = shelf.id === selectedId;
          return (
            <button
              key={shelf.id}
              type="button"
              onClick={() => setSelectedId(shelf.id)}
              aria-pressed={isSelected}
              aria-label={`${shelf.title} shelf`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-center touch-manipulation"
              style={{
                left: `${(pos.x / SIZE) * 100}%`,
                top: `${(pos.y / SIZE) * 100}%`,
                color: isSelected ? shelf.accent : "#94a3b8",
              }}
            >
              <Icon
                className="h-5 w-5"
                style={
                  isSelected
                    ? { filter: `drop-shadow(0 0 6px ${shelf.accent})` }
                    : undefined
                }
              />
              <span className="max-w-[4.5rem] text-[9px] font-bold uppercase leading-tight tracking-wide">
                {shelf.title}
              </span>
            </button>
          );
        })}

        {/* Center hub */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-slate-700 bg-slate-950/90 p-3 text-center">
          <selected.icon
            className="h-6 w-6"
            style={{ color: selected.accent }}
          />
          <p className="mt-1 text-xs font-bold text-white">{selected.title}</p>
          <p className="text-[10px] text-slate-500">
            {selected.entries.length} destinations
          </p>
        </div>
      </div>

      {/* Shelf contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-lg space-y-2"
        >
          <p className="px-1 text-xs text-slate-400">{selected.blurb}</p>
          {selected.entries.map((entry, i) => (
            <motion.div
              key={entry.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={entry.href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 transition-colors hover:border-slate-600 hover:bg-slate-900"
                style={{ borderLeftColor: selected.accent, borderLeftWidth: 3 }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100">
                    {entry.label}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {entry.description}
                  </p>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-slate-500 transition-all group-hover:translate-x-0.5"
                  style={{ color: selected.accent }}
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
