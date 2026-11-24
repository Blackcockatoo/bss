import type { DerivedTraits } from "@/lib/genome";
import type { EvolutionState } from "@/evolution/types";
import { getCumulativeEvolutionUpgrade } from "@/evolution/stageUpgrades";
import { EvolutionStageAdornments } from "../evolution/EvolutionStageAdornments";
import { resolveStagePalette } from "../evolution/stagePalette";
import { EyeEmotionFilters } from "./EyeFilters";
import { EyeRenderer, type EyeState } from "./EyeSystem";

export type FormKey =
  | "radiant"
  | "meditation"
  | "sage"
  | "vigilant"
  | "celestial"
  | "wild";
type Form = {
  name: string;
  baseColor: string;
  primaryGold: string;
  secondaryGold: string;
  tealAccent: string;
  eyeColor: string;
  glowColor: string;
  description: string;
};

export const AURALIA_FORMS: Record<FormKey, Form> = {
    radiant: {
      name: "Radiant Guardian",
      baseColor: "#1E3A8A",
      primaryGold: "#FBBF24",
      secondaryGold: "#FDE68A",
      tealAccent: "#38BDF8",
      eyeColor: "#FBBF24",
      glowColor: "rgba(251, 191, 36, 0.52)",
      description: "Warm cobalt resolve — solar gold meets the deep sky",
    },
    meditation: {
      name: "Meditation Cocoon",
      baseColor: "#0A1628",
      primaryGold: "#2DD4BF",
      secondaryGold: "#5EEAD4",
      tealAccent: "#0F766E",
      eyeColor: "#2DD4BF",
      glowColor: "rgba(45, 212, 191, 0.48)",
      description: "Oceanic stillness — the deepest calm before the wave",
    },
    sage: {
      name: "Sage Luminary",
      baseColor: "#12172E",
      primaryGold: "#EAB308",
      secondaryGold: "#FDE047",
      tealAccent: "#34D399",
      eyeColor: "#FDE047",
      glowColor: "rgba(234, 179, 8, 0.58)",
      description: "Ancient light — hepta-crown blazing at full resonance",
    },
    vigilant: {
      name: "Vigilant Sentinel",
      baseColor: "#1C1033",
      primaryGold: "#F97316",
      secondaryGold: "#FB923C",
      tealAccent: "#22D3EE",
      eyeColor: "#FB923C",
      glowColor: "rgba(249, 115, 22, 0.58)",
      description: "Burning indigo will — neon fire cuts through every shadow",
    },
    celestial: {
      name: "Celestial Voyager",
      baseColor: "#05081A",
      primaryGold: "#DDD6FE",
      secondaryGold: "#A78BFA",
      tealAccent: "#7C3AED",
      eyeColor: "#EDE9FE",
      glowColor: "rgba(167, 139, 250, 0.62)",
      description: "Cosmic void-drift — stardust, lavender, and the infinite",
    },
    wild: {
      name: "Wild Verdant",
      baseColor: "#14532D",
      primaryGold: "#84CC16",
      secondaryGold: "#A3E635",
      tealAccent: "#4ADE80",
      eyeColor: "#A3E635",
      glowColor: "rgba(132, 204, 22, 0.55)",
      description: "Primal fractal bloom — electric growth, untamed and free",
    },
  };

export function resolveAuraliaForm({
  energy, health, bond, dreamCount, curiosity, activatedCount,
}: { energy: number; health: number; bond: number; dreamCount: number; curiosity: number; activatedCount: number }): FormKey {
    if (energy < 30 && health < 50) return "meditation";
    if (bond > 80 && dreamCount > 3) return "celestial";
    if (energy > 80 && curiosity > 70 && activatedCount >= 5)
      return "wild";
    if (energy > 70 && curiosity > 60) return "vigilant";
    if (bond > 60 && curiosity > 50) return "sage";
    return "radiant";
}

export function AuraliaCreatureDefs({ activeForm, red60, animate = true }: { activeForm: FormKey; red60: number; animate?: boolean }) {
  const currentForm = AURALIA_FORMS[activeForm];
  return (
    <>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="strongGlow">
        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id="goldGlow">
        <stop
          offset="0%"
          stopColor={currentForm.primaryGold}
          stopOpacity="0.8"
        />
        <stop
          offset="100%"
          stopColor={currentForm.primaryGold}
          stopOpacity="0"
        />
      </radialGradient>
      <linearGradient
        id="red60grad"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop
          offset="0%"
          stopColor="#FF6B35"
          stopOpacity={red60 / 100}
        />
        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
      </linearGradient>

      {/* Eye emotion filters and effects */}
      <EyeEmotionFilters includeGlow={false} animate={animate} />
    </>
  );
}

interface AuraliaCreatureProps {
  activeForm: FormKey;
  evolutionState: EvolutionState;
  traits: DerivedTraits | null;
  eyeState: EyeState;
  eyePos: {x: number; y: number};
  red60: number;
  blue60: number;
  black60: number;
  stageEmphasis?: number;
  transformationMode?: "normal" | "squished" | "stretched" | "bouncy" | "grumpy";
  orbDeformation?: {x: number; y: number; intensity: number};
  aiMode?: string;
  isBeingSquished?: boolean;
  annoyanceLevel?: number;
  live?: boolean;
}

export function AuraliaCreature({
  activeForm, evolutionState, traits, eyeState, eyePos, red60, blue60, black60,
  stageEmphasis = 0, transformationMode = "normal", orbDeformation = {x: 0, y: 0, intensity: 0},
  aiMode, isBeingSquished = false, annoyanceLevel = 0, live = false,
}: AuraliaCreatureProps) {
  const currentForm = AURALIA_FORMS[activeForm];
  const stageUpgrade = getCumulativeEvolutionUpgrade(evolutionState);
  const stagePalette = resolveStagePalette(evolutionState, traits);
  const STAGE_ANCHOR = {
    headX: 200,
    headY: 145,
    headRx: 30,
    headRy: 35,
    bodyX: 200,
    bodyY: 210,
    bodyRx: 40,
    bodyRy: 60,
  } as const;
  const stageGrowth = `translate(200 185) scale(${(
    stageUpgrade.bodyScale +
    stageEmphasis * 0.06
  ).toFixed(4)}) translate(-200 -185)`;
  return (
    <>
      {/* Evolution growth wraps the orb and its stage anatomy:
          wings behind, orb, then horns/crown/third eye/sigil. */}
      <g data-testid="auralia-evolution-stage" transform={stageGrowth}>
      {stageUpgrade.glowBonus > 0 && (
        <circle
          cx="200"
          cy="185"
          r={92}
          fill={stagePalette.glowColor}
          opacity={
            stageUpgrade.glowBonus * 0.55 + stageEmphasis * 0.25
          }
          filter="url(#glow)"
          pointerEvents="none"
        />
      )}
      <EvolutionStageAdornments
        {...STAGE_ANCHOR}
        state={evolutionState}
        layer="behind"
        color={stagePalette.color}
        accentColor={stagePalette.accentColor}
        underlayColor="#05081A"
        emphasis={stageEmphasis}
        strokeWidth={2.6}
      />
      <g
        className={`
        ${aiMode === "idle" ? "ai-idle" : ""}
        ${aiMode === "playing" ? "ai-playing" : ""}
        ${aiMode === "dreaming" ? "ai-dreaming" : ""}
        ${aiMode === "observing" ? "ai-observing" : ""}
        ${aiMode === "focusing" ? "ai-focusing" : ""}
      `}
        style={{
          transform: `translate(${orbDeformation.x}px, ${orbDeformation.y}px)`,
          transition: isBeingSquished
            ? "none"
            : "transform 0.3s ease-out",
        }}
      >
        <ellipse
          cx="200"
          cy="210"
          rx={
            transformationMode === "squished"
              ? 50
              : transformationMode === "stretched"
                ? 30
                : transformationMode === "grumpy"
                  ? 35
                  : 40
          }
          ry={
            transformationMode === "squished"
              ? 50
              : transformationMode === "stretched"
                ? 70
                : transformationMode === "grumpy"
                  ? 55
                  : 60
          }
          fill={
            transformationMode === "grumpy"
              ? "#8B5A3C"
              : currentForm.baseColor
          }
          opacity={transformationMode === "grumpy" ? 0.95 : 0.9}
          className={live ? "breathe-anim" : undefined}
          style={{
            transformOrigin: "200px 210px",
            transform: `scale(${1 - orbDeformation.intensity * 0.1})`,
            transition: "all 0.2s ease-out",
          }}
        />
        <ellipse
          cx="200"
          cy="145"
          rx={
            transformationMode === "squished"
              ? 35
              : transformationMode === "stretched"
                ? 25
                : transformationMode === "grumpy"
                  ? 28
                  : 30
          }
          ry={
            transformationMode === "squished"
              ? 30
              : transformationMode === "stretched"
                ? 40
                : transformationMode === "grumpy"
                  ? 32
                  : 35
          }
          fill={
            transformationMode === "grumpy"
              ? "#8B5A3C"
              : currentForm.baseColor
          }
          opacity={transformationMode === "grumpy" ? 0.95 : 0.9}
          className={live ? "breathe-anim" : undefined}
          style={{
            transformOrigin: "200px 145px",
            transform: `scale(${1 - orbDeformation.intensity * 0.15})`,
            transition: "all 0.2s ease-out",
          }}
        />
      </g>

      <EvolutionStageAdornments
        {...STAGE_ANCHOR}
        state={evolutionState}
        layer="front"
        color={stagePalette.color}
        accentColor={stagePalette.accentColor}
        underlayColor="#05081A"
        emphasis={stageEmphasis}
        strokeWidth={2.6}
      />
      </g>

      <rect
        x={200 - red60 / 4}
        y={150}
        width={red60 / 2}
        height={100}
        fill="url(#red60grad)"
        opacity={red60 / 150}
        filter="url(#glow)"
      />
      <path
        d={`M 200 150 C 200 100, ${200 + blue60 / 2} 100, ${200 + blue60 / 2} 145`}
        fill="none"
        stroke={currentForm.tealAccent}
        strokeWidth="1"
        opacity={blue60 / 150}
        filter="url(#glow)"
      />
      <path
        d={`M 200 150 C 200 100, ${200 - blue60 / 2} 100, ${200 - blue60 / 2} 145`}
        fill="none"
        stroke={currentForm.tealAccent}
        strokeWidth="1"
        opacity={blue60 / 150}
        filter="url(#glow)"
      />

      {activeForm === "sage" && (
        <g transform="translate(200, 145)">
          <path
            d="M 0 -50 L 20 -20 L 50 0 L 20 20 L 0 50 L -20 20 L -50 0 L -20 -20 Z"
            fill="none"
            stroke={currentForm.primaryGold}
            strokeWidth="1"
            filter="url(#strongGlow)"
            opacity="0.7"
          />
        </g>
      )}
      {activeForm === "vigilant" && (
        <g transform="translate(200, 145)">
          <circle
            r="60"
            fill="none"
            stroke={currentForm.tealAccent}
            strokeWidth="0.5"
            strokeDasharray="5,5"
            opacity="0.4"
          />
        </g>
      )}
      {activeForm === "celestial" && (
        <g transform="translate(200, 145)">
          <circle
            r="80"
            fill="none"
            stroke={currentForm.primaryGold}
            strokeWidth="0.5"
            opacity="0.4"
          >
            {live && (<animate
              attributeName="r"
              values="80;85;80"
              dur="4s"
              repeatCount="indefinite"
            />)}
          </circle>
          <circle
            r="65"
            fill="none"
            stroke={currentForm.tealAccent}
            strokeWidth="0.5"
            opacity="0.3"
          >
            {live && (<animate
              attributeName="r"
              values="65;70;65"
              dur="5s"
              repeatCount="indefinite"
            />)}
          </circle>
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 0 0)`}>
              <circle
                cx="0"
                cy="-75"
                r="2"
                fill={currentForm.primaryGold}
                opacity="0.8"
                filter="url(#strongGlow)"
              >
                {live && (<animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${angle / 60}s`}
                />)}
              </circle>
              <path
                d="M 0 -75 L 2 -80 L -2 -80 Z"
                fill={currentForm.tealAccent}
                opacity="0.6"
              >
                {live && (<animate
                  attributeName="opacity"
                  values="0.3;0.8;0.3"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${angle / 60}s`}
                />)}
              </path>
            </g>
          ))}
        </g>
      )}
      {activeForm === "wild" && (
        <g transform="translate(200, 145)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <g key={angle} transform={`rotate(${angle} 0 0)`}>
              <path
                d={`M 0 -55 Q ${5 + i * 2} -${65 + i * 3} ${8 + i * 3} -${75 + i * 5}`}
                stroke={
                  i % 2 === 0
                    ? currentForm.primaryGold
                    : currentForm.secondaryGold
                }
                strokeWidth="2"
                fill="none"
                opacity="0.7"
                filter="url(#glow)"
              >
                {live && (<animate
                  attributeName="d"
                  values={`M 0 -55 Q ${5 + i * 2} -${65 + i * 3} ${8 + i * 3} -${75 + i * 5};M 0 -55 Q ${7 + i * 2} -${68 + i * 3} ${10 + i * 3} -${78 + i * 5};M 0 -55 Q ${5 + i * 2} -${65 + i * 3} ${8 + i * 3} -${75 + i * 5}`}
                  dur={`${2 + i * 0.3}s`}
                  repeatCount="indefinite"
                />)}
              </path>
              <circle
                cx="0"
                cy={`-${75 + i * 5}`}
                r="3"
                fill={currentForm.tealAccent}
                opacity="0.6"
              >
                {live && (<animate
                  attributeName="r"
                  values="3;5;3"
                  dur={`${2 + i * 0.3}s`}
                  repeatCount="indefinite"
                />)}
              </circle>
            </g>
          ))}
        </g>
      )}
      {black60 > 70 && (
        <circle
          cx="200"
          cy="120"
          r="5"
          fill={currentForm.primaryGold}
          filter="url(#strongGlow)"
          opacity={(black60 - 70) / 30}
        />
      )}

      {/* Enhanced expressive eyes */}
      {(!live || activeForm !== "meditation") ? (
        <EyeRenderer
          eyeState={eyeState}
          eyePos={eyePos}
          leftEyeCenter={{ x: 180, y: 145 }}
          rightEyeCenter={{ x: 220, y: 145 }}
          annoyanceLevel={annoyanceLevel}
          animate={live}
        />
      ) : (
        <>
          <path
            d="M 175 210 Q 182 215 190 210"
            stroke={currentForm.primaryGold}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M 210 210 Q 217 215 225 210"
            stroke={currentForm.primaryGold}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </>
      )}
    </>
  );
}

import { MOSS_BLACK_STRAND as BLACK, MOSS_BLUE_STRAND as BLUE, MOSS_RED_STRAND as RED } from "@/lib/moss60/strandSequences";
const toDigits = (strand: string) => Array.from(strand, digit => Number(digit));
export const auraliaStrandMarkings = () => {
  const red = RED,
    black = BLACK,
    blue = BLUE;
  const r = toDigits(red),
    k = toDigits(black),
    b = toDigits(blue);

  const pulse = r.map(
    (rv, i) => (rv ^ k[(i * 7) % 60] ^ b[(i * 13) % 60]) % 10,
  );
  const ring = Array.from({ length: 60 }, (_, i) => (r[i] + k[i] + b[i]) % 10);

  return { pulse, ring };
};

export function resolveAuraliaMarkings({energy, health, curiosity, bond}: {
  energy: number; health: number; curiosity: number; bond: number;
}): {
    red60: number;
    blue60: number;
    black60: number;
} {
    const field = auraliaStrandMarkings();
    const pulseSum = field.pulse.slice(0, 20).reduce((a, b) => a + b, 0);
    const ringSum = field.ring.slice(0, 20).reduce((a, b) => a + b, 0);
    const red60 = Math.min(
      100,
      (pulseSum * 1.2 + energy * 0.7 + (100 - health) * 0.3) % 100,
    );
    const blue60 = Math.min(
      100,
      (ringSum * 1.1 + curiosity * 0.6 + bond * 0.5) % 100,
    );
    const black60 = Math.min(
      100,
      ((pulseSum + ringSum) * 0.8 + energy * 0.4 + bond * 0.6) % 100,
    );
    return { red60, blue60, black60 };
}
