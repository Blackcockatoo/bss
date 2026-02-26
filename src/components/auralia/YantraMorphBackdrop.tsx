import React, { useEffect, useRef } from 'react';

type YantraMorphBackdropProps = {
  width?: number;
  height?: number;
  energy: number;
  curiosity: number;
  bond: number;
  className?: string;
  reduceMotion?: boolean;
  isVisible?: boolean;
};

const PALETTE = [
  '#0b3c5d',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

const LUKAS = [2, 1, 3, 4, 7, 1, 8, 9, 7, 6, 3, 9];
const LUKAS_BOUNDS = (() => {
  const bounds = [0];
  let s = 0;
  for (const d of LUKAS) { s += d; bounds.push(s); }
  return bounds;
})();

const buildFib60 = (): number[] => {
  const digits: number[] = [];
  let a = 0;
  let b = 1;
  for (let i = 0; i < 60; i++) {
    digits.push(a % 10);
    const next = (a + b) % 10;
    a = b;
    b = next;
  }
  return digits;
};

const FIB60 = buildFib60();

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const sectorForIndex = (k: number): number => {
  for (let s = 0; s < 12; s++) {
    if (k >= LUKAS_BOUNDS[s] && k < LUKAS_BOUNDS[s + 1]) return s;
  }
  return 11;
};

export const YantraMorphBackdrop: React.FC<YantraMorphBackdropProps> = ({
  width = 420,
  height = 420,
  energy,
  curiosity,
  bond,
  className = '',
  reduceMotion = false,
  isVisible = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const drawPhyllo = (t: number, mix: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const count = 180; // Reduced from 260 for performance (30% reduction)
      const baseR = Math.min(width, height) * 0.48;
      const turn = Math.PI * (3 - Math.sqrt(5));
      const energyPulse = 0.6 + (energy / 100) * 0.4;

      for (let i = 0; i < count; i++) {
        const r = Math.sqrt(i / count) * baseR * mix;
        const angle = i * turn + t * 0.35;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const fib = FIB60[i % 60];
        const rgb = hexToRgb(PALETTE[fib % PALETTE.length]);
        const pulse = 0.35 + 0.6 * Math.sin(t * 0.8 + i * 0.07) * energyPulse;
        const R = clamp(Math.floor(rgb.r * pulse), 0, 255);
        const G = clamp(Math.floor(rgb.g * pulse), 0, 255);
        const B = clamp(Math.floor(rgb.b * pulse), 0, 255);
        ctx.fillStyle = `rgba(${R},${G},${B},${0.65 * mix})`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (pulse * 2), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawHexGrid = (t: number, mix: number) => {
      const radius = Math.min(width, height) * 0.04;
      const spacing = radius * 1.75;
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / (spacing * 0.87)) + 2;
      const offsetX = (width - cols * spacing) / 2;
      const offsetY = (height - rows * spacing * 0.87) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * spacing + (row % 2 ? spacing / 2 : 0);
          const y = offsetY + row * spacing * 0.87;
          const idx = row * cols + col;
          const fib = FIB60[idx % 60];
          const rgb = hexToRgb(PALETTE[fib % PALETTE.length]);
          const pulse = 0.55 + 0.35 * Math.sin(t * 1.2 + idx * 0.08 + curiosity / 22);
          const R = clamp(Math.floor(rgb.r * pulse), 0, 255);
          const G = clamp(Math.floor(rgb.g * pulse), 0, 255);
          const B = clamp(Math.floor(rgb.b * pulse), 0, 255);

          ctx.fillStyle = `rgba(${R},${G},${B},${0.12 * mix})`;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i + t * 0.08;
            const px = x + radius * Math.cos(a) * mix;
            const py = y + radius * Math.sin(a) * mix;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    };

    const drawYantra = (t: number, mix: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const baseR = Math.min(width, height) * 0.36 * mix;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.6;
      for (let i = 1; i <= 5; i++) {
        const r = baseR * (i / 5);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const levels = 7;
      for (let k = 0; k < levels; k++) {
        const r = baseR * (0.25 + 0.7 * k / (levels - 1));
        const fib = FIB60[(k * 7) % 60];
        ctx.strokeStyle = `${PALETTE[fib % PALETTE.length]}77`;
        const spin = t * 0.15 + k * 0.18;
        ctx.save();
        ctx.rotate(spin);
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = ((Math.PI * 2) / 3) * i - Math.PI / 2;
          const x = r * Math.cos(a);
          const y = r * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      const size1 = baseR * 0.92;
      const size2 = baseR * 0.58;
      const a = t * 0.25;
      ctx.save();
      ctx.rotate(a);
      const s1 = size1 / 2;
      const s2 = size2 / 2;
      const sq1 = [
        { x: -s1, y: -s1 }, { x: s1, y: -s1 }, { x: s1, y: s1 }, { x: -s1, y: s1 },
      ];
      const sq2 = [
        { x: -s2, y: -s2 }, { x: s2, y: -s2 }, { x: s2, y: s2 }, { x: -s2, y: s2 },
      ];
      const off = Math.PI / 8;
      const c = Math.cos(off);
      const s = Math.sin(off);
      const rot2 = sq2.map(p => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }));

      ctx.beginPath();
      sq1.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      rot2.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(sq1[i].x, sq1[i].y);
        ctx.lineTo(rot2[i].x, rot2[i].y);
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();
    };

    const drawHarmonicWeb = (t: number, mix: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const rings = 6;
      const maxR = Math.min(width, height) * 0.48 * mix;
      const ringPoints: { x: number; y: number; fib: number; L: number; }[][] = Array.from({ length: rings }, () => new Array(60));

      for (let ring = 0; ring < rings; ring++) {
        const baseR = maxR * (ring + 1) / rings;

        for (let j = 0; j < 60; j++) {
          const theta = (2 * Math.PI * j) / 60;
          const k = j;
          const fib = FIB60[k];
          const sector = sectorForIndex(k);
          const L = LUKAS[sector];

          const kH = 2 + (fib % 5);
          const amp = 0.16 + 0.03 * L;
          const phase = 0.3 * L;
          const wave = 1 + amp * Math.sin(kH * theta + 1.2 * t + phase + bond / 50);

          const radius = baseR * wave;
          const x = cx + radius * Math.cos(theta);
          const y = cy + radius * Math.sin(theta);
          ringPoints[ring][j] = { x, y, fib, L };

          const baseColor = PALETTE[fib % PALETTE.length];
          const rgb = hexToRgb(baseColor);
          const pulse = 0.55 + 0.35 * Math.sin(t * 2.4 + ring * 0.35 + j * 0.09);
          const R = clamp(Math.floor(rgb.r * pulse), 0, 255);
          const G = clamp(Math.floor(rgb.g * pulse), 0, 255);
          const B = clamp(Math.floor(rgb.b * pulse), 0, 255);
          const size = 1.6 + 1.6 * pulse;

          ctx.fillStyle = `rgba(${R},${G},${B},${0.72 * mix})`;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }

      for (let ring = 0; ring < rings; ring++) {
        ctx.beginPath();
        for (let j = 0; j < 60; j++) {
          const p = ringPoints[ring][j];
          if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255,255,255,${0.05 + 0.04 * ring})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      for (let j = 0; j < 60; j++) {
        ctx.beginPath();
        for (let ring = 0; ring < rings; ring++) {
          const p = ringPoints[ring][j];
          if (ring === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        const fib = FIB60[j];
        const col = PALETTE[fib % PALETTE.length];
        ctx.strokeStyle = `${col}45`;
        ctx.lineWidth = 0.45;
        ctx.stroke();
      }
    };

    let running = true;
    let rafId = 0;
    let lastFrameTime = 0;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms for 30fps

    const loop = (ts: number) => {
      if (!running) return;

      // Skip animation if reduce motion is enabled or not visible
      if (reduceMotion || !isVisible) {
        // Draw once with static time for reduce motion
        if (reduceMotion && lastFrameTime === 0) {
          const t = 0;
          ctx.clearRect(0, 0, width, height);
          const morph = 0.5;
          drawPhyllo(t, 1 - morph);
          drawHexGrid(t, morph * 0.65);
          drawYantra(t, morph * 0.72);
          drawHarmonicWeb(t, morph * 0.58);
          lastFrameTime = ts;
        }
        rafId = requestAnimationFrame(loop);
        return;
      }

      // FPS throttling: only render if enough time has passed
      const elapsed = ts - lastFrameTime;
      if (elapsed < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(loop);
        return; // Skip this frame
      }

      // Update lastFrameTime, accounting for any excess time
      lastFrameTime = ts - (elapsed % FRAME_INTERVAL);

      const t = ts / 1000;
      ctx.clearRect(0, 0, width, height);
      const morph = 0.5 + 0.5 * Math.sin(t * 0.38 + bond / 80);

      drawPhyllo(t, 1 - morph);
      drawHexGrid(t, morph * 0.65);
      drawYantra(t, morph * 0.72);
      drawHarmonicWeb(t, morph * 0.58);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [width, height, energy, curiosity, bond, reduceMotion, isVisible]);

  return <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none mix-blend-screen opacity-70 ${className}`} style={{ willChange: 'transform' }} aria-hidden="true" />;
};

export default YantraMorphBackdrop;
