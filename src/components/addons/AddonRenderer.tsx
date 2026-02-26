/**
 * AddonRenderer - Renders equipped addons on Auralia with drag support
 */

'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { Addon, AddonPositionOverride } from '@/lib/addons';

interface AddonRendererProps {
  addon: Addon;
  petSize?: number;
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  /** Custom position override from store */
  positionOverride?: AddonPositionOverride;
  /** Whether dragging is enabled */
  draggable?: boolean;
  /** Callback when position changes */
  onPositionChange?: (x: number, y: number) => void;
  /** Callback to toggle lock */
  onToggleLock?: (locked: boolean) => void;
  /** Callback to reset position */
  onResetPosition?: () => void;
}

export const AddonRenderer: React.FC<AddonRendererProps> = ({
  addon,
  petSize = 100,
  petPosition = { x: 0, y: 0 },
  animationPhase = 0,
  positionOverride,
  draggable = false,
  onPositionChange,
  onToggleLock,
  onResetPosition,
}) => {
  const { attachment, visual } = addon;
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Calculate default position based on attachment point
  const defaultPosition = useMemo(() => {
    const baseX = petPosition.x;
    const baseY = petPosition.y;

    let anchorX = baseX;
    let anchorY = baseY;

    // Adjust anchor based on attachment point
    // Auralia pet coordinates: body center (200, 210), head center (200, 145)
    switch (attachment.anchorPoint) {
      case 'head':
        anchorY = baseY - 65; // Head is 65px above body center
        break;
      case 'body':
        anchorY = baseY;
        break;
      case 'left-hand':
        anchorX = baseX - 25;
        anchorY = baseY + 20;
        break;
      case 'right-hand':
        anchorX = baseX + 25;
        anchorY = baseY + 20;
        break;
      case 'back':
        anchorY = baseY;
        anchorX = baseX; // Center on body but rendered behind
        break;
      case 'floating':
        // Floating items start from body center
        anchorX = baseX;
        anchorY = baseY - 30; // Slightly above body
        break;
      case 'aura':
        // Aura surrounds the body center
        anchorX = baseX;
        anchorY = baseY;
        break;
    }

    return {
      x: anchorX + attachment.offset.x,
      y: anchorY + attachment.offset.y,
    };
  }, [petPosition, attachment]);

  // Use custom position if available, otherwise use default
  const position = useMemo(() => {
    if (positionOverride) {
      return { x: positionOverride.x, y: positionOverride.y };
    }
    return defaultPosition;
  }, [positionOverride, defaultPosition]);

  const isLocked = positionOverride?.locked ?? false;

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (!draggable || isLocked) return;
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    e.preventDefault();
    e.stopPropagation();
    setShowControls(true);

    (e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;

      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;

      // Scale the movement based on SVG viewBox vs actual size
      const scaleFactor = 400 / (document.querySelector('.auralia-pet-svg')?.getBoundingClientRect().width || 400);

      const newX = dragStartRef.current.posX + dx * scaleFactor;
      const newY = dragStartRef.current.posY + dy * scaleFactor;

      onPositionChange?.(newX, newY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }, [draggable, isLocked, position, onPositionChange]);

  // Animation transform
  const animationTransform = useMemo(() => {
    if (!visual.animation) return '';

    const { type, duration } = visual.animation;
    const progress = (animationPhase % duration) / duration;

    switch (type) {
      case 'float':
        const floatY = Math.sin(progress * Math.PI * 2) * 3;
        return `translateY(${floatY}px)`;

      case 'rotate':
        const rotateDeg = progress * 360;
        return `rotate(${rotateDeg}deg)`;

      case 'pulse':
        const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
        return `scale(${scale})`;

      case 'shimmer':
        // Handled via opacity animation
        return '';

      default:
        return '';
    }
  }, [visual.animation, animationPhase]);

  // Opacity for shimmer effect
  const opacity = useMemo(() => {
    if (visual.animation?.type === 'shimmer') {
      const progress =
        (animationPhase % visual.animation.duration) / visual.animation.duration;
      return 0.7 + Math.sin(progress * Math.PI * 2) * 0.3;
    }
    return 1;
  }, [visual.animation, animationPhase]);

  return (
    <g
      transform={`translate(${position.x}, ${position.y}) rotate(${attachment.rotation}) scale(${attachment.scale})`}
      opacity={opacity}
      onMouseEnter={() => draggable && setShowControls(true)}
      onMouseLeave={() => !isDragging && setShowControls(false)}
      style={{ cursor: draggable && !isLocked ? 'grab' : 'default', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
    >
      {/* Drag indicator / selection highlight */}
      {draggable && showControls && (
        <g className="addon-controls">
          {/* Selection outline */}
          <circle
            cx="0"
            cy="0"
            r="35"
            fill="none"
            stroke={isLocked ? '#22c55e' : '#3b82f6'}
            strokeWidth="2"
            strokeDasharray={isLocked ? 'none' : '4 2'}
            opacity="0.7"
          />

          {/* Lock indicator */}
          {isLocked && (
            <g transform="translate(25, -25)">
              <circle cx="0" cy="0" r="8" fill="#22c55e" />
              <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white">🔒</text>
            </g>
          )}

          {/* Control buttons (when not locked) */}
          {!isLocked && (
            <>
              {/* Lock button */}
              <g
                transform="translate(30, -20)"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock?.(true);
                }}
              >
                <circle cx="0" cy="0" r="10" fill="#22c55e" opacity="0.9" />
                <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white">🔓</text>
              </g>

              {/* Reset button */}
              <g
                transform="translate(30, 10)"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onResetPosition?.();
                }}
              >
                <circle cx="0" cy="0" r="10" fill="#f59e0b" opacity="0.9" />
                <text x="0" y="4" textAnchor="middle" fontSize="9" fill="white">↺</text>
              </g>
            </>
          )}

          {/* Unlock button (when locked) */}
          {isLocked && (
            <g
              transform="translate(30, 0)"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock?.(false);
              }}
            >
              <circle cx="0" cy="0" r="10" fill="#ef4444" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fontSize="9" fill="white">🔓</text>
            </g>
          )}
        </g>
      )}

      {/* Main addon visual */}
      {visual.svgPath && (
        <g transform={animationTransform}>
          <path
            d={visual.svgPath}
            fill={visual.colors.primary}
            stroke={visual.colors.secondary || visual.colors.primary}
            strokeWidth="1"
          />

          {/* Glow effect */}
          {visual.colors.glow && (
            <path
              d={visual.svgPath}
              fill="none"
              stroke={visual.colors.glow}
              strokeWidth="3"
              filter="url(#addonGlow)"
              opacity="0.6"
            />
          )}

          {/* Accent highlights */}
          {visual.colors.accent && (
            <path
              d={visual.svgPath}
              fill="none"
              stroke={visual.colors.accent}
              strokeWidth="0.5"
              opacity="0.8"
            />
          )}
        </g>
      )}

      {/* Particles */}
      {visual.particles && (
        <AddonParticles
          config={visual.particles}
          animationPhase={animationPhase}
          centerX={0}
          centerY={0}
        />
      )}
    </g>
  );
};

interface AddonParticlesProps {
  config: NonNullable<Addon['visual']['particles']>;
  animationPhase: number;
  centerX: number;
  centerY: number;
}

const AddonParticles: React.FC<AddonParticlesProps> = ({
  config,
  animationPhase,
  centerX,
  centerY,
}) => {
  const particles = useMemo(() => {
    const { count, color, size, behavior } = config;
    const result: Array<{ id: number; x: number; y: number; opacity: number }> = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      let x = centerX;
      let y = centerY;

      switch (behavior) {
        case 'orbit':
          const radius = 30 + Math.sin((animationPhase / 1000 + i) * 0.5) * 5;
          const orbitAngle = angle + animationPhase / 1000;
          x = centerX + Math.cos(orbitAngle) * radius;
          y = centerY + Math.sin(orbitAngle) * radius;
          break;

        case 'ambient':
          x =
            centerX +
            Math.sin((animationPhase / 2000 + i) * 0.8) * 20;
          y =
            centerY +
            Math.cos((animationPhase / 1500 + i) * 0.6) * 20;
          break;

        case 'trail':
          x = centerX + Math.cos(angle) * (20 - i * 2);
          y = centerY + Math.sin(angle) * (20 - i * 2) - animationPhase / 100;
          break;

        case 'burst':
          const burstRadius = ((animationPhase % 2000) / 2000) * 30;
          x = centerX + Math.cos(angle) * burstRadius;
          y = centerY + Math.sin(angle) * burstRadius;
          break;
      }

      result.push({
        id: i,
        x,
        y,
        opacity: behavior === 'burst' ? 1 - (animationPhase % 2000) / 2000 : 0.8,
      });
    }

    return result;
  }, [config, animationPhase, centerX, centerY]);

  return (
    <>
      {particles.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={config.size}
          fill={config.color}
          opacity={p.opacity}
          filter="url(#particleGlow)"
        />
      ))}
    </>
  );
};

/**
 * Addon SVG filters and definitions
 */
export const AddonSVGDefs: React.FC = () => (
  <defs>
    <filter id="addonGlow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="particleGlow">
      <feGaussianBlur stdDeviation="1" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);
