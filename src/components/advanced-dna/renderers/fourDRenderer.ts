import { mutationSignal } from "../dnaMapper";
import {
  TAU,
  clamp,
  drawBaseMarker,
  drawStageBackdrop,
  hexToRgba,
  lerp,
  pulseStrength,
  smoothstep,
} from "../canvasUtils";
import type {
  DnaModeRenderer,
  DnaVisualModel,
  GeneLocus,
  RenderFrame,
} from "../types";

type Vec4 = { x: number; y: number; z: number; w: number };
type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  scale: number;
  locus: GeneLocus;
};

type HelixState = {
  label: "INHERITED" | "EXPRESSED" | "DORMANT" | "MUTATED";
  radius: number;
  phase: number;
  alpha: number;
  width: number;
  dash: number[];
};

const HELIX_STATES: readonly HelixState[] = [
  { label: "INHERITED", radius: 1, phase: 0, alpha: 0.7, width: 1.3, dash: [] },
  {
    label: "EXPRESSED",
    radius: 0.79,
    phase: 0.72,
    alpha: 0.92,
    width: 1.85,
    dash: [],
  },
  {
    label: "DORMANT",
    radius: 0.61,
    phase: 1.48,
    alpha: 0.38,
    width: 1,
    dash: [5, 6],
  },
  {
    label: "MUTATED",
    radius: 0.45,
    phase: 2.18,
    alpha: 0.75,
    width: 1.45,
    dash: [2, 4],
  },
] as const;

function rotatePlane(
  vector: Vec4,
  a: keyof Vec4,
  b: keyof Vec4,
  angle: number,
): Vec4 {
  const next = { ...vector };
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  next[a] = vector[a] * cos - vector[b] * sin;
  next[b] = vector[a] * sin + vector[b] * cos;
  return next;
}

function stateExpression(
  state: HelixState,
  locus: GeneLocus,
  model: DnaVisualModel,
  mutationLevel: number,
): number {
  if (state.label === "INHERITED") return 0.72 + locus.stability * 0.2;
  if (state.label === "EXPRESSED") {
    return 0.55 + locus.weight * 0.35 + model.traitWeights.mood * 0.1;
  }
  if (state.label === "DORMANT") {
    return 0.48 + (1 - locus.weight) * 0.25 + model.traitWeights.latent * 0.16;
  }
  return 0.42 + mutationSignal(locus, mutationLevel) * 0.52;
}

function projectHigherDimension(
  vector: Vec4,
  frame: RenderFrame,
  centerX: number,
  centerY: number,
  screenScale: number,
  identityPhase: number,
): { x: number; y: number; depth: number; scale: number } {
  const dimension3 = smoothstep(2, 3, frame.controls.dimension);
  const dimension4 = smoothstep(3, 4, frame.controls.dimension);
  const foldTime = frame.reducedMotion
    ? identityPhase
    : frame.time * frame.controls.speed * 0.11 + identityPhase;
  let rotated = rotatePlane(vector, "x", "w", dimension4 * (0.74 + foldTime));
  rotated = rotatePlane(
    rotated,
    "y",
    "w",
    dimension4 * (-0.46 + foldTime * 0.63),
  );
  rotated = rotatePlane(
    rotated,
    "z",
    "w",
    dimension4 * (0.31 + foldTime * 0.37),
  );

  const fourDistance = 3.4 + frame.controls.cameraDepth * 1.4;
  const fourScale = lerp(
    1,
    fourDistance / Math.max(0.7, fourDistance - rotated.w),
    dimension4,
  );
  let x = rotated.x * fourScale;
  let y = rotated.y * fourScale;
  let z = rotated.z * fourScale;

  // Pointer rotation is a slice selector. Time never just spins a normal helix.
  const yaw = frame.interaction.yaw * dimension3;
  const pitch = frame.interaction.pitch * dimension3;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const xYaw = x * cosY - z * sinY;
  const zYaw = x * sinY + z * cosY;
  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const yPitch = y * cosX - zYaw * sinX;
  const zPitch = y * sinX + zYaw * cosX;
  x = xYaw;
  y = yPitch;
  z = zPitch;

  const threeDistance = 4.8 + frame.controls.cameraDepth * 1.7;
  const threeScale = lerp(
    1,
    threeDistance / Math.max(0.8, threeDistance - z),
    dimension3,
  );
  return {
    x: centerX + x * screenScale * threeScale,
    y: centerY + y * screenScale * threeScale,
    depth: z + rotated.w * dimension4 * 0.4,
    scale: fourScale * threeScale,
  };
}

export function createFourDRenderer(
  model: DnaVisualModel,
  animationNonce: number,
): DnaModeRenderer {
  const identityPhase =
    (((model.numericSeed >>> 3) + Math.imul(animationNonce + 1, 2654435761)) >>>
      0) /
    0xffffffff;

  return {
    render(frame: RenderFrame) {
      const { ctx, width, height, controls, interaction, performance } = frame;
      drawStageBackdrop(ctx, width, height, "#4B1A73");
      const centerX = width * 0.5;
      const centerY = height * 0.51;
      const minSide = Math.min(width, height);
      const screenScale = minSide * 0.29 * interaction.zoom;
      const dimension3 = smoothstep(2, 3, controls.dimension);
      const dimension4 = smoothstep(3, 4, controls.dimension);
      const pointCount = Math.max(
        30,
        Math.round(76 * controls.particleDensity * performance.densityScale),
      );
      const pulse = pulseStrength(interaction.pulseStartedAt, frame.time);
      const allRails: Array<{
        state: HelixState;
        side: -1 | 1;
        points: ProjectedPoint[];
      }> = [];

      HELIX_STATES.forEach((state, stateIndex) => {
        for (const side of [-1, 1] as const) {
          const points: ProjectedPoint[] = [];
          for (let pointIndex = 0; pointIndex <= pointCount; pointIndex += 1) {
            const locusIndex = Math.floor(
              ((pointIndex % pointCount) * model.loci.length) / pointCount,
            );
            const locus = model.loci[locusIndex];
            const t = (pointIndex / pointCount) * TAU;
            const expression = stateExpression(
              state,
              locus,
              model,
              controls.mutationLevel,
            );
            const basePhase =
              t * (2 + (model.numericSeed % 3) * 0.25) + state.phase;
            const dnaPhase = locus.phase * 0.16 + locus.digit * 0.035;
            const rail = side * (0.09 + locus.weight * 0.055);
            const mobiusTwist = Math.cos(t * 0.5 + state.phase) * rail;
            const recursionWave =
              Math.sin(t * 6 + dnaPhase + stateIndex) * 0.075;
            const mutate =
              state.label === "MUTATED"
                ? mutationSignal(locus, controls.mutationLevel) *
                  locus.angleBias *
                  0.2
                : 0;

            // 2D slice: a readable looped helix laid flat.
            const x2 =
              Math.cos(t) * state.radius +
              Math.cos(basePhase * 3) * rail * (0.55 + expression * 0.45);
            const y2 =
              Math.sin(t) * state.radius * 0.56 +
              Math.sin(basePhase * 3) * rail +
              stateIndex * 0.045 -
              0.07;

            // 3D slice: nested helices fold through a toroidal/Mobius path.
            const torusRadius =
              state.radius + mobiusTwist + recursionWave * expression;
            const x3 = Math.cos(t) * torusRadius;
            const y3 = Math.sin(t) * torusRadius * 0.82;
            const z3 =
              Math.sin(basePhase * 2.5 + side * Math.PI * 0.5) *
                (0.22 + locus.radialBias * 0.09) +
              Math.sin(t * 0.5) * mobiusTwist * 1.8;

            // W is not decorative: it changes perspective and intersection order.
            const w4 =
              Math.sin(t * 2 + state.phase + dnaPhase) *
                (0.46 + locus.rarity * 0.22) +
              Math.cos(t * 0.5) * rail * 2.4 +
              mutate;
            const vector: Vec4 = {
              x: lerp(x2, x3 + mutate, dimension3),
              y: lerp(y2, y3 - mutate * 0.35, dimension3),
              z: z3 * dimension3,
              w: w4 * dimension4,
            };
            const projected = projectHigherDimension(
              vector,
              frame,
              centerX,
              centerY,
              screenScale *
                (1 +
                  (interaction.focusGroup === locus.group ? pulse * 0.035 : 0)),
              identityPhase,
            );
            points.push({ ...projected, locus });
          }
          allRails.push({ state, side, points });
        }
      });

      // Recursive slices reveal successive cross-sections of the same object.
      for (let echo = performance.recursion - 1; echo >= 0; echo -= 1) {
        const echoScale = 1 - echo * 0.055;
        const echoAlpha = echo === 0 ? 1 : 0.12 / echo;
        const segments = allRails.flatMap((rail) =>
          rail.points.slice(0, -1).map((point, index) => ({
            state: rail.state,
            from: point,
            to: rail.points[index + 1],
            depth: (point.depth + rail.points[index + 1].depth) * 0.5,
          })),
        );
        segments.sort((a, b) => a.depth - b.depth);

        segments.forEach((segment) => {
          const focus = interaction.focusGroup === segment.from.locus.group;
          const stateExpressionValue = stateExpression(
            segment.state,
            segment.from.locus,
            model,
            controls.mutationLevel,
          );
          const depthFade = clamp(0.54 + segment.depth * 0.12, 0.2, 1);
          const transformPoint = (point: ProjectedPoint) => ({
            x: centerX + (point.x - centerX) * echoScale,
            y: centerY + (point.y - centerY) * echoScale,
          });
          const from = transformPoint(segment.from);
          const to = transformPoint(segment.to);

          ctx.setLineDash(segment.state.dash);
          ctx.lineCap = "round";
          ctx.strokeStyle = hexToRgba(
            segment.from.locus.color,
            segment.state.alpha *
              stateExpressionValue *
              depthFade *
              echoAlpha *
              (focus ? 1.2 : 1),
          );
          ctx.lineWidth = Math.max(
            0.55,
            segment.state.width * segment.from.scale * (focus ? 1.4 : 1),
          );
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        });
      }
      ctx.setLineDash([]);

      // Base-pair rungs and state-specific markers clarify the nested helices.
      for (let railIndex = 0; railIndex < allRails.length; railIndex += 2) {
        const first = allRails[railIndex];
        const second = allRails[railIndex + 1];
        const stateIndex = railIndex / 2;
        const markerStride = performance.densityScale < 0.7 ? 10 : 7;
        for (
          let index = stateIndex + 3;
          index < pointCount;
          index += markerStride
        ) {
          const a = first.points[index];
          const b = second.points[index];
          if (!a || !b) continue;
          ctx.strokeStyle = hexToRgba(a.locus.color, first.state.alpha * 0.3);
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          const front = a.depth > b.depth ? a : b;
          drawBaseMarker(
            ctx,
            front.locus.base,
            front.x,
            front.y,
            Math.max(1.8, minSide * 0.0048 * front.scale),
            front.locus.color,
            first.state.alpha,
            first.state.label !== "DORMANT",
          );
        }
      }

      // State legend is intentionally structural: line pattern + label + colour chip.
      ctx.save();
      const legendX = Math.max(12, width * 0.027);
      let legendY = Math.max(20, height * 0.06);
      ctx.font = `600 ${Math.max(8, minSide * 0.017)}px ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      HELIX_STATES.forEach((state, index) => {
        ctx.setLineDash(state.dash);
        ctx.strokeStyle = ["#C9E7F2", "#5CF2D6", "#8A94A8", "#FF3C78"][index];
        ctx.lineWidth = state.width;
        ctx.beginPath();
        ctx.moveTo(legendX, legendY);
        ctx.lineTo(legendX + 24, legendY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(218, 235, 241, 0.72)";
        ctx.fillText(state.label, legendX + 31, legendY);
        legendY += Math.max(14, minSide * 0.028);
      });
      ctx.restore();

      ctx.save();
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.font = `700 ${Math.max(9, minSide * 0.019)}px ui-monospace, monospace`;
      ctx.fillStyle = "rgba(244, 211, 94, 0.82)";
      ctx.fillText(
        `${controls.dimension.toFixed(1)}D SLICE · W-PHASE ${(dimension4 * 100).toFixed(0)}%`,
        width - Math.max(12, width * 0.025),
        height - Math.max(10, height * 0.025),
      );
      ctx.restore();
    },
    updateModel(nextModel) {
      model = nextModel;
    },
    reset() {},
    dispose() {},
  };
}
