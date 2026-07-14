"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type BodyShape =
  | "round"
  | "orb"
  | "bean"
  | "cubic"
  | "block"
  | "crystal"
  | "toroid"
  | "droplet"
  | "bell"
  | "seed"
  | "manta"
  | "lantern"
  | "crown"
  | "hourglass"
  | "wisp";
export type BodyPattern =
  | "solid"
  | "gradient"
  | "striped"
  | "stripes"
  | "spotted"
  | "spots"
  | "velvet"
  | "pearl"
  | "glass"
  | "chrome"
  | "scales"
  | "moss"
  | "stone"
  | "ink";
export type FaceExpression =
  | "neutral"
  | "smile"
  | "frown"
  | "focused"
  | "sleepy"
  | "mischief"
  | "calm"
  | "fierce";
export type BodyFeature =
  | "wings"
  | "horns"
  | "crown"
  | "thirdEye"
  | "tailFlame";
export type GenderFrame = "male" | "neutral" | "female";
export type WingStyle = "feather" | "moth" | "blade" | "veil";
export type WingPurpose =
  | "flight"
  | "attack"
  | "attract"
  | "defend"
  | "decorative";
export type AuraStyle =
  | "mist"
  | "sparkle"
  | "fireworks"
  | "fizz"
  | "5d"
  | "embers"
  | "prism"
  | "static"
  | "ribbons"
  | "void";
export type AuraMotion =
  | "orbit"
  | "implode"
  | "explode"
  | "breathe"
  | "spiral"
  | "drift";

export interface BodySpec {
  name: string;
  shape: BodyShape;
  pattern: BodyPattern;
  expression: FaceExpression;
  primaryColor: string;
  secondaryColor: string;
  highlightColor: string;
  bodyWidth: number;
  bodyHeight: number;
  bodyScale: number;
  cornerRoundness: number;
  genderFrame: GenderFrame;
  shoulders: number;
  waist: number;
  hips: number;
  textureScale: number;
  textureDepth: number;
  textureRoughness: number;
  eyeSize: number;
  eyeSpacing: number;
  eyeHeight: number;
  pupilSize: number;
  gazeX: number;
  gazeY: number;
  mouthWidth: number;
  mouthHeight: number;
  wingSpread: number;
  wingStyle: WingStyle;
  wingPurpose: WingPurpose;
  hornLength: number;
  outlineWidth: number;
  glow: number;
  tilt: number;
  bob: number;
  breathe: number;
  animationSpeed: number;
  auraStyle: AuraStyle;
  auraMotion: AuraMotion;
  auraDensity: number;
  auraRadius: number;
  auraSpeed: number;
  auraTurbulence: number;
  auraDimension: number;
  auraColor: string;
  auraSecondary: string;
  emotionIndex: number;
  features: BodyFeature[];
}

export const DEFAULT_BODY_SPEC: BodySpec = {
  name: "Auralia Body 01",
  shape: "bean",
  pattern: "gradient",
  expression: "smile",
  primaryColor: "#1677ff",
  secondaryColor: "#070b18",
  highlightColor: "#f5c451",
  bodyWidth: 104,
  bodyHeight: 112,
  bodyScale: 1,
  cornerRoundness: 28,
  genderFrame: "neutral",
  shoulders: 50,
  waist: 50,
  hips: 50,
  textureScale: 48,
  textureDepth: 58,
  textureRoughness: 22,
  eyeSize: 12,
  eyeSpacing: 40,
  eyeHeight: 104,
  pupilSize: 5,
  gazeX: 0,
  gazeY: 0,
  mouthWidth: 30,
  mouthHeight: 11,
  wingSpread: 0.78,
  wingStyle: "feather",
  wingPurpose: "flight",
  hornLength: 28,
  outlineWidth: 4,
  glow: 0.45,
  tilt: 0,
  bob: 7,
  breathe: 0.035,
  animationSpeed: 1,
  auraStyle: "5d",
  auraMotion: "orbit",
  auraDensity: 62,
  auraRadius: 72,
  auraSpeed: 55,
  auraTurbulence: 48,
  auraDimension: 5,
  auraColor: "#42dfff",
  auraSecondary: "#9c5cff",
  emotionIndex: 34,
  features: ["wings", "thirdEye", "tailFlame"],
};

function mouthPath(spec: BodySpec) {
  const x1 = 140 - spec.mouthWidth / 2;
  const x2 = 140 + spec.mouthWidth / 2;
  const y = 132;
  if (spec.expression === "smile" || spec.expression === "mischief")
    return `M ${x1} ${y} Q 140 ${y + spec.mouthHeight} ${x2} ${y}`;
  if (spec.expression === "frown")
    return `M ${x1} ${y + spec.mouthHeight} Q 140 ${y} ${x2} ${y + spec.mouthHeight}`;
  if (spec.expression === "focused" || spec.expression === "fierce")
    return `M ${x1} ${y + 3} L ${x2} ${y + 3}`;
  if (spec.expression === "sleepy")
    return `M ${x1 + 6} ${y} Q 140 ${y + 4} ${x2 - 6} ${y}`;
  return `M ${x1 + 3} ${y + 2} L ${x2 - 3} ${y + 2}`;
}

function BodySilhouette({ spec, fill }: { spec: BodySpec; fill: string }) {
  const x = 140 - spec.bodyWidth / 2;
  const y = 112 - spec.bodyHeight / 2;
  const shoulder = spec.bodyWidth * (0.37 + spec.shoulders / 420);
  const waist = spec.bodyWidth * (0.26 + spec.waist / 520);
  const hip = spec.bodyWidth * (0.36 + spec.hips / 390);
  const common = {
    fill,
    stroke: spec.secondaryColor,
    strokeWidth: spec.outlineWidth,
  };
  if (spec.shape === "cubic" || spec.shape === "block") {
    return (
      <rect
        x={x}
        y={y}
        width={spec.bodyWidth}
        height={spec.bodyHeight}
        rx={spec.cornerRoundness}
        {...common}
      />
    );
  }
  if (spec.shape === "crystal") {
    return (
      <path
        d={`M 140 ${y} L ${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.34} L ${x + spec.bodyWidth * 0.76} ${y + spec.bodyHeight} L ${x + spec.bodyWidth * 0.24} ${y + spec.bodyHeight} L ${x} ${y + spec.bodyHeight * 0.34} Z`}
        {...common}
      />
    );
  }
  if (spec.shape === "toroid") {
    return (
      <g>
        <ellipse
          cx="140"
          cy="112"
          rx={spec.bodyWidth / 2}
          ry={spec.bodyHeight / 2}
          {...common}
        />
        <ellipse
          cx="140"
          cy="112"
          rx={spec.bodyWidth * 0.19}
          ry={spec.bodyHeight * 0.19}
          fill="#050814"
          stroke={spec.secondaryColor}
          strokeWidth={spec.outlineWidth}
        />
      </g>
    );
  }
  if (spec.shape === "bean") {
    return (
      <path
        d={`M140 ${y} C${140 + shoulder} ${y + spec.bodyHeight * 0.05} ${140 + shoulder} ${y + spec.bodyHeight * 0.24} ${140 + waist} ${y + spec.bodyHeight * 0.47} C${140 + hip} ${y + spec.bodyHeight * 0.68} ${140 + hip} ${y + spec.bodyHeight * 0.91} 140 ${y + spec.bodyHeight} C${140 - hip} ${y + spec.bodyHeight * 0.91} ${140 - hip} ${y + spec.bodyHeight * 0.68} ${140 - waist} ${y + spec.bodyHeight * 0.47} C${140 - shoulder} ${y + spec.bodyHeight * 0.24} ${140 - shoulder} ${y + spec.bodyHeight * 0.05} 140 ${y}Z`}
        {...common}
      />
    );
  }
  if (spec.shape === "droplet")
    return (
      <path
        d={`M140 ${y} C${x + spec.bodyWidth * 0.9} ${y + spec.bodyHeight * 0.42} ${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.62} ${x + spec.bodyWidth * 0.83} ${y + spec.bodyHeight * 0.82} C${x + spec.bodyWidth * 0.64} ${y + spec.bodyHeight * 1.05} ${x + spec.bodyWidth * 0.34} ${y + spec.bodyHeight * 1.05} ${x + spec.bodyWidth * 0.17} ${y + spec.bodyHeight * 0.82} C${x} ${y + spec.bodyHeight * 0.61} ${x + spec.bodyWidth * 0.12} ${y + spec.bodyHeight * 0.39} 140 ${y}Z`}
        {...common}
      />
    );
  if (spec.shape === "bell")
    return (
      <path
        d={`M140 ${y} C${x + spec.bodyWidth * 0.82} ${y + spec.bodyHeight * 0.05} ${x + spec.bodyWidth * 0.82} ${y + spec.bodyHeight * 0.4} ${x + spec.bodyWidth * 0.9} ${y + spec.bodyHeight * 0.72} L${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.9} Q${x + spec.bodyWidth * 0.76} ${y + spec.bodyHeight} ${x + spec.bodyWidth * 0.62} ${y + spec.bodyHeight * 0.91} Q140 ${y + spec.bodyHeight * 1.06} ${x + spec.bodyWidth * 0.38} ${y + spec.bodyHeight * 0.91} Q${x + spec.bodyWidth * 0.24} ${y + spec.bodyHeight} ${x} ${y + spec.bodyHeight * 0.9} L${x + spec.bodyWidth * 0.1} ${y + spec.bodyHeight * 0.72} C${x + spec.bodyWidth * 0.18} ${y + spec.bodyHeight * 0.4} ${x + spec.bodyWidth * 0.18} ${y + spec.bodyHeight * 0.05} 140 ${y}Z`}
        {...common}
      />
    );
  if (spec.shape === "seed")
    return (
      <path
        d={`M140 ${y} C${x + spec.bodyWidth * 1.03} ${y + spec.bodyHeight * 0.28} ${x + spec.bodyWidth * 0.94} ${y + spec.bodyHeight * 0.72} 140 ${y + spec.bodyHeight} C${x + spec.bodyWidth * 0.06} ${y + spec.bodyHeight * 0.72} ${x - spec.bodyWidth * 0.03} ${y + spec.bodyHeight * 0.28} 140 ${y}Z`}
        {...common}
      />
    );
  if (spec.shape === "manta")
    return (
      <path
        d={`M140 ${y + spec.bodyHeight * 0.18} Q${x + spec.bodyWidth * 0.76} ${y - spec.bodyHeight * 0.08} ${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.28} L${x + spec.bodyWidth * 0.72} ${y + spec.bodyHeight * 0.56} Q${x + spec.bodyWidth * 0.62} ${y + spec.bodyHeight * 0.74} 140 ${y + spec.bodyHeight} Q${x + spec.bodyWidth * 0.38} ${y + spec.bodyHeight * 0.74} ${x + spec.bodyWidth * 0.28} ${y + spec.bodyHeight * 0.56} L${x} ${y + spec.bodyHeight * 0.28} Q${x + spec.bodyWidth * 0.24} ${y - spec.bodyHeight * 0.08} 140 ${y + spec.bodyHeight * 0.18}Z`}
        {...common}
      />
    );
  if (spec.shape === "lantern")
    return (
      <path
        d={`M${x + spec.bodyWidth * 0.34} ${y} L${x + spec.bodyWidth * 0.66} ${y} L${x + spec.bodyWidth * 0.78} ${y + spec.bodyHeight * 0.13} Q${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.5} ${x + spec.bodyWidth * 0.78} ${y + spec.bodyHeight * 0.87} L${x + spec.bodyWidth * 0.66} ${y + spec.bodyHeight} L${x + spec.bodyWidth * 0.34} ${y + spec.bodyHeight} L${x + spec.bodyWidth * 0.22} ${y + spec.bodyHeight * 0.87} Q${x} ${y + spec.bodyHeight * 0.5} ${x + spec.bodyWidth * 0.22} ${y + spec.bodyHeight * 0.13}Z`}
        {...common}
      />
    );
  if (spec.shape === "crown")
    return (
      <path
        d={`M${x} ${y + spec.bodyHeight * 0.24} L${x + spec.bodyWidth * 0.2} ${y + spec.bodyHeight * 0.42} L${x + spec.bodyWidth * 0.35} ${y} L140 ${y + spec.bodyHeight * 0.4} L${x + spec.bodyWidth * 0.65} ${y} L${x + spec.bodyWidth * 0.8} ${y + spec.bodyHeight * 0.42} L${x + spec.bodyWidth} ${y + spec.bodyHeight * 0.24} L${x + spec.bodyWidth * 0.84} ${y + spec.bodyHeight} L${x + spec.bodyWidth * 0.16} ${y + spec.bodyHeight}Z`}
        {...common}
      />
    );
  if (spec.shape === "hourglass")
    return (
      <path
        d={`M${x} ${y} Q140 ${y + spec.bodyHeight * 0.42} ${x + spec.bodyWidth * 0.38} ${y + spec.bodyHeight * 0.5} Q140 ${y + spec.bodyHeight * 0.58} ${x} ${y + spec.bodyHeight} L${x + spec.bodyWidth} ${y + spec.bodyHeight} Q140 ${y + spec.bodyHeight * 0.58} ${x + spec.bodyWidth * 0.62} ${y + spec.bodyHeight * 0.5} Q140 ${y + spec.bodyHeight * 0.42} ${x + spec.bodyWidth} ${y}Z`}
        {...common}
      />
    );
  if (spec.shape === "wisp")
    return (
      <path
        d={`M${x + spec.bodyWidth * 0.78} ${y} Q${x + spec.bodyWidth * 0.58} ${y + spec.bodyHeight * 0.28} ${x + spec.bodyWidth * 0.9} ${y + spec.bodyHeight * 0.43} Q${x + spec.bodyWidth * 1.08} ${y + spec.bodyHeight * 0.62} ${x + spec.bodyWidth * 0.63} ${y + spec.bodyHeight * 0.75} Q${x + spec.bodyWidth * 0.31} ${y + spec.bodyHeight * 0.82} ${x + spec.bodyWidth * 0.18} ${y + spec.bodyHeight} Q${x + spec.bodyWidth * 0.2} ${y + spec.bodyHeight * 0.7} ${x} ${y + spec.bodyHeight * 0.53} Q${x + spec.bodyWidth * 0.22} ${y + spec.bodyHeight * 0.39} ${x + spec.bodyWidth * 0.36} ${y + spec.bodyHeight * 0.12} Q${x + spec.bodyWidth * 0.57} ${y + spec.bodyHeight * 0.24} ${x + spec.bodyWidth * 0.78} ${y}Z`}
        {...common}
      />
    );
  return (
    <ellipse
      cx="140"
      cy="112"
      rx={spec.bodyWidth / 2}
      ry={spec.bodyHeight / 2}
      {...common}
    />
  );
}

function AuraPreview({ spec, moving }: { spec: BodySpec; moving: boolean }) {
  const particleCount = Math.max(4, Math.round(spec.auraDensity / 7));
  const radius = 62 + spec.auraRadius * 0.45;
  const duration = Math.max(1.2, 8 - spec.auraSpeed / 15);
  const auraAnimation =
    spec.auraMotion === "implode"
      ? { scale: [1.25, 0.42], opacity: [0, spec.glow, 0] }
      : spec.auraMotion === "explode"
        ? { scale: [0.35, 1.3], opacity: [0, spec.glow, 0] }
        : spec.auraMotion === "breathe"
          ? {
              scale: [0.92, 1.1, 0.92],
              opacity: [spec.glow * 0.55, spec.glow, spec.glow * 0.55],
            }
          : spec.auraMotion === "spiral"
            ? { rotate: [0, 360], scale: [1, 0.7, 1] }
            : spec.auraMotion === "drift"
              ? { x: [-6, 7, -4], y: [5, -6, 5] }
              : { rotate: [0, 360] };
  const particles = Array.from({ length: particleCount }, (_, index) => {
    const angle = (index / particleCount) * Math.PI * 2;
    const x = 140 + Math.cos(angle) * radius;
    const y = 112 + Math.sin(angle) * radius * 0.75;
    const color = index % 2 ? spec.auraColor : spec.auraSecondary;
    if (spec.auraStyle === "sparkle")
      return (
        <path
          key={index}
          d={`M${x} ${y - 5} L${x + 2} ${y - 2} L${x + 5} ${y} L${x + 2} ${y + 2} L${x} ${y + 5} L${x - 2} ${y + 2} L${x - 5} ${y} L${x - 2} ${y - 2}Z`}
          fill={color}
        />
      );
    if (spec.auraStyle === "embers")
      return (
        <path
          key={index}
          d={`M${x} ${y - 7} Q${x + 5} ${y} ${x} ${y + 6} Q${x - 5} ${y} ${x} ${y - 7}Z`}
          fill={color}
        />
      );
    if (spec.auraStyle === "static")
      return (
        <path
          key={index}
          d={`M${x - 4} ${y - 7} L${x + 2} ${y - 2} L${x - 2} ${y + 2} L${x + 4} ${y + 7}`}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
      );
    return (
      <circle key={index} cx={x} cy={y} r={1.8 + (index % 3)} fill={color} />
    );
  });

  return (
    <motion.g
      style={{ transformOrigin: "140px 112px" }}
      opacity={Math.max(0.08, spec.glow)}
      animate={moving ? auraAnimation : undefined}
      transition={{
        duration,
        repeat: Infinity,
        ease: spec.auraMotion === "orbit" ? "linear" : "easeInOut",
      }}
    >
      <ellipse
        cx="140"
        cy="112"
        rx={radius}
        ry={radius * 0.75}
        fill={spec.auraColor}
        opacity=".08"
      />
      {spec.auraStyle === "mist" && (
        <g opacity=".28">
          <ellipse cx="95" cy="91" rx="43" ry="23" fill={spec.auraColor} />
          <ellipse
            cx="184"
            cy="139"
            rx="51"
            ry="26"
            fill={spec.auraSecondary}
          />
          <ellipse cx="148" cy="54" rx="36" ry="19" fill={spec.auraColor} />
        </g>
      )}
      {spec.auraStyle === "fireworks" && (
        <g strokeLinecap="round" strokeWidth="2.4">
          {[0, 45, 90, 135].map((angle, index) => (
            <g
              key={angle}
              transform={`rotate(${angle} 140 112)`}
              stroke={index % 2 ? spec.auraSecondary : spec.auraColor}
            >
              <path d="M140 18 L140 43" />
              <path d="M140 181 L140 206" />
            </g>
          ))}
        </g>
      )}
      {spec.auraStyle === "5d" && (
        <g fill="none" strokeWidth="1.7">
          {Array.from({ length: spec.auraDimension }, (_, index) => (
            <ellipse
              key={index}
              cx="140"
              cy="112"
              rx={radius - index * 5}
              ry={25 + index * 6}
              transform={`rotate(${(index * 180) / Math.max(1, spec.auraDimension)} 140 112)`}
              stroke={index % 2 ? spec.auraColor : spec.auraSecondary}
              strokeDasharray={`${7 + index * 2} ${4 + index}`}
            />
          ))}
        </g>
      )}
      {spec.auraStyle === "prism" && (
        <g fill="none" strokeWidth="1.8">
          <path d="M140 12 L241 184 L39 184Z" stroke={spec.auraColor} />
          <path d="M140 212 L42 42 L238 42Z" stroke={spec.auraSecondary} />
          <rect
            x="72"
            y="44"
            width="136"
            height="136"
            transform="rotate(45 140 112)"
            stroke={spec.highlightColor}
          />
        </g>
      )}
      {spec.auraStyle === "ribbons" && (
        <g fill="none" strokeWidth="5" strokeLinecap="round">
          <path
            d="M31 112 C54 22 226 23 249 112 C226 202 54 201 31 112Z"
            stroke={spec.auraColor}
          />
          <path
            d="M140 8 C231 34 231 190 140 216 C49 190 49 34 140 8Z"
            stroke={spec.auraSecondary}
          />
        </g>
      )}
      {spec.auraStyle === "void" && (
        <g>
          <circle
            cx="140"
            cy="112"
            r={radius * 0.7}
            fill={spec.secondaryColor}
            opacity=".86"
          />
          <circle
            cx="140"
            cy="112"
            r={radius * 0.72}
            fill="none"
            stroke={spec.auraSecondary}
            strokeWidth="2"
            strokeDasharray="2 10"
          />
        </g>
      )}
      {particles}
    </motion.g>
  );
}

export function PetBodyRenderer({
  spec,
  className = "",
  animate = true,
  showForgeAura = false,
}: {
  spec: BodySpec;
  className?: string;
  animate?: boolean;
  showForgeAura?: boolean;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reducedMotion = useReducedMotion();
  const moving = animate && !reducedMotion;
  const patternId = `body-pattern-${rawId}`;
  const glowId = `body-glow-${rawId}`;
  const grainId = `body-grain-${rawId}`;
  const fill =
    spec.pattern === "solid" ? spec.primaryColor : `url(#${patternId})`;
  const leftEye = 140 - spec.eyeSpacing / 2;
  const rightEye = 140 + spec.eyeSpacing / 2;
  const eyeHeight =
    spec.expression === "sleepy"
      ? Math.max(2.4, spec.eyeSize * 0.22)
      : spec.eyeSize;
  const textureSize = 8 + spec.textureScale / 5;
  const wingPurposeScale =
    spec.wingPurpose === "attack"
      ? 1.12
      : spec.wingPurpose === "decorative"
        ? 0.62
        : spec.wingPurpose === "defend"
          ? 0.82
          : spec.wingPurpose === "attract"
            ? 1.04
            : 1;
  const wingReach = 34 * spec.wingSpread * wingPurposeScale;
  const wingRootX = 140 - spec.bodyWidth * 0.42;
  const wingPath =
    spec.wingStyle === "blade"
      ? `M${wingRootX} 103 L${wingRootX - wingReach} ${spec.wingPurpose === "attack" ? 60 : 76} L${wingRootX - wingReach * 0.42} 133 L${wingRootX + 8} 128Z`
      : spec.wingStyle === "moth"
        ? `M${wingRootX} 102 C${wingRootX - wingReach * 0.82} 57 ${wingRootX - wingReach} 87 ${wingRootX - wingReach * 0.55} 113 C${wingRootX - wingReach * 0.95} 145 ${wingRootX - wingReach * 0.27} 151 ${wingRootX + 8} 128Z`
        : spec.wingStyle === "veil"
          ? `M${wingRootX} 102 Q${wingRootX - wingReach} 77 ${wingRootX - wingReach * 0.62} 148 Q${wingRootX - wingReach * 0.15} 166 ${wingRootX + 8} 128Z`
          : `M${wingRootX} 102 Q${wingRootX - wingReach} 73 ${wingRootX - wingReach * 0.65} 137 Q${wingRootX - 10} 145 ${wingRootX + 8} 128Z`;
  const emotionalBob = Math.max(-4, Math.min(9, spec.emotionIndex / 12));

  return (
    <motion.svg
      viewBox="0 0 280 250"
      className={className}
      role="img"
      aria-label={`${spec.name}, ${spec.shape} body`}
    >
      <defs>
        {spec.pattern === "gradient" && (
          <linearGradient id={patternId} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor={spec.highlightColor} />
            <stop offset="42%" stopColor={spec.primaryColor} />
            <stop offset="100%" stopColor={spec.secondaryColor} />
          </linearGradient>
        )}
        {spec.pattern === "velvet" && (
          <radialGradient id={patternId} cx="38%" cy="28%">
            <stop stopColor={spec.highlightColor} />
            <stop offset=".28" stopColor={spec.primaryColor} />
            <stop offset=".74" stopColor={spec.primaryColor} />
            <stop offset="1" stopColor={spec.secondaryColor} />
          </radialGradient>
        )}
        {spec.pattern === "pearl" && (
          <radialGradient id={patternId} cx="32%" cy="24%">
            <stop stopColor="#fff" />
            <stop offset=".17" stopColor={spec.highlightColor} />
            <stop offset=".53" stopColor={spec.primaryColor} />
            <stop offset=".82" stopColor={spec.highlightColor} />
            <stop offset="1" stopColor={spec.secondaryColor} />
          </radialGradient>
        )}
        {spec.pattern === "glass" && (
          <linearGradient id={patternId} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff" stopOpacity=".85" />
            <stop
              offset=".2"
              stopColor={spec.highlightColor}
              stopOpacity=".32"
            />
            <stop
              offset=".48"
              stopColor={spec.primaryColor}
              stopOpacity=".72"
            />
            <stop offset=".76" stopColor="#fff" stopOpacity=".18" />
            <stop
              offset="1"
              stopColor={spec.secondaryColor}
              stopOpacity=".82"
            />
          </linearGradient>
        )}
        {spec.pattern === "chrome" && (
          <linearGradient id={patternId} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f8ffff" />
            <stop offset=".18" stopColor={spec.primaryColor} />
            <stop offset=".37" stopColor={spec.secondaryColor} />
            <stop offset=".52" stopColor="#fff" />
            <stop offset=".66" stopColor={spec.highlightColor} />
            <stop offset=".83" stopColor={spec.secondaryColor} />
            <stop offset="1" stopColor={spec.primaryColor} />
          </linearGradient>
        )}
        {(spec.pattern === "striped" || spec.pattern === "stripes") && (
          <pattern
            id={patternId}
            width={textureSize}
            height={textureSize}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(24)"
          >
            <rect
              width={textureSize}
              height={textureSize}
              fill={spec.primaryColor}
            />
            <rect
              width={textureSize * 0.35}
              height={textureSize}
              fill={spec.highlightColor}
              opacity=".8"
            />
          </pattern>
        )}
        {(spec.pattern === "spotted" || spec.pattern === "spots") && (
          <pattern
            id={patternId}
            width={textureSize}
            height={textureSize}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={textureSize}
              height={textureSize}
              fill={spec.primaryColor}
            />
            <circle
              cx={textureSize * 0.3}
              cy={textureSize * 0.34}
              r={textureSize * 0.18}
              fill={spec.highlightColor}
            />
            <circle
              cx={textureSize * 0.82}
              cy={textureSize * 0.8}
              r={textureSize * 0.11}
              fill={spec.secondaryColor}
            />
          </pattern>
        )}
        {spec.pattern === "scales" && (
          <pattern
            id={patternId}
            width={textureSize}
            height={textureSize * 0.68}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={textureSize}
              height={textureSize}
              fill={spec.primaryColor}
            />
            <path
              d={`M0 0 Q${textureSize * 0.25} ${textureSize * 0.55} ${textureSize * 0.5} 0 Q${textureSize * 0.75} ${textureSize * 0.55} ${textureSize} 0`}
              fill="none"
              stroke={spec.highlightColor}
              strokeWidth={1 + spec.textureDepth / 50}
            />
          </pattern>
        )}
        {spec.pattern === "moss" && (
          <pattern
            id={patternId}
            width={textureSize}
            height={textureSize}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={textureSize}
              height={textureSize}
              fill={spec.primaryColor}
            />
            <circle
              cx={textureSize * 0.25}
              cy={textureSize * 0.55}
              r={textureSize * 0.24}
              fill={spec.highlightColor}
              opacity=".65"
            />
            <circle
              cx={textureSize * 0.72}
              cy={textureSize * 0.28}
              r={textureSize * 0.17}
              fill={spec.secondaryColor}
              opacity=".7"
            />
          </pattern>
        )}
        {(spec.pattern === "stone" || spec.pattern === "ink") && (
          <pattern
            id={patternId}
            width="280"
            height="250"
            patternUnits="userSpaceOnUse"
          >
            <rect width="280" height="250" fill={spec.primaryColor} />
            <rect
              width="280"
              height="250"
              fill={
                spec.pattern === "ink"
                  ? spec.secondaryColor
                  : spec.highlightColor
              }
              opacity={spec.textureDepth / 220}
              filter={`url(#${grainId})`}
            />
          </pattern>
        )}
        <filter id={grainId}>
          <feTurbulence
            type={spec.pattern === "ink" ? "fractalNoise" : "turbulence"}
            baseFrequency={0.008 + spec.textureRoughness / 620}
            numOctaves="3"
            seed="11"
          />
          <feColorMatrix type="saturate" values="0" />
          <feBlend
            in="SourceGraphic"
            mode={spec.pattern === "ink" ? "multiply" : "overlay"}
          />
        </filter>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={2 + spec.glow * 10} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {showForgeAura && <AuraPreview spec={spec} moving={moving} />}
      {!showForgeAura && (
        <motion.ellipse
          cx="140"
          cy="120"
          rx={72 + spec.glow * 28}
          ry={69 + spec.glow * 25}
          fill={spec.primaryColor}
          opacity={0.06 + spec.glow * 0.13}
          animate={
            moving
              ? { scale: [0.96, 1.05, 0.96], opacity: [0.05, 0.18, 0.05] }
              : undefined
          }
          transition={{ duration: 3 / spec.animationSpeed, repeat: Infinity }}
        />
      )}

      <motion.g
        style={{ transformOrigin: "140px 112px" }}
        animate={
          moving
            ? {
                y: [0, -(spec.bob + emotionalBob), 0],
                rotate: [
                  spec.tilt - 1 - spec.emotionIndex / 100,
                  spec.tilt + 1 + spec.emotionIndex / 100,
                  spec.tilt - 1 - spec.emotionIndex / 100,
                ],
                scaleX: [
                  spec.bodyScale,
                  spec.bodyScale * (1 + spec.breathe),
                  spec.bodyScale,
                ],
                scaleY: [
                  spec.bodyScale,
                  spec.bodyScale * (1 - spec.breathe * 0.45),
                  spec.bodyScale,
                ],
              }
            : { rotate: spec.tilt, scale: spec.bodyScale }
        }
        transition={{
          duration: 2.8 / spec.animationSpeed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        filter={spec.glow > 0 ? `url(#${glowId})` : undefined}
      >
        {spec.features.includes("wings") && (
          <g
            fill={
              spec.wingPurpose === "decorative"
                ? spec.highlightColor
                : spec.primaryColor
            }
            stroke={
              spec.wingPurpose === "attack"
                ? spec.highlightColor
                : spec.secondaryColor
            }
            strokeWidth={
              spec.wingPurpose === "attack"
                ? spec.outlineWidth * 1.3
                : spec.outlineWidth
            }
            opacity={spec.wingPurpose === "defend" ? 0.82 : 0.9}
          >
            <path d={wingPath} />
            <path d={wingPath} transform="translate(280 0) scale(-1 1)" />
            {spec.wingPurpose === "attract" && (
              <g fill={spec.highlightColor} stroke="none">
                <circle cx={wingRootX - wingReach * 0.48} cy="106" r="5" />
                <circle
                  cx={280 - wingRootX + wingReach * 0.48}
                  cy="106"
                  r="5"
                />
              </g>
            )}
          </g>
        )}
        {spec.features.includes("tailFlame") && (
          <motion.path
            d="M 140 161 C 116 190 133 218 140 226 C 147 218 164 190 140 161 Z"
            fill={spec.highlightColor}
            stroke={spec.secondaryColor}
            strokeWidth={spec.outlineWidth}
            animate={moving ? { scaleY: [0.82, 1.14, 0.82] } : undefined}
            transition={{
              duration: 0.9 / spec.animationSpeed,
              repeat: Infinity,
            }}
          />
        )}
        <BodySilhouette spec={spec} fill={fill} />
        {spec.features.includes("horns") && (
          <g
            fill="none"
            stroke={spec.highlightColor}
            strokeWidth={spec.outlineWidth}
            strokeLinecap="round"
          >
            <path
              d={`M 110 76 Q 93 ${70 - spec.hornLength * 0.45} 101 ${70 - spec.hornLength}`}
            />
            <path
              d={`M 170 76 Q 187 ${70 - spec.hornLength * 0.45} 179 ${70 - spec.hornLength}`}
            />
          </g>
        )}
        {spec.features.includes("crown") && (
          <path
            d="M 105 70 L 113 46 L 126 66 L 140 38 L 154 66 L 167 46 L 175 70"
            fill="none"
            stroke={spec.highlightColor}
            strokeWidth={spec.outlineWidth}
            strokeLinejoin="round"
          />
        )}
        <g>
          <ellipse
            cx={leftEye}
            cy={spec.eyeHeight}
            rx={spec.eyeSize}
            ry={eyeHeight}
            fill="#fffdf4"
            stroke={spec.secondaryColor}
            strokeWidth={Math.max(1.5, spec.outlineWidth * 0.55)}
          />
          <ellipse
            cx={rightEye}
            cy={spec.eyeHeight}
            rx={spec.eyeSize}
            ry={eyeHeight}
            fill="#fffdf4"
            stroke={spec.secondaryColor}
            strokeWidth={Math.max(1.5, spec.outlineWidth * 0.55)}
          />
          <circle
            cx={leftEye + spec.gazeX}
            cy={spec.eyeHeight + spec.gazeY}
            r={spec.pupilSize}
            fill={spec.secondaryColor}
          />
          <circle
            cx={rightEye + spec.gazeX}
            cy={spec.eyeHeight + spec.gazeY}
            r={spec.pupilSize}
            fill={spec.secondaryColor}
          />
        </g>
        {spec.features.includes("thirdEye") && (
          <g>
            <ellipse
              cx="140"
              cy="76"
              rx={11}
              ry={7}
              fill={spec.highlightColor}
              stroke={spec.secondaryColor}
              strokeWidth={spec.outlineWidth * 0.7}
            />
            <circle cx="140" cy="76" r="3.2" fill={spec.secondaryColor} />
          </g>
        )}
        <motion.path
          d={mouthPath(spec)}
          fill="none"
          stroke={spec.secondaryColor}
          strokeWidth={spec.outlineWidth * 0.75}
          strokeLinecap="round"
          transition={{ duration: 0.25 }}
        />
      </motion.g>
    </motion.svg>
  );
}
