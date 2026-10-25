/**
 * Coat of Arms SVG Renderer
 *
 * Renders heraldic coats of arms as SVG
 */

"use client";

import React, { useId } from "react";
import type {
  CoatOfArms,
  HeraldTincture,
  HeraldCharge,
  HeraldDivision,
  LineageMarker,
} from "@/lib/lineage/types";

interface CoatOfArmsRendererProps {
  coatOfArms: CoatOfArms;
  size?: number;
  showMarkers?: boolean;
  label?: string;
}

export const CoatOfArmsRenderer: React.FC<CoatOfArmsRendererProps> = ({
  coatOfArms,
  size = 200,
  showMarkers = true,
  label = "Companion coat of arms",
}) => {
  const scope = useId().replace(/:/g, "");
  const { division, field, fieldSecondary, charges, lineageMarkers } =
    coatOfArms;

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className="coat-of-arms"
      role="img"
      aria-labelledby={`${scope}-title`}
      aria-describedby={`${scope}-description`}
      style={{ maxWidth: "100%", height: "auto", overflow: "visible" }}
    >
      <title id={`${scope}-title`}>{label}</title>
      <desc id={`${scope}-description`}>
        {division.replaceAll("-", " ")} shield, {field}
        {fieldSecondary ? ` and ${fieldSecondary}` : ""};{" "}
        {charges.map((charge) => charge.charge).join(", ")}. Generation{" "}
        {coatOfArms.generation}.
      </desc>
      <defs>
        <clipPath id={`${scope}-shield`}>
          <path d="M12 12H88V60Q88 84 50 98Q12 84 12 60Z" />
        </clipPath>
        <linearGradient id={`${scope}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".32" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#020617" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={`${scope}-rim`}>
          <stop stopColor="#64748b" />
          <stop offset=".4" stopColor="#e2e8f0" />
          <stop offset=".65" stopColor="#d1ad66" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        {/* Gradients for metallic effects */}
        <linearGradient
          id={`${scope}-goldGradient`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f4df9e" />
          <stop offset="50%" stopColor="#c49a44" />
          <stop offset="100%" stopColor="#8a602b" />
        </linearGradient>
        <linearGradient
          id={`${scope}-silverGradient`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#F5F5F5" />
          <stop offset="50%" stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#C0C0C0" />
        </linearGradient>

        {/* Shield glow */}
        <filter id={`${scope}-shieldGlow`}>
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield outline */}
      <ShieldOutline scope={scope} />
      <g clipPath={`url(#${scope}-shield)`}>
        {/* Shield field (background and division) */}
        <ShieldField
          scope={scope}
          division={division}
          field={field}
          fieldSecondary={fieldSecondary}
        />

        {/* Charges (symbols) */}
        {charges.map((charge, i) => (
          <ChargeRenderer
            key={i}
            scope={scope}
            charge={charge.charge}
            tincture={charge.tincture}
            position={charge.position}
          />
        ))}

        {/* Lineage markers */}
        {showMarkers && lineageMarkers.length > 0 && (
          <g className="lineage-markers" opacity="0.7">
            {lineageMarkers.slice(0, 4).map((marker, i) => (
              <LineageMarkerRenderer
                key={i}
                scope={scope}
                marker={marker}
                index={i}
              />
            ))}
          </g>
        )}

        <path
          d="M12 12H88V60Q88 84 50 98Q12 84 12 60Z"
          fill={`url(#${scope}-sheen)`}
          pointerEvents="none"
        />
      </g>
      <path
        d="M10 10H90V60Q90 85 50 100Q10 85 10 60Z"
        fill="none"
        stroke={`url(#${scope}-rim)`}
        strokeWidth="2.5"
      />
      <path
        d="M15 15H85V60Q85 81 50 94Q15 81 15 60Z"
        fill="none"
        stroke="#fff"
        strokeOpacity=".3"
        strokeWidth=".6"
      />
      {/* Generation number */}
      {coatOfArms.generation > 0 && (
        <text
          x="50"
          y="115"
          textAnchor="middle"
          fontSize="8"
          fill="#94a3b8"
          fontFamily="serif"
          fontStyle="italic"
        >
          Gen {coatOfArms.generation}
        </text>
      )}
    </svg>
  );
};

// Shield outline path
const ShieldOutline: React.FC<{ scope: string }> = ({ scope }) => (
  <path
    d="M 10 10 L 90 10 L 90 60 Q 90 85 50 100 Q 10 85 10 60 Z"
    fill="none"
    stroke="#333"
    strokeWidth="2"
    filter={`url(#${scope}-shieldGlow)`}
  />
);

// Shield field renderer
interface ShieldFieldProps {
  scope: string;
  division: HeraldDivision;
  field: HeraldTincture;
  fieldSecondary?: HeraldTincture;
}

const ShieldField: React.FC<ShieldFieldProps> = ({
  scope,
  division,
  field,
  fieldSecondary,
}) => {
  const fieldColor = tinctureToColor(field, scope);
  const fieldSecondaryColor = fieldSecondary
    ? tinctureToColor(fieldSecondary, scope)
    : fieldColor;

  const clipPath = "M 12 12 L 88 12 L 88 60 Q 88 84 50 98 Q 12 84 12 60 Z";

  switch (division) {
    case "plain":
      return <path d={clipPath} fill={fieldColor} />;

    case "per-pale": // Vertical split
      return (
        <g>
          <path d="M 12 12 L 50 12 L 50 98 Q 12 84 12 60 Z" fill={fieldColor} />
          <path
            d="M 50 12 L 88 12 L 88 60 Q 88 84 50 98 Z"
            fill={fieldSecondaryColor}
          />
        </g>
      );

    case "per-fess": // Horizontal split
      return (
        <g>
          <path d="M 12 12 L 88 12 L 88 55 L 12 55 Z" fill={fieldColor} />
          <path
            d="M 12 55 L 88 55 L 88 60 Q 88 84 50 98 Q 12 84 12 60 Z"
            fill={fieldSecondaryColor}
          />
        </g>
      );

    case "quarterly": // Four quarters
      return (
        <g>
          <path d="M 12 12 L 50 12 L 50 55 L 12 55 Z" fill={fieldColor} />
          <path
            d="M 50 12 L 88 12 L 88 55 L 50 55 Z"
            fill={fieldSecondaryColor}
          />
          <path
            d="M 12 55 L 50 55 L 50 98 Q 12 84 12 60 Z"
            fill={fieldSecondaryColor}
          />
          <path d="M 50 55 L 88 55 L 88 60 Q 88 84 50 98 Z" fill={fieldColor} />
        </g>
      );

    case "per-bend": // Diagonal (top-left to bottom-right)
      return (
        <g>
          <clipPath id={`${scope}-shieldClip`}>
            <path d={clipPath} />
          </clipPath>
          <g clipPath={`url(#${scope}-shieldClip)`}>
            <path
              d="M 12 12 L 88 12 L 88 98 L 12 98 Z"
              fill={fieldSecondaryColor}
            />
            <path d="M 12 12 L 88 12 L 12 98 Z" fill={fieldColor} />
          </g>
        </g>
      );

    case "per-saltire": // X-shaped division
      return (
        <g>
          <clipPath id={`${scope}-shieldClipSaltire`}>
            <path d={clipPath} />
          </clipPath>
          <g clipPath={`url(#${scope}-shieldClipSaltire)`}>
            <path d={clipPath} fill={fieldColor} />
            <path d="M 50 55 L 12 12 L 88 12 Z" fill={fieldSecondaryColor} />
            <path d="M 50 55 L 88 98 L 12 98 Z" fill={fieldSecondaryColor} />
          </g>
        </g>
      );

    case "chevron": // V-shaped
      return (
        <g>
          <path d={clipPath} fill={fieldSecondaryColor} />
          <path
            d="M 12 65 L 50 30 L 88 65 L 88 60 Q 88 84 50 98 Q 12 84 12 60 Z"
            fill={fieldColor}
          />
        </g>
      );

    case "canton": // Small square in top-left corner
      return (
        <g>
          <path d={clipPath} fill={fieldColor} />
          <rect
            x="12"
            y="12"
            width="30"
            height="30"
            fill={fieldSecondaryColor}
          />
        </g>
      );

    default:
      return <path d={clipPath} fill={fieldColor} />;
  }
};

// Charge renderer
interface ChargeRendererProps {
  scope: string;
  charge: HeraldCharge;
  tincture: HeraldTincture;
  position: { x: number; y: number; scale: number; rotation: number };
}

const ChargeRenderer: React.FC<ChargeRendererProps> = ({
  scope,
  charge,
  tincture,
  position,
}) => {
  const color = tinctureToColor(tincture, scope);
  const { x, y, scale, rotation } = position;

  const chargePath = getChargePath(charge);

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`}>
      <path
        d={chargePath}
        fill={color}
        stroke="#333"
        strokeWidth="0.5"
        opacity="0.9"
      />
    </g>
  );
};

// Lineage marker renderer
interface LineageMarkerRendererProps {
  scope: string;
  marker: LineageMarker;
  index: number;
}

const LineageMarkerRenderer: React.FC<LineageMarkerRendererProps> = ({
  scope,
  marker,
  index,
}) => {
  const positions = [
    { x: 15, y: 15 }, // top-left
    { x: 85, y: 15 }, // top-right
    { x: 15, y: 50 }, // mid-left
    { x: 85, y: 50 }, // mid-right
  ];

  const pos = positions[index] || positions[0];
  const color = tinctureToColor(marker.tincture, scope);
  const chargePath = getChargePath(marker.charge);

  return (
    <g transform={`translate(${pos.x}, ${pos.y}) scale(0.15)`}>
      <circle r="8" fill={color} opacity="0.3" />
      <path
        d={chargePath}
        fill={color}
        stroke="#333"
        strokeWidth="1"
        opacity="0.6"
        transform="scale(0.5) translate(-10, -10)"
      />
    </g>
  );
};

// Helper: Convert tincture to CSS color
function tinctureToColor(tincture: HeraldTincture, scope: string): string {
  const colors: Record<HeraldTincture, string> = {
    or: `url(#${scope}-goldGradient)`,
    argent: `url(#${scope}-silverGradient)`,
    azure: "#155ea8",
    gules: "#E03C31",
    sable: "#1C1C1C",
    vert: "#009B77",
    purpure: "#7947bb",
    tenne: "#CD7F32",
  };
  return colors[tincture];
}

// Helper: Get SVG path for charge
function getChargePath(charge: HeraldCharge): string {
  const paths: Record<HeraldCharge, string> = {
    star: "M 0 -10 L 3 -3 L 10 -3 L 4 2 L 6 9 L 0 4 L -6 9 L -4 2 L -10 -3 L -3 -3 Z",
    moon: "M 5 0 A 7 7 0 1 1 -5 0 A 5 5 0 1 0 5 0",
    sun: "M 0 -8 L 1 -2 L 8 -1 L 2 0 L 1 8 L 0 2 L -8 1 L -2 0 Z M 0 -5 A 5 5 0 1 1 0 5 A 5 5 0 1 1 0 -5",
    cross:
      "M -2 -8 L 2 -8 L 2 -2 L 8 -2 L 8 2 L 2 2 L 2 8 L -2 8 L -2 2 L -8 2 L -8 -2 L -2 -2 Z",
    chevron: "M -8 6 L 0 -6 L 8 6 L 6 8 L 0 0 L -6 8 Z",
    lion: "M -5 -5 Q -6 -7 -4 -8 Q -2 -8 -1 -6 L 0 -3 L 2 -5 Q 4 -6 5 -4 L 6 0 Q 6 4 3 6 L -3 6 Q -6 4 -6 0 Z",
    eagle:
      "M 0 -8 L 3 -5 L 7 -6 L 5 -2 L 8 0 L 4 2 L 2 6 L 0 4 L -2 6 L -4 2 L -8 0 L -5 -2 L -7 -6 L -3 -5 Z",
    tree: "M -1 8 L 1 8 L 1 2 L 3 2 Q 4 0 3 -2 L 4 -2 Q 5 -4 4 -6 L 5 -6 Q 6 -8 4 -9 Q 0 -8 -4 -9 Q -6 -8 -5 -6 L -4 -6 Q -5 -4 -4 -2 L -3 -2 Q -4 0 -3 2 L -1 2 Z",
    flower:
      "M 0 -6 Q 2 -5 2 -3 Q 3 -2 2 -1 Q 3 0 2 1 Q 3 2 2 3 Q 2 5 0 6 Q -2 5 -2 3 Q -3 2 -2 1 Q -3 0 -2 -1 Q -3 -2 -2 -3 Q -2 -5 0 -6 M 0 -2 A 2 2 0 1 1 0 2 A 2 2 0 1 1 0 -2",
    crown:
      "M -8 0 L -6 -5 L -4 0 L -2 -7 L 0 0 L 2 -7 L 4 0 L 6 -5 L 8 0 L 8 4 L -8 4 Z",
    key: "M -6 0 A 3 3 0 1 1 0 0 L 6 0 L 6 1 L 4 1 L 4 2 L 6 2 L 6 3 L 8 3 L 8 -3 L 6 -3 L 6 -2 L 4 -2 L 4 -1 L 6 -1 L 6 0",
    sword:
      "M 0 -8 L 1 6 L 2 6 L 2 7 L -2 7 L -2 6 L -1 6 L 0 -8 M -3 6 L 3 6 M -2 8 L 2 8",
    book: "M -6 -6 L 6 -6 L 6 6 L -6 6 Z M 0 -6 L 0 6 M -4 -2 L -1 -2 M 1 -2 L 4 -2 M -4 1 L -1 1 M 1 1 L 4 1",
    orb: "M 0 -7 A 7 7 0 1 1 0 7 A 7 7 0 1 1 0 -7 M -7 0 L 7 0 M 0 -7 Q 3 0 0 7 Q -3 0 0 -7",
  };
  return paths[charge] || paths["star"];
}

/** The same charge paths used on saved shields, for the labelled heraldry guide. */
export function HeraldicChargeGlyph({ charge }: { charge: HeraldCharge }) {
  return (
    <svg
      viewBox="-14 -14 28 28"
      className="h-10 w-10 text-amber-200"
      aria-hidden="true"
    >
      <path d={getChargePath(charge)} fill="currentColor" />
    </svg>
  );
}
