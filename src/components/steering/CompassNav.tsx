'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { SteeringViewProps } from './types';
import { NAVIGATION_TARGETS } from './types';

const COLOR_VARIANTS = {
  red: { primary: '#FF5555', secondary: '#FF9999', tertiary: '#FFCCCC' },
  blue: { primary: '#5555FF', secondary: '#9999FF', tertiary: '#CCCCFF' },
  black: { primary: '#AAAAAA', secondary: '#666666', tertiary: '#333333' },
};

export function CompassNav({
  color,
  numberStrings,
  selectedFeature,
  onFeatureSelect,
  onFeatureActivate,
}: SteeringViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ angle: number; rotation: number } | null>(null);

  const colors = COLOR_VARIANTS[color];
  const numberString = numberStrings[color];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const hourAngle = (hours % 12) * 30 + minutes / 2;
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  // Drag-to-rotate
  const getAngleFromEvent = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientX - cx, -(e.clientY - cy)) * (180 / Math.PI);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { angle: getAngleFromEvent(e), rotation };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [getAngleFromEvent, rotation]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const currentAngle = getAngleFromEvent(e);
    const delta = currentAngle - dragStartRef.current.angle;
    setRotation(dragStartRef.current.rotation + delta);
  }, [isDragging, getAngleFromEvent]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    // Snap rotation to nearest 30-degree sector
    const snapped = Math.round(rotation / 30) * 30;
    setRotation(snapped);
    // The sector at "12 o'clock" after rotation
    const sectorAtTop = (((-snapped % 360) + 360) % 360) / 30;
    const sectorIndex = Math.round(sectorAtTop) % 12;
    onFeatureSelect(sectorIndex);
  }, [isDragging, rotation, onFeatureSelect]);

  // Build a sector (wedge) path for a 30-degree arc
  const sectorPath = (index: number) => {
    const startAngle = (index * 30 - 15) * (Math.PI / 180);
    const endAngle = (index * 30 + 15) * (Math.PI / 180);
    const innerR = 120;
    const outerR = 195;
    const x1 = Math.sin(startAngle) * innerR;
    const y1 = -Math.cos(startAngle) * innerR;
    const x2 = Math.sin(startAngle) * outerR;
    const y2 = -Math.cos(startAngle) * outerR;
    const x3 = Math.sin(endAngle) * outerR;
    const y3 = -Math.cos(endAngle) * outerR;
    const x4 = Math.sin(endAngle) * innerR;
    const y4 = -Math.cos(endAngle) * innerR;
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[500px] h-[500px] max-w-full">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          viewBox="-250 -250 500 500"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <filter id="sector-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`rotate(${rotation})`}>
            {/* Outer ring */}
            <circle cx="0" cy="0" r="200" stroke={colors.primary} strokeWidth="2" fill="none" />
            <circle cx="0" cy="0" r="120" stroke={colors.secondary} strokeWidth="1" fill="none" strokeOpacity="0.4" />

            {/* 12 clickable sectors */}
            {NAVIGATION_TARGETS.map((target, i) => {
              const isSelected = selectedFeature === i;
              const isHovered = hoveredSector === i;
              return (
                <g key={i}>
                  <path
                    d={sectorPath(i)}
                    fill={isSelected ? `${colors.primary}33` : isHovered ? `${colors.primary}1a` : 'transparent'}
                    stroke={isSelected ? colors.primary : 'transparent'}
                    strokeWidth={isSelected ? 1.5 : 0}
                    filter={isSelected ? 'url(#sector-glow)' : undefined}
                    className="transition-all duration-200"
                    onPointerEnter={() => setHoveredSector(i)}
                    onPointerLeave={() => setHoveredSector(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFeatureActivate(i);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              );
            })}

            {/* Hour markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const x1 = Math.sin(angle) * 195;
              const y1 = -Math.cos(angle) * 195;
              const x2 = Math.sin(angle) * 200;
              const y2 = -Math.cos(angle) * 200;
              return (
                <line key={`h-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={colors.primary} strokeWidth="2" />
              );
            })}

            {/* Minute markers */}
            {Array.from({ length: 60 }).map((_, i) => {
              if (i % 5 === 0) return null;
              const angle = (i * 6) * (Math.PI / 180);
              const x1 = Math.sin(angle) * 196;
              const y1 = -Math.cos(angle) * 196;
              const x2 = Math.sin(angle) * 200;
              const y2 = -Math.cos(angle) * 200;
              return (
                <line key={`m-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={colors.secondary} strokeWidth="0.5" />
              );
            })}

            {/* Feature labels at each sector */}
            {NAVIGATION_TARGETS.map((target, i) => {
              const angle = target.angle * (Math.PI / 180);
              const labelR = 157;
              const x = Math.sin(angle) * labelR;
              const y = -Math.cos(angle) * labelR;
              const isSelected = selectedFeature === i;
              return (
                <text
                  key={`label-${i}`}
                  x={x}
                  y={y}
                  fill={isSelected ? colors.primary : colors.secondary}
                  fontSize={isSelected ? '10' : '8'}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {target.label}
                </text>
              );
            })}

            {/* Number sequence digits around the compass (24 positions) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15) * (Math.PI / 180);
              const x = Math.sin(angle) * 135;
              const y = -Math.cos(angle) * 135;
              const startIdx = (i * 2) % numberString.length;
              const digits = numberString.substring(startIdx, startIdx + 3);
              return (
                <text
                  key={`num-${i}`}
                  x={x} y={y}
                  fill={colors.tertiary}
                  fontSize="7"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  opacity="0.6"
                  style={{ pointerEvents: 'none' }}
                >
                  {digits}
                </text>
              );
            })}

            {/* Clock hands (ambient, behind navigation) */}
            <line
              x1="0" y1="0"
              x2={Math.sin(hourAngle * (Math.PI / 180)) * 70}
              y2={-Math.cos(hourAngle * (Math.PI / 180)) * 70}
              stroke={colors.primary} strokeWidth="3" strokeLinecap="round" opacity="0.6"
            />
            <line
              x1="0" y1="0"
              x2={Math.sin(minuteAngle * (Math.PI / 180)) * 95}
              y2={-Math.cos(minuteAngle * (Math.PI / 180)) * 95}
              stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" opacity="0.5"
            />
            <line
              x1="0" y1="0"
              x2={Math.sin(secondAngle * (Math.PI / 180)) * 110}
              y2={-Math.cos(secondAngle * (Math.PI / 180)) * 110}
              stroke={colors.tertiary} strokeWidth="1" strokeLinecap="round" opacity="0.4"
            />
            <circle cx="0" cy="0" r="4" fill={colors.primary} />
          </g>

          {/* Fixed center label showing selected feature */}
          <text
            x="0" y="220"
            fill={colors.primary}
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
          >
            {NAVIGATION_TARGETS[selectedFeature]?.label ?? ''}
          </text>
        </svg>
      </div>

      {/* Rotation hint */}
      <p className="text-xs text-gray-500 mt-2">
        Drag to rotate &middot; Click a sector to navigate
      </p>
    </div>
  );
}
