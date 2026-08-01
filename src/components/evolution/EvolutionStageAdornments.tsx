"use client";

/**
 * The stage's earned anatomy, drawn for the orb-style renderers.
 *
 * `PetBodyRenderer` already draws horns / third eye / crown / wings in the
 * Body Forge's own richer vocabulary, so the Evolved form does not use this.
 * Auralia and Geometry have no anatomy system of their own — this is what
 * makes the same grants visible on them, in one shared implementation, so a
 * SPECIATION pet is a SPECIATION pet on every renderer.
 *
 * Everything is drawn from an anchor box the caller supplies, so each
 * renderer places it in its own viewBox without this module knowing anything
 * about their internals. Purely additive: no caller's existing art changes.
 */

import {
  getCumulativeEvolutionUpgrade,
  type EvolutionGrantedFeature,
} from "@/evolution/stageUpgrades";
import type { EvolutionState } from "@/evolution/types";
import { StageSigil } from "./StageSigil";

export interface EvolutionStageAnchor {
  /** Head centre and half-extents, in the caller's viewBox space. */
  headX: number;
  headY: number;
  headRx: number;
  headRy: number;
  /** Body/chest centre and half-extents — where the sigil is etched. */
  bodyX: number;
  bodyY: number;
  bodyRx: number;
  bodyRy: number;
}

export interface EvolutionStageAdornmentsProps extends EvolutionStageAnchor {
  state: EvolutionState;
  /** `behind` draws wings (under the creature); `front` draws the rest. */
  layer: "behind" | "front";
  color: string;
  accentColor: string;
  /** Dark colour used to keep marks legible on any body. */
  underlayColor: string;
  /** 0..1 momentary emphasis — the ceremony flash drives this. */
  emphasis?: number;
  strokeWidth?: number;
}

function has(
  features: readonly EvolutionGrantedFeature[],
  feature: EvolutionGrantedFeature,
): boolean {
  return features.includes(feature);
}

export function EvolutionStageAdornments({
  state,
  layer,
  color,
  accentColor,
  underlayColor,
  emphasis = 0,
  strokeWidth = 2.4,
  ...anchor
}: EvolutionStageAdornmentsProps) {
  const upgrade = getCumulativeEvolutionUpgrade(state);
  const glow = Math.max(0, Math.min(1, emphasis));
  const { headX, headY, headRx, headRy, bodyX, bodyY, bodyRx, bodyRy } = anchor;
  const width = strokeWidth * (1 + glow * 0.35);

  if (layer === "behind") {
    if (!has(upgrade.features, "wings")) return null;
    const reach = bodyRx * (1.5 + glow * 0.35);
    const rise = bodyRy * 0.85;
    return (
      <g
        data-evolution-adornment="wings"
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        opacity={0.55 + glow * 0.35}
      >
        {[-1, 1].map((side) => (
          <g key={side}>
            <path
              d={`M ${bodyX} ${bodyY - bodyRy * 0.2}
                  Q ${bodyX + side * reach * 0.75} ${bodyY - rise}
                    ${bodyX + side * reach} ${bodyY + bodyRy * 0.1}
                  Q ${bodyX + side * reach * 0.5} ${bodyY + bodyRy * 0.55}
                    ${bodyX} ${bodyY + bodyRy * 0.35} Z`}
              fill={accentColor}
              fillOpacity={0.16 + glow * 0.14}
            />
            {[0.35, 0.6, 0.85].map((spar) => (
              <path
                key={spar}
                d={`M ${bodyX} ${bodyY - bodyRy * 0.16}
                    Q ${bodyX + side * reach * spar * 0.7} ${bodyY - rise * spar}
                      ${bodyX + side * reach * spar} ${bodyY + bodyRy * 0.1 * spar}`}
                opacity="0.7"
              />
            ))}
          </g>
        ))}
      </g>
    );
  }

  return (
    <g data-evolution-adornment="front">
      {has(upgrade.features, "horns") && (
        <g
          data-evolution-adornment="horns"
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={0.78 + glow * 0.22}
        >
          {[-1, 1].map((side) => (
            <path
              key={side}
              d={`M ${headX + side * headRx * 0.62} ${headY - headRy * 0.52}
                  Q ${headX + side * headRx * 1.18} ${headY - headRy * 1.05}
                    ${headX + side * headRx * 0.86} ${headY - headRy * (1.62 + glow * 0.16)}`}
            />
          ))}
        </g>
      )}

      {has(upgrade.features, "crown") && (
        <path
          data-evolution-adornment="crown"
          d={`M ${headX - headRx * 0.95} ${headY - headRy * 1.12}
              L ${headX - headRx * 0.62} ${headY - headRy * 1.72}
              L ${headX - headRx * 0.3} ${headY - headRy * 1.22}
              L ${headX} ${headY - headRy * (1.95 + glow * 0.18)}
              L ${headX + headRx * 0.3} ${headY - headRy * 1.22}
              L ${headX + headRx * 0.62} ${headY - headRy * 1.72}
              L ${headX + headRx * 0.95} ${headY - headRy * 1.12}`}
          fill="none"
          stroke={accentColor}
          strokeWidth={width}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.82 + glow * 0.18}
        />
      )}

      {has(upgrade.features, "thirdEye") && (
        <g data-evolution-adornment="thirdEye" opacity={0.8 + glow * 0.2}>
          <ellipse
            cx={headX}
            cy={headY - headRy * 0.72}
            rx={headRx * 0.3}
            ry={headRy * (0.15 + glow * 0.05)}
            fill={accentColor}
            stroke={underlayColor}
            strokeWidth={width * 0.6}
          />
          <circle
            cx={headX}
            cy={headY - headRy * 0.72}
            r={headRx * (0.1 + glow * 0.03)}
            fill={underlayColor}
          />
          {glow > 0.45 && (
            <circle
              cx={headX}
              cy={headY - headRy * 0.72}
              r={headRx * 0.42 + glow * 4}
              fill="none"
              stroke={color}
              strokeWidth={width * 0.5}
              opacity={(glow - 0.45) * 1.3}
            />
          )}
        </g>
      )}

      <StageSigil
        shape={upgrade.mark}
        count={upgrade.markCount}
        cx={bodyX}
        cy={bodyY}
        rx={bodyRx * 0.62}
        ry={bodyRy * 0.42}
        glow={glow}
        color={color}
        accentColor={accentColor}
        underlayColor={underlayColor}
        width={Math.max(1, strokeWidth * 0.6)}
        opacity={Math.min(0.95, upgrade.markIntensity * (0.92 + glow * 0.35))}
      />
    </g>
  );
}
