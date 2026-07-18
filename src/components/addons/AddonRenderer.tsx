/**
 * AddonRenderer - Renders equipped addons on Auralia with drag support
 */

"use client";

import type { Addon, AddonPositionOverride } from "@/lib/addons";
import {
  RARITY_POP,
  REDUCED_MOTION_DAMP,
  getParticleImpactBoost,
  getPopTransform,
  getShockwave,
  getSnapOn,
  getSparklePoints,
} from "@/lib/addons/animationPop";
import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { SeraphicPendantField } from "./SeraphicPendantField";
import { WizardStaffSoulEngine } from "./WizardStaffSoulEngine";

/**
 * Minimal shape the renderer needs. Verified Addons satisfy it directly;
 * wardrobe cosmetics are adapted into it (see @/lib/wardrobe/adapter).
 */
export type RenderableAddon = Pick<
  Addon,
  "id" | "rarity" | "attachment" | "visual"
>;

interface AddonRendererProps {
  addon: RenderableAddon;
  petSize?: number;
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  mood?: number;
  energy?: number;
  curiosity?: number;
  bond?: number;
  red60?: number;
  blue60?: number;
  black60?: number;
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
  /** Respect the user's reduced-motion preference */
  reduceMotion?: boolean;
}

export const AddonRenderer: React.FC<AddonRendererProps> = ({
  addon,
  petSize = 100,
  petPosition = { x: 0, y: 0 },
  animationPhase = 0,
  mood = 50,
  energy = 50,
  curiosity = 50,
  bond = 50,
  red60 = 50,
  blue60 = 50,
  black60 = 50,
  positionOverride,
  draggable = false,
  onPositionChange,
  onToggleLock,
  onResetPosition,
  reduceMotion = false,
}) => {
  const { attachment, visual } = addon;
  const popProfile = RARITY_POP[addon.rarity];
  // Anchor the equip "snap on" flourish to the animation clock so it
  // pauses with the parent and never needs its own timer.
  const [mountPhase] = useState(animationPhase);
  const snapOn = getSnapOn(animationPhase - mountPhase, reduceMotion);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    posX: number;
    posY: number;
  } | null>(null);

  // Calculate default position based on attachment point
  const defaultPosition = useMemo(() => {
    const baseX = petPosition.x;
    const baseY = petPosition.y;

    let anchorX = baseX;
    let anchorY = baseY;

    // Adjust anchor based on attachment point
    // Auralia pet coordinates: body center (200, 210), head center (200, 145)
    switch (attachment.anchorPoint) {
      case "head":
        anchorY = baseY - 65; // Head is 65px above body center
        break;
      case "body":
        anchorY = baseY;
        break;
      case "left-hand":
        anchorX = baseX - 25;
        anchorY = baseY + 20;
        break;
      case "right-hand":
        anchorX = baseX + 25;
        anchorY = baseY + 20;
        break;
      case "back":
        anchorY = baseY;
        anchorX = baseX; // Center on body but rendered behind
        break;
      case "floating":
        // Floating items start from body center
        anchorX = baseX;
        anchorY = baseY - 30; // Slightly above body
        break;
      case "aura":
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

  const previewAssetFrame = useMemo(() => ({ x: 200, y: 120, size: 620 }), []);

  const isLocked = positionOverride?.locked ?? false;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!draggable || isLocked) return;
      if (e.button !== 0 && e.pointerType !== "touch") return;
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
        const scaleFactor =
          400 /
          (document.querySelector(".auralia-pet-svg")?.getBoundingClientRect()
            .width || 400);

        const newX = dragStartRef.current.posX + dx * scaleFactor;
        const newY = dragStartRef.current.posY + dy * scaleFactor;

        onPositionChange?.(newX, newY);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [draggable, isLocked, position, onPositionChange],
  );

  // Normalized progress through one animation cycle (0..1)
  const cycleT = useMemo(() => {
    if (!visual.animation) return 0;
    return (animationPhase % visual.animation.duration) / visual.animation.duration;
  }, [visual.animation, animationPhase]);

  // Animation transform with rarity pop (attack/impact/aftershock/settle)
  const pop = useMemo(() => {
    if (!visual.animation) return { transform: "", opacityFactor: 1 };
    return getPopTransform(visual.animation.type, cycleT, addon.rarity, reduceMotion);
  }, [visual.animation, cycleT, addon.rarity, reduceMotion]);

  const animationTransform = pop.transform;

  // Shockwave ring for pulse/glow/sparkle addons on rarities that earn one
  const shockwave = useMemo(() => {
    const type = visual.animation?.type;
    const wantsShockwave =
      type === "pulse" || type === "glow" || type === "sparkle";
    if (!wantsShockwave || !popProfile.shockwave || reduceMotion) return null;
    const wave = getShockwave(cycleT, popProfile.amplitude);
    return wave.opacity > 0.01 ? wave : null;
  }, [visual.animation, cycleT, popProfile, reduceMotion]);

  // Sparkle glints for the sparkle type
  const sparkles = useMemo(() => {
    if (visual.animation?.type !== "sparkle") return null;
    const count = reduceMotion ? 3 : 6;
    return getSparklePoints(cycleT, count);
  }, [visual.animation, cycleT, reduceMotion]);

  // Opacity for shimmer effect (gentler wave under reduced motion)
  const opacity = useMemo(() => {
    let value = 1;
    if (visual.animation?.type === "shimmer") {
      const waveDepth = reduceMotion ? 0.3 * REDUCED_MOTION_DAMP : 0.3;
      value = 1 - waveDepth + Math.sin(cycleT * Math.PI * 2) * waveDepth;
    }
    return value * pop.opacityFactor * snapOn.opacity;
  }, [visual.animation, cycleT, reduceMotion, pop.opacityFactor, snapOn.opacity]);

  const particleImpactBoost = getParticleImpactBoost(
    cycleT,
    popProfile,
    reduceMotion,
  );

  return (
    <g
      transform={`translate(${position.x}, ${position.y}) rotate(${attachment.rotation}) scale(${attachment.scale * snapOn.scale})`}
      opacity={opacity}
      onMouseEnter={() => draggable && setShowControls(true)}
      onMouseLeave={() => !isDragging && setShowControls(false)}
      style={{
        cursor: draggable && !isLocked ? "grab" : "default",
        touchAction: "none",
      }}
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
            stroke={isLocked ? "#22c55e" : "#3b82f6"}
            strokeWidth="2"
            strokeDasharray={isLocked ? "none" : "4 2"}
            opacity="0.7"
          />

          {/* Lock indicator */}
          {isLocked && (
            <g transform="translate(25, -25)">
              <circle cx="0" cy="0" r="8" fill="#22c55e" />
              <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white">
                🔒
              </text>
            </g>
          )}

          {/* Control buttons (when not locked) */}
          {!isLocked && (
            <>
              {/* Lock button */}
              <g
                transform="translate(30, -20)"
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock?.(true);
                }}
              >
                <circle cx="0" cy="0" r="10" fill="#22c55e" opacity="0.9" />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                >
                  🔓
                </text>
              </g>

              {/* Reset button */}
              <g
                transform="translate(30, 10)"
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onResetPosition?.();
                }}
              >
                <circle cx="0" cy="0" r="10" fill="#f59e0b" opacity="0.9" />
                <text x="0" y="4" textAnchor="middle" fontSize="9" fill="white">
                  ↺
                </text>
              </g>
            </>
          )}

          {/* Unlock button (when locked) */}
          {isLocked && (
            <g
              transform="translate(30, 0)"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock?.(false);
              }}
            >
              <circle cx="0" cy="0" r="10" fill="#ef4444" opacity="0.9" />
              <text x="0" y="4" textAnchor="middle" fontSize="9" fill="white">
                🔓
              </text>
            </g>
          )}
        </g>
      )}

      {/* Main addon visual */}
      {visual.customRenderer === "seraphicPendantField" ? (
        <SeraphicPendantField
          animationPhase={animationPhase}
          mood={mood}
          energy={energy}
          curiosity={curiosity}
          bond={bond}
          red60={red60}
          blue60={blue60}
          black60={black60}
        />
      ) : visual.customRenderer === "wizardStaffSoulEngine" ? (
        <WizardStaffSoulEngine
          animationPhase={animationPhase}
          mood={mood}
          energy={energy}
          curiosity={curiosity}
          bond={bond}
        />
      ) : visual.previewAsset ? (
        <g transform={animationTransform}>
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="18"
            fill="rgba(2, 6, 23, 0.55)"
            stroke={
              visual.colors.accent ||
              visual.colors.secondary ||
              visual.colors.primary
            }
            strokeWidth="1.2"
            opacity="0.8"
          />
          <svg
            x="6"
            y="6"
            width="88"
            height="88"
            viewBox={`${previewAssetFrame.x} ${previewAssetFrame.y} ${previewAssetFrame.size} ${previewAssetFrame.size}`}
          >
            <image
              href={visual.previewAsset}
              x="0"
              y="0"
              width="1024"
              height="1024"
              preserveAspectRatio="xMidYMid slice"
            />
          </svg>

          {visual.colors.glow && (
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              rx="18"
              fill="none"
              stroke={visual.colors.glow}
              strokeWidth="3"
              filter="url(#addonGlow)"
              opacity="0.45"
            />
          )}
        </g>
      ) : visual.svgPath ? (
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
      ) : null}

      {/* Shockwave ring synced to the impact phase */}
      {shockwave && (
        <circle
          cx="0"
          cy="0"
          r={shockwave.radius}
          fill="none"
          stroke={visual.colors.glow || visual.colors.accent || visual.colors.primary}
          strokeWidth={shockwave.strokeWidth}
          opacity={shockwave.opacity}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Sparkle glints */}
      {sparkles?.map((s, i) => (
        <circle
          key={`sparkle-${i}`}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={visual.colors.accent || visual.colors.glow || "#ffffff"}
          opacity={s.opacity}
          filter="url(#particleGlow)"
          style={{ pointerEvents: "none" }}
        />
      ))}

      {/* Snap-on flash when freshly equipped */}
      {snapOn.active && !reduceMotion && (
        <circle
          cx="0"
          cy="0"
          r={30 * (2 - snapOn.scale)}
          fill="none"
          stroke={visual.colors.glow || visual.colors.primary}
          strokeWidth="2"
          opacity={Math.max(0, snapOn.opacity - 0.55)}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Particles */}
      {visual.particles && (
        <AddonParticles
          config={visual.particles}
          animationPhase={animationPhase}
          centerX={0}
          centerY={0}
          impactBoost={particleImpactBoost}
          reduceMotion={reduceMotion}
        />
      )}
    </g>
  );
};

interface AddonParticlesProps {
  config: NonNullable<Addon["visual"]["particles"]>;
  animationPhase: number;
  centerX: number;
  centerY: number;
  /** Radius/speed multiplier applied during the impact phase (>= 1). */
  impactBoost?: number;
  reduceMotion?: boolean;
}

const AddonParticles: React.FC<AddonParticlesProps> = ({
  config,
  animationPhase,
  centerX,
  centerY,
  impactBoost = 1,
  reduceMotion = false,
}) => {
  const particles = useMemo(() => {
    const { count, behavior } = config;
    const visibleCount = reduceMotion ? Math.max(2, Math.ceil(count / 2)) : count;
    // Boosted clock makes orbits/trails visibly accelerate on impact.
    const boostedPhase = animationPhase * impactBoost;
    const result: Array<{ id: number; x: number; y: number; opacity: number }> =
      [];

    for (let i = 0; i < visibleCount; i++) {
      const angle = (i / visibleCount) * Math.PI * 2;
      let x = centerX;
      let y = centerY;

      switch (behavior) {
        case "orbit":
          const radius =
            (30 + Math.sin((boostedPhase / 1000 + i) * 0.5) * 5) * impactBoost;
          const orbitAngle = angle + boostedPhase / 1000;
          x = centerX + Math.cos(orbitAngle) * radius;
          y = centerY + Math.sin(orbitAngle) * radius;
          break;

        case "ambient":
          x = centerX + Math.sin((boostedPhase / 2000 + i) * 0.8) * 20 * impactBoost;
          y = centerY + Math.cos((boostedPhase / 1500 + i) * 0.6) * 20 * impactBoost;
          break;

        case "trail":
          x = centerX + Math.cos(angle) * (20 - i * 2) * impactBoost;
          y =
            centerY +
            Math.sin(angle) * (20 - i * 2) * impactBoost -
            boostedPhase / 100;
          break;

        case "burst":
          const burstRadius = ((boostedPhase % 2000) / 2000) * 30 * impactBoost;
          x = centerX + Math.cos(angle) * burstRadius;
          y = centerY + Math.sin(angle) * burstRadius;
          break;
      }

      result.push({
        id: i,
        x,
        y,
        opacity:
          behavior === "burst" ? 1 - (boostedPhase % 2000) / 2000 : 0.8,
      });
    }

    return result;
  }, [config, animationPhase, centerX, centerY, impactBoost, reduceMotion]);

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
