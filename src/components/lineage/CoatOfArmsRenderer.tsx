/**
 * Coat of Arms SVG Renderer
 *
 * Renders heraldic coats of arms as SVG
 */

'use client';

import React from 'react';
import type { CoatOfArms, HeraldTincture, HeraldCharge, HeraldDivision } from '@/lib/lineage/types';

interface CoatOfArmsRendererProps {
  coatOfArms: CoatOfArms;
  size?: number;
  showMarkers?: boolean;
}

export const CoatOfArmsRenderer: React.FC<CoatOfArmsRendererProps> = ({
  coatOfArms,
  size = 200,
  showMarkers = true,
}) => {
  const { division, field, fieldSecondary, charges, lineageMarkers } = coatOfArms;

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className="coat-of-arms"
    >
      <defs>
        {/* Gradients for metallic effects */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#DAA520" />
        </linearGradient>
        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5F5F5" />
          <stop offset="50%" stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#C0C0C0" />
        </linearGradient>

        {/* Shield glow */}
        <filter id="shieldGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield outline */}
      <ShieldOutline />

      {/* Shield field (background and division) */}
      <ShieldField
        division={division}
        field={field}
        fieldSecondary={fieldSecondary}
      />

      {/* Charges (symbols) */}
      {charges.map((charge, i) => (
        <ChargeRenderer
          key={i}
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
              marker={marker}
              index={i}
            />
          ))}
        </g>
      )}

      {/* Generation number */}
      {coatOfArms.generation > 0 && (
        <text
          x="50"
          y="115"
          textAnchor="middle"
          fontSize="8"
          fill="#666"
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
const ShieldOutline: React.FC = () => (
  <path
    d="M 10 10 L 90 10 L 90 60 Q 90 85 50 100 Q 10 85 10 60 Z"
    fill="none"
    stroke="#333"
    strokeWidth="2"
    filter="url(#shieldGlow)"
  />
);

// Shield field renderer
interface ShieldFieldProps {
  division: HeraldDivision;
  field: HeraldTincture;
  fieldSecondary?: HeraldTincture;
}

const ShieldField: React.FC<ShieldFieldProps> = ({ division, field, fieldSecondary }) => {
  const fieldColor = tinctureToColor(field);
  const fieldSecondaryColor = fieldSecondary ? tinctureToColor(fieldSecondary) : fieldColor;

  const clipPath = "M 12 12 L 88 12 L 88 60 Q 88 84 50 98 Q 12 84 12 60 Z";

  switch (division) {
    case 'plain':
      return (
        <path d={clipPath} fill={fieldColor} />
      );

    case 'per-pale': // Vertical split
      return (
        <g>
          <path d="M 12 12 L 50 12 L 50 98 Q 12 84 12 60 Z" fill={fieldColor} />
          <path d="M 50 12 L 88 12 L 88 60 Q 88 84 50 98 Z" fill={fieldSecondaryColor} />
        </g>
      );

    case 'per-fess': // Horizontal split
      return (
        <g>
          <path d="M 12 12 L 88 12 L 88 55 L 12 55 Z" fill={fieldColor} />
          <path d="M 12 55 L 88 55 L 88 60 Q 88 84 50 98 Q 12 84 12 60 Z" fill={fieldSecondaryColor} />
        </g>
      );

    case 'quarterly': // Four quarters
      return (
        <g>
          <path d="M 12 12 L 50 12 L 50 55 L 12 55 Z" fill={fieldColor} />
          <path d="M 50 12 L 88 12 L 88 55 L 50 55 Z" fill={fieldSecondaryColor} />
          <path d="M 12 55 L 50 55 L 50 98 Q 12 84 12 60 Z" fill={fieldSecondaryColor} />
          <path d="M 50 55 L 88 55 L 88 60 Q 88 84 50 98 Z" fill={fieldColor} />
        </g>
      );

    case 'per-bend': // Diagonal (top-left to bottom-right)
      return (
        <g>
          <clipPath id="shieldClip">
            <path d={clipPath} />
          </clipPath>
          <g clipPath="url(#shieldClip)">
            <path d="M 12 12 L 88 12 L 88 98 L 12 98 Z" fill={fieldSecondaryColor} />
            <path d="M 12 12 L 88 12 L 12 98 Z" fill={fieldColor} />
          </g>
        </g>
      );

    case 'per-saltire': // X-shaped division
      return (
        <g>
          <clipPath id="shieldClipSaltire">
            <path d={clipPath} />
          </clipPath>
          <g clipPath="url(#shieldClipSaltire)">
            <path d={clipPath} fill={fieldColor} />
            <path d="M 50 55 L 12 12 L 88 12 Z" fill={fieldSecondaryColor} />
            <path d="M 50 55 L 88 12 L 88 98 Z" fill={fieldSecondaryColor} />
          </g>
        </g>
      );

    case 'chevron': // V-shaped
      return (
        <g>
          <path d={clipPath} fill={fieldSecondaryColor} />
          <path d="M 12 65 L 50 30 L 88 65 L 88 60 Q 88 84 50 98 Q 12 84 12 60 Z" fill={fieldColor} />
        </g>
      );

    case 'canton': // Small square in top-left corner
      return (
        <g>
          <path d={clipPath} fill={fieldColor} />
          <rect x="12" y="12" width="30" height="30" fill={fieldSecondaryColor} />
        </g>
      );

    default:
      return <path d={clipPath} fill={fieldColor} />;
  }
};

// Charge renderer
interface ChargeRendererProps {
  charge: HeraldCharge;
  tincture: HeraldTincture;
  position: { x: number; y: number; scale: number; rotation: number };
}

const ChargeRenderer: React.FC<ChargeRendererProps> = ({ charge, tincture, position }) => {
  const color = tinctureToColor(tincture);
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
  marker: any;
  index: number;
}

const LineageMarkerRenderer: React.FC<LineageMarkerRendererProps> = ({ marker, index }) => {
  const positions = [
    { x: 15, y: 15 }, // top-left
    { x: 85, y: 15 }, // top-right
    { x: 15, y: 50 }, // mid-left
    { x: 85, y: 50 }, // mid-right
  ];

  const pos = positions[index] || positions[0];
  const color = tinctureToColor(marker.tincture);
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
function tinctureToColor(tincture: HeraldTincture): string {
  const colors: Record<HeraldTincture, string> = {
    'or': 'url(#goldGradient)',
    'argent': 'url(#silverGradient)',
    'azure': '#0047AB',
    'gules': '#E03C31',
    'sable': '#1C1C1C',
    'vert': '#009B77',
    'purpure': '#9B30FF',
    'tenne': '#CD7F32',
  };
  return colors[tincture];
}

// Helper: Get SVG path for charge
function getChargePath(charge: HeraldCharge): string {
  const paths: Record<HeraldCharge, string> = {
    'star': 'M 0 -10 L 3 -3 L 10 -3 L 4 2 L 6 9 L 0 4 L -6 9 L -4 2 L -10 -3 L -3 -3 Z',
    'moon': 'M 5 0 A 7 7 0 1 1 -5 0 A 5 5 0 1 0 5 0',
    'sun': 'M 0 -8 L 1 -2 L 8 -1 L 2 0 L 1 8 L 0 2 L -8 1 L -2 0 Z M 0 -5 A 5 5 0 1 1 0 5 A 5 5 0 1 1 0 -5',
    'cross': 'M -2 -8 L 2 -8 L 2 -2 L 8 -2 L 8 2 L 2 2 L 2 8 L -2 8 L -2 2 L -8 2 L -8 -2 L -2 -2 Z',
    'chevron': 'M -8 6 L 0 -6 L 8 6 L 6 8 L 0 0 L -6 8 Z',
    'lion': 'M -5 -5 Q -6 -7 -4 -8 Q -2 -8 -1 -6 L 0 -3 L 2 -5 Q 4 -6 5 -4 L 6 0 Q 6 4 3 6 L -3 6 Q -6 4 -6 0 Z',
    'eagle': 'M 0 -8 L 3 -5 L 7 -6 L 5 -2 L 8 0 L 4 2 L 2 6 L 0 4 L -2 6 L -4 2 L -8 0 L -5 -2 L -7 -6 L -3 -5 Z',
    'tree': 'M -1 8 L 1 8 L 1 2 L 3 2 Q 4 0 3 -2 L 4 -2 Q 5 -4 4 -6 L 5 -6 Q 6 -8 4 -9 Q 0 -8 -4 -9 Q -6 -8 -5 -6 L -4 -6 Q -5 -4 -4 -2 L -3 -2 Q -4 0 -3 2 L -1 2 Z',
    'flower': 'M 0 -6 Q 2 -5 2 -3 Q 3 -2 2 -1 Q 3 0 2 1 Q 3 2 2 3 Q 2 5 0 6 Q -2 5 -2 3 Q -3 2 -2 1 Q -3 0 -2 -1 Q -3 -2 -2 -3 Q -2 -5 0 -6 M 0 -2 A 2 2 0 1 1 0 2 A 2 2 0 1 1 0 -2',
    'crown': 'M -8 0 L -6 -5 L -4 0 L -2 -7 L 0 0 L 2 -7 L 4 0 L 6 -5 L 8 0 L 8 4 L -8 4 Z',
    'key': 'M -6 0 A 3 3 0 1 1 0 0 L 6 0 L 6 1 L 4 1 L 4 2 L 6 2 L 6 3 L 8 3 L 8 -3 L 6 -3 L 6 -2 L 4 -2 L 4 -1 L 6 -1 L 6 0',
    'sword': 'M 0 -8 L 1 6 L 2 6 L 2 7 L -2 7 L -2 6 L -1 6 L 0 -8 M -3 6 L 3 6 M -2 8 L 2 8',
    'book': 'M -6 -6 L 6 -6 L 6 6 L -6 6 Z M 0 -6 L 0 6 M -4 -2 L -1 -2 M 1 -2 L 4 -2 M -4 1 L -1 1 M 1 1 L 4 1',
    'orb': 'M 0 -7 A 7 7 0 1 1 0 7 A 7 7 0 1 1 0 -7 M -7 0 L 7 0 M 0 -7 Q 3 0 0 7 Q -3 0 0 -7',
  };
  return paths[charge] || paths['star'];
}
