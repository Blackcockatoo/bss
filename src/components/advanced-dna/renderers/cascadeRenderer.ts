import { mutationSignal } from "../dnaMapper";
import {
  clamp,
  drawBaseMarker,
  drawGeneLabel,
  drawStageBackdrop,
  hexToRgba,
  pulseStrength,
  selectLoci,
} from "../canvasUtils";
import type {
  DnaModeRenderer,
  DnaVisualModel,
  GenomeStrand,
  RenderFrame,
} from "../types";

const STRAND_OFFSET: Record<GenomeStrand, number> = {
  red: -0.23,
  blue: 0,
  black: 0.23,
};

export function createCascadeRenderer(
  model: DnaVisualModel,
  animationNonce: number,
): DnaModeRenderer {
  let initializedWidth = 0;
  let initializedHeight = 0;

  const reset = () => {
    initializedWidth = 0;
    initializedHeight = 0;
  };

  return {
    render(frame: RenderFrame) {
      const { ctx, width, height, controls, interaction, performance } = frame;
      const firstFrame =
        width !== initializedWidth || height !== initializedHeight;
      if (firstFrame) {
        drawStageBackdrop(ctx, width, height, "#083A61");
        initializedWidth = width;
        initializedHeight = height;
      } else {
        const healthClarity = 0.06 + model.traitWeights.health * 0.06;
        ctx.fillStyle = `rgba(1, 5, 14, ${clamp(
          performance.trailAlpha + healthClarity,
          0.1,
          0.34,
        )})`;
        ctx.fillRect(0, 0, width, height);
      }

      const top = Math.max(38, height * 0.1);
      const bottom = height - Math.max(22, height * 0.055);
      const flowHeight = bottom - top;
      const sidePadding = Math.max(16, width * 0.045);
      const laneWidth = (width - sidePadding * 2) / model.groups.length;
      const drive = clamp(
        model.traitWeights.energy * 0.44 +
          model.traitWeights.mood * 0.26 +
          controls.intensity * 0.2 +
          controls.mutationLevel * 0.1,
        0.15,
        1.35,
      );
      const motion = frame.reducedMotion ? 0 : frame.time * controls.speed;
      const pulse = pulseStrength(interaction.pulseStartedAt, frame.time);

      // Related gene groups stay in stable lanes, with weighted genomic conduits.
      model.groups.forEach((group) => {
        const laneX = sidePadding + (group.index + 0.5) * laneWidth;
        const focused = interaction.focusGroup === group.index;
        if (focused) {
          const glow = ctx.createLinearGradient(0, top, 0, bottom);
          glow.addColorStop(0, "rgba(92, 242, 214, 0.02)");
          glow.addColorStop(0.5, `rgba(92, 242, 214, ${0.08 + pulse * 0.08})`);
          glow.addColorStop(1, "rgba(92, 242, 214, 0.01)");
          ctx.fillStyle = glow;
          ctx.fillRect(
            laneX - laneWidth * 0.46,
            top,
            laneWidth * 0.92,
            flowHeight,
          );
        }

        ctx.strokeStyle = hexToRgba(
          model.loci[group.locusIndices[0]]?.color ?? "#379BFF",
          0.035 + group.weight * 0.075,
        );
        ctx.lineWidth = Math.max(
          0.6,
          laneWidth * (0.025 + group.weight * 0.035),
        );
        ctx.beginPath();
        ctx.moveTo(laneX, top);
        ctx.bezierCurveTo(
          laneX + Math.sin(group.index + motion * 0.15) * laneWidth * 0.08,
          top + flowHeight * 0.34,
          laneX -
            Math.cos(group.index * 0.7 + motion * 0.12) * laneWidth * 0.08,
          top + flowHeight * 0.67,
          laneX,
          bottom,
        );
        ctx.stroke();
      });

      const loci = selectLoci(
        model,
        controls.particleDensity,
        performance.densityScale,
        42,
      );
      const labelStride = width > 680 ? 3 : 5;

      loci.forEach((locus, locusIndex) => {
        const laneCenter = sidePadding + (locus.group + 0.5) * laneWidth;
        const strandOffset = STRAND_OFFSET[locus.strand] * laneWidth;
        const velocity =
          0.07 + locus.weight * 0.13 + drive * 0.055 + locus.digit * 0.0018;
        const yPhase =
          (locus.radialBias +
            motion * velocity +
            animationNonce * 0.071 +
            locus.strandIndex * 0.0027) %
          1;
        const y = top + yPhase * flowHeight;
        const sway =
          Math.sin(motion * (0.55 + drive * 0.4) + locus.phase) *
          laneWidth *
          (0.045 + model.traitWeights.mood * 0.08) *
          controls.intensity;
        const x =
          laneCenter +
          strandOffset +
          sway +
          interaction.distortion * laneWidth * 0.12;
        const mutation = mutationSignal(locus, controls.mutationLevel);
        const focused = interaction.focusGroup === locus.group;
        const alpha = clamp(
          0.34 + locus.weight * 0.5 + (focused ? 0.18 : 0),
          0,
          1,
        );
        const radius =
          Math.max(1.5, laneWidth * 0.07) *
          (0.62 + locus.weight * 0.84) *
          (1 + (focused ? pulse * 0.5 : 0));

        // A short readable trail reinforces vertical flow without smearing text.
        ctx.strokeStyle = hexToRgba(locus.color, alpha * 0.3);
        ctx.lineWidth = Math.max(0.7, radius * (0.28 + locus.weight * 0.2));
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x - sway * 0.18, y - (11 + drive * 18 + locus.weight * 13));
        ctx.stroke();

        if (mutation > 0.43) {
          const direction = locus.angleBias < 0 ? -1 : 1;
          const branchLength = laneWidth * (0.32 + mutation * 0.65);
          ctx.strokeStyle = hexToRgba(locus.color, 0.2 + mutation * 0.62);
          ctx.lineWidth = Math.max(0.8, radius * 0.26);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + direction * branchLength * 0.35, y + 5);
          ctx.lineTo(x + direction * branchLength * 0.62, y - 2);
          ctx.lineTo(x + direction * branchLength, y + 9 + mutation * 8);
          ctx.stroke();
          drawBaseMarker(
            ctx,
            locus.base,
            x + direction * branchLength,
            y + 9 + mutation * 8,
            radius * 0.72,
            locus.color,
            alpha * 0.78,
            false,
          );
        }

        if (locusIndex % labelStride === 0 || locus.weight > 0.86 || focused) {
          drawGeneLabel(
            ctx,
            locus.base,
            x,
            y,
            locus.color,
            Math.max(9, radius * 1.35),
            alpha,
          );
        } else {
          drawBaseMarker(
            ctx,
            locus.base,
            x,
            y,
            radius,
            locus.color,
            alpha,
            true,
          );
        }
      });

      // Redraw a clean header over the trails so lane labels always stay readable.
      const headerGradient = ctx.createLinearGradient(0, 0, 0, top + 8);
      headerGradient.addColorStop(0, "rgba(1, 4, 12, 0.98)");
      headerGradient.addColorStop(1, "rgba(1, 4, 12, 0.15)");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, width, top + 8);
      ctx.font = `600 ${width > 680 ? 9 : 8}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      model.groups.forEach((group) => {
        if (width < 540 && group.index % 2 === 1) return;
        const x = sidePadding + (group.index + 0.5) * laneWidth;
        ctx.fillStyle = hexToRgba(
          model.loci[group.locusIndices[0]]?.color ?? "#5CF2D6",
          interaction.focusGroup === group.index ? 1 : 0.64,
        );
        ctx.fillText(
          group.shortLabel.toUpperCase(),
          x,
          Math.max(17, top * 0.42),
        );
      });

      ctx.save();
      ctx.textAlign = "left";
      ctx.font = `600 ${Math.max(9, width * 0.012)}px ui-monospace, monospace`;
      ctx.fillStyle = "rgba(184, 213, 224, 0.6)";
      ctx.fillText(
        drive > 0.72
          ? "GENOMIC FLOW · HIGH EXPRESSION"
          : "GENOMIC FLOW · CALM EXPRESSION",
        Math.max(12, width * 0.025),
        height - 9,
      );
      ctx.restore();
    },
    updateModel(nextModel) {
      model = nextModel;
    },
    reset,
    dispose: reset,
  };
}
