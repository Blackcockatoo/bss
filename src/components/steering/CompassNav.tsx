'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { SteeringViewProps } from './types';
import { NAVIGATION_TARGETS } from './types';

const COLOR_VARIANTS = {
  red: { primary: '#FF5555', secondary: '#FF9999', tertiary: '#FFCCCC' },
  blue: { primary: '#5555FF', secondary: '#9999FF', tertiary: '#CCCCFF' },
  black: { primary: '#AAAAAA', secondary: '#666666', tertiary: '#333333' },
};

const normalizeDelta = (delta: number) => {
  if (delta > 180) return delta - 360;
  if (delta < -180) return delta + 360;
  return delta;
};

const getLabelLines = (label: string): string[] => {
  if (label.length <= 11 || !label.includes(' ')) {
    return [label];
  }

  const words = label.split(' ');

  if (
    words.length === 2
    && words[0].length <= 2
    && words[1].length >= 7
  ) {
    return [label];
  }

  const halfway = Math.ceil(words.length / 2);
  return [words.slice(0, halfway).join(' '), words.slice(halfway).join(' ')];
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
  const [isCompact, setIsCompact] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveRef = useRef<{ angle: number; timestamp: number } | null>(null);
  const dragDistanceRef = useRef(0);
  const settleFrameRef = useRef<number | null>(null);

  const colors = COLOR_VARIANTS[color];
  const numberString = numberStrings[color];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const syncCompact = () => setIsCompact(media.matches);
    syncCompact();

    media.addEventListener('change', syncCompact);
    return () => media.removeEventListener('change', syncCompact);
  }, []);

  const clearSettleAnimation = useCallback(() => {
    if (settleFrameRef.current !== null) {
      cancelAnimationFrame(settleFrameRef.current);
      settleFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearSettleAnimation();
    };
  }, [clearSettleAnimation]);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const hourAngle = (hours % 12) * 30 + minutes / 2;
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  const selectTopSector = useCallback((angle: number) => {
    const sectorAtTop = (((-angle % 360) + 360) % 360) / 30;
    const sectorIndex = Math.round(sectorAtTop) % 12;
    onFeatureSelect(sectorIndex);
  }, [onFeatureSelect]);

  const settleToNearestSector = useCallback((targetRotation: number) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearSettleAnimation();

    if (reducedMotion) {
      rotationRef.current = targetRotation;
      velocityRef.current = 0;
      setRotation(targetRotation);
      selectTopSector(targetRotation);
      return;
    }

    const tick = () => {
      const diff = targetRotation - rotationRef.current;
      velocityRef.current = velocityRef.current * 0.82 + diff * 0.14;
      rotationRef.current += velocityRef.current;
      setRotation(rotationRef.current);

      if (Math.abs(diff) < 0.2 && Math.abs(velocityRef.current) < 0.15) {
        rotationRef.current = targetRotation;
        velocityRef.current = 0;
        setRotation(targetRotation);
        settleFrameRef.current = null;
        selectTopSector(targetRotation);
        return;
      }

      settleFrameRef.current = requestAnimationFrame(tick);
    };

    settleFrameRef.current = requestAnimationFrame(tick);
  }, [clearSettleAnimation, selectTopSector]);

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
    if ((e.target as Element).closest('[data-sector-hit="true"]')) {
      return;
    }

    clearSettleAnimation();
    setIsDragging(true);
    activePointerIdRef.current = e.pointerId;
    const angle = getAngleFromEvent(e);
    lastMoveRef.current = { angle, timestamp: performance.now() };
    dragDistanceRef.current = 0;
    velocityRef.current = 0;
    svgRef.current?.setPointerCapture?.(e.pointerId);
  }, [clearSettleAnimation, getAngleFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || activePointerIdRef.current !== e.pointerId || !lastMoveRef.current) return;

    e.preventDefault();

    const currentAngle = getAngleFromEvent(e);
    const now = performance.now();
    const previous = lastMoveRef.current;
    const delta = normalizeDelta(currentAngle - previous.angle);
    const elapsed = Math.max(8, now - previous.timestamp);
    const nextRotation = rotationRef.current + delta;

    dragDistanceRef.current += Math.abs(delta);
    velocityRef.current = (delta / elapsed) * 16;
    rotationRef.current = nextRotation;
    setRotation(nextRotation);
    selectTopSector(nextRotation);
    lastMoveRef.current = { angle: currentAngle, timestamp: now };
  }, [isDragging, getAngleFromEvent, selectTopSector]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging || activePointerIdRef.current !== e.pointerId) return;

    svgRef.current?.releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
    activePointerIdRef.current = null;
    lastMoveRef.current = null;

    if (dragDistanceRef.current < 4) {
      return;
    }

    const projected = rotationRef.current + velocityRef.current * 8;
    const snapped = Math.round(projected / 30) * 30;
    settleToNearestSector(snapped);
  }, [isDragging, settleToNearestSector]);

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
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          viewBox="-250 -250 500 500"
          style={{ touchAction: 'none' }}
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
            <filter id="sector-hover-glow">
              <feGaussianBlur stdDeviation="2.2" result="hoverBlur" />
              <feMerge>
                <feMergeNode in="hoverBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="label-compact-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.6" result="labelBlur" />
              <feMerge>
                <feMergeNode in="labelBlur" />
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
              const selectedFill = isCompact ? `${colors.primary}3a` : `${colors.primary}4d`;
              const hoverFill = isCompact ? `${colors.primary}20` : `${colors.primary}29`;
              const selectedStrokeOpacity = isCompact ? 0.88 : 0.95;
              const selectedStrokeWidth = isCompact ? 1.95 : 2.2;
              const hoverStrokeOpacity = isCompact ? 0.64 : 0.72;
              const hoverStrokeWidth = isCompact ? 1 : 1.2;
              return (
                <g key={i}>
                  <path
                    d={sectorPath(i)}
                    fill="rgba(255, 255, 255, 0.001)"
                    stroke="transparent"
                    onPointerEnter={() => setHoveredSector(i)}
                    onPointerLeave={() => setHoveredSector(null)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      onFeatureActivate(i);
                    }}
                    data-sector-hit="true"
                    style={{ cursor: 'pointer' }}
                  />
                  <path
                    d={sectorPath(i)}
                    fill={isSelected ? selectedFill : isHovered ? hoverFill : 'transparent'}
                    stroke={isSelected ? colors.primary : isHovered ? `${colors.secondary}` : 'transparent'}
                    strokeOpacity={isSelected ? selectedStrokeOpacity : isHovered ? hoverStrokeOpacity : 0}
                    strokeWidth={isSelected ? selectedStrokeWidth : isHovered ? hoverStrokeWidth : 0}
                    filter={isSelected ? 'url(#sector-glow)' : isHovered ? 'url(#sector-hover-glow)' : undefined}
                    className="pointer-events-none transition-all duration-200"
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
                  stroke={colors.primary} strokeWidth="2" strokeOpacity={isCompact ? 0.72 : 1} />
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
                  stroke={colors.secondary} strokeWidth="0.5" strokeOpacity={isCompact ? 0.48 : 1} />
              );
            })}

            {/* Feature labels at each sector */}
            {NAVIGATION_TARGETS.map((target, i) => {
              const angle = target.angle * (Math.PI / 180);
              const isLongCompactLabel = isCompact && target.label.length >= 12;
              const compactLabelInset = isLongCompactLabel ? 6 : 0;
              const labelR = (isCompact ? 154 : 157) - compactLabelInset;
              const x = Math.sin(angle) * labelR;
              const y = -Math.cos(angle) * labelR;
              const isSelected = selectedFeature === i;
              const isHovered = hoveredSector === i;
              const labelLines = getLabelLines(target.label);
              const baseFontSize = isSelected ? (isCompact ? 10.8 : 11) : isHovered ? (isCompact ? 10.2 : 9.8) : (isCompact ? 9.8 : 9.2);
              const maxLineChars = Math.max(...labelLines.map((line) => line.length));
              const estimatedWidth = maxLineChars * baseFontSize * 0.56;
              const widthScale = isCompact ? Math.min(1, 84 / Math.max(estimatedWidth, 1)) : 1;
              const fontSize = Number((baseFontSize * widthScale).toFixed(2));
              const lineHeight = Number(((isCompact ? 9.4 : 10) * widthScale).toFixed(2));
              const firstLineY = y - ((labelLines.length - 1) * lineHeight) / 2;
              const textStrokeWidth = isCompact ? (isSelected ? 2.8 : 2.1) : (isSelected ? 2 : 1.6);
              const platePaddingX = isCompact ? 7 : 5;
              const platePaddingY = isCompact ? 2.5 : 2;
              const plateWidth = Math.max(36, maxLineChars * fontSize * 0.56 + platePaddingX * 2);
              const plateHeight = labelLines.length * lineHeight + platePaddingY * 2;
              const plateY = firstLineY - lineHeight / 2 - platePaddingY;
              const showPlate = isCompact || isSelected || isHovered;
              const selectedCompactBoost = isCompact && isSelected;
              const plateFill = isSelected
                ? (isCompact ? 'rgba(3, 8, 16, 0.92)' : 'rgba(3, 8, 16, 0.88)')
                : isHovered
                  ? 'rgba(4, 10, 20, 0.78)'
                  : 'rgba(4, 10, 20, 0.62)';
              const plateStroke = isSelected
                ? (isCompact ? `${colors.primary}d1` : `${colors.primary}9c`)
                : isHovered
                  ? `${colors.secondary}8a`
                  : 'rgba(210, 221, 244, 0.2)';
              return (
                <g key={`label-${i}`}>
                  {selectedCompactBoost ? (
                    <rect
                      x={x - plateWidth / 2 - 1}
                      y={plateY - 1}
                      width={plateWidth + 2}
                      height={plateHeight + 2}
                      rx={isCompact ? 6.5 : 6}
                      fill="none"
                      stroke={`${colors.primary}6e`}
                      strokeWidth={1.1}
                      style={{ pointerEvents: 'none', filter: 'url(#label-compact-glow)' }}
                    />
                  ) : null}
                  {showPlate ? (
                    <rect
                      x={x - plateWidth / 2}
                      y={plateY}
                      width={plateWidth}
                      height={plateHeight}
                      rx={isCompact ? 5.5 : 5}
                      fill={plateFill}
                      stroke={plateStroke}
                      strokeWidth={isSelected ? (isCompact ? 1.15 : 1) : 0.8}
                      style={{ pointerEvents: 'none' }}
                    />
                  ) : null}
                  <text
                    x={x}
                    y={firstLineY}
                    fill={isSelected ? (isCompact ? '#ffffff' : '#f8fbff') : isHovered ? '#f3f7ff' : '#e4ecff'}
                    fontSize={fontSize}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    stroke="rgba(4, 8, 16, 0.9)"
                    strokeWidth={textStrokeWidth}
                    paintOrder="stroke"
                    letterSpacing={isLongCompactLabel ? '0px' : isSelected ? '0.2px' : '0.1px'}
                    style={{
                      pointerEvents: 'none',
                      filter: isSelected
                        ? (isCompact ? 'url(#label-compact-glow)' : 'url(#sector-glow)')
                        : undefined,
                    }}
                  >
                    {labelLines.map((line, lineIndex) => (
                      <tspan key={`${target.label}-${lineIndex}`} x={x} dy={lineIndex === 0 ? 0 : lineHeight}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
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
                  fontSize={isCompact ? '7.2' : '7.8'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  opacity={isCompact ? 0.54 : 0.72}
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
            fill="#f8fbff"
            fontSize="13.5"
            fontWeight="bold"
            textAnchor="middle"
            stroke="rgba(4, 8, 16, 0.9)"
            strokeWidth="1.6"
            paintOrder="stroke"
          >
            {NAVIGATION_TARGETS[selectedFeature]?.label ?? ''}
          </text>
        </svg>
      </div>

      {/* Rotation hint */}
      <p className="text-xs text-gray-400 mt-2 tracking-wide">
        Drag to rotate with momentum &middot; Tap a sector to navigate
      </p>
    </div>
  );
}
