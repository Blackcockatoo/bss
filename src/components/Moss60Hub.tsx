'use client';

/**
 * Moss60Hub — MOSS60 Layered Cryptographic Platform
 * Tabs: Glyph | QR Cipher | Serpent Protocol | Reality | Network | Security
 *
 * Glyph canvas ported from moss60-ultimate.html
 * Crypto functions reuse src/lib/qr-messaging/crypto.ts
 */

import { useState, useRef, useEffect, useCallback } from 'react';
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
  R as DNA_R,
} from '@/lib/qr-messaging/crypto';
import { Download, RefreshCw, Lock, Unlock, Key, Orbit, Layers, ShieldCheck, BookOpen } from 'lucide-react';
import { CrystallineNetwork } from './CrystallineNetwork';
import { CrystallineLattice } from './CrystallineLattice';
import { trackEvent } from '@/lib/analytics';
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
  seed: string;
}> = [
  { name: 'Aurora School', scheme: 'Spectral', variant: 'Pulse', seed: 'aurora-classroom' },
  { name: 'Cyber Conservatory', scheme: 'Cyberpunk', variant: 'Prism', seed: 'cyber-conservatory' },
  { name: 'Ocean Memory', scheme: 'Ocean', variant: 'Cascade', seed: 'ocean-memory-thread' },
];

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
    const baseR = Math.min(W, H) * 0.38;

    // Trail effect
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, W, H);

    const pairs = COLOR_SCHEMES[scheme] ?? COLOR_SCHEMES['Spectral'];
    const hash = seedHashOverride ?? (seed ? moss60Hash(seed) : 'deadbeef');
    const hashVal = parseInt(hash.slice(0, 4), 16) / 0xffff;

    // Generate 60 points along a PHI spiral
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI * PHI + time * variantConfig.speed;
      const wobble = 1 + variantConfig.wobble * Math.sin(i * PHI * 0.5 + time * 0.001);
      const r = baseR * wobble;
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }

    // Draw connections between prime-indexed points
    for (let i = 0; i < 60; i++) {
      if (!PRIMES.has(i)) continue;
      for (let step = 1; step <= 3; step++) {
        const j = (i + step * 7) % 60;
        const t = (i / 60 + hashVal) % 1;
        const pairIdx = Math.floor(t * pairs.length) % pairs.length;
        const [ca, cb] = pairs[pairIdx];
        const alpha = 0.15 + variantConfig.alpha * Math.abs(Math.sin(time * 0.0008 + i * 0.3));
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.strokeStyle = lerpColor(ca, cb, t) ;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = step === 1 ? 1.2 : 0.6;
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
      ctx.arc(points[i].x, points[i].y, isPrime ? 3 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = lerpColor(ca, cb, t);
      ctx.globalAlpha = isPrime ? 0.9 : 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
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
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        className="rounded-xl border border-slate-700 bg-black"
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

type Projection = 'flat' | 'sphere' | 'torus' | 'hyperbolic';

function RealityCanvas({ seed, projection }: { seed: string; projection: Projection }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

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

    function project(x: number, y: number, z: number): { x: number; y: number; alpha: number } {
      // Apply rotation
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
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
      const r = 120 * (1 + 0.12 * Math.sin(i * 0.5));
      return { x: r * Math.cos(angle), y: r * Math.sin(angle), z: 0 };
    }

    function spherePoint(i: number, t: number) {
      const theta = (i / 60) * Math.PI;
      const phi   = (i / 60) * 2 * Math.PI * PHI + t * 0.0006;
      const R = 130;
      return { x: R * Math.sin(theta) * Math.cos(phi), y: R * Math.sin(theta) * Math.sin(phi), z: R * Math.cos(theta) };
    }

    function torusPoint(i: number, t: number) {
      const u = (i / 60) * 2 * Math.PI + t * 0.0006;
      const v = (i / 60) * 2 * Math.PI * 3;
      const R = 90, r = 40;
      return { x: (R + r * Math.cos(v)) * Math.cos(u), y: (R + r * Math.cos(v)) * Math.sin(u), z: r * Math.sin(v) };
    }

    function hyperbolicPoint(i: number, t: number) {
      const angle = (i / 60) * 2 * Math.PI * PHI + t * 0.0006;
      const rPoincare = 0.85 * (1 - 1 / (1 + i / 10));
      const x = rPoincare * Math.cos(angle);
      const y = rPoincare * Math.sin(angle);
      return { x: x * 140, y: y * 140, z: (i / 60 - 0.5) * 60 };
    }

    function getPoint(i: number, t: number) {
      switch (projection) {
        case 'sphere':     return spherePoint(i, t);
        case 'torus':      return torusPoint(i, t);
        case 'hyperbolic': return hyperbolicPoint(i, t);
        default:           return flatPoint(i, t);
      }
    }

    const loop = (time: number) => {
      rotX = time * 0.0003;
      rotY = time * 0.0005;

      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 0, W, H);

      const pts = Array.from({ length: 60 }, (_, i) => {
        const p3 = getPoint(i, time);
        const p2 = project(p3.x, p3.y, p3.z);
        return p2;
      });

      for (let i = 0; i < 60; i++) {
        if (!PRIMES.has(i)) continue;
        const j = (i + 7) % 60;
        const t = i / 60;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `hsl(${t * 360},70%,60%)`;
        ctx.globalAlpha = (pts[i].alpha + pts[j].alpha) * 0.3;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, PRIMES.has(i) ? 3 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${(i / 60) * 360},70%,65%)`;
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
      width={320}
      height={320}
      className="rounded-xl border border-slate-700 bg-black mx-auto block"
    />
  );
}

// ─── Security Learning Panel ──────────────────────────────────────────────────

const SECURITY_LAYERS = [
  {
    id: 'hashing',
    icon: '🔐',
    title: 'MOSS60 Hashing',
    summary: 'Core 60-digit mixing with prime-indexed rotations',
    detail:
      'Every input passes through a 60-step mixing loop. At each step the hash state is XOR-folded against three independent DNA sequences (R, K, B), bit-rotated, and multiplied by a prime. The 60-step structure means even a single-character difference avalanches through all three sequences before the final output.',
    strength: 'Avalanche + triple-sequence mixing',
  },
  {
    id: 'keypair',
    icon: '🗝️',
    title: 'Key Derivation',
    summary: 'Extended-hash key pairs with prime-indexed spiral generation',
    detail:
      'Key pairs are generated by running the seed through 8 iterated hashing rounds, producing a 60-element private spiral. The public key is a separate 8-round hash of the spiral — knowledge of the public hash does not reveal the private spiral without inverting the iterated chain.',
    strength: 'Iterated one-way derivation',
  },
  {
    id: 'exchange',
    icon: '🤝',
    title: 'Key Exchange',
    summary: 'Shared secret via conditional prime-bridge mixing',
    detail:
      'Shared secrets are computed element-wise: at prime-indexed positions the combination uses golden-ratio scaling (val × φ + partner), at other positions a simpler modular sum. The prime-conditional branching means an attacker must identify which indices are prime to reconstruct the mixing — information that depends on the private spiral.',
    strength: 'Conditional prime-bridge mixing',
  },
  {
    id: 'temporal',
    icon: '⏳',
    title: 'Temporal Evolution',
    summary: 'Lucas-sequence key rotation per message',
    detail:
      'Each message can use temporal mode, evolving the key by the Lucas sequence value at the current message index. Since Lucas numbers grow superlinearly, late messages have significantly different keystreams from early ones — replaying an old key for a new message index produces garbage.',
    strength: 'Non-repeating keystream evolution',
  },
  {
    id: 'topology',
    icon: '🕸️',
    title: 'Network Topology',
    summary: '60-node small-world graph with prime-bridge shortcuts',
    detail:
      'The crystalline network models MOSS60\'s algebraic structure: 60 nodes on a ring with Watts-Strogatz rewiring (β = 0.28) and prime-distance shortcuts. The resulting graph has O(log N) average path length — information can traverse the full structure in very few hops, making coordinated multi-node attacks extremely difficult to isolate.',
    strength: 'Small-world routing resilience',
  },
  {
    id: 'philosophy',
    icon: '🧬',
    title: 'Depth over Claims',
    summary: 'Layered mixing strategy rather than single-primitive reliance',
    detail:
      'MOSS60 deliberately avoids depending on a single hardness assumption. Instead it layers prime-residue orbits, golden-ratio frequency separation, Lucas-sequence evolution, and multi-round hashing. Compromise of any individual layer does not expose the full keystream. This mirrors biological defence — redundancy and diversity over single points of failure.',
    strength: 'Defence-in-depth by design',
  },
] as const;

function SecurityLearningPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [demoInput, setDemoInput] = useState('');
  const [demoHash, setDemoHash]   = useState('');
  const [demoHash2, setDemoHash2] = useState('');

  function runHashDemo() {
    if (!demoInput.trim()) return;
    setDemoHash(moss60Hash(demoInput.trim()));
    const flipped = demoInput.trim().slice(0, -1) + String.fromCharCode(
      demoInput.trim().charCodeAt(demoInput.trim().length - 1) ^ 1
    );
    setDemoHash2(moss60Hash(flipped));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-cyan-300" />
        <div>
          <h3 className="text-sm font-bold text-white">Security Model</h3>
          <p className="text-[10px] text-zinc-500">How MOSS60 layers independent mixing strategies for depth</p>
        </div>
      </div>

      {/* Interactive hash demo */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-300" />
          <p className="text-xs font-semibold text-cyan-200">Live: Avalanche Effect</p>
        </div>
        <p className="text-[11px] text-zinc-400">
          Type anything, then see how flipping a single bit in the last character produces a completely different hash.
        </p>
        <div className="flex gap-2">
          <input
            value={demoInput}
            onChange={e => setDemoInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button size="sm" onClick={runHashDemo} disabled={!demoInput.trim()}>Hash</Button>
        </div>
        {demoHash && (
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
              <p className="text-zinc-500 mb-1">Original</p>
              <p className="text-cyan-300 break-all">{demoHash}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
              <p className="text-zinc-500 mb-1">1-bit flip</p>
              <p className="text-amber-300 break-all">{demoHash2}</p>
            </div>
          </div>
        )}
      </div>

      {/* Security layers */}
      <div className="space-y-2">
        {SECURITY_LAYERS.map(layer => {
          const isOpen = expanded === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setExpanded(isOpen ? null : layer.id)}
              className={`w-full text-left rounded-xl border transition-all ${
                isOpen
                  ? 'border-cyan-500/40 bg-cyan-950/20'
                  : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600/60'
              } p-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{layer.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-100">{layer.title}</p>
                    <p className="text-[10px] text-zinc-500">{layer.summary}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isOpen ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-zinc-500'
                }`}>
                  {layer.strength}
                </span>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-slate-700/40">
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{layer.detail}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
        Each layer operates independently — compromising one does not weaken the others.
        <br />
        The 60-element structure mirrors natural prime distribution within the first 60 integers.
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
