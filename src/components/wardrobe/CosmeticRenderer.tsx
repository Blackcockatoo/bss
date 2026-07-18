"use client";

/**
 * Renders one equipped gameplay cosmetic on the live pet.
 *
 * Shares the same philosophy as AddonRenderer (which stays dedicated to
 * crypto add-ons): SVG drawn in the host stage's own coordinate space via
 * a caller-provided anchor, deterministic output (no randomness at
 * render), reduced-motion aware, and a safe fallback glyph when visual
 * data is incomplete so a bad catalogue entry can never blank the pet.
 */

import { motion } from "framer-motion";
import type { AttachmentAnchor, WardrobeItem } from "@/lib/wardrobe/types";

export interface CosmeticRendererProps {
  item: WardrobeItem;
  /** Resolves a named anchor to stage-local coordinates. */
  resolveAnchor: (anchor: AttachmentAnchor) => { x: number; y: number };
  /** Uniform scale for the host stage's coordinate density. */
  scale?: number;
  reduceMotion?: boolean;
  /** Approximate body radius in stage units, for auras/patterns. */
  bodyRadius?: number;
}

const INFINITE = Number.POSITIVE_INFINITY;

export function CosmeticRenderer({
  item,
  resolveAnchor,
  scale = 1,
  reduceMotion = false,
  bodyRadius = 60,
}: CosmeticRendererProps) {
  const { visualData } = item;
  const anchor = resolveAnchor(visualData.anchor);
  const color = visualData.color ?? "#9adcff";
  const secondary = visualData.secondaryColor ?? color;
  const animate = !reduceMotion;

  return (
    <g
      data-testid="cosmetic-renderer-root"
      data-cosmetic-id={item.id}
      transform={`translate(${anchor.x}, ${anchor.y}) scale(${scale})`}
      style={{ pointerEvents: "none" }}
    >
      {renderBody()}
    </g>
  );

  function renderBody() {
    switch (item.id) {
      case "crown-gold":
        return (
          <g>
            <path d={visualData.svgPath ?? ""} fill={color} stroke="#8a6d00" strokeWidth="1" />
            <circle cx="-9" cy="-8" r="1.6" fill="#fff6d8" />
            <circle cx="0" cy="-11" r="1.9" fill="#fff6d8" />
            <circle cx="9" cy="-8" r="1.6" fill="#fff6d8" />
          </g>
        );

      case "halo-sacred":
        return (
          <motion.ellipse
            cx="0"
            cy="-10"
            rx="18"
            ry="5.5"
            fill="none"
            stroke={color}
            strokeWidth="2.6"
            animate={animate ? { opacity: [0.55, 1, 0.55] } : undefined}
            transition={{ duration: 2.4, repeat: INFINITE, ease: "easeInOut" }}
          />
        );

      case "horns-crystal":
        return (
          <g>
            <path
              d="M -10 2 L -16 -16 L -7 -6 Z"
              fill={color}
              stroke="#e8f7ff"
              strokeWidth="0.8"
              opacity="0.92"
            />
            <path
              d="M 10 2 L 16 -16 L 7 -6 Z"
              fill={color}
              stroke="#e8f7ff"
              strokeWidth="0.8"
              opacity="0.92"
            />
          </g>
        );

      case "aura-rainbow":
        return (
          <motion.g
            animate={animate ? { rotate: 360 } : undefined}
            transition={{ duration: 14, repeat: INFINITE, ease: "linear" }}
          >
            {[0, 1, 2].map((ring) => (
              <ellipse
                key={ring}
                cx="0"
                cy="0"
                rx={bodyRadius + 8 + ring * 6}
                ry={(bodyRadius + 8 + ring * 6) * 0.82}
                fill="none"
                stroke={ring === 0 ? color : ring === 1 ? secondary : "#b6ff6e"}
                strokeWidth="1.6"
                strokeDasharray="10 7"
                opacity={0.55 - ring * 0.12}
              />
            ))}
          </motion.g>
        );

      case "aura-void":
        return (
          <motion.g
            animate={animate ? { rotate: -360 } : undefined}
            transition={{ duration: 22, repeat: INFINITE, ease: "linear" }}
          >
            <ellipse
              cx="0"
              cy="0"
              rx={bodyRadius + 12}
              ry={(bodyRadius + 12) * 0.8}
              fill="none"
              stroke={secondary}
              strokeWidth="2.2"
              strokeDasharray="3 9"
              opacity="0.7"
            />
            <ellipse
              cx="0"
              cy="0"
              rx={bodyRadius + 4}
              ry={(bodyRadius + 4) * 0.8}
              fill={color}
              opacity="0.16"
            />
          </motion.g>
        );

      case "aura-fire":
        return (
          <motion.g
            animate={animate ? { opacity: [0.5, 0.9, 0.62, 0.9, 0.5] } : undefined}
            transition={{ duration: 1.7, repeat: INFINITE, ease: "easeInOut" }}
          >
            <ellipse
              cx="0"
              cy="0"
              rx={bodyRadius + 9}
              ry={(bodyRadius + 9) * 0.84}
              fill="none"
              stroke={color}
              strokeWidth="3"
              opacity="0.65"
            />
            <ellipse
              cx="0"
              cy={-bodyRadius * 0.2}
              rx={bodyRadius * 0.72}
              ry={bodyRadius * 0.5}
              fill={secondary}
              opacity="0.14"
            />
          </motion.g>
        );

      case "pattern-stars":
        return (
          <g opacity="0.85">
            {STAR_POINTS.map(([sx, sy, r], index) => (
              <circle
                key={index}
                cx={sx * bodyRadius}
                cy={sy * bodyRadius}
                r={r}
                fill={color}
              />
            ))}
          </g>
        );

      case "pattern-sacred":
        return (
          <g opacity="0.8" stroke={color} fill="none" strokeWidth="1.1">
            <circle cx="0" cy="0" r={bodyRadius * 0.34} />
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <circle
                key={angle}
                cx={Math.cos((angle * Math.PI) / 180) * bodyRadius * 0.34}
                cy={Math.sin((angle * Math.PI) / 180) * bodyRadius * 0.34}
                r={bodyRadius * 0.34}
                opacity="0.55"
              />
            ))}
          </g>
        );

      case "effect-sparkle":
        return (
          <g>
            {SPARKLE_POINTS.map(([sx, sy, r, delay], index) => (
              <motion.circle
                key={index}
                cx={sx}
                cy={sy}
                r={r}
                fill={color}
                animate={animate ? { opacity: [0.15, 0.95, 0.15], scale: [0.7, 1.25, 0.7] } : undefined}
                transition={{ duration: 1.9, delay, repeat: INFINITE, ease: "easeInOut" }}
                opacity={animate ? undefined : 0.7}
              />
            ))}
          </g>
        );

      case "effect-quantum":
        return (
          <motion.g
            animate={animate ? { opacity: [0.25, 0.85, 0.25], x: [-3, 3, -3] } : undefined}
            transition={{ duration: 2.6, repeat: INFINITE, ease: "easeInOut" }}
          >
            <ellipse cx="-10" cy="0" rx="9" ry="3.4" fill={color} opacity="0.4" />
            <ellipse cx="10" cy="1.5" rx="9" ry="3.4" fill={secondary} opacity="0.4" />
          </motion.g>
        );

      default:
        // Unknown/incomplete visual data: a soft marker rather than nothing,
        // so an equipped item is always visibly present.
        return <circle cx="0" cy="0" r="6" fill={color} opacity="0.75" />;
    }
  }
}

/** Deterministic scatter (unit body-radius space) for the star pattern. */
const STAR_POINTS: ReadonlyArray<[number, number, number]> = [
  [-0.42, -0.3, 1.7],
  [0.34, -0.44, 1.3],
  [0.12, 0.06, 2.0],
  [-0.2, 0.36, 1.4],
  [0.44, 0.3, 1.6],
  [-0.05, -0.52, 1.2],
  [0.05, 0.55, 1.2],
];

/** Deterministic trail sparkles (stage units around the ground anchor). */
const SPARKLE_POINTS: ReadonlyArray<[number, number, number, number]> = [
  [-26, 4, 2.2, 0],
  [-14, 10, 1.6, 0.3],
  [0, 13, 2.4, 0.65],
  [14, 10, 1.6, 0.95],
  [26, 4, 2.2, 1.3],
];
