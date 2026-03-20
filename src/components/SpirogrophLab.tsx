"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, RotateCcw, Zap } from "lucide-react";
import { useStore } from "@/lib/store";

const VIEW_W = 1000;
const VIEW_H = 1000;

interface ControlState {
  outerTeeth: number;
  innerTeeth: number;
  penOffset: number;
  pointCount: number;
  toothDepth: number;
  density: number;
  strokeWidth: number;
  glow: number;
  hueSpin: number;
  shapeMode: "classic" | "star" | "gear" | "flower" | "crystal" | "spiral" | "mandala" | "wave" | "hyperbolic" | "tribal" | "ethereal" | "cosmic";
  phase: number;
}

function fract(n: number) {
  return n - Math.floor(n);
}

function gcd(a: number, b: number) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function shapeWarp(theta: number, mode: string, points: number, depth: number) {
  const d = depth;
  switch (mode) {
    case "star":
      return 1 + d * Math.sign(Math.cos(points * theta)) * 0.38 + d * 0.12 * Math.cos(points * theta * 2);
    case "gear":
      return 1 + d * Math.pow(Math.abs(Math.cos(points * theta)), 0.28) * Math.sign(Math.cos(points * theta)) * 0.55;
    case "flower":
      return 1 + d * Math.cos(points * theta) * 0.5 + d * 0.1 * Math.cos(points * theta * 3);
    case "crystal":
      return 1 + d * Math.sign(Math.sin(points * theta)) * 0.24 + d * Math.cos(points * theta * 2) * 0.32;
    case "spiral":
      return 1 + d * Math.sin(points * theta * 0.5) * 0.35 + d * Math.cos(points * theta) * 0.15;
    case "mandala":
      return 1 + d * (Math.cos(points * theta) * 0.4 + Math.cos(points * theta * 3) * 0.2 + Math.cos(points * theta * 5) * 0.1);
    case "wave":
      return 1 + d * Math.sin(points * theta) * 0.45 + d * Math.sin(points * theta * 2.5) * 0.15;
    case "hyperbolic":
      return 1 + d * Math.tanh(Math.cos(points * theta) * 2.5) * 0.5;
    case "tribal":
      const tri = Math.sin(points * theta * Math.PI) > 0 ? 1 : -1;
      return 1 + d * tri * (0.3 + 0.15 * Math.cos(points * theta * 3));
    case "ethereal":
      return 1 + d * Math.pow(Math.abs(Math.sin(points * theta)), 1.5) * 0.4 + d * Math.cos(points * theta * 0.5) * 0.15;
    case "cosmic":
      return 1 + d * (Math.sin(points * theta) * Math.cos(points * theta * 2) * 0.35 + Math.sin(points * theta * 3) * 0.2);
    default:
      return 1;
  }
}

function buildSpiroPath(cfg: ControlState) {
  const cx = 500;
  const cy = 500;
  const R = 300;
  const r = Math.max(8, R * (cfg.innerTeeth / cfg.outerTeeth));
  const d = r * (cfg.penOffset / 100);
  const loops = cfg.innerTeeth / gcd(cfg.outerTeeth, cfg.innerTeeth);
  const maxT = Math.PI * 2 * loops;
  const steps = cfg.density;
  const pointCount = cfg.pointCount;
  const toothDepth = cfg.toothDepth / 100;

  let path = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxT;
    const xBase = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const yBase = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    const angle = Math.atan2(yBase, xBase);
    const warp = shapeWarp(t + cfg.phase, cfg.shapeMode, pointCount, toothDepth);
    const extraTwist = shapeWarp(angle * 0.75 + cfg.phase * 0.8, cfg.shapeMode, Math.max(1, pointCount - 1), toothDepth * 0.65);
    const radius = Math.hypot(xBase, yBase) * (0.72 * warp + 0.28 * extraTwist);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    path += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return { path: path.trim(), loops, ratio: (cfg.outerTeeth / cfg.innerTeeth).toFixed(3) };
}

export default function SpirogrophLab() {
  const genome = useStore((state) => state.genome);
  const svgRef = useRef<SVGSVGElement>(null);
  const filterRef = useRef<SVGFEGaussianBlurElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);
  const [animating, setAnimating] = useState(false);
  const animationIdRef = useRef<number | null>(null);

  const [controls, setControls] = useState<ControlState>({
    outerTeeth: 144,
    innerTeeth: 63,
    penOffset: 68,
    pointCount: 9,
    toothDepth: 28,
    density: 5000,
    strokeWidth: 1.25,
    glow: 8,
    hueSpin: 210,
    shapeMode: "classic",
    phase: 0,
  });

  const spiroData = useMemo(() => buildSpiroPath(controls), [controls]);

  const updateControl = useCallback((key: keyof ControlState, value: number | string) => {
    setControls((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? value : value,
    }));
  }, []);

  const randomize = useCallback(() => {
    // Use pet genome as seed for deterministic randomness per pet
    let seed = 12345;
    if (genome) {
      // Create a simple numeric seed from the genome
      for (let i = 0; i < Math.min(60, genome.red60?.length || 0); i++) {
        seed = ((seed << 5) - seed) + (genome.red60?.[i] || 0);
        seed = seed & seed; // Convert to 32bit integer
      }
    }

    // Seeded random function
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const randomBetween = (min: number, max: number, step = 1) => {
      const v = min + seededRandom() * (max - min);
      return Math.round(v / step) * step;
    };
    const modes: ControlState["shapeMode"][] = ["classic", "star", "gear", "flower", "crystal", "spiral", "mandala", "wave", "hyperbolic", "tribal", "ethereal", "cosmic"];

    setControls((prev) => ({
      ...prev,
      outerTeeth: randomBetween(72, 220),
      innerTeeth: randomBetween(18, Math.max(24, prev.outerTeeth - 12)),
      penOffset: randomBetween(20, 98),
      pointCount: randomBetween(3, 20),
      toothDepth: randomBetween(8, 78),
      density: randomBetween(2200, 9200, 50),
      strokeWidth: randomBetween(0.4, 4, 0.1),
      glow: randomBetween(2, 16),
      hueSpin: randomBetween(0, 360),
      shapeMode: modes[Math.floor(seededRandom() * modes.length)],
    }));
  }, [genome]);

  const toggleAnimate = useCallback(() => {
    if (animating) {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
      setAnimating(false);
      return;
    }

    setAnimating(true);
    const animate = () => {
      setControls((prev) => ({ ...prev, phase: prev.phase + 0.012 }));
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, [animating]);

  const exportSVG = useCallback(() => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1000");
    clone.setAttribute("height", "1000");

    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spirograph-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.setAttribute("stdDeviation", String(controls.glow));
    }
    if (gradientRef.current) {
      gradientRef.current.setAttribute("gradientTransform", `rotate(${controls.hueSpin} 0.5 0.5)`);
    }
  }, [controls.glow, controls.hueSpin]);

  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  const innerTeethMax = Math.max(Math.min(controls.innerTeeth, controls.outerTeeth - 1), 1);

  return (
    <div className="w-full space-y-4 md:space-y-6 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 lg:space-y-0">
      {/* Canvas Panel */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4 shadow-lg md:rounded-[2rem] md:p-6">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full aspect-square rounded-xl md:rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900"
        >
          <defs>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur ref={filterRef} stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient ref={gradientRef} id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="1000" height="1000" fill="transparent" />
          <path
            d={spiroData.path}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth={controls.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
            opacity="0.95"
          />
        </svg>

        {/* Mobile HUD */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs md:text-sm text-white/70">
          <span className="font-mono">
            ratio {spiroData.ratio} · {spiroData.loops} loops
          </span>
          <span className="text-xs">{controls.shapeMode}</span>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="space-y-3 md:space-y-4">
        {/* Control Sections */}
        <div className="grid gap-3 md:gap-4">
          {/* Core Ratio */}
          <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3 md:p-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">Core Ratio</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Outer teeth</label>
                <span className="text-cyan-400 font-mono">{controls.outerTeeth}</span>
              </div>
              <input
                type="range"
                min="48"
                max="240"
                value={controls.outerTeeth}
                onChange={(e) => updateControl("outerTeeth", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Inner teeth</label>
                <span className="text-cyan-400 font-mono">{innerTeethMax}</span>
              </div>
              <input
                type="range"
                min="12"
                max={controls.outerTeeth - 1}
                value={innerTeethMax}
                onChange={(e) => updateControl("innerTeeth", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Pen offset</label>
                <span className="text-cyan-400 font-mono">{controls.penOffset}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={controls.penOffset}
                onChange={(e) => updateControl("penOffset", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* Shape Mischief */}
          <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3 md:p-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">Shape Mischief</h3>

            <div className="space-y-2">
              <label className="text-xs">Mode</label>
              <select
                value={controls.shapeMode}
                onChange={(e) => updateControl("shapeMode", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="classic">Classic</option>
                <option value="star">Star</option>
                <option value="gear">Gear</option>
                <option value="flower">Flower</option>
                <option value="crystal">Crystal</option>
                <option value="spiral">Spiral</option>
                <option value="mandala">Mandala</option>
                <option value="wave">Wave</option>
                <option value="hyperbolic">Hyperbolic</option>
                <option value="tribal">Tribal</option>
                <option value="ethereal">Ethereal</option>
                <option value="cosmic">Cosmic</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Point count</label>
                <span className="text-cyan-400 font-mono">{controls.pointCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="36"
                value={controls.pointCount}
                onChange={(e) => updateControl("pointCount", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Tooth depth</label>
                <span className="text-cyan-400 font-mono">{controls.toothDepth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={controls.toothDepth}
                onChange={(e) => updateControl("toothDepth", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Line density</label>
                <span className="text-cyan-400 font-mono">{controls.density}</span>
              </div>
              <input
                type="range"
                min="800"
                max="12000"
                step="50"
                value={controls.density}
                onChange={(e) => updateControl("density", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* Finish */}
          <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3 md:p-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">Finish</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Stroke width</label>
                <span className="text-cyan-400 font-mono">{controls.strokeWidth.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="4"
                step="0.1"
                value={controls.strokeWidth}
                onChange={(e) => updateControl("strokeWidth", parseFloat(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Glow</label>
                <span className="text-cyan-400 font-mono">{controls.glow}</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                value={controls.glow}
                onChange={(e) => updateControl("glow", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label>Hue spin</label>
                <span className="text-cyan-400 font-mono">{controls.hueSpin}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={controls.hueSpin}
                onChange={(e) => updateControl("hueSpin", parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
          <button
            onClick={randomize}
            className="rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden md:inline">Randomize</span>
            <span className="md:hidden">Random</span>
          </button>

          <button
            onClick={toggleAnimate}
            className="rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-lg">{animating ? "⏸" : "▶"}</span>
            <span className="hidden md:inline">{animating ? "Pause" : "Animate"}</span>
          </button>

          <button
            onClick={exportSVG}
            className="rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>

        {/* Info */}
        <p className="text-xs leading-relaxed text-white/50 px-1">
          Weird magic lives in ratios. Try outer 168, inner 65, point count 11, then switch to <em>Gear</em> or <em>Crystal</em>.
        </p>
      </div>
    </div>
  );
}
