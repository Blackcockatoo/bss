import { memo, type ReactNode } from "react";
import { AddonRenderer, AddonSVGDefs } from "@/components/addons/AddonRenderer";
import { BodyForgeAddonLayer } from "@/components/addons/BodyForgeAddonOverlay";
import { PetBodyRenderer, type BodySpec } from "@/components/body-forge/PetBodyRenderer";
import { AURALIA_FORMS, AuraliaCreature, AuraliaCreatureDefs } from "@/components/auralia/AuraliaCreature";
import type { EyeState } from "@/components/auralia/EyeSystem";
import { GeometryPortraitSprite } from "@/components/GeometryAvatarRenderer";
import { WardrobeCosmeticLayer, resolveAuraliaCosmeticAnchor, resolveBodyForgeCosmeticAnchor } from "@/components/wardrobe/WardrobeCosmeticLayer";
import { NEUTRAL_PERFORMANCE, resolveBodyPerformance } from "@/pet/performance";
import { DEFAULT_VITALS } from "@metapet/core/vitals";
import type { PetForm } from "@/lib/petForms";
import type { CreatureSnapshot } from "@/lib/expressions/snapshot";
import type { Expression, ExpressionFrame } from "@/lib/expressions/studio";

export const FORM_LABELS: Record<PetForm, string> = { auralia: "Auralia", evolved: "Evolved", geometry: "Geometry" };
export const BACKGROUNDS = {
  transparent: "Transparent", midnight: "Midnight", plum: "Deep plum",
  lagoon: "Lagoon", classroom: "Classroom", stars: "Star field", lattice: "Lattice", cavern: "Cavern",
} as const;
export type Background = keyof typeof BACKGROUNDS;
export const PROPS = { none: "None", platform: "Platform", moon: "Moon", crystal: "Crystal" } as const;
export type Prop = keyof typeof PROPS;
export type Scene = { background: Background; prop: Prop; propX: number; light: number };
export const DEFAULT_SCENE: Scene = { background: "transparent", prop: "none", propX: 0, light: 0 };
export const ASPECTS = { square: [512, 512], portrait: [512, 640], landscape: [640, 512] } as const;
export type Aspect = keyof typeof ASPECTS;
export type Caption = {
  top: string; bottom: string; bubble: string; style: "speech" | "thought" | "narration";
  align: "left" | "center" | "right"; size: number; outline: boolean;
};
export const DEFAULT_CAPTION: Caption = {
  top: "", bottom: "", bubble: "", style: "speech", align: "center", size: 32, outline: true,
};

function AuraliaExpression({ pet, frame, expression }: AdapterProps) {
  const style = AURALIA_FORMS[pet.auralia.form];
  const blinking = frame.lid < .15;
  const eyeState: EyeState = {
    emotion: blinking ? "blinking" : frame.lid > 1.04 ? "surprised" :
      frame.lid < .49 ? "sleepy" : expression.id === "confused" ? "confused" : "normal",
    shape: expression.effect === "hearts" && frame.aura > .5 ? "heart" :
      expression.id === "confused" ? "spiral" :
      frame.lid > 1.08 ? "wide" : frame.lid < .65 ? "half-lidded" : "round",
    pupilSize: 7 + frame.mouth, irisSize: 14, irisColor: style.eyeColor,
    glowIntensity: .79 + frame.aura * .2, blinkSpeed: 0, trackingSpeed: 0,
    verticalScale: frame.lid, sparkles: false, jitter: false, wink: false,
    offset: { x: 0, y: 0 },
  };
  const { form, markings, energy, bond, curiosity, health } = pet.auralia;
  return (
    <svg x="31" y="24" width="450" height="450" viewBox="0 0 400 400" overflow="visible">
      <defs><AuraliaCreatureDefs activeForm={form} red60={markings.red60} animate={false} /><AddonSVGDefs /></defs>
      <AuraliaCreature activeForm={form} evolutionState={pet.evolution} traits={pet.traits}
        eyeState={eyeState} eyePos={{ x: frame.gazeX * 7, y: frame.gazeY * 5 }} {...markings} />
      {(["behind", "front"] as const).map(layer => (
        <WardrobeCosmeticLayer key={layer} layer={layer} items={pet.cosmetics}
          resolveAnchor={resolveAuraliaCosmeticAnchor} reduceMotion bodyRadius={72} />
      ))}
      {pet.addons.map(addon => (
        <AddonRenderer key={addon.id} addon={addon} petSize={80} petPosition={{ x: 200, y: 210 }}
          animationPhase={0} mood={health} energy={energy} curiosity={curiosity} bond={bond}
          {...markings} positionOverride={pet.positions?.[addon.id]} reduceMotion />
      ))}
    </svg>
  );
}

const EvolvedWardrobe = memo(function EvolvedWardrobe({
  pet, layer,
}: { pet: CreatureSnapshot; layer: "behind" | "front" }) {
  return (
    <>
      {layer === "behind" && <defs><AddonSVGDefs /></defs>}
      <WardrobeCosmeticLayer items={pet.cosmetics} layer={layer} reduceMotion
        resolveAnchor={anchor => resolveBodyForgeCosmeticAnchor(pet.body, anchor)}
        bodyRadius={Math.max(pet.body.bodyWidth, pet.body.bodyHeight) / 2} />
      <BodyForgeAddonLayer spec={pet.body} addons={pet.addons} reduceMotion includeDefs={false}
        positionOverrides={pet.positions} layer={layer === "behind" ? "behind-body" : "front"} />
    </>
  );
});

const restingBody = resolveBodyPerformance({
  vitals: DEFAULT_VITALS, personality: null, essence: 0, anomalyActive: false, reducedMotion: true,
});

function EvolvedExpression({ pet, frame }: AdapterProps) {
  const performance = {
    ...NEUTRAL_PERFORMANCE,
    eyelidOpen: frame.lid, gazeX: frame.gazeX, gazeY: frame.gazeY,
    pupilScale: .9 + frame.lid * .15, wingSpread: .98 + frame.aura * .22,
    wingFold: (1 - Math.min(1, frame.lid)) * .18, headTilt: frame.angle * .33,
    featureIntensity: frame.aura, auraScale: 1 + frame.aura * .14,
  };
  const spec: BodySpec = { ...pet.body, name: "Evolved", expression: "neutral" };
  return (
    <svg x="71" y="84" width="370" height="320" viewBox="0 0 280 250" overflow="visible">
      <PetBodyRenderer spec={spec} animate={false} performance={performance}
        living={{ ...restingBody, mouthCurve: frame.mouth }} evolutionMark={pet.mark}
        addonsBehind={<EvolvedWardrobe pet={pet} layer="behind" />}
        addonsFront={<EvolvedWardrobe pet={pet} layer="front" />} />
    </svg>
  );
}

const GeometryCore = memo(function GeometryCore({ pet }: { pet: CreatureSnapshot }) {
  return <GeometryPortraitSprite strands={pet.strands} traits={pet.traits} evolutionState={pet.evolution} />;
});

function GeometryExpression({ pet, frame, expression }: AdapterProps) {
  const resonance = expression.effect === "orbit" ? Math.sin(frame.phase * Math.PI * 2) * frame.aura * 19 : frame.gazeX * -13;
  return (
    <svg x="58" y="51" width="396" height="396" viewBox="0 0 400 400" overflow="visible">
      <g transform={`rotate(${resonance} 200 200)`}><GeometryCore pet={pet} /></g>
    </svg>
  );
}

type AdapterProps = { pet: CreatureSnapshot; frame: ExpressionFrame; expression: Expression };
const adapters = { auralia: AuraliaExpression, evolved: EvolvedExpression, geometry: GeometryExpression };

function SceneBackground({ scene, width, height }: { scene: Scene; width: number; height: number }) {
  const fills: Partial<Record<Background, string>> = {
    midnight: "#0e1931", plum: "#2c1437", lagoon: "#10333e", classroom: "#173d38",
    stars: "#0b142b", lattice: "#101e34", cavern: "#1d202a",
  };
  if (scene.background === "transparent") return null;
  return (
    <>
      <rect width={width} height={height} fill={fills[scene.background]} />
      {scene.background === "classroom" && <path d={`M14 14H${width - 14}V${height - 14}H14Z`} fill="none" stroke="#8bb4a1" strokeWidth="2" opacity=".65" />}
      {scene.background === "stars" && Array.from({ length: 24 }, (_, i) =>
        <circle key={i} cx={(i * 137 + 36) % width} cy={(i * i * 41 + 27) % height} r={1 + i % 3 * .4} fill="#b6dfef" opacity=".58" />)}
      {scene.background === "lattice" && Array.from({ length: 12 }, (_, i) =>
        <path key={i} d={`M${i * width / 11} 0V${height} M0 ${i * height / 11}H${width}`} stroke="#437993" opacity=".28" />)}
      {scene.background === "cavern" && <path d={`M0 0H${width}V${height * .48}L${width * .84} 61L${width * .73} 93L${width * .53} 36L${width * .38} 69L${width * .23} 47L0 ${height * .5}Z`} fill="#303342" />}
    </>
  );
}

function SceneProp({ scene }: { scene: Scene }) {
  if (scene.prop === "none") return null;
  return (
    <g transform={`translate(${scene.propX} 0)`}>
      {scene.prop === "platform" && <ellipse cx="256" cy="388" rx="131" ry="23" fill="#354e63" stroke="#91c1d0" strokeWidth="3" />}
      {scene.prop === "moon" && <path d="M370 139a43 43 0 1 1-48-60 47 47 0 0 0 48 60Z" fill="#eac978" opacity=".83" />}
      {scene.prop === "crystal" && <path d="m112 284 23 59-26 30-23-31Z m-2 89 2-89" fill="#236b7e" stroke="#98dfed" strokeWidth="2" />}
    </g>
  );
}

function Effects({ expression, frame, form }: AdapterProps & { form: PetForm }) {
  const color = expression.effect === "hearts" ? "#ffaac7" : expression.effect === "orbit" ? "#8be8ef" : "#ffd482";
  return (
    <g opacity={frame.aura * .86} fill={color} stroke={color}>
      {expression.effect === "halo" || expression.effect === "ripples" || form === "geometry" ? (
        <ellipse cx="256" cy="241" rx={105 + frame.aura * 29} ry={100 + frame.aura * 22}
          fill="none" strokeWidth={form === "geometry" ? 2 : 1} opacity=".57" strokeDasharray={form === "geometry" ? "8 9" : undefined}
          transform={`rotate(${frame.angle * 2} 256 241)`} />
      ) : null}
      {frame.particles.map(({ x, y, size }, i) => {
        const points = `0,${-size * 2} ${size * .42},${-size * .42} ${size * 2},0 ${size * .42},${size * .42} 0,${size * 2} ${-size * .42},${size * .42} ${-size * 2},0 ${-size * .42},${-size * .42}`;
        return expression.effect === "hearts" ? (
          <path key={i} d="M0 5C-11-1-5-9 0-4 5-9 11-1 0 5Z" transform={`translate(${x} ${y}) scale(${size / 4})`} />
        ) : expression.effect === "stars" || expression.effect === "sparks" ? (
          <polygon key={i} points={points} transform={`translate(${x} ${y}) rotate(${frame.phase * 85 + i * 23})`} stroke="none" />
        ) : <circle key={i} cx={x} cy={y} r={size * .67} />;
      })}
    </g>
  );
}

function wrappedLines(value: string, max: number) {
  const groups: string[] = [];
  for (const word of value.trim().split(/\s+/)) {
    const parts = Array.from(word);
    while (parts.length > max) groups.push(parts.splice(0, max).join(""));
    const last = groups.at(-1);
    const segment = parts.join("");
    if (last && Array.from(last + " " + segment).length <= max) groups[groups.length - 1] = last + " " + segment;
    else if (segment) groups.push(segment);
  }
  return groups;
}

function CaptionLayer({ caption, width, height }: { caption: Caption; width: number; height: number }) {
  const padding = 20;
  const bubbleFont = Math.min(caption.size, 26);
  const bubbleLines = wrappedLines(caption.bubble, Math.floor((width - 125) / bubbleFont * 1.6)).slice(0, 3);
  const bubbleY = caption.top ? 118 : 23;
  const bubbleHeight = bubbleLines.length * (bubbleFont + 4) + 18;
  const x = caption.align === "left" ? padding : caption.align === "right" ? width - padding : width / 2;
  const anchor = caption.align === "left" ? "start" : caption.align === "right" ? "end" : "middle";
  const bands: ReactNode[] = [];
  for (const [key, value] of [["top", caption.top], ["bottom", caption.bottom]]) {
    if (!value) continue;
    const lines = wrappedLines(value, Math.floor((width - 2 * padding) / caption.size * 1.6)).slice(0, 3);
    const spacing = caption.size * 1.06;
    const y = key === "top" ? padding + caption.size * .8 : height - padding - (lines.length - 1) * spacing;
    bands.push(
      <text key={key} x={x} y={y} textAnchor={anchor} fill="#fff6dd"
        fontFamily="system-ui, sans-serif" fontWeight="800" fontSize={caption.size}
        paintOrder="stroke" stroke={caption.outline ? "#0b1324" : "none"} strokeWidth={5} strokeLinejoin="round">
        {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : spacing}>{line}</tspan>)}
      </text>,
    );
  }
  return (
    <>
      {bands}
      {bubbleLines.length > 0 && (
        <g>
          <rect x="52" y={bubbleY} width={width - 104} height={bubbleHeight} rx={caption.style === "thought" ? 28 : 11} fill="#fff4d9" />
          {caption.style === "speech" && <path d={`M${width / 2 - 18} ${bubbleY + bubbleHeight - 1}l35 0-27 18Z`} fill="#fff4d9" />}
          {caption.style === "thought" && <g fill="#fff4d9"><circle cx={width / 2 - 14} cy={bubbleY + bubbleHeight + 8} r="6" /><circle cx={width / 2 - 6} cy={bubbleY + bubbleHeight + 19} r="3" /></g>}
          <text x={width / 2} y={bubbleY + bubbleFont + 4} textAnchor="middle" fill="#10182c" fontSize={bubbleFont}
            fontWeight="700" fontFamily="system-ui, sans-serif">
            {bubbleLines.map((line, i) => <tspan key={i} x={width / 2} dy={i === 0 ? 0 : bubbleFont + 4}>{line}</tspan>)}
          </text>
        </g>
      )}
    </>
  );
}

export type ArtProps = AdapterProps & {
  form: PetForm; caption: Caption; scene: Scene; aspect?: Aspect;
};
export function ExpressionArt({ pet, frame, expression, form, caption, scene, aspect = "square" }: ArtProps) {
  const [width, height] = ASPECTS[aspect];
  const Renderer = adapters[form];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`}
      role="img" aria-label={`${FORM_LABELS[form]} performing ${expression.label}`}
      className="block h-auto w-full [&_[data-expression-lattice]>svg>rect]:hidden">
      <SceneBackground scene={scene} width={width} height={height} />
      <g transform={`translate(${(width - 512) / 2} ${(height - 512) / 2})`}>
        {scene.light > 0 && <ellipse cx="256" cy="234" rx="153" ry="148" fill="#efc477" opacity={scene.light * .15} />}
        <SceneProp scene={scene} />
        <Effects pet={pet} form={form} frame={frame} expression={expression} />
        <g transform={`translate(${256 + frame.x} ${247 + frame.y}) rotate(${frame.angle}) scale(${frame.scale * (1 + frame.squash)} ${frame.scale * (1 - frame.squash)}) translate(-256 -247)`}>
          <Renderer pet={pet} frame={frame} expression={expression} />
        </g>
      </g>
      <CaptionLayer caption={caption} width={width} height={height} />
    </svg>
  );
}
