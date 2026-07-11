'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import type { SteeringViewProps } from './types';
import { COMPASS_NAVIGATION_TARGETS, getNavigationTargetByPosition } from './types';
import { getLabelLines, useIsCompactViewport } from './labelUtils';

const COLOR_VARIANTS = {
  red: { stroke: '#FF5555', node: '#FF9999', dim: '#FF555533' },
  blue: { stroke: '#5555FF', node: '#9999FF', dim: '#5555FF33' },
  black: { stroke: '#AAAAAA', node: '#666666', dim: '#AAAAAA33' },
};

// Connections between feature nodes based on system relationships
const FEATURE_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3],       // Home connects to Explore, Pet, Studio Site
  [6, 7], [6, 11],              // Shop connects to DNA and QR
  [7, 8], [8, 9],               // DNA → Identity → Lineage
  [1, 3],                        // Explore ↔ Games
  [4, 5],                        // Style ↔ Rewards
  [9, 11],                       // Lineage ↔ QR
  [2, 5],                        // Pet ↔ Rewards
];

export function NetworkView({
  color,
  numberStrings,
  selectedFeature,
  onFeatureSelect,
  onFeatureActivate,
}: SteeringViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [animPhase, setAnimPhase] = useState(0);

  const colors = COLOR_VARIANTS[color];
  const numberString = numberStrings[color];
  const isCompact = useIsCompactViewport();

  // Animate particles along connections
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setAnimPhase(prev => (prev + 0.005) % 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Generate compacted feature nodes in a ring + data-driven inner nodes
  const featureNodes = useMemo(() => {
    return Object.fromEntries(COMPASS_NAVIGATION_TARGETS.map((target) => {
      const angle = target.renderAngle * (Math.PI / 180);
      const r = 160;
      return [target.position, {
        x: Math.sin(angle) * r,
        y: -Math.cos(angle) * r,
        label: target.label,
      }];
    }));
  }, []);

  // Inner data nodes derived from number string
  const dataNodes = useMemo(() => {
    const nodes: { x: number; y: number }[] = [];
    for (let i = 0; i < numberString.length - 1; i += 3) {
      const d1 = parseInt(numberString[i], 10);
      const d2 = parseInt(numberString[i + 1] || '0', 10);
      const angle = ((d1 * 40) % 360) * (Math.PI / 180);
      const dist = 25 + d2 * 10;
      nodes.push({ x: Math.sin(angle) * dist, y: -Math.cos(angle) * dist });
    }
    return nodes;
  }, [numberString]);

  // Particle positions along connections
  const particles = useMemo(() => {
    return FEATURE_CONNECTIONS.map(([a, b]) => {
      const na = featureNodes[a];
      const nb = featureNodes[b];
      if (!na || !nb) {
        return null;
      }
      const t = (animPhase + a * 0.08) % 1;
      return {
        x: na.x + (nb.x - na.x) * t,
        y: na.y + (nb.y - na.y) * t,
      };
    }).filter((particle): particle is { x: number; y: number } => particle !== null);
  }, [featureNodes, animPhase]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[500px] h-[500px] max-w-full">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="-250 -250 500 500"
        >
          <defs>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Data node connections to center */}
          {dataNodes.map((node, i) => (
            <line
              key={`dc-${i}`}
              x1={0} y1={0}
              x2={node.x} y2={node.y}
              stroke={colors.stroke}
              strokeWidth="0.3"
              opacity="0.2"
            />
          ))}

          {/* Data nodes (inner cluster) */}
          {dataNodes.map((node, i) => (
            <circle
              key={`dn-${i}`}
              cx={node.x} cy={node.y}
              r={1.5}
              fill={colors.node}
              opacity="0.3"
            />
          ))}

          {/* Feature connections */}
          {FEATURE_CONNECTIONS.map(([a, b], i) => {
            const na = featureNodes[a];
            const nb = featureNodes[b];
            if (!na || !nb) {
              return null;
            }
            const isHighlighted = a === selectedFeature || b === selectedFeature;
            return (
              <line
                key={`fc-${i}`}
                x1={na.x} y1={na.y}
                x2={nb.x} y2={nb.y}
                stroke={isHighlighted ? colors.stroke : colors.dim}
                strokeWidth={isHighlighted ? 1.5 : 0.8}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Particles along connections */}
          {particles.map((p, i) => (
            <circle
              key={`p-${i}`}
              cx={p.x} cy={p.y}
              r={2}
              fill={colors.stroke}
              opacity="0.6"
            />
          ))}

          {/* Feature nodes */}
          {COMPASS_NAVIGATION_TARGETS.map((target) => {
            const node = featureNodes[target.position];
            if (!node) {
              return null;
            }
            const isSelected = selectedFeature === target.position;
            const isHovered = hoveredNode === target.position;
            const r = isSelected ? 14 : isHovered ? 12 : 10;
            return (
              <g
                key={`fn-${target.position}`}
                className="cursor-pointer"
                onPointerEnter={() => setHoveredNode(target.position)}
                onPointerLeave={() => setHoveredNode(null)}
                onClick={() => onFeatureActivate(target.position)}
              >
                <circle
                  cx={node.x} cy={node.y}
                  r={r}
                  fill={isSelected ? colors.stroke : 'rgba(0,0,0,0.5)'}
                  stroke={isSelected || isHovered ? colors.stroke : colors.node}
                  strokeWidth={isSelected ? 2 : 1}
                  filter={isSelected ? 'url(#node-glow)' : undefined}
                  className="transition-all duration-200"
                />
                {(() => {
                  const labelLines = getLabelLines(node.label);
                  const baseFontSize = isSelected ? (isCompact ? 9.8 : 8.8) : isHovered ? (isCompact ? 8.8 : 7.8) : (isCompact ? 8.2 : 7.2);
                  const lineHeight = isCompact ? 8.6 : 7.8;
                  const maxLineChars = Math.max(...labelLines.map((line) => line.length));
                  const estimatedWidth = maxLineChars * baseFontSize * 0.56;
                  const widthScale = Math.min(1, (isCompact ? 66 : 58) / Math.max(estimatedWidth, 1));
                  const fontSize = Number((baseFontSize * widthScale).toFixed(2));
                  const scaledLineHeight = Number((lineHeight * widthScale).toFixed(2));
                  const firstLineY = node.y - ((labelLines.length - 1) * scaledLineHeight) / 2;
                  const plateWidth = Math.max(28, maxLineChars * fontSize * 0.56 + (isCompact ? 10 : 8));
                  const plateHeight = labelLines.length * scaledLineHeight + (isCompact ? 5 : 4);
                  return (
                    <>
                      <rect
                        x={node.x - plateWidth / 2}
                        y={firstLineY - scaledLineHeight / 2 - (isCompact ? 2.5 : 2)}
                        width={plateWidth}
                        height={plateHeight}
                        rx={isCompact ? 5 : 4}
                        fill={isSelected ? 'rgba(5, 9, 18, 0.92)' : isHovered ? 'rgba(5, 9, 18, 0.78)' : 'rgba(5, 9, 18, 0.58)'}
                        stroke={isSelected || isHovered ? colors.stroke : 'rgba(210,221,244,0.2)'}
                        strokeWidth={isSelected ? 1 : 0.7}
                        style={{ pointerEvents: 'none' }}
                      />
                      <text
                        x={node.x}
                        y={firstLineY}
                        fill={isSelected ? '#fff' : '#eef4ff'}
                        fontSize={fontSize}
                        fontWeight={isSelected ? 'bold' : '600'}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        stroke="rgba(4, 8, 16, 0.92)"
                        strokeWidth={isCompact ? 2 : 1.5}
                        paintOrder="stroke"
                        style={{ pointerEvents: 'none' }}
                      >
                        {labelLines.map((line, lineIndex) => (
                          <tspan key={`${node.label}-${lineIndex}`} x={node.x} dy={lineIndex === 0 ? 0 : scaledLineHeight}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </>
                  );
                })()}
              </g>
            );
          })}

          {/* Center hub node */}
          <circle cx="0" cy="0" r="6" fill={colors.stroke} opacity="0.8" />
          <circle cx="0" cy="0" r="3" fill="#111" />

          {/* Selected feature label */}
          <text
            x="0" y="220"
            fill={colors.stroke}
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
          >
            {getNavigationTargetByPosition(selectedFeature)?.label ?? ''}
          </text>
        </svg>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Click a node to navigate
      </p>
    </div>
  );
}
