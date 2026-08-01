"use client";

/**
 * The one painter for the evolution stage sigil, shared by every renderer.
 *
 * A sigil is painted in two passes — a dark underlay, then the stage-coloured
 * stroke on top. That treatment is what keeps a stage legible on ANY body: a
 * blue GENETICS mark on a blue creature would otherwise vanish into it.
 *
 * Geometry comes from `buildStageSigil`, so the Evolved body, Auralia and
 * Geometry all draw the same shapes in their own coordinate spaces.
 */

import {
  buildStageSigil,
  type SigilPrimitive,
  type StageSigilLayout,
} from "@/evolution/stageSigil";

export interface StageSigilProps extends StageSigilLayout {
  /** Primary stroke colour. */
  color: string;
  /** Alternating stroke colour for accented primitives. */
  accentColor: string;
  /** Dark colour painted underneath for guaranteed contrast. */
  underlayColor: string;
  /** Stroke width of the top pass, in the caller's coordinate space. */
  width: number;
  /** 0..1 overall opacity of the top pass. */
  opacity: number;
}

function SigilPass({
  primitives,
  stroke,
  width,
  opacity,
  keyPrefix,
}: {
  primitives: SigilPrimitive[];
  /** Called per primitive; the underlay pass ignores the accent flag. */
  stroke: (accent: boolean) => string;
  width: number;
  opacity: number;
  keyPrefix: string;
}) {
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round">
      {primitives.map((primitive, index) => {
        const key = `${keyPrefix}-${index}`;
        const color = stroke(primitive.accent);
        if (primitive.kind === "line") {
          return (
            <line
              key={key}
              x1={primitive.x1}
              y1={primitive.y1}
              x2={primitive.x2}
              y2={primitive.y2}
              stroke={color}
              strokeWidth={width}
            />
          );
        }
        if (primitive.kind === "ellipse") {
          return (
            <ellipse
              key={key}
              cx={primitive.cx}
              cy={primitive.cy}
              rx={primitive.rx}
              ry={primitive.ry}
              stroke={color}
              strokeWidth={width}
              strokeDasharray={primitive.dash}
            />
          );
        }
        return (
          <circle
            key={key}
            cx={primitive.cx}
            cy={primitive.cy}
            r={primitive.r + width * 0.25}
            fill={color}
            stroke="none"
          />
        );
      })}
    </g>
  );
}

export function StageSigil({
  color,
  accentColor,
  underlayColor,
  width,
  opacity,
  ...layout
}: StageSigilProps) {
  const primitives = buildStageSigil(layout);

  return (
    <g data-evolution-mark={layout.shape}>
      <SigilPass
        primitives={primitives}
        stroke={() => underlayColor}
        width={width * 2.1}
        opacity={opacity * 0.5}
        keyPrefix="under"
      />
      <SigilPass
        primitives={primitives}
        stroke={(accent) => (accent ? accentColor : color)}
        width={width}
        opacity={opacity}
        keyPrefix="mark"
      />
    </g>
  );
}
