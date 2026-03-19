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

  useEffect(() => {
    setDemoInput(profile.securityLessonInput);
    setDemoHash('');
    setDemoHash2('');
  }, [profile.securityLessonInput]);

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
  const [activeTab, setActiveTab]   = useState('glyph');
  const [glyphSeed, setGlyphSeed]   = useState('');
  const [scheme, setScheme]         = useState('Spectral');
  const [animating, setAnimating]   = useState(true);
  const [variant, setVariant] = useState<(typeof GLYPH_VARIANTS)[number]>('Pulse');
  const [projection, setProjection] = useState<Projection>('sphere');
  const [realitySeed, setRealitySeed] = useState('');
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  const baseMetadata = useCallback((): Moss60ShareMetadata => ({
    id: moss60Hash(`${glyphSeed}:${scheme}:${variant}:${Date.now()}`).slice(0, 16),
    seed: glyphSeed,
    scheme,
    variant,
    projection,
    timestamp: Date.now(),
    source: 'moss60-studio',
  }), [glyphSeed, projection, scheme, variant]);

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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" fill="#020617"/><text x="22" y="48" fill="#e2e8f0" font-family="sans-serif" font-size="15">MOSS60 ${payload.metadata.id}</text><text x="22" y="76" fill="#94a3b8" font-family="sans-serif" font-size="12">Scheme ${scheme} · Variant ${variant}</text><text x="22" y="104" fill="#67e8f9" font-family="monospace" font-size="11">${moss60Hash(payload.metadata.seed || 'seedless').slice(0, 28)}</text></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `moss60-bundle-${payload.metadata.id}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('moss60_export', { format: 'svg', variant, scheme });
    setShareUrl(createShareUrl(payload));
  }, [baseMetadata, scheme, variant]);

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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-300" />
          MOSS60
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Layered cryptographic platform — depth through algebraic complexity</p>
      </div>

      {/* Plain-language intro — what is MOSS60? */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 space-y-2">
        <p className="text-sm font-semibold text-cyan-200">What is MOSS60?</p>
        <p className="text-xs text-zinc-300 leading-relaxed">
          MOSS60 is a visual + cryptographic system built on the number 60. Why 60? It&apos;s the smallest number
          divisible by 1 through 6 and contains more prime-indexed positions than any smaller base — giving it a
          natural richness for mixing and encoding information.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Think of it like a secret language made of geometry. Each tab below shows a different face of the same
          underlying idea — from animated glyphs to encrypted messages to 3D projections. You don&apos;t need to
          understand the math to explore it; start with <span className="text-cyan-300 font-medium">Glyph</span> and
          follow your curiosity.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {[
            { tab: 'Glyph',    desc: 'Animated visual fingerprint of any word or phrase' },
            { tab: 'QR',       desc: 'Encode messages into scannable QR ciphers' },
            { tab: 'Serpent',  desc: 'Two-way encrypted chat via key exchange' },
            { tab: 'Reality',  desc: '3D projections of the 60-point structure' },
            { tab: 'Network',  desc: 'See how nodes connect in the MOSS60 graph' },
            { tab: 'Security', desc: 'Learn how each layer of protection works' },
          ].map(({ tab, desc }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab.toLowerCase())}
              className="text-left rounded-lg border border-slate-700/60 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-cyan-950/20 p-2 transition-colors"
            >
              <p className="text-[11px] font-semibold text-cyan-300">{tab}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="glyph"    className="text-xs py-2">Glyph</TabsTrigger>
          <TabsTrigger value="qr"       className="text-xs py-2">QR</TabsTrigger>
          <TabsTrigger value="serpent"  className="text-xs py-2">Serpent</TabsTrigger>
          <TabsTrigger value="reality"  className="text-xs py-2">Reality</TabsTrigger>
          <TabsTrigger value="network"  className="text-xs py-2">Network</TabsTrigger>
          <TabsTrigger value="security" className="text-xs py-2">Security</TabsTrigger>
        </TabsList>

        {/* ── Glyph ── */}
        <TabsContent value="glyph" className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold text-zinc-200 mb-1">Visual DNA fingerprint</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type any word, phrase, or name below and watch it become a unique animated glyph.
              Two different inputs will always produce two completely different glyphs — this is the
              &ldquo;avalanche effect&rdquo; at work. Think of it as your personal sigil generated from MOSS60 mathematics.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={glyphSeed}
              onChange={e => setGlyphSeed(e.target.value)}
              placeholder="Type anything — your name, a word, a phrase…"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={scheme}
              onChange={e => setScheme(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {Object.keys(COLOR_SCHEMES).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => setAnimating(a => !a)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${animating ? 'animate-spin' : ''}`} />
              {animating ? 'Pause' : 'Animate'}
            </button>
            <select
              value={variant}
              onChange={event => setVariant(event.target.value as (typeof GLYPH_VARIANTS)[number])}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {GLYPH_VARIANTS.map(item => (
                <option key={item} value={item}>{item} variant</option>
              ))}
            </select>
          </div>
          <GlyphCanvas seed={glyphSeed} scheme={scheme} animating={animating} variant={variant} onCanvasReady={setCanvasEl} />

          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-3">
            <p className="text-sm font-semibold text-zinc-200">MOSS60 Studio</p>
            <p className="text-xs text-zinc-500">Theme presets · animated glyph variants · export bundles (PNG/SVG/JSON).</p>

            <div className="flex flex-wrap gap-2">
              {STUDIO_PRESETS.map(preset => (
                <Button
                  key={preset.name}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setScheme(preset.scheme);
                    setVariant(preset.variant);
                    setGlyphSeed(preset.seed);
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={exportPNG}><Download className="w-3 h-3 mr-1" />Export PNG</Button>
              <Button size="sm" onClick={exportSVG}><Download className="w-3 h-3 mr-1" />Export SVG</Button>
              <Button size="sm" onClick={exportJSON}><Download className="w-3 h-3 mr-1" />Export JSON</Button>
            </div>

            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-2">
              <p className="text-xs text-emerald-300">Primary growth KPI: verified re-import rate</p>
              <p className="text-sm text-zinc-100 mt-1">{growth.rate}% ({growth.reimports} verified re-imports / {growth.imports} imports)</p>
              {shareUrl && <p className="text-[11px] text-zinc-400 mt-1">Share route: {shareUrl}</p>}
            </div>
          </div>
        </TabsContent>

        {/* ── QR Cipher ── */}
        <TabsContent value="qr" className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold text-zinc-200 mb-1">Hide messages inside QR codes</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type a message, generate a QR code, and that QR carries a MOSS60-encrypted version of your
              text. Only someone with the matching key (or the same app) can read what&apos;s inside —
              anyone else just sees a normal-looking QR code.
              Great for sharing pet data, notes, or just exploring how QR + encryption combine.
            </p>
          </div>
          <QRGenerator />
        </TabsContent>

        {/* ── Serpent ── */}
        <TabsContent value="serpent" className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold text-zinc-200 mb-1">Encrypted two-way messaging</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Serpent lets two people create a private shared secret without ever sending their private key.
              Here&apos;s the idea: you both generate your own keypair from a secret phrase, share only your
              <span className="text-cyan-300"> public key</span>, then combine it with the other person&apos;s
              public key to arrive at the <span className="text-emerald-300">same shared secret</span> — independently.
              From that point, messages can be encrypted and decrypted by either party.
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Step 1 → generate keys &nbsp;·&nbsp; Step 2 → share your public key &nbsp;·&nbsp; Step 3 → paste their public key &amp; handshake &nbsp;·&nbsp; Step 4 → encrypt / decrypt
            </p>
          </div>
          <SerpentTab />
        </TabsContent>

        {/* ── Reality ── */}
        <TabsContent value="reality" className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold text-zinc-200 mb-1">60-point geometry in 3D space</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              The 60 MOSS60 nodes aren&apos;t just numbers — they can be mapped onto any surface.
              Switch between projections to see the same underlying prime-indexed structure take different shapes:
              a flat spiral, a sphere, a torus (donut), or a hyperbolic disk.
              All four are the same 60 points — just viewed through different geometric lenses.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={projection}
              onChange={e => setProjection(e.target.value as Projection)}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="flat">Flat Spiral</option>
              <option value="sphere">Sphere</option>
              <option value="torus">Torus</option>
              <option value="hyperbolic">Hyperbolic</option>
            </select>
            <Orbit className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">Auto-rotates</span>
          </div>
          <div className="flex gap-2">
            <input
              value={realitySeed}
              onChange={e => setRealitySeed(e.target.value)}
              placeholder="Optional seed..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <RealityCanvas seed={realitySeed} projection={projection} />
        </TabsContent>

        {/* ── Network ── */}
        <TabsContent value="network" className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold text-zinc-200 mb-1">The crystalline node graph</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              This shows MOSS60 as a network of 60 nodes — like a map of how information flows.
              Nodes at <span className="text-cyan-300">prime-indexed positions</span> (2, 3, 5, 7, 11…) act as
              &ldquo;bridges&rdquo; with extra long-range connections, making the network small-world: any node can
              reach any other in just a few hops. This structure is why MOSS60 mixing is so thorough —
              a single input change ripples everywhere quickly.
            </p>
          </div>
          <CrystallineNetwork dna={DNA_R.join('')} />
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3 mt-4">
            <p className="text-xs font-semibold text-zinc-200 mb-1">3D crystal lattice scaffold</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              The DNA blueprint generates a 3-dimensional lattice structure — a scaffold that holds
              the crystalline network in physical space. Watch it grow intelligently from a single seed,
              choosing each new node by structural support and DNA affinity. Platonic sub-shells
              (tetrahedra, octahedra) emerge as the geometry self-organises.
            </p>
          </div>
          <CrystallineLattice dna={DNA_R.join('')} />
        </TabsContent>

        {/* ── Security Learning ── */}
        <TabsContent value="security" className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold text-zinc-200 mb-1">How the protection layers stack</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              MOSS60&apos;s security comes from layering <em>many independent mixing strategies</em> rather than
              relying on a single algorithm. Even if one layer were cracked, the others would still hold.
              Tap each layer below to see a plain-English explanation of what it does — and use the live
              hash demo to see the &ldquo;avalanche effect&rdquo; in action: one tiny change scrambles everything.
            </p>
          </div>
          <SecurityLearningPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
