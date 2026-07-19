import { mutationSignal } from "../dnaMapper";
import {
  TAU,
  clamp,
  drawBaseMarker,
  drawGeneLabel,
  drawStageBackdrop,
  hexToRgba,
  pulseStrength,
  selectLoci,
} from "../canvasUtils";
import type { DnaModeRenderer, DnaVisualModel, RenderFrame } from "../types";

type VortexParticle = {
  x: number;
  y: number;
  depth: number;
  scale: number;
  angle: number;
  radius: number;
  mutation: number;
  locusIndex: number;
};

export function createVortexRenderer(
  model: DnaVisualModel,
  animationNonce: number,
): DnaModeRenderer {
  const seedPhase =
    (((model.numericSeed >>> 5) ^ Math.imul(animationNonce + 3, 0x45d9f3b)) >>>
      0) /
    0xffffffff;

  return {
    render(frame: RenderFrame) {
      const { ctx, width, height, controls, interaction, performance } = frame;
      drawStageBackdrop(ctx, width, height, "#052C3A");
      const cx = width * 0.5;
      const cy = height * 0.5;
      const minSide = Math.min(width, height);
      const maxRadius = minSide * 0.43 * interaction.zoom;
      const time = frame.reducedMotion
        ? seedPhase * 3
        : frame.time * controls.speed;
      const eventPeriod = 5.6 - controls.mutationLevel * 1.8;
      const eventAge = (time + seedPhase * eventPeriod) % eventPeriod;
      const eventStrength =
        eventAge < 1.45
          ? Math.sin((eventAge / 1.45) * Math.PI) * controls.mutationLevel
          : 0;
      const tapPulse = pulseStrength(interaction.pulseStartedAt, frame.time);
      const shock = Math.max(eventStrength, tapPulse);
      const loci = selectLoci(
        model,
        controls.particleDensity,
        performance.densityScale,
        48,
      );
      const particles: VortexParticle[] = [];

      // Stable group orbits make the field readable before particles are added.
      model.groups.forEach((group) => {
        const radius = maxRadius * (0.29 + group.stability * 0.61);
        const start =
          group.index * (TAU / model.groups.length) + seedPhase * 0.2;
        const arc = TAU / model.groups.length - 0.07;
        ctx.strokeStyle = hexToRgba(
          model.loci[group.locusIndices[0]]?.color ?? "#5CF2D6",
          0.05 + group.weight * 0.11,
        );
        ctx.lineWidth = Math.max(0.6, minSide * 0.0015);
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          radius,
          radius * (0.64 + controls.cameraDepth * 0.12),
          interaction.yaw * 0.22,
          start,
          start + arc,
        );
        ctx.stroke();
      });

      loci.forEach((locus, sampledIndex) => {
        const mutation = mutationSignal(locus, controls.mutationLevel);
        const rareFlare = clamp((locus.rarity - 0.66) * 2.4, 0, 0.72);
        const stableOrbit = 0.34 + locus.stability * 0.55;
        const inwardCycle =
          mutation *
          (0.18 + 0.2 * (0.5 + Math.sin(time * 0.8 + locus.phase) * 0.5));
        const shockDisplacement = shock * (rareFlare * 0.2 - mutation * 0.16);
        const normalizedRadius = clamp(
          stableOrbit -
            inwardCycle +
            rareFlare * (0.22 + shock * 0.24) +
            shockDisplacement,
          0.1,
          1.13,
        );
        const direction = locus.strand === "black" ? -1 : 1;
        const orbitSpeed =
          direction * (0.11 + (1 - locus.stability) * 0.17 + mutation * 0.2);
        const angle =
          locus.phase +
          time * orbitSpeed +
          locus.group * 0.045 +
          inwardCycle * 5.2 +
          interaction.distortion * locus.angleBias;
        const depth = Math.sin(angle * 1.25 + locus.radialBias * TAU);
        const perspective = clamp(
          0.72 + depth * 0.24 * controls.cameraDepth,
          0.38,
          1.24,
        );
        const radius = normalizedRadius * maxRadius;
        const ellipse = 0.66 + controls.cameraDepth * 0.1;
        const yawOffset =
          interaction.yaw * 0.32 + interaction.pitch * depth * 0.08;
        const x = cx + Math.cos(angle + yawOffset) * radius;
        const y =
          cy +
          Math.sin(angle) * radius * ellipse +
          depth * interaction.pitch * minSide * 0.045;
        particles.push({
          x,
          y,
          depth,
          scale: perspective,
          angle,
          radius,
          mutation,
          locusIndex: locus.index,
        });

        // Mutated genes expose a short inward spiral vector; rare genes flare out.
        const vectorStrength = mutation * 0.7 + rareFlare * 0.42;
        if (vectorStrength > 0.24 && sampledIndex % 2 === 0) {
          const vectorDirection = rareFlare > mutation ? 1 : -1;
          const vectorRadius =
            radius + vectorDirection * maxRadius * vectorStrength * 0.12;
          ctx.strokeStyle = hexToRgba(
            locus.color,
            0.08 + vectorStrength * 0.27,
          );
          ctx.lineWidth = Math.max(0.55, minSide * 0.0012 * perspective);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(
            cx +
              Math.cos(angle + 0.13 * vectorDirection) *
                (radius + vectorRadius) *
                0.5,
            cy +
              Math.sin(angle + 0.13 * vectorDirection) *
                (radius + vectorRadius) *
                0.32,
            cx + Math.cos(angle + 0.25 * vectorDirection) * vectorRadius,
            cy +
              Math.sin(angle + 0.25 * vectorDirection) * vectorRadius * ellipse,
          );
          ctx.stroke();
        }
      });

      particles.sort((a, b) => a.depth - b.depth);
      particles.forEach((particle, drawIndex) => {
        const locus = model.loci[particle.locusIndex];
        const focused = interaction.focusGroup === locus.group;
        const size =
          Math.max(1.7, minSide * 0.0062) *
          particle.scale *
          (0.72 + locus.weight * 0.74) *
          (focused ? 1.35 : 1);
        const alpha = clamp(
          0.3 +
            particle.scale * 0.42 +
            locus.weight * 0.2 +
            (focused ? 0.18 : 0),
          0,
          1,
        );

        if (
          drawIndex % (width > 660 ? 4 : 6) === 0 ||
          locus.rarity > 0.83 ||
          focused
        ) {
          drawGeneLabel(
            ctx,
            locus.base,
            particle.x,
            particle.y,
            locus.color,
            size * 1.45,
            alpha,
          );
        } else {
          drawBaseMarker(
            ctx,
            locus.base,
            particle.x,
            particle.y,
            size,
            locus.color,
            alpha,
            particle.mutation < 0.55,
          );
        }
      });

      // Mutation shockwaves pass through every orbit without random explosions.
      if (shock > 0.015) {
        [0.48, 0.72, 0.94].forEach((scale, index) => {
          const waveRadius =
            maxRadius * clamp(shock * 1.2 + index * 0.17, 0.08, scale);
          ctx.strokeStyle = `rgba(255, 60, 120, ${clamp(shock * (0.32 - index * 0.07), 0, 0.4)})`;
          ctx.lineWidth = Math.max(0.8, minSide * 0.0025 * (1 - index * 0.15));
          ctx.beginPath();
          ctx.ellipse(cx, cy, waveRadius, waveRadius * 0.72, 0, 0, TAU);
          ctx.stroke();
        });
      }

      // Genome core: a dark reactor eye whose iris sectors come from gene groups.
      const coreRadius = maxRadius * 0.145;
      const halo = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        coreRadius * 2.1,
      );
      halo.addColorStop(0, "rgba(0, 0, 0, 1)");
      halo.addColorStop(0.46, "rgba(2, 9, 18, 0.98)");
      halo.addColorStop(
        0.66,
        `rgba(255, 60, 120, ${0.12 + controls.mutationLevel * 0.14})`,
      );
      halo.addColorStop(1, "rgba(4, 20, 29, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 2.1, 0, TAU);
      ctx.fill();

      model.groups.forEach((group) => {
        const arc = TAU / model.groups.length;
        const start = group.index * arc - Math.PI / 2 + time * 0.018;
        const locus = model.loci[group.locusIndices[0]];
        ctx.strokeStyle = hexToRgba(locus.color, 0.35 + group.weight * 0.38);
        ctx.lineWidth = Math.max(1, minSide * (0.002 + group.weight * 0.002));
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 1.22, start + 0.045, start + arc - 0.045);
        ctx.stroke();
      });

      ctx.fillStyle = "rgba(0, 0, 0, 0.98)";
      ctx.beginPath();
      ctx.ellipse(
        cx + interaction.yaw * coreRadius * 0.14,
        cy + interaction.pitch * coreRadius * 0.1,
        coreRadius * 0.52,
        coreRadius * 0.82,
        seedPhase * Math.PI,
        0,
        TAU,
      );
      ctx.fill();
      ctx.strokeStyle = "rgba(92, 242, 214, 0.5)";
      ctx.lineWidth = Math.max(0.8, minSide * 0.0018);
      ctx.stroke();

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = `700 ${Math.max(9, minSide * 0.018)}px ui-monospace, monospace`;
      ctx.fillStyle = "rgba(190, 225, 232, 0.62)";
      ctx.fillText(
        eventStrength > 0.1
          ? "MUTATION SHOCKWAVE"
          : "GENOME CORE · ORBITAL STABILITY",
        cx,
        height - Math.max(10, height * 0.026),
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
