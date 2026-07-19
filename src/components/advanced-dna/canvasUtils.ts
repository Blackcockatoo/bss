import type { DnaBase, DnaVisualModel, GeneLocus } from "./types";

export const TAU = Math.PI * 2;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

export function smoothstep(
  edge0: number,
  edge1: number,
  value: number,
): number {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized.slice(0, 6),
    16,
  );
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
}

export function drawStageBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accent = "#123356",
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.43,
    0,
    width * 0.5,
    height * 0.52,
    Math.max(width, height) * 0.72,
  );
  gradient.addColorStop(0, hexToRgba(accent, 0.2));
  gradient.addColorStop(0.42, "rgba(5, 13, 27, 0.96)");
  gradient.addColorStop(1, "rgba(1, 3, 9, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Shape language means base/state remains legible without colour perception. */
export function drawBaseMarker(
  ctx: CanvasRenderingContext2D,
  base: DnaBase,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1,
  fill = true,
): void {
  const size = Math.max(1.2, radius);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(0.75, size * 0.24);
  ctx.beginPath();

  if (base === "A") {
    ctx.arc(x, y, size, 0, TAU);
  } else if (base === "T") {
    ctx.moveTo(x, y - size * 1.15);
    ctx.lineTo(x + size, y + size * 0.82);
    ctx.lineTo(x - size, y + size * 0.82);
    ctx.closePath();
  } else if (base === "C") {
    ctx.moveTo(x, y - size * 1.15);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size * 1.15);
    ctx.lineTo(x - size, y);
    ctx.closePath();
  } else {
    ctx.rect(x - size * 0.82, y - size * 0.82, size * 1.64, size * 1.64);
  }

  if (fill) ctx.fill();
  else ctx.stroke();

  if (base === "G") {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y);
    ctx.lineTo(x + size * 0.5, y);
    ctx.moveTo(x, y - size * 0.5);
    ctx.lineTo(x, y + size * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGeneLabel(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color: string,
  size: number,
  alpha = 1,
): void {
  ctx.save();
  ctx.font = `700 ${Math.max(8, size)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(2, size * 0.28);
  ctx.strokeStyle = `rgba(1, 4, 12, ${0.82 * alpha})`;
  ctx.strokeText(value, x, y);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillText(value, x, y);
  ctx.restore();
}

export function selectLoci(
  model: DnaVisualModel,
  density: number,
  densityScale: number,
  minimum = 36,
): GeneLocus[] {
  const target = Math.max(
    Math.min(minimum, model.loci.length),
    Math.round(model.loci.length * clamp(density, 0.15, 1) * densityScale),
  );
  if (target >= model.loci.length) return model.loci;

  const selected: GeneLocus[] = [];
  for (let index = 0; index < target; index += 1) {
    selected.push(model.loci[Math.floor((index * model.loci.length) / target)]);
  }
  return selected;
}

export type Point3 = { x: number; y: number; z: number };

export function rotatePoint3(
  point: Point3,
  yaw: number,
  pitch: number,
): Point3 {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;
  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  return {
    x: x1,
    y: point.y * cosX - z1 * sinX,
    z: point.y * sinX + z1 * cosX,
  };
}

export function projectPoint3(
  point: Point3,
  centerX: number,
  centerY: number,
  focalLength: number,
  cameraDistance: number,
): { x: number; y: number; scale: number; z: number } {
  const denominator = Math.max(0.3, cameraDistance - point.z);
  const scale = focalLength / denominator;
  return {
    x: centerX + point.x * scale,
    y: centerY + point.y * scale,
    scale,
    z: point.z,
  };
}

export function pulseStrength(startedAt: number, time: number): number {
  if (startedAt < 0) return 0;
  const age = time - startedAt;
  if (age < 0 || age > 1.25) return 0;
  return (1 - age / 1.25) * Math.sin(Math.min(1, age * 5) * Math.PI * 0.5);
}
