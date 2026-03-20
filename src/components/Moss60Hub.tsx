'use client';

/**
 * Moss60Hub — MOSS60 Layered Cryptographic Platform
 * Tabs: Glyph | QR Cipher | Serpent Protocol | Reality | Network | Security
 *
 * Glyph canvas ported from moss60-ultimate.html
 * Crypto functions reuse src/lib/qr-messaging/crypto.ts
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { QRGenerator } from './QRMessaging/QRGenerator';
import {
  moss60Hash,
  generateKeyPair,
  computeSharedSecret,
  deriveKeys,
  encrypt,
  decrypt,
  PHI,
  PRIMES,
} from '@/lib/qr-messaging/crypto';
import {
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Orbit,
  Layers,
  ShieldCheck,
  BookOpen,
  Dna,
  Sparkles,
} from 'lucide-react';
import { CrystallineNetwork } from './CrystallineNetwork';
import { CrystallineLattice } from './CrystallineLattice';
import SpirogrophLab from './SpirogrophLab';
import { trackEvent } from '@/lib/analytics';
import type { PetSaveData } from '@/lib/persistence/indexeddb';
import { getAllPets } from '@/lib/persistence/indexeddb';
import { useStore } from '@/lib/store';
import {
  deriveMoss60PetProfile,
  matchMoss60Genome,
  type Moss60PetProfile,
  type Moss60PetStrandKey,
} from '@/lib/moss60/petProfile';
import {
  createMoss60VerifiablePayload,
  createShareUrl,
  type Moss60ShareMetadata,
} from '@/lib/moss60/share';

// ─── Glyph Canvas ─────────────────────────────────────────────────────────────

const COLOR_SCHEMES: Record<string, [string, string][]> = {
  Spectral:      [['#ff6b6b','#48dbfb'], ['#ff9ff3','#00d2d3'], ['#54a0ff','#5f27cd']],
  Golden:        [['#ffd32a','#ff9f43'], ['#ffdd59','#ff6b6b'], ['#ffeaa7','#fdcb6e']],
  Cyberpunk:     [['#00f2fe','#ff00fc'], ['#0abde3','#ee5a24'], ['#00d2d3','#ff6b6b']],
  Consciousness: [['#a29bfe','#55efc4'], ['#fd79a8','#6c5ce7'], ['#00cec9','#a29bfe']],
  Fire:          [['#ff6b6b','#ffeaa7'], ['#ff7675','#fdcb6e'], ['#e17055','#fab1a0']],
  Ocean:         [['#0984e3','#00cec9'], ['#74b9ff','#0abde3'], ['#81ecec','#636e72']],
};

const GLYPH_VARIANTS = ['Pulse', 'Prism', 'Cascade'] as const;

const STUDIO_PRESETS: Array<{
  name: string;
  scheme: string;
  variant: (typeof GLYPH_VARIANTS)[number];
  focus: Moss60PetStrandKey;
}> = [
  { name: 'Core Glyph', scheme: 'Consciousness', variant: 'Pulse', focus: 'combined' },
  { name: 'Fire Thread', scheme: 'Fire', variant: 'Prism', focus: 'red' },
  { name: 'Water Thread', scheme: 'Ocean', variant: 'Cascade', focus: 'blue' },
];

const GLYPH_FOCUS_OPTIONS: Array<{
  key: Moss60PetStrandKey;
  label: string;
  helper: string;
}> = [
  { key: 'combined', label: 'Combined', helper: 'All three pet strands braided together.' },
  { key: 'red', label: 'Red strand', helper: 'Action and motion layer from the pet genome.' },
  { key: 'blue', label: 'Blue strand', helper: 'Pattern and memory layer from the pet genome.' },
  { key: 'black', label: 'Black strand', helper: 'Grounding and archive layer from the pet genome.' },
  { key: 'security', label: 'Security braid', helper: 'Pet genome mixed with crest + hepta proof layers.' },
];

type Projection =
  | 'flat'
  | 'sphere'
  | 'torus'
  | 'hyperbolic'
  | 'helix'
  | 'cube'
  | 'petal';

const PROJECTION_OPTIONS: Array<{
  value: Projection;
  label: string;
  helper: string;
}> = [
  { value: 'sphere', label: 'Sphere', helper: 'Wrap the pet code over a globe.' },
  { value: 'torus', label: 'Torus', helper: 'Thread the code through a donut loop.' },
  { value: 'hyperbolic', label: 'Hyperbolic', helper: 'Spread the structure into a curved disk.' },
  { value: 'helix', label: 'Helix tower', helper: 'Stack the pet code into a vertical coil.' },
  { value: 'cube', label: 'Crystal cube', helper: 'Pin the sequence to six mirrored faces.' },
  { value: 'petal', label: 'Petal bloom', helper: 'Turn the code into a living floral field.' },
  { value: 'flat', label: 'Flat spiral', helper: 'See the raw spiral before projection.' },
];

function formatCodeLine(value: string, groupSize = 5, maxGroups = 6): string {
  return (
    value.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.slice(0, maxGroups).join(' ') ??
    value
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function GlyphCanvas({
  seed,
  scheme,
  animating,
  variant,
  seedHashOverride,
  onCanvasReady,
}: {
  seed: string;
  scheme: string;
  animating: boolean;
  variant: (typeof GLYPH_VARIANTS)[number];
  seedHashOverride?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const timeRef   = useRef<number>(0);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const variantConfig = {
      Pulse: { speed: 0.0006, wobble: 0.12, alpha: 0.55 },
      Prism: { speed: 0.001, wobble: 0.18, alpha: 0.72 },
      Cascade: { speed: 0.00045, wobble: 0.08, alpha: 0.45 },
    }[variant];
    const baseR = Math.min(W, H) * 0.34;

    const pairs = COLOR_SCHEMES[scheme] ?? COLOR_SCHEMES['Spectral'];
    const hash = seedHashOverride ?? (seed ? moss60Hash(seed) : 'deadbeef');
    const hashVal = parseInt(hash.slice(0, 4), 16) / 0xffff;
    const hashDigits = Array.from(hash.slice(0, 12), char => Number.parseInt(char, 16) || 0);

    const backdrop = ctx.createRadialGradient(cx, cy, baseR * 0.1, cx, cy, baseR * 1.45);
    backdrop.addColorStop(0, 'rgba(10, 18, 32, 0.96)');
    backdrop.addColorStop(0.55, 'rgba(4, 13, 28, 0.88)');
    backdrop.addColorStop(1, 'rgba(2, 6, 23, 0.18)');
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
    ctx.fillRect(0, 0, W, H);

    // Generate 60 points along a PHI spiral
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI * PHI + time * variantConfig.speed;
      const wobble =
        1 +
        variantConfig.wobble * Math.sin(i * PHI * 0.5 + time * 0.001) +
        (hashDigits[i % hashDigits.length] / 40) * Math.cos(i * 0.7 + time * 0.0004);
      const r = baseR * wobble;
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }

    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = baseR * (0.48 + ring * 0.22);
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = pairs[ring % pairs.length][0];
      ctx.globalAlpha = 0.08 + ring * 0.05;
      ctx.lineWidth = 1 + ring * 0.35;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw connections between prime-indexed points
    for (let i = 0; i < 60; i++) {
      if (!PRIMES.has(i)) continue;
      for (let step = 1; step <= 3; step++) {
        const j = (i + step * (5 + (hashDigits[i % hashDigits.length] % 4))) % 60;
        const t = (i / 60 + hashVal) % 1;
        const pairIdx = Math.floor(t * pairs.length) % pairs.length;
        const [ca, cb] = pairs[pairIdx];
        const alpha = 0.15 + variantConfig.alpha * Math.abs(Math.sin(time * 0.0008 + i * 0.3));
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.strokeStyle = lerpColor(ca, cb, t);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = step === 1 ? 2.1 : 0.95;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Draw point dots
    for (let i = 0; i < 60; i++) {
      const isPrime = PRIMES.has(i);
      const t = i / 60;
      const pairIdx = Math.floor(t * pairs.length) % pairs.length;
      const [ca, cb] = pairs[pairIdx];
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, isPrime ? 5.2 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = lerpColor(ca, cb, t);
      ctx.globalAlpha = isPrime ? 0.9 : 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 28 + hashDigits[0], 0, Math.PI * 2);
    ctx.strokeStyle = lerpColor(pairs[0][0], pairs[pairs.length - 1][1], hashVal);
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [seed, scheme, seedHashOverride, variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    onCanvasReady?.(canvas ?? null);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (animating) {
      const loop = (t: number) => {
        timeRef.current = t;
        draw(t);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      draw(timeRef.current);
    }
  }, [animating, draw, onCanvasReady]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        className="h-auto w-full max-w-[440px] rounded-[28px] border border-cyan-400/20 bg-[#020612] shadow-[0_0_80px_rgba(34,211,238,0.12)]"
      />
    </div>
  );
}

// ─── Serpent Protocol Tab ─────────────────────────────────────────────────────

function SerpentTab() {
  const [seed, setSeed]             = useState('');
  const [myPub, setMyPub]           = useState('');
  const [myPriv, setMyPriv]         = useState<number[]>([]);
  const [partnerPub, setPartnerPub] = useState('');
  const [sharedReady, setSharedReady] = useState(false);
  const [encKey, setEncKey]         = useState<number[]>([]);
  const [decKey, setDecKey]         = useState<number[]>([]);
  const [msgCount, setMsgCount]     = useState(0);
  const [plaintext, setPlaintext]   = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [decInput, setDecInput]     = useState('');
  const [decOutput, setDecOutput]   = useState('');

  function genKeys() {
    if (!seed.trim()) return;
    const kp = generateKeyPair(seed.trim());
    setMyPriv(kp.private);
    setMyPub(kp.public);
    setSharedReady(false);
  }

  function handshake() {
    if (!partnerPub.trim() || myPriv.length === 0) return;
    const shared = computeSharedSecret(myPriv, partnerPub.trim());
    const { encryptionKey, decryptionKey } = deriveKeys(shared);
    setEncKey(encryptionKey);
    setDecKey(decryptionKey);
    setSharedReady(true);
  }

  function encryptMsg() {
    if (!sharedReady || !plaintext.trim()) return;
    const ct = encrypt(plaintext, encKey, msgCount);
    setCiphertext(ct);
    setMsgCount(c => c + 1);
  }

  function decryptMsg() {
    if (!sharedReady || !decInput.trim()) return;
    try {
      const pt = decrypt(decInput.trim(), decKey, msgCount > 0 ? msgCount - 1 : 0);
      setDecOutput(pt);
    } catch {
      setDecOutput('⚠ Decryption failed — wrong key or corrupted data');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">Alice–Bob key exchange. Generate your keypair, share your public key, enter your partner's public key, then encrypt/decrypt messages.</p>

      {/* Step 1 */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"><Key className="w-3 h-3" /> 1 — Generate Your Keypair</p>
        <div className="flex gap-2">
          <input
            value={seed}
            onChange={e => setSeed(e.target.value)}
            placeholder="Your secret seed phrase..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button size="sm" onClick={genKeys} disabled={!seed.trim()}>Generate</Button>
        </div>
        {myPub && (
          <div>
            <p className="text-[10px] text-zinc-500 mb-1">Your Public Key (share this):</p>
            <p className="font-mono text-[10px] text-cyan-300 break-all bg-slate-950/60 p-2 rounded-lg">{myPub.slice(0, 64)}…</p>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> 2 — Enter Partner's Public Key</p>
        <div className="flex gap-2">
          <input
            value={partnerPub}
            onChange={e => setPartnerPub(e.target.value)}
            placeholder="Paste partner public key..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button size="sm" onClick={handshake} disabled={!partnerPub.trim() || myPriv.length === 0}>Handshake</Button>
        </div>
        {sharedReady && <p className="text-xs text-emerald-400">✓ Shared secret established</p>}
      </div>

      {/* Encrypt */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Encrypt</p>
        <textarea
          value={plaintext}
          onChange={e => setPlaintext(e.target.value)}
          placeholder="Message to encrypt..."
          rows={2}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
        <Button size="sm" onClick={encryptMsg} disabled={!sharedReady || !plaintext.trim()} className="w-full">Encrypt</Button>
        {ciphertext && (
          <p className="font-mono text-[10px] text-amber-300 break-all bg-slate-950/60 p-2 rounded-lg">{ciphertext}</p>
        )}
      </div>

      {/* Decrypt */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"><Unlock className="w-3 h-3" /> Decrypt</p>
        <textarea
          value={decInput}
          onChange={e => setDecInput(e.target.value)}
          placeholder="Paste ciphertext to decrypt..."
          rows={2}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
        <Button size="sm" onClick={decryptMsg} disabled={!sharedReady || !decInput.trim()} className="w-full">Decrypt</Button>
        {decOutput && (
          <p className="text-sm text-emerald-300 bg-slate-950/60 p-2 rounded-lg">{decOutput}</p>
        )}
      </div>
    </div>
  );
}

// ─── Reality Canvas (3D projections) ─────────────────────────────────────────

function RealityCanvas({ seed, projection }: { seed: string; projection: Projection }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    let rotX = 0;
    let rotY = 0;
    const digits = seed
      .split('')
      .map(value => Number.parseInt(value, 10))
      .filter(value => Number.isFinite(value));
    const safeDigits = digits.length > 0 ? digits : [0, 1, 2, 3, 4, 5];
    const petalCount = 4 + (safeDigits[0] % 5);

    function project(x: number, y: number, z: number): { x: number; y: number; alpha: number } {
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;
      const fov = 400;
      const scale = fov / (fov + z2 + 200);
      return { x: cx + x2 * scale, y: cy + y1 * scale, alpha: 0.3 + 0.7 * scale };
    }

    function flatPoint(i: number, t: number) {
      const angle = (i / 60) * 2 * Math.PI * PHI + t * 0.0006;
      const r = 95 + safeDigits[i % safeDigits.length] * 6 + 18 * Math.sin(i * 0.5 + t * 0.0008);
      return { x: r * Math.cos(angle), y: r * Math.sin(angle), z: 0 };
    }

    function spherePoint(i: number, t: number) {
      const theta = ((i + safeDigits[(i + 7) % safeDigits.length]) / 60) * Math.PI;
      const phi = (i / 60) * 2 * Math.PI * PHI + t * 0.0006;
      const radius = 110 + safeDigits[(i + 13) % safeDigits.length] * 2.5;
      return {
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
      };
    }

    function torusPoint(i: number, t: number) {
      const u = (i / 60) * 2 * Math.PI + t * 0.0006;
      const v = (i / 60) * 2 * Math.PI * (2 + (safeDigits[1] % 4));
      const outer = 78 + safeDigits[(i + 5) % safeDigits.length] * 2.2;
      const inner = 26 + safeDigits[(i + 11) % safeDigits.length] * 1.3;
      return {
        x: (outer + inner * Math.cos(v)) * Math.cos(u),
        y: (outer + inner * Math.cos(v)) * Math.sin(u),
        z: inner * Math.sin(v),
      };
    }

    function hyperbolicPoint(i: number, t: number) {
      const angle = (i / 60) * 2 * Math.PI * PHI + t * 0.0006;
      const rPoincare = 0.86 * (1 - 1 / (1 + (i + safeDigits[i % safeDigits.length]) / 10));
      const x = rPoincare * Math.cos(angle);
      const y = rPoincare * Math.sin(angle);
      return { x: x * 145, y: y * 145, z: (i / 60 - 0.5) * 90 };
    }

    function helixPoint(i: number, t: number) {
      const angle = i * 0.48 + t * 0.0007;
      const radius = 42 + safeDigits[i % safeDigits.length] * 5;
      return {
        x: radius * Math.cos(angle),
        y: ((i / 60) - 0.5) * 220,
        z: radius * Math.sin(angle) + Math.sin(angle * 1.6) * 14,
      };
    }

    function cubePoint(i: number, t: number) {
      const face = i % 6;
      const u = (safeDigits[i % safeDigits.length] / 9 - 0.5) * 2;
      const v = (safeDigits[(i + 9) % safeDigits.length] / 9 - 0.5) * 2;
      const offset = 102 + Math.sin(t * 0.0006 + i * 0.5) * 4;
      switch (face) {
        case 0:
          return { x: offset, y: u * offset, z: v * offset };
        case 1:
          return { x: -offset, y: u * offset, z: v * offset };
        case 2:
          return { x: u * offset, y: offset, z: v * offset };
        case 3:
          return { x: u * offset, y: -offset, z: v * offset };
        case 4:
          return { x: u * offset, y: v * offset, z: offset };
        default:
          return { x: u * offset, y: v * offset, z: -offset };
      }
    }

    function petalPoint(i: number, t: number) {
      const angle = (i / 60) * 2 * Math.PI + t * 0.0004;
      const bloom =
        72 +
        safeDigits[(i + 3) % safeDigits.length] * 3.5 +
        38 * Math.sin(petalCount * angle + safeDigits[(i + 17) % safeDigits.length] * 0.12);
      return {
        x: bloom * Math.cos(angle),
        y: bloom * Math.sin(angle),
        z: 42 * Math.cos(angle * petalCount * 0.5 + safeDigits[i % safeDigits.length] * 0.18),
      };
    }

    function getPoint(i: number, t: number) {
      switch (projection) {
        case 'sphere':
          return spherePoint(i, t);
        case 'torus':
          return torusPoint(i, t);
        case 'hyperbolic':
          return hyperbolicPoint(i, t);
        case 'helix':
          return helixPoint(i, t);
        case 'cube':
          return cubePoint(i, t);
        case 'petal':
          return petalPoint(i, t);
        default:
          return flatPoint(i, t);
      }
    }

    const loop = (time: number) => {
      rotX = time * 0.0003;
      rotY = time * 0.0005;

      const background = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
      background.addColorStop(0, 'rgba(11, 17, 32, 0.98)');
      background.addColorStop(0.55, 'rgba(5, 10, 22, 0.78)');
      background.addColorStop(1, 'rgba(2, 6, 18, 0.18)');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, W, H);

      const pts = Array.from({ length: 60 }, (_, i) => {
        const p3 = getPoint(i, time);
        const p2 = project(p3.x, p3.y, p3.z);
        return p2;
      });

      for (let i = 0; i < 60; i++) {
        if (!PRIMES.has(i)) continue;
        const j =
          (i + 1 + safeDigits[(i + 7) % safeDigits.length] + safeDigits[(i + 13) % safeDigits.length]) % 60;
        const hue = (i * 9 + safeDigits[i % safeDigits.length] * 18) % 360;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `hsl(${hue}, 82%, 66%)`;
        ctx.globalAlpha = (pts[i].alpha + pts[j].alpha) * 0.32;
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < 60; i++) {
        const hue = (safeDigits[(i + 5) % safeDigits.length] * 26 + i * 5) % 360;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, PRIMES.has(i) ? 4.8 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, 84%, 70%)`;
        ctx.globalAlpha = pts[i].alpha * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [projection, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={420}
      className="mx-auto block h-auto w-full max-w-[440px] rounded-[28px] border border-cyan-400/20 bg-[#020612] shadow-[0_0_70px_rgba(34,211,238,0.10)]"
    />
  );
}

// ─── Security Learning Panel ──────────────────────────────────────────────────

const SECURITY_LAYERS = [
  {
    id: 'hashing',
    icon: '🔐',
    title: 'Hash Avalanche',
    summary: 'One tiny edit scrambles the full 60-step fingerprint.',
    detail:
      'MOSS60 hashing keeps remixing the input across 60 positions. Each round folds the message into multiple strand states, rotates the bits, and multiplies by primes. That repeated remixing is why even a one-character edit produces a radically different final digest.',
    strength: 'Diffusion',
  },
  {
    id: 'signatures',
    icon: '🪪',
    title: 'Crest Signatures',
    summary: 'The pet crest signs vault, rotation, tail, and timestamp together.',
    detail:
      'A crest is not just decoration. It packages the pet identity fields and signs them with an HMAC. If any part of the crest changes after signing, verification fails. This teaches integrity: the receiver can check whether the identity packet stayed intact in transit.',
    strength: 'Integrity',
  },
  {
    id: 'hepta',
    icon: '⑦',
    title: 'Hepta Redundancy',
    summary: 'The 42-digit hepta layer adds structured error correction.',
    detail:
      'The hepta code is encoded in base 7 and carries extra redundancy. That means the system can often detect or repair small transcription mistakes instead of silently accepting a damaged packet. In classroom terms: it behaves like a checksum plus correction hints wrapped into the code itself.',
    strength: 'Error checks',
  },
  {
    id: 'keypair',
    icon: '🗝️',
    title: 'Key Derivation',
    summary: 'Keys are stretched through repeated one-way hashing rounds.',
    detail:
      'Key material is not taken straight from the phrase. MOSS60 pushes the seed through several rounds of hashing and reshaping before a public key is exposed. That makes the public output useful for exchange while keeping the private spiral hidden.',
    strength: 'One-way stretch',
  },
  {
    id: 'exchange',
    icon: '🤝',
    title: 'Prime-Aware Exchange',
    summary: 'Shared secrets change their math at prime-indexed positions.',
    detail:
      'Key exchange does not treat every index equally. Prime positions use a stronger golden-ratio mix while non-prime positions use a simpler modular blend. This gives the same secret only to both valid participants while making reverse engineering harder from public data alone.',
    strength: 'Layered mix',
  },
  {
    id: 'temporal',
    icon: '⏳',
    title: 'Temporal Rotation',
    summary: 'Message keys evolve so old ciphertext does not stay reusable.',
    detail:
      'Each message can advance the key using the Lucas sequence. That means message 10 is encrypted with a different keystream from message 1 even if the shared secret started the same. Replay attacks become less useful because the timeline itself changes the cipher.',
    strength: 'Freshness',
  },
  {
    id: 'topology',
    icon: '🕸️',
    title: 'Small-World Topology',
    summary: 'Prime bridges let information spread quickly across the whole system.',
    detail:
      'The 60-node graph is deliberately wired so that local neighborhoods stay coherent while prime-distance bridges jump far across the structure. That balance gives strong mixing: local detail is preserved, but changes can still ripple everywhere in only a few hops.',
    strength: 'Coverage',
  },
  {
    id: 'philosophy',
    icon: '🧬',
    title: 'Defence in Depth',
    summary: 'No single layer carries the entire trust model.',
    detail:
      'The safest lesson here is architectural: hashing, signatures, redundancy, topology, and temporal evolution all do different jobs. A robust system does not ask one clever trick to do everything. It stacks narrower mechanisms so failure in one place does not collapse the whole design.',
    strength: 'Architecture',
  },
] as const;

function SecurityLearningPanel({ profile }: { profile: Moss60PetProfile }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [demoInput, setDemoInput] = useState(profile.securityLessonInput);
  const [demoHash, setDemoHash] = useState('');
  const [demoHash2, setDemoHash2] = useState('');

  function runHashDemo() {
    const trimmed = demoInput.trim();
    if (!trimmed) return;

    setDemoHash(moss60Hash(trimmed));
    const lastChar = trimmed.slice(-1);
    const flippedChar = String.fromCharCode(lastChar.charCodeAt(0) ^ 1);
    const flipped = trimmed.length > 1 ? `${trimmed.slice(0, -1)}${flippedChar}` : flippedChar;
    setDemoHash2(moss60Hash(flipped));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-cyan-300" />
        <div>
          <h3 className="text-base font-semibold text-white">Security Model</h3>
          <p className="text-sm text-zinc-300">
            Learn the protection stack using the active pet&apos;s own code instead of a generic demo string.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Pet Proof Trail</p>
          <p className="mt-3 text-sm font-medium text-white">{profile.crestLine}</p>
          <p className="mt-2 text-sm text-zinc-200">{profile.heptaLine}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Verify In Order</p>
          <p className="mt-3 text-sm text-zinc-100">1. Confirm the digest changes when the message changes.</p>
          <p className="mt-2 text-sm text-zinc-100">2. Confirm the crest still matches the signed identity fields.</p>
          <p className="mt-2 text-sm text-zinc-100">3. Confirm the hepta layer still decodes cleanly after transport.</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Key Idea</p>
          <p className="mt-3 text-sm leading-6 text-zinc-100">
            Security here is a chain of checks. Hashing shows change, signatures show integrity, and hepta redundancy
            shows transport reliability.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-300" />
          <p className="text-sm font-semibold text-cyan-100">Live Lesson: Avalanche Effect</p>
        </div>
        <p className="text-sm leading-6 text-zinc-200">
          Start from the active pet-derived string below. Hash it once, then compare that result with the version that
          flips just one bit in the last character. The outputs should look unrelated even though the edit is tiny.
        </p>
        <div className="flex gap-2">
          <input
            value={demoInput}
            onChange={e => setDemoInput(e.target.value)}
            placeholder="Pet proof message..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button size="sm" onClick={runHashDemo} disabled={!demoInput.trim()}>
            Hash
          </Button>
        </div>
        {demoHash && (
          <div className="grid gap-3 lg:grid-cols-2 text-sm font-mono">
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Original</p>
              <p className="break-all text-cyan-300">{demoHash}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">1-bit flip</p>
              <p className="break-all text-amber-300">{demoHash2}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {SECURITY_LAYERS.map(layer => {
          const isOpen = expanded === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setExpanded(isOpen ? null : layer.id)}
              className={`w-full text-left rounded-xl border transition-all ${
                isOpen
                  ? 'border-cyan-500/45 bg-cyan-950/25'
                  : 'border-slate-700/60 bg-slate-900/55 hover:border-slate-600/60'
              } p-4`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{layer.icon}</span>
                  <div>
                    <p className="text-base font-semibold text-zinc-50">{layer.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">{layer.summary}</p>
                  </div>
                </div>
                <span className={`text-xs font-mono px-3 py-1 rounded-full ${
                  isOpen ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-zinc-400'
                }`}>
                  {layer.strength}
                </span>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-slate-700/40">
                  <p className="text-sm leading-6 text-zinc-200">{layer.detail}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm leading-6 text-zinc-400">
        Read the layers as separate lessons, not marketing claims. The useful takeaway is how each mechanism solves a
        different problem: detecting change, proving identity, catching errors, refreshing keys, and spreading mixing
        across the full 60-position structure.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Moss60Hub() {
  const liveGenome = useStore(state => state.genome);
  const livePetType = useStore(state => state.petType);
  const [activeTab, setActiveTab] = useState('glyph');
  const [scheme, setScheme] = useState('Consciousness');
  const [animating, setAnimating] = useState(true);
  const [variant, setVariant] = useState<(typeof GLYPH_VARIANTS)[number]>('Pulse');
  const [projection, setProjection] = useState<Projection>('sphere');
  const [glyphFocus, setGlyphFocus] = useState<Moss60PetStrandKey>('combined');
  const [realityFocus, setRealityFocus] = useState<Moss60PetStrandKey>('combined');
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [archivedPet, setArchivedPet] = useState<PetSaveData | null>(null);
  const [archiveLookupComplete, setArchiveLookupComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getAllPets()
      .then(pets => {
        if (cancelled) return;
        const latest = [...pets].sort((a, b) => b.lastSaved - a.lastSaved)[0] ?? null;
        setArchivedPet(latest);
        setArchiveLookupComplete(true);
      })
      .catch(() => {
        if (cancelled) return;
        setArchivedPet(null);
        setArchiveLookupComplete(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const matchingArchive = useMemo(() => {
    if (!liveGenome || !archivedPet) return null;
    return matchMoss60Genome(liveGenome, archivedPet.genome) ? archivedPet : null;
  }, [archivedPet, liveGenome]);

  const petSource = useMemo(() => {
    if (liveGenome) {
      return {
        id: matchingArchive?.id,
        name: matchingArchive?.name,
        petType: matchingArchive?.petType ?? livePetType,
        genome: liveGenome,
        genomeHash: matchingArchive?.genomeHash,
        crest: matchingArchive?.crest,
        heptaDigits: matchingArchive?.heptaDigits,
        source: 'live' as const,
      };
    }

    if (archivedPet) {
      return {
        id: archivedPet.id,
        name: archivedPet.name,
        petType: archivedPet.petType,
        genome: archivedPet.genome,
        genomeHash: archivedPet.genomeHash,
        crest: archivedPet.crest,
        heptaDigits: archivedPet.heptaDigits,
        source: 'archive' as const,
      };
    }

    return {
      petType: livePetType,
      source: 'fallback' as const,
    };
  }, [archivedPet, liveGenome, livePetType, matchingArchive]);

  const petProfile = useMemo(() => deriveMoss60PetProfile(petSource), [petSource]);
  const glyphFocusMeta =
    GLYPH_FOCUS_OPTIONS.find(option => option.key === glyphFocus) ?? GLYPH_FOCUS_OPTIONS[0];
  const projectionMeta =
    PROJECTION_OPTIONS.find(option => option.value === projection) ?? PROJECTION_OPTIONS[0];
  const glyphSeed = `${petProfile.glyphSeed}|${glyphFocus}|${petProfile.strands[glyphFocus]}`;
  const glyphHash = moss60Hash(`${petProfile.glyphHash}|${glyphFocus}|${petProfile.digest}`);
  const realitySeed = petProfile.strands[realityFocus];
  const sourceSummary = liveGenome
    ? matchingArchive
      ? 'Live genome with archived crest and hepta proof layers.'
      : 'Live genome detected. Save or load the current companion archive to surface crest and hepta proof details here too.'
    : archivedPet
      ? 'Loaded from the most recent local archive because no live pet is mounted in the store on this route.'
      : archiveLookupComplete
        ? 'No saved companion was found, so the studio is using a deterministic fallback teaching profile.'
        : 'Looking for the most recent saved companion now.';
  const hasProofLayers = Boolean(petSource.crest && petSource.heptaDigits);

  const baseMetadata = useCallback((): Moss60ShareMetadata => ({
    id: moss60Hash(`${petProfile.digest}:${glyphFocus}:${scheme}:${variant}:${projection}`).slice(0, 16),
    seed: glyphSeed,
    scheme,
    variant,
    projection,
    timestamp: Date.now(),
    source: 'moss60-studio',
  }), [glyphFocus, glyphSeed, petProfile.digest, projection, scheme, variant]);

  const exportJSON = useCallback(() => {
    const payload = createMoss60VerifiablePayload(baseMetadata());
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `moss60-bundle-${payload.metadata.id}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('moss60_export', { format: 'json', variant, scheme });
    setShareUrl(createShareUrl(payload));
  }, [baseMetadata, scheme, variant]);

  const exportPNG = useCallback(() => {
    if (!canvasEl) return;
    const a = document.createElement('a');
    a.download = `moss60-glyph-${Date.now()}.png`;
    a.href = canvasEl.toDataURL('image/png');
    a.click();
    trackEvent('moss60_export', { format: 'png', variant, scheme });
  }, [canvasEl, scheme, variant]);

  const exportSVG = useCallback(() => {
    const payload = createMoss60VerifiablePayload(baseMetadata());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420"><rect width="420" height="420" fill="#020617"/><text x="26" y="48" fill="#e2e8f0" font-family="ui-sans-serif,system-ui" font-size="20" font-weight="700">${petProfile.label}</text><text x="26" y="76" fill="#94a3b8" font-family="ui-sans-serif,system-ui" font-size="13">${petProfile.sourceLabel}</text><text x="26" y="106" fill="#67e8f9" font-family="ui-monospace,SFMono-Regular,monospace" font-size="12">${payload.metadata.id}</text><text x="26" y="136" fill="#cbd5e1" font-family="ui-sans-serif,system-ui" font-size="13">Scheme ${scheme} · Variant ${variant} · ${glyphFocusMeta.label}</text><text x="26" y="166" fill="#f8fafc" font-family="ui-monospace,SFMono-Regular,monospace" font-size="11">${formatCodeLine(petProfile.strands[glyphFocus], 5, 8)}</text><text x="26" y="196" fill="#94a3b8" font-family="ui-sans-serif,system-ui" font-size="12">Digest ${petProfile.digest.slice(0, 24)}</text></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `moss60-bundle-${payload.metadata.id}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('moss60_export', { format: 'svg', variant, scheme });
    setShareUrl(createShareUrl(payload));
  }, [baseMetadata, glyphFocus, glyphFocusMeta.label, petProfile.digest, petProfile.label, petProfile.sourceLabel, petProfile.strands, scheme, variant]);

  const kpi = useCallback(() => {
    if (typeof window === 'undefined') return { imports: 0, reimports: 0, rate: 0 };
    try {
      const raw = window.localStorage.getItem('metapet-analytics');
      const events = raw ? (JSON.parse(raw) as Array<{ name: string }>) : [];
      const imports = events.filter(event => event.name === 'moss60_import').length;
      const reimports = events.filter(event => event.name === 'moss60_reimport').length;
      const rate = imports === 0 ? 0 : Math.round((reimports / imports) * 100);
      return { imports, reimports, rate };
    } catch {
      return { imports: 0, reimports: 0, rate: 0 };
    }
  }, []);

  const growth = kpi();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <Layers className="w-5 h-5 text-cyan-300" />
          MOSS60 Studio
        </h2>
        <p className="max-w-4xl text-sm leading-6 text-zinc-300">
          This studio now reads from the active companion&apos;s code path first. The glyph, reality shapes, security
          lessons, network, and lattice all derive from pet strands instead of a generic sequence.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Companion Source</p>
          <p className="mt-3 text-lg font-semibold text-white">{petProfile.label}</p>
          <p className="mt-1 text-sm text-zinc-200">{petProfile.sourceLabel}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{sourceSummary}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Pet Code Snapshot</p>
          <p className="mt-3 text-sm font-medium text-white">{petProfile.petTypeLabel}</p>
          <p className="mt-2 font-mono text-sm leading-6 text-cyan-200">
            {formatCodeLine(petProfile.strands.combined, 5, 8)}
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Digest {petProfile.digest.slice(0, 24)} · signature {petProfile.signaturePreview}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">What To Explore</p>
          <div className="mt-3 grid gap-2">
            {[
              'Glyph shows the pet code as the main visual fingerprint.',
              'Reality remaps the same pet code across seven geometric surfaces.',
              'Security explains how crest, hepta, and hashing protect identity.',
            ].map(item => (
              <p key={item} className="text-sm leading-6 text-zinc-100">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/15 p-4">
        <p className="text-base font-semibold text-cyan-100">What is MOSS60?</p>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          MOSS60 is a visual and cryptographic system built around 60 positions. In this version, those positions are
          driven by your companion&apos;s genome strands and, when available, by its crest and hepta proof layers.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { tab: 'Glyph', desc: 'Pet-coded sigil and export bundle' },
            { tab: 'Reality', desc: 'Seven geometric projections of the same code' },
            { tab: 'Security', desc: 'Readable lessons on hashing, signatures, and redundancy' },
            { tab: 'Network', desc: 'Combined pet strand routed as a small-world graph' },
            { tab: 'QR', desc: 'Encrypted QR workflows for messages and payloads' },
            { tab: 'Serpent', desc: 'Key exchange and private message flow' },
          ].map(({ tab, desc }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab.toLowerCase())}
              className="text-left rounded-xl border border-slate-700/60 bg-slate-900/45 p-3 transition-colors hover:border-cyan-500/40 hover:bg-cyan-950/20"
            >
              <p className="text-sm font-semibold text-cyan-200">{tab}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-300">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 sm:grid-cols-7">
          <TabsTrigger value="glyph" className="py-2 text-xs">Glyph</TabsTrigger>
          <TabsTrigger value="qr" className="py-2 text-xs">QR</TabsTrigger>
          <TabsTrigger value="serpent" className="py-2 text-xs">Serpent</TabsTrigger>
          <TabsTrigger value="spirograph" className="py-2 text-xs">Spiral</TabsTrigger>
          <TabsTrigger value="reality" className="py-2 text-xs">Reality</TabsTrigger>
          <TabsTrigger value="network" className="py-2 text-xs">Network</TabsTrigger>
          <TabsTrigger value="security" className="py-2 text-xs">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="glyph" className="mt-4 space-y-3">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <div className="rounded-[28px] border border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 via-slate-950/80 to-slate-950/95 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">Pet-Coded Glyph</p>
                  <h3 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    {petProfile.label}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-200">
                    This glyph is now anchored to the companion&apos;s code stack. The pet strands choose the structure,
                    and the crest or hepta layers, when available, deepen the proof braid.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  {petProfile.sourceLabel}
                </span>
              </div>

              <div className="mt-5 rounded-[32px] border border-cyan-400/20 bg-slate-950/75 p-4">
                <GlyphCanvas
                  seed={glyphSeed}
                  scheme={scheme}
                  animating={animating}
                  variant={variant}
                  seedHashOverride={glyphHash}
                  onCanvasReady={setCanvasEl}
                />
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Glyph Focus</p>
                  <p className="mt-2 text-base font-semibold text-white">{glyphFocusMeta.label}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">{glyphFocusMeta.helper}</p>
                  <p className="mt-3 font-mono text-sm leading-6 text-cyan-200">
                    {formatCodeLine(petProfile.strands[glyphFocus], 5, 8)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Proof Digest</p>
                  <p className="mt-2 text-base font-semibold text-white">{petProfile.petTypeLabel}</p>
                  <p className="mt-2 font-mono text-sm leading-6 text-emerald-200">{petProfile.digest.slice(0, 36)}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">
                    {hasProofLayers
                      ? 'Signed proof layers are available for this pet.'
                      : 'Only the genome strands are available right now; crest and hepta proof layers appear once the pet archive is loaded.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Companion Layers</p>
                <p className="mt-3 text-sm font-medium text-white">{petProfile.crestLine}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-200">{petProfile.heptaLine}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Red</p>
                    <p className="mt-1 font-mono text-cyan-200">{formatCodeLine(petProfile.strands.red, 5, 6)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Blue</p>
                    <p className="mt-1 font-mono text-cyan-200">{formatCodeLine(petProfile.strands.blue, 5, 6)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Black</p>
                    <p className="mt-1 font-mono text-cyan-200">{formatCodeLine(petProfile.strands.black, 5, 6)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Visual Controls</p>
                <div className="mt-4 grid gap-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white">Color scheme</span>
                    <select
                      value={scheme}
                      onChange={e => setScheme(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {Object.keys(COLOR_SCHEMES).map(item => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white">Glyph variant</span>
                    <select
                      value={variant}
                      onChange={event => setVariant(event.target.value as (typeof GLYPH_VARIANTS)[number])}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {GLYPH_VARIANTS.map(item => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={() => setAnimating(value => !value)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-zinc-200 transition-colors hover:border-cyan-500/40 hover:text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${animating ? 'animate-spin' : ''}`} />
                    {animating ? 'Pause glyph motion' : 'Resume glyph motion'}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {STUDIO_PRESETS.map(preset => (
                    <Button
                      key={preset.name}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setScheme(preset.scheme);
                        setVariant(preset.variant);
                        setGlyphFocus(preset.focus);
                      }}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>

                <div className="mt-4 grid gap-2">
                  {GLYPH_FOCUS_OPTIONS.map(option => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setGlyphFocus(option.key)}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                        glyphFocus === option.key
                          ? 'border-cyan-400/45 bg-cyan-950/25'
                          : 'border-slate-700/70 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{option.label}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-300">{option.helper}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Export Bundle</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={exportPNG}>
                    <Download className="mr-1 h-3 w-3" />
                    PNG
                  </Button>
                  <Button size="sm" onClick={exportSVG}>
                    <Download className="mr-1 h-3 w-3" />
                    SVG
                  </Button>
                  <Button size="sm" onClick={exportJSON}>
                    <Download className="mr-1 h-3 w-3" />
                    JSON
                  </Button>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-100">
                  Verified re-import rate: {growth.rate}% ({growth.reimports}/{growth.imports})
                </p>
                {shareUrl && <p className="mt-2 text-sm break-all text-zinc-300">Share route: {shareUrl}</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="qr" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
            <p className="text-base font-semibold text-white">Hide messages inside QR codes</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              Type a message, generate a QR code, and that QR carries a MOSS60-encrypted version of your
              text. Only someone with the matching key (or the same app) can read what&apos;s inside —
              anyone else just sees a normal-looking QR code.
              Use this for pet data, notes, or teaching how scannable transport can coexist with encryption.
            </p>
          </div>
          <QRGenerator />
        </TabsContent>

        <TabsContent value="spirograph" className="mt-4">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 mb-4">
            <p className="text-base font-semibold text-white">Live spirograph geometry</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              Watch a mathematical spirograph unfold in real time. Adjust the gear ratios, pen offset, and point symmetry to create ornate geometric patterns.
              Every spiral is a dance of the outer ring against the inner one — a quiet little engine of beauty hiding in the ratio between them.
            </p>
          </div>
          <SpirogrophLab />
        </TabsContent>

        <TabsContent value="serpent" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
            <p className="text-base font-semibold text-white">Encrypted two-way messaging</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              Serpent lets two people create a private shared secret without ever sending their private key.
              Here&apos;s the idea: you both generate your own keypair from a secret phrase, share only your
              <span className="text-cyan-300"> public key</span>, then combine it with the other person&apos;s
              public key to arrive at the <span className="text-emerald-300">same shared secret</span> — independently.
              From that point, messages can be encrypted and decrypted by either party.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Step 1: generate keys. Step 2: share your public key. Step 3: paste the partner key and handshake.
              Step 4: encrypt or decrypt.
            </p>
          </div>
          <SerpentTab />
        </TabsContent>

        <TabsContent value="reality" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
            <p className="text-base font-semibold text-white">60-point geometry in shaped reality</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              The same pet code can be projected across multiple geometric surfaces. Switch shapes to see how one
              companion strand behaves as a sphere, torus, hyperbolic disk, helix tower, crystal cube, petal bloom, or
              flat spiral.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Current source: {GLYPH_FOCUS_OPTIONS.find(option => option.key === realityFocus)?.label} · auto-rotates
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {PROJECTION_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setProjection(option.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  projection === option.value
                    ? 'border-cyan-400/45 bg-cyan-950/25'
                    : 'border-slate-700/70 bg-slate-900/55 hover:border-slate-600'
                }`}
              >
                <p className="text-sm font-semibold text-white">{option.label}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-300">{option.helper}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
            {GLYPH_FOCUS_OPTIONS.map(option => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRealityFocus(option.key)}
                className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                  realityFocus === option.key
                    ? 'border-emerald-400/45 bg-emerald-950/25 text-emerald-100'
                    : 'border-slate-700/70 bg-slate-900/55 text-zinc-300 hover:border-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="rounded-[28px] border border-cyan-500/25 bg-gradient-to-br from-slate-950/95 via-slate-950/85 to-cyan-950/20 p-4">
            <RealityCanvas seed={realitySeed} projection={projection} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Selected Shape</p>
              <p className="mt-2 text-base font-semibold text-white">{projectionMeta.label}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{projectionMeta.helper}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Reality Code Slice</p>
              <p className="mt-2 font-mono text-sm leading-6 text-cyan-200">{formatCodeLine(realitySeed, 5, 8)}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="network" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
            <p className="text-base font-semibold text-white">The crystalline node graph</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              The network now routes the combined pet strand instead of the fixed crypto fallback string. Prime-indexed
              bridge nodes still create the small-world effect, but the topology is now visibly shaped by the companion
              code you loaded into the studio.
            </p>
          </div>
          {/* Keep both network views anchored to the current pet-derived strands. */}
          <CrystallineNetwork dna={petProfile.strands.combined} />
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 mt-4">
            <p className="text-base font-semibold text-white">3D crystal lattice scaffold</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              The lattice uses the security braid so the structural view responds not only to genome strands but also to
              the pet&apos;s proof-oriented mix. Growth, resonance, and memory all stay deterministic for that same
              companion snapshot.
            </p>
          </div>
          <CrystallineLattice dna={petProfile.strands.security} />
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
            <p className="text-base font-semibold text-white">How the protection layers stack</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              This tab is now more explicit about what each layer teaches. It ties the lessons back to the active pet
              code so hashing, signatures, hepta redundancy, and time-based key rotation feel like parts of one readable
              system.
            </p>
          </div>
          <SecurityLearningPanel key={petProfile.digest} profile={petProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
