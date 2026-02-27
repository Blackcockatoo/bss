'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { SteeringViewProps } from './types';
import { NAVIGATION_TARGETS } from './types';

const COLOR_VARIANTS = {
  red: { primary: '#FF5555', secondary: '#FF9999', bg: 'rgba(255,85,85,0.05)' },
  blue: { primary: '#5555FF', secondary: '#9999FF', bg: 'rgba(85,85,255,0.05)' },
  black: { primary: '#AAAAAA', secondary: '#666666', bg: 'rgba(170,170,170,0.05)' },
};

type GeometryPattern = 'flower' | 'star' | 'metatron' | 'fibonacci';

export function GeometryView({
  color,
  numberStrings,
  selectedFeature,
  onFeatureSelect,
  onFeatureActivate,
}: SteeringViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pattern, setPattern] = useState<GeometryPattern>('flower');
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(true);

  const colors = COLOR_VARIANTS[color];
  const numberString = numberStrings[color];

  // Slow rotation animation
  useEffect(() => {
    if (!animating) return;
    let frame: number;
    const animate = () => {
      setRotation(prev => (prev + 0.15) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [animating]);

  // Feature vertex positions (12 points on outer ring, overlaid on geometry)
  const featureVertices = useMemo(() => {
    return NAVIGATION_TARGETS.map((target, i) => {
      const angle = target.angle * (Math.PI / 180);
      const r = 210;
      return { x: Math.sin(angle) * r, y: -Math.cos(angle) * r, label: target.label };
    });
  }, []);

  const renderFlower = () => (
    <>
      <circle cx="0" cy="0" r="200" stroke={colors.primary} strokeWidth="1" fill="none" />
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        return (
          <circle
            key={i}
            cx={Math.sin(angle) * 100}
            cy={Math.cos(angle) * 100}
            r="100"
            stroke={colors.primary} strokeWidth="1" fill="none"
          />
        );
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        return (
          <circle
            key={`o-${i}`}
            cx={Math.sin(angle) * 150}
            cy={Math.cos(angle) * 150}
            r="50"
            stroke={colors.primary} strokeWidth="0.5" fill="none"
          />
        );
      })}
    </>
  );

  const renderStar = () => (
    <>
      <polygon
        points="0,-200 173.2,100 -173.2,100"
        stroke={colors.primary} strokeWidth="1" fill="none"
      />
      <polygon
        points="0,200 173.2,-100 -173.2,-100"
        stroke={colors.primary} strokeWidth="1" fill="none"
      />
      <polygon
        points="-200,0 100,173.2 100,-173.2"
        stroke={colors.primary} strokeWidth="1" fill="none"
      />
      <polygon
        points="200,0 -100,173.2 -100,-173.2"
        stroke={colors.primary} strokeWidth="1" fill="none"
      />
      {[
        { x: 0, y: -200 }, { x: 173.2, y: 100 }, { x: -173.2, y: 100 },
        { x: 0, y: 200 }, { x: 173.2, y: -100 }, { x: -173.2, y: -100 },
        { x: -200, y: 0 }, { x: 100, y: 173.2 }, { x: 100, y: -173.2 },
        { x: 200, y: 0 }, { x: -100, y: 173.2 }, { x: -100, y: -173.2 },
      ].map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="15"
          stroke={colors.primary} strokeWidth="1" fill="none" />
      ))}
      <circle cx="0" cy="0" r="30" stroke={colors.primary} strokeWidth="1" fill="none" />
    </>
  );

  const renderMetatron = () => (
    <>
      {[180, 150, 120, 90, 60, 30].map((r, i) => (
        <circle key={i} cx="0" cy="0" r={r}
          stroke={colors.primary} strokeWidth={i === 0 ? 1 : 0.7} fill="none" />
      ))}
      <polygon
        points="0,-180 155.9,-90 155.9,90 0,180 -155.9,90 -155.9,-90"
        stroke={colors.primary} strokeWidth="1" fill="none"
      />
      <polygon
        points="0,-120 103.9,-60 103.9,60 0,120 -103.9,60 -103.9,-60"
        stroke={colors.primary} strokeWidth="0.7" fill="none"
      />
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        return (
          <line key={i} x1={0} y1={0}
            x2={Math.sin(angle) * 180} y2={-Math.cos(angle) * 180}
            stroke={colors.primary} strokeWidth="0.7" />
        );
      })}
    </>
  );

  const renderFibonacci = () => (
    <>
      <circle cx="0" cy="0" r="200" stroke={colors.primary} strokeWidth="1" fill="none" />
      <path
        d="M 0,0 A 20,20 0 0 1 20,20 A 40,40 0 0 0 60,60 A 100,100 0 0 1 160,160 A 180,180 0 0 0 -20,160"
        stroke={colors.primary} strokeWidth="1.5" fill="none"
      />
      {[20, 40, 60, 100, 160].map((w, i) => (
        <rect key={i} x={-10} y={-10} width={w} height={w}
          stroke={colors.primary} strokeWidth="0.7" fill="none" />
      ))}
      {numberString.split('').slice(0, 8).map((digit, i) => {
        const fibPos = [1, 1, 2, 3, 5, 8, 13, 21];
        const size = fibPos[i] * 10;
        return (
          <text
            key={i}
            x={-10 + size / 2} y={-10 + size / 2}
            fill={colors.primary} fontSize="12"
            textAnchor="middle" dominantBaseline="middle"
          >
            {digit}
          </text>
        );
      })}
    </>
  );

  const patternRenderers: Record<GeometryPattern, () => React.JSX.Element> = {
    flower: renderFlower,
    star: renderStar,
    metatron: renderMetatron,
    fibonacci: renderFibonacci,
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[500px] h-[500px] max-w-full">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="-250 -250 500 500"
          style={{ backgroundColor: colors.bg }}
        >
          {/* Rotating geometry */}
          <g transform={`rotate(${rotation})`}>
            {patternRenderers[pattern]()}
          </g>

          {/* Feature labels around the outer ring (fixed, not rotating) */}
          {featureVertices.map((v, i) => {
            const isSelected = selectedFeature === i;
            return (
              <g key={`fv-${i}`}
                className="cursor-pointer"
                onClick={() => onFeatureActivate(i)}
              >
                <circle
                  cx={v.x} cy={v.y} r={isSelected ? 16 : 12}
                  fill={isSelected ? `${colors.primary}44` : 'rgba(0,0,0,0.4)'}
                  stroke={isSelected ? colors.primary : colors.secondary}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  className="transition-all duration-200"
                />
                <text
                  x={v.x} y={v.y}
                  fill={isSelected ? colors.primary : colors.secondary}
                  fontSize="5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {v.label.length > 7 ? v.label.slice(0, 6) + '.' : v.label}
                </text>
              </g>
            );
          })}

          {/* Selected feature label */}
          <text
            x="0" y="240"
            fill={colors.primary}
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
          >
            {NAVIGATION_TARGETS[selectedFeature]?.label ?? ''}
          </text>
        </svg>
      </div>

      {/* Pattern type selector */}
      <div className="flex gap-2 mt-3 flex-wrap justify-center">
        {(['flower', 'star', 'metatron', 'fibonacci'] as const).map(type => (
          <button
            key={type}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              pattern === type ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            onClick={() => setPattern(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <button
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            animating ? 'bg-red-900/50 text-red-400' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
          onClick={() => setAnimating(prev => !prev)}
        >
          {animating ? 'Stop' : 'Animate'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Click a vertex to navigate &middot; Sacred geometry layer
      </p>
    </div>
  );
}
