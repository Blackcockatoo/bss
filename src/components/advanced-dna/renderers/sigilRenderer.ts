import { mutationSignal } from "../dnaMapper";
import {
  TAU,
  drawBaseMarker,
  drawStageBackdrop,
  hexToRgba,
  pulseStrength,
} from "../canvasUtils";
import type { DnaModeRenderer, DnaVisualModel, RenderFrame } from "../types";

export function createSigilRenderer(
  model: DnaVisualModel,
  animationNonce: number,
): DnaModeRenderer {
  const identityPhase =
    ((model.numericSeed ^ Math.imul(animationNonce + 1, 0x9e3779b9)) >>> 0) /
    0xffffffff;

  return {
    render(frame: RenderFrame) {
      const { ctx, width, height, controls, interaction, performance } = frame;
      drawStageBackdrop(ctx, width, height, "#0C6F78");

      const cx = width * 0.5;
      const cy = height * 0.5;
      const minSide = Math.min(width, height);
      const pulse = pulseStrength(interaction.pulseStartedAt, frame.time);
      const breathing = frame.reducedMotion
        ? 1
        : 1 +
          Math.sin(frame.time * controls.speed * 0.62 + identityPhase * TAU) *
            0.018;
      const radius =
        minSide * 0.345 * interaction.zoom * breathing * (1 + pulse * 0.035);
      const symmetry = controls.symmetry;
      const sector = TAU / symmetry;
      const armStride =
        symmetry === 60 && performance.densityScale < 0.7 ? 2 : 1;

      ctx.save();
      ctx.translate(cx, cy);

      // Genome orbit rings: slow independent drift, never rotating the seal itself.
      [0.72, 0.91, 1.055].forEach((ringScale, ringIndex) => {
        const ringRadius = radius * ringScale;
        ctx.lineWidth = Math.max(0.7, minSide * (0.0014 - ringIndex * 0.0002));
        model.groups.forEach((group) => {
          const groupArc = TAU / model.groups.length;
          const drift = frame.reducedMotion
            ? 0
            : frame.time *
              controls.speed *
              (ringIndex % 2 === 0 ? 0.012 : -0.008);
          const start =
            group.index * groupArc - Math.PI / 2 + drift + identityPhase * 0.08;
          const gap = 0.04 + (1 - group.stability) * 0.035;
          ctx.strokeStyle = hexToRgba(
            model.loci[group.locusIndices[0]]?.color ?? "#5CF2D6",
            0.22 + group.weight * 0.3,
          );
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, start + gap, start + groupArc - gap);
          ctx.stroke();
        });
      });

      // Radial mirrored construction. DNA values determine every bend and length.
      for (let arm = 0; arm < symmetry; arm += armStride) {
        const bucketStart = Math.floor((arm * model.loci.length) / symmetry);
        const bucketEnd = Math.floor(
          ((arm + 1) * model.loci.length) / symmetry,
        );
        const armLoci = model.loci.slice(bucketStart, bucketEnd);
        const armWeight =
          armLoci.reduce((sum, locus) => sum + locus.weight, 0) /
          Math.max(1, armLoci.length);
        const armAngleBias =
          armLoci.reduce((sum, locus) => sum + locus.angleBias, 0) /
          Math.max(1, armLoci.length);
        const sampleCount = Math.min(5, armLoci.length);
        const sampledLoci = Array.from(
          { length: sampleCount },
          (_, index) =>
            armLoci[
              Math.min(
                armLoci.length - 1,
                Math.floor(((index + 0.5) * armLoci.length) / sampleCount),
              )
            ],
        );
        const mutationPriority = armLoci.reduce((strongest, locus) => {
          const locusSignal = locus.explicitMutation
            ? 2
            : locus.mutationPotential;
          const strongestSignal = strongest.explicitMutation
            ? 2
            : strongest.mutationPotential;
          return locusSignal > strongestSignal ? locus : strongest;
        }, armLoci[0]);
        const constructionLoci = sampledLoci.includes(mutationPriority)
          ? sampledLoci
          : [...sampledLoci, mutationPriority].sort(
              (first, second) => first.index - second.index,
            );
        const baseAngle = arm * sector - Math.PI / 2;
        const focus = armLoci.some(
          (locus) => interaction.focusGroup === locus.group,
        );

        for (const mirror of [-1, 1] as const) {
          let previousX = Math.cos(baseAngle) * radius * 0.12;
          let previousY = Math.sin(baseAngle) * radius * 0.12;

          constructionLoci.forEach((locus, pointIndex) => {
            const mutation = mutationSignal(locus, controls.mutationLevel);
            const fracture = mutation > 0.5 && (arm + pointIndex) % 3 === 0;
            const progress = (pointIndex + 1) / constructionLoci.length;
            const radial =
              radius *
              (0.12 +
                progress * 0.62 +
                locus.weight * 0.075 +
                locus.radialBias * 0.025 +
                armWeight * 0.025);
            const angular =
              baseAngle +
              mirror *
                sector *
                (0.08 +
                  locus.angleBias * 0.17 +
                  armAngleBias * 0.08 +
                  progress * 0.12) +
              (fracture ? mirror * mutation * sector * 0.36 : 0);
            const fractureLift = fracture ? radius * mutation * 0.025 : 0;
            const x = Math.cos(angular) * (radial + fractureLift);
            const y = Math.sin(angular) * (radial + fractureLift);
            const flicker =
              fracture && !frame.reducedMotion
                ? 0.58 +
                  Math.sin(frame.time * controls.speed * 7 + locus.phase) * 0.24
                : 1;

            ctx.strokeStyle = hexToRgba(
              locus.color,
              (0.28 + locus.weight * 0.52 + (focus ? 0.2 : 0)) * flicker,
            );
            ctx.lineWidth =
              Math.max(0.55, minSide * 0.0022 * locus.weight) +
              (focus ? 0.8 : 0);
            ctx.beginPath();
            ctx.moveTo(previousX, previousY);
            if (fracture) {
              const kinkAngle = (baseAngle + angular) * 0.5 + mirror * 0.08;
              const kinkRadius = radial * 0.82;
              ctx.lineTo(
                Math.cos(kinkAngle) * kinkRadius,
                Math.sin(kinkAngle) * kinkRadius,
              );
            }
            ctx.lineTo(x, y);
            ctx.stroke();

            if (
              pointIndex === Math.floor(constructionLoci.length * 0.5) ||
              pointIndex === constructionLoci.length - 1
            ) {
              drawBaseMarker(
                ctx,
                locus.base,
                x,
                y,
                Math.max(1.2, minSide * 0.004 * (0.75 + locus.weight)),
                locus.color,
                0.52 + locus.weight * 0.34,
                pointIndex === constructionLoci.length - 1,
              );
            }
            previousX = x;
            previousY = y;
          });
        }
      }

      // Inner genetic glyph: the twelve groups form an immutable identity polygon.
      const glyphPoints = model.groups.map((group) => {
        const angle = (group.index / model.groups.length) * TAU - Math.PI / 2;
        const glyphRadius = radius * (0.14 + group.weight * 0.095);
        return {
          x: Math.cos(angle) * glyphRadius,
          y: Math.sin(angle) * glyphRadius,
          group,
        };
      });

      ctx.lineJoin = "round";
      ctx.beginPath();
      glyphPoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(218, 255, 249, 0.48)";
      ctx.lineWidth = Math.max(1, minSide * 0.0025);
      ctx.stroke();

      glyphPoints.forEach((point, index) => {
        const opposite =
          glyphPoints[
            (index + 5 + (model.numericSeed % 3)) % glyphPoints.length
          ];
        ctx.strokeStyle = hexToRgba(
          model.loci[point.group.locusIndices[0]]?.color ?? "#5CF2D6",
          0.2 + point.group.weight * 0.28,
        );
        ctx.lineWidth = Math.max(0.55, minSide * 0.0013);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(opposite.x, opposite.y);
        ctx.stroke();
      });

      // Node crown and selected-gene pulse.
      model.groups.forEach((group) => {
        const angle = (group.index / model.groups.length) * TAU - Math.PI / 2;
        const orbitRadius = radius * 0.91;
        const x = Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius;
        const locus =
          model.loci[
            group.locusIndices[group.index % group.locusIndices.length]
          ];
        const focused = interaction.focusGroup === group.index;
        if (focused) {
          ctx.strokeStyle = hexToRgba(locus.color, 0.64);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, minSide * (0.016 + pulse * 0.025), 0, TAU);
          ctx.stroke();
        }
        drawBaseMarker(
          ctx,
          locus.base,
          x,
          y,
          minSide * (focused ? 0.009 : 0.0065),
          locus.color,
          focused ? 1 : 0.78,
          true,
        );
      });

      const coreGradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        radius * 0.105,
      );
      coreGradient.addColorStop(0, "rgba(244, 211, 94, 0.28)");
      coreGradient.addColorStop(0.55, "rgba(15, 54, 67, 0.65)");
      coreGradient.addColorStop(1, "rgba(2, 7, 15, 0.95)");
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.105, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(92, 242, 214, 0.52)";
      ctx.lineWidth = Math.max(1, minSide * 0.0022);
      ctx.stroke();

      ctx.restore();

      // Fine registration marks make the result read as a seal, not an equaliser.
      ctx.save();
      ctx.fillStyle = "rgba(203, 231, 240, 0.52)";
      ctx.font = `600 ${Math.max(8, minSide * 0.018)}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(
        model.fingerprint,
        cx,
        height - Math.max(12, minSide * 0.034),
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
