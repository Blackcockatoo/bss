'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Game World ───────────────────────────────────────────────────────────────
const W = 400;
const H = 600;
const PR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

// ─── Types ────────────────────────────────────────────────────────────────────
type Rarity   = 'common' | 'rare' | 'epic' | 'mythic';
type Shape    = 'diamond' | 'hex' | 'tri' | 'star';
type Phase    = 'idle' | 'playing' | 'dead' | 'gameover';

interface Bullet   { id: number; x: number; y: number; vy: number; fp: boolean; }
interface Enemy    { id: number; x: number; y: number; vx: number; vy: number; shape: Shape; rarity: Rarity; angle: number; aVel: number; r: number; hp: number; maxHp: number; flash: number; }
interface Drop     { id: number; x: number; y: number; vy: number; rarity: Rarity; age: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; r: number; }
interface FText    { x: number; y: number; text: string; life: number; color: string; vy: number; }

interface GS {
  phase: Phase;
  score: number;
  hi: number;
  wave: number;
  lives: number;
  combo: number;
  comboT: number;
  px: number;
  py: number;
  pinv: number;
  bullets: Bullet[];
  enemies: Enemy[];
  drops: Drop[];
  particles: Particle[];
  texts: FText[];
  shootT: number;
  spawnT: number;
  spawnI: number;
  waveLeft: number;
  waveTransT: number;
  boss: (Enemy & { shootT: number }) | null;
  shake: number;
  keysL: boolean;
  keysR: boolean;
  touchX: number | null;
  nextId: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAYER_SPEED  = 220; // px/s
const BULLET_SPEED  = 380;
const SHOOT_MS      = 200;
const ENEMY_BASE_SPY = 60; // px/s base fall speed

const RARITY_COL: Record<Rarity, { fill: string; glow: string; drop: string }> = {
  common: { fill: '#60A5FA', glow: '#1D4ED8', drop: '#93C5FD' },
  rare:   { fill: '#C084FC', glow: '#7E22CE', drop: '#D8B4FE' },
  epic:   { fill: '#FB923C', glow: '#9A3412', drop: '#FED7AA' },
  mythic: { fill: '#F472B6', glow: '#9D174D', drop: '#FBCFE8' },
};

const RARITY_PTS: Record<Rarity, number>    = { common: 10,  rare: 50,  epic: 150, mythic: 500 };
const RARITY_WEIGHTS: [Rarity, number][]   = [['common', 65], ['rare', 25], ['epic', 8], ['mythic', 2]];
const SHAPES: Shape[] = ['diamond', 'hex', 'tri', 'star'];

function pickRarity(): Rarity {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const [r, w] of RARITY_WEIGHTS) { acc += w; if (roll < acc) return r; }
  return 'common';
}

function rand(lo: number, hi: number) { return lo + Math.random() * (hi - lo); }

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function drawAuralia(ctx: CanvasRenderingContext2D, x: number, y: number, inv: number, t: number) {
  // Flicker when invincible
  if (inv > 0 && Math.floor(inv * 10) % 2 === 0) return;

  const bob = Math.sin(t * 2.5) * 2;
  ctx.save();

  // Body glow
  ctx.shadowColor = '#8B5CF6';
  ctx.shadowBlur  = 18;

  // Body
  const bodyG = ctx.createRadialGradient(x, y + bob, 4, x, y + bob + 8, 26);
  bodyG.addColorStop(0, '#A78BFA');
  bodyG.addColorStop(1, '#4C1D95');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.ellipse(x, y + 8 + bob, 18, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headG = ctx.createRadialGradient(x, y - 14 + bob, 2, x, y - 10 + bob, 16);
  headG.addColorStop(0, '#C4B5FD');
  headG.addColorStop(1, '#6D28D9');
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.ellipse(x, y - 12 + bob, 14, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.shadowColor = '#2DD4BF';
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = '#2DD4BF';
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 13 + bob, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 5, y - 13 + bob, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine glow trail
  ctx.shadowColor = '#7C3AED';
  ctx.shadowBlur  = 20;
  const trailG = ctx.createLinearGradient(x, y + 30, x, y + 55);
  trailG.addColorStop(0, 'rgba(139,92,246,0.6)');
  trailG.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = trailG;
  ctx.beginPath();
  ctx.ellipse(x, y + 38 + bob, 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, e: Enemy) {
  const c = RARITY_COL[e.rarity];
  const flash = e.flash > 0;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  ctx.shadowColor = flash ? '#ffffff' : c.glow;
  ctx.shadowBlur  = flash ? 30 : 15;

  ctx.strokeStyle = flash ? '#ffffff' : '#ffffff44';
  ctx.lineWidth   = 1.5;
  ctx.fillStyle   = flash ? '#ffffff' : c.fill;

  ctx.beginPath();
  const r = e.r;
  if (e.shape === 'diamond') {
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.65, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.65, 0);
    ctx.closePath();
  } else if (e.shape === 'hex') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
              : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  } else if (e.shape === 'tri') {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
              : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  } else {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const sr = i % 2 === 0 ? r : r * 0.45;
      i === 0 ? ctx.moveTo(Math.cos(a) * sr, Math.sin(a) * sr)
              : ctx.lineTo(Math.cos(a) * sr, Math.sin(a) * sr);
    }
    ctx.closePath();
  }

  ctx.fill();
  ctx.stroke();

  // HP bar for boss/high-HP enemies
  if (e.maxHp > 1) {
    ctx.shadowBlur = 0;
    const bw = r * 2.4;
    ctx.fillStyle = '#333';
    ctx.fillRect(-bw / 2, r + 5, bw, 4);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? c.fill : '#EF4444';
    ctx.fillRect(-bw / 2, r + 5, bw * (e.hp / e.maxHp), 4);
  }

  ctx.restore();
}

function drawDrop(ctx: CanvasRenderingContext2D, d: Drop, t: number) {
  const c = RARITY_COL[d.rarity];
  const pulse = 1 + Math.sin(t * 5 + d.id) * 0.12;
  const alpha = Math.min(1, (60 - d.age) / 15);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = c.fill;
  ctx.shadowBlur  = 12;
  ctx.fillStyle   = c.drop;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.rarity === 'mythic' ? 8 * pulse : d.rarity === 'epic' ? 6 * pulse : 5 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();
  const g = ctx.createLinearGradient(b.x, b.y - 10, b.x, b.y + 2);
  g.addColorStop(0, '#22D3EE');
  g.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.shadowColor = '#22D3EE';
  ctx.shadowBlur  = 8;
  ctx.fillStyle   = g;
  ctx.beginPath();
  ctx.ellipse(b.x, b.y - 4, 2.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Spawn / Wave helpers ─────────────────────────────────────────────────────
function spawnEnemy(g: GS, isBoss = false): Enemy {
  const wave = g.wave;
  const rarity: Rarity = isBoss ? (wave >= 10 ? 'mythic' : wave >= 5 ? 'epic' : 'rare') : pickRarity();
  const baseR = isBoss ? 38 : rand(12, 20);
  const hp    = isBoss ? 5 + wave * 2 : (rarity === 'mythic' ? 3 : rarity === 'epic' ? 2 : 1);
  const speed = ENEMY_BASE_SPY + wave * 8;

  return {
    id: g.nextId++,
    x: rand(baseR + 10, W - baseR - 10),
    y: -baseR - 10,
    vx: isBoss ? 0 : rand(-30, 30),
    vy: isBoss ? speed * 0.4 : speed + rand(-10, 10),
    shape: isBoss ? 'star' : SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rarity,
    angle: 0,
    aVel: rand(-1.5, 1.5),
    r: baseR,
    hp,
    maxHp: hp,
    flash: 0,
  };
}

function spawnBurst(g: GS, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(40, 160);
    g.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.4, 0.9),
      color,
      r: rand(1.5, 4),
    });
  }
}

function makeState(): GS {
  const hi = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('sjHi') || '0', 10) : 0;
  return {
    phase: 'idle',
    score: 0, hi,
    wave: 1, lives: 3,
    combo: 0, comboT: 0,
    px: W / 2, py: H - 60,
    pinv: 0,
    bullets: [], enemies: [], drops: [], particles: [], texts: [],
    shootT: 0, spawnT: 0, spawnI: 2200,
    waveLeft: 8, waveTransT: 0,
    boss: null, shake: 0,
    keysL: false, keysR: false, touchX: null,
    nextId: 1,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SpaceJewblesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef     = useRef<GS>(makeState());
  const rafRef    = useRef<number>(0);
  const lastRef   = useRef<number>(0);
  const tRef      = useRef<number>(0);

  const [uiPhase, setUiPhase] = useState<Phase>('idle');
  const [uiScore, setUiScore] = useState(0);
  const [uiWave,  setUiWave]  = useState(1);
  const [uiLives, setUiLives] = useState(3);
  const [uiHi,    setUiHi]    = useState(0);
  const [uiCombo, setUiCombo] = useState(0);

  // ── Resize canvas ──────────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const pw = parent.clientWidth;
    const ph = parent.clientHeight;
    const scale = Math.min(pw / W, ph / H);
    canvas.style.width  = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    canvas.width  = W * PR;
    canvas.height = H * PR;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(PR, PR);
  }, []);

  // ── Game loop step ─────────────────────────────────────────────────────────
  const step = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    tRef.current += dt;
    const t = tRef.current;
    const g = gsRef.current;

    if (g.phase !== 'playing') {
      rafRef.current = requestAnimationFrame(step);
      render(g, t);
      return;
    }

    // Player movement
    const { keysL, keysR, touchX } = g;
    if (touchX !== null) {
      const dx = touchX - g.px;
      g.px += Math.sign(dx) * Math.min(Math.abs(dx), PLAYER_SPEED * dt * 1.3);
    } else {
      if (keysL) g.px -= PLAYER_SPEED * dt;
      if (keysR) g.px += PLAYER_SPEED * dt;
    }
    g.px = Math.max(20, Math.min(W - 20, g.px));

    // Auto-shoot
    g.shootT -= dt * 1000;
    if (g.shootT <= 0) {
      g.shootT = SHOOT_MS;
      g.bullets.push({ id: g.nextId++, x: g.px, y: g.py - 28, vy: -BULLET_SPEED, fp: true });
    }

    // Move bullets
    for (let i = g.bullets.length - 1; i >= 0; i--) {
      const b = g.bullets[i];
      b.y += b.vy * dt;
      if (b.y < -20 || b.y > H + 20) g.bullets.splice(i, 1);
    }

    // Wave: spawn enemies
    g.waveTransT = Math.max(0, g.waveTransT - dt);
    if (g.waveTransT <= 0 && !g.boss) {
      g.spawnT -= dt * 1000;
      if (g.spawnT <= 0 && g.waveLeft > 0) {
        g.spawnT = g.spawnI;
        // Spawn 1–3 at a time
        const count = Math.min(g.waveLeft, 1 + Math.floor(g.wave / 3));
        for (let i = 0; i < count; i++) g.enemies.push(spawnEnemy(g));
        g.waveLeft -= count;
        // Spawn boss when wave is cleared
        if (g.waveLeft <= 0 && g.wave % 5 === 0) {
          const b = spawnEnemy(g, true) as Enemy & { shootT: number };
          b.shootT = 2;
          g.boss = b;
        }
      }
    }

    // Move enemies + boss
    const allEnemies: Enemy[] = [...g.enemies, ...(g.boss ? [g.boss] : [])];
    for (const e of allEnemies) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.angle += e.aVel * dt;
      e.flash  = Math.max(0, e.flash - dt * 5);
      // Bounce boss horizontally
      if (e === g.boss && (e.x < 50 || e.x > W - 50)) e.vx *= -1;
      // Wall bounce for normal enemies
      if (e !== g.boss && (e.x < e.r || e.x > W - e.r)) e.vx *= -1;
    }

    // Boss shooting
    if (g.boss) {
      g.boss.shootT -= dt;
      if (g.boss.shootT <= 0) {
        g.boss.shootT = Math.max(0.8, 2.5 - g.wave * 0.1);
        const ang = Math.atan2(g.py - g.boss.y, g.px - g.boss.x);
        g.bullets.push({ id: g.nextId++, x: g.boss.x, y: g.boss.y, vy: 180, fp: false });
        // Spread shots
        [-0.4, 0.4].forEach(off => g.bullets.push({ id: g.nextId++, x: g.boss.x, y: g.boss.y, vy: Math.cos(ang + off) * 150 + 60, fp: false }));
        void ang;
      }
    }

    // Enemy reaches bottom → lose a life
    for (let i = g.enemies.length - 1; i >= 0; i--) {
      if (g.enemies[i].y > H + 40) {
        g.enemies.splice(i, 1);
        takeDamage(g);
      }
    }
    if (g.boss && g.boss.y > H + 60) {
      g.boss = null;
      takeDamage(g);
    }

    // Bullet ↔ enemy collision
    for (let bi = g.bullets.length - 1; bi >= 0; bi--) {
      const b = g.bullets[bi];
      if (!b.fp) continue;
      let hit = false;
      for (let ei = g.enemies.length - 1; ei >= 0; ei--) {
        const e = g.enemies[ei];
        if (dist(b.x, b.y, e.x, e.y) < e.r + 4) {
          hit = true;
          hitEnemy(g, ei, false);
          break;
        }
      }
      if (!hit && g.boss && dist(b.x, b.y, g.boss.x, g.boss.y) < g.boss.r + 4) {
        hit = true;
        g.boss.hp -= 1;
        g.boss.flash = 1;
        spawnBurst(g, g.boss.x, g.boss.y, RARITY_COL[g.boss.rarity].fill, 4);
        if (g.boss.hp <= 0) killBoss(g);
      }
      if (hit) g.bullets.splice(bi, 1);
    }

    // Enemy bullets ↔ player
    if (g.pinv <= 0) {
      for (let bi = g.bullets.length - 1; bi >= 0; bi--) {
        const b = g.bullets[bi];
        if (b.fp) continue;
        if (dist(b.x, b.y, g.px, g.py) < 22) {
          g.bullets.splice(bi, 1);
          takeDamage(g);
          break;
        }
      }
    }

    // Player ↔ drops
    for (let di = g.drops.length - 1; di >= 0; di--) {
      const d = g.drops[di];
      d.y += d.vy * dt;
      d.age += dt;
      if (d.age > 6 || d.y > H + 20) { g.drops.splice(di, 1); continue; }
      if (dist(d.x, d.y, g.px, g.py) < 28) {
        collectDrop(g, d);
        g.drops.splice(di, 1);
      }
    }

    // Particles
    for (let i = g.particles.length - 1; i >= 0; i--) {
      const p = g.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.life -= dt;
      if (p.life <= 0) g.particles.splice(i, 1);
    }

    // Floating texts
    for (let i = g.texts.length - 1; i >= 0; i--) {
      const tx = g.texts[i];
      tx.y += tx.vy * dt;
      tx.life -= dt;
      if (tx.life <= 0) g.texts.splice(i, 1);
    }

    // Combo timer
    g.comboT -= dt;
    if (g.comboT <= 0) g.combo = 0;

    // Screen shake decay
    g.shake = Math.max(0, g.shake - dt * 120);

    // Wave clear check
    if (g.enemies.length === 0 && !g.boss && g.waveLeft <= 0 && g.waveTransT <= 0) {
      g.wave += 1;
      g.waveLeft   = 6 + g.wave * 2;
      g.spawnI     = Math.max(600, 2200 - g.wave * 80);
      g.waveTransT = 2.5;
      g.texts.push({ x: W / 2, y: H / 2, text: `WAVE ${g.wave}`, life: 2, color: '#22D3EE', vy: -15 });
      spawnBurst(g, W / 2, H / 2, '#22D3EE', 20);
    }

    // Update React UI sparingly
    setUiScore(g.score);
    setUiWave(g.wave);
    setUiLives(g.lives);
    setUiCombo(g.combo);

    render(g, t);
    rafRef.current = requestAnimationFrame(step);
  }, []); // eslint-disable-line

  // ── Enemy hit ──────────────────────────────────────────────────────────────
  function hitEnemy(g: GS, idx: number, isBoss: boolean) {
    const e = isBoss ? g.boss! : g.enemies[idx];
    e.hp    -= 1;
    e.flash  = 1;
    spawnBurst(g, e.x, e.y, RARITY_COL[e.rarity].fill, 5);
    if (e.hp <= 0 && !isBoss) {
      killEnemy(g, idx);
    }
  }

  function killEnemy(g: GS, idx: number) {
    const e = g.enemies[idx];
    spawnBurst(g, e.x, e.y, RARITY_COL[e.rarity].fill, 14);
    // Drop gem
    for (let i = 0; i < (e.rarity === 'mythic' ? 3 : e.rarity === 'epic' ? 2 : 1); i++) {
      g.drops.push({ id: g.nextId++, x: e.x + rand(-12, 12), y: e.y, vy: rand(40, 80), rarity: e.rarity, age: 0 });
    }
    g.enemies.splice(idx, 1);
    g.shake = Math.min(8, g.shake + (e.rarity === 'mythic' ? 6 : 2));
  }

  function killBoss(g: GS) {
    const b = g.boss!;
    spawnBurst(g, b.x, b.y, RARITY_COL[b.rarity].fill, 40);
    for (let i = 0; i < 5; i++) {
      g.drops.push({ id: g.nextId++, x: b.x + rand(-40, 40), y: b.y + rand(-20, 20), vy: rand(30, 70), rarity: pickRarity(), age: 0 });
    }
    g.drops.push({ id: g.nextId++, x: b.x, y: b.y, vy: 50, rarity: 'mythic', age: 0 });
    g.score += 1000 * g.wave;
    g.boss   = null;
    g.shake  = 15;
    g.texts.push({ x: W / 2, y: H / 2 - 30, text: 'BOSS SLAIN!', life: 2.5, color: '#F472B6', vy: -20 });
  }

  function collectDrop(g: GS, d: Drop) {
    g.combo  += 1;
    g.comboT  = 2;
    const mult = Math.min(8, 1 + Math.floor(g.combo / 3));
    const pts  = RARITY_PTS[d.rarity] * mult;
    g.score  += pts;
    spawnBurst(g, d.x, d.y, RARITY_COL[d.rarity].drop, 6);
    const label = mult > 1 ? `+${pts} ×${mult}` : `+${pts}`;
    g.texts.push({ x: d.x, y: d.y - 10, text: label, life: 1, color: RARITY_COL[d.rarity].fill, vy: -40 });
    if (d.rarity === 'mythic') g.shake = Math.min(10, g.shake + 5);
  }

  function takeDamage(g: GS) {
    if (g.pinv > 0) return;
    g.lives  -= 1;
    g.pinv    = 2.5;
    g.combo   = 0;
    g.shake   = 10;
    spawnBurst(g, g.px, g.py, '#EF4444', 20);
    if (g.lives <= 0) {
      g.phase = 'gameover';
      if (g.score > g.hi) {
        g.hi = g.score;
        if (typeof localStorage !== 'undefined') localStorage.setItem('sjHi', String(g.score));
      }
      setUiPhase('gameover');
      setUiHi(g.hi);
    } else {
      g.phase = 'dead';
      setTimeout(() => { g.phase = 'playing'; setUiPhase('playing'); }, 1200);
      setUiPhase('dead');
    }
    setUiLives(g.lives);
  }

  function dist(ax: number, ay: number, bx: number, by: number) {
    return Math.hypot(ax - bx, ay - by);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function render(g: GS, t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = g.shake > 0 ? rand(-g.shake, g.shake) * 0.5 : 0;
    const sy = g.shake > 0 ? rand(-g.shake, g.shake) * 0.5 : 0;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.clearRect(-sx - 5, -sy - 5, W + 10, H + 10);

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-sx - 5, -sy - 5, W + 10, H + 10);

    // Stars
    drawStars(ctx, t);

    if (g.phase === 'idle') {
      drawTitle(ctx, t);
      ctx.restore();
      return;
    }

    if (g.phase === 'gameover') {
      drawGameOver(ctx, g);
      ctx.restore();
      return;
    }

    // Particles (behind everything)
    for (const p of g.particles) {
      const a = Math.max(0, p.life / 0.6);
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 8;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Drops
    for (const d of g.drops) drawDrop(ctx, d, t);

    // Enemy bullets
    for (const b of g.bullets) {
      if (b.fp) continue;
      ctx.save();
      ctx.shadowColor = '#F87171';
      ctx.shadowBlur  = 8;
      ctx.fillStyle   = '#FCA5A5';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Enemies
    for (const e of g.enemies) drawShape(ctx, e);
    if (g.boss)               drawShape(ctx, g.boss);

    // Player bullets
    for (const b of g.bullets) { if (b.fp) drawBullet(ctx, b); }

    // Player
    drawAuralia(ctx, g.px, g.py, g.pinv, t);

    // Floating texts
    for (const tx of g.texts) {
      const a = Math.min(1, tx.life);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font        = tx.text.startsWith('+') ? 'bold 14px monospace' : 'bold 22px monospace';
      ctx.fillStyle   = tx.color;
      ctx.shadowColor = tx.color;
      ctx.shadowBlur  = 12;
      ctx.textAlign   = 'center';
      ctx.fillText(tx.text, tx.x, tx.y);
      ctx.restore();
    }

    // Wave transition banner
    if (g.waveTransT > 0 && g.waveTransT < 2.5) {
      const a = Math.min(1, g.waveTransT / 0.4) * Math.min(1, g.waveTransT);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font        = 'bold 36px monospace';
      ctx.fillStyle   = '#22D3EE';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur  = 20;
      ctx.textAlign   = 'center';
      ctx.fillText(`WAVE ${g.wave}`, W / 2, H / 2 + 10);
      ctx.restore();
    }

    ctx.restore();
    ctx.restore?.(); // no-op safety
  }

  let starCache: { x: number; y: number; r: number; b: number }[] | null = null;
  function drawStars(ctx: CanvasRenderingContext2D, t: number) {
    if (!starCache) {
      starCache = Array.from({ length: 80 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(0.5, 1.8), b: rand(0, Math.PI * 2) }));
    }
    for (const s of starCache) {
      const alpha = 0.3 + Math.sin(t * 1.2 + s.b) * 0.2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawTitle(ctx: CanvasRenderingContext2D, t: number) {
    // Floating Auralia
    drawAuralia(ctx, W / 2, H / 2 - 80, 0, t);

    ctx.textAlign = 'center';
    ctx.shadowColor = '#22D3EE';
    ctx.shadowBlur  = 24;
    ctx.fillStyle   = '#22D3EE';
    ctx.font        = 'bold 42px monospace';
    ctx.fillText('SPACE', W / 2, H / 2 + 20);

    ctx.shadowColor = '#F472B6';
    ctx.fillStyle   = '#F472B6';
    ctx.font        = 'bold 42px monospace';
    ctx.fillText('JEWBLES', W / 2, H / 2 + 62);

    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#94A3B8';
    ctx.font        = '14px monospace';
    ctx.fillText('Tap or press Space to play', W / 2, H / 2 + 100);
    ctx.fillText('Arrow keys or drag to move', W / 2, H / 2 + 120);

    // Hi-score
    const hi = parseInt(typeof localStorage !== 'undefined' ? localStorage.getItem('sjHi') || '0' : '0', 10);
    if (hi > 0) {
      ctx.fillStyle = '#64748B';
      ctx.font      = '12px monospace';
      ctx.fillText(`Best: ${hi.toLocaleString()}`, W / 2, H / 2 + 148);
    }
  }

  function drawGameOver(ctx: CanvasRenderingContext2D, g: GS) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 36px monospace';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = '#EF4444';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 60);

    ctx.shadowColor = '#ffffff';
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 24px monospace';
    ctx.fillText(`${g.score.toLocaleString()}`, W / 2, H / 2 - 15);

    ctx.fillStyle   = '#64748B';
    ctx.font        = '13px monospace';
    ctx.fillText(`Wave ${g.wave}`, W / 2, H / 2 + 18);
    if (g.score >= g.hi && g.score > 0) {
      ctx.fillStyle   = '#FCD34D';
      ctx.font        = 'bold 14px monospace';
      ctx.fillText('NEW HIGH SCORE!', W / 2, H / 2 + 44);
    } else if (g.hi > 0) {
      ctx.fillStyle   = '#64748B';
      ctx.font        = '13px monospace';
      ctx.fillText(`Best: ${g.hi.toLocaleString()}`, W / 2, H / 2 + 44);
    }

    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#94A3B8';
    ctx.font        = '14px monospace';
    ctx.fillText('Tap or Space to play again', W / 2, H / 2 + 90);
  }

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const g = makeState();
    g.phase    = 'playing';
    g.waveLeft = 8;
    gsRef.current = g;
    setUiPhase('playing');
    setUiScore(0);
    setUiWave(1);
    setUiLives(3);
    setUiCombo(0);
    setUiHi(g.hi);
  }, []);

  // ── Input ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = gsRef.current;
      if (e.code === 'ArrowLeft'  || e.code === 'KeyA') { g.keysL = e.type === 'keydown'; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { g.keysR = e.type === 'keydown'; }
      if (e.type === 'keydown' && (e.code === 'Space' || e.code === 'Enter')) {
        if (g.phase === 'idle' || g.phase === 'gameover') startGame();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup',   onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [startGame]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getGameX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * W;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const g = gsRef.current;
      if (g.phase === 'idle' || g.phase === 'gameover') { startGame(); return; }
      g.touchX = getGameX(e.touches[0].clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      gsRef.current.touchX = getGameX(e.touches[0].clientX);
    };
    const onTouchEnd = () => { gsRef.current.touchX = null; };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd);

    // Mouse for desktop click-to-start + drag
    const onMouseDown = (e: MouseEvent) => {
      const g = gsRef.current;
      if (g.phase === 'idle' || g.phase === 'gameover') { startGame(); return; }
      const rect = canvas.getBoundingClientRect();
      g.touchX = ((e.clientX - rect.left) / rect.width) * W;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons !== 1) return;
      const g = gsRef.current;
      if (g.phase !== 'playing' && g.phase !== 'dead') return;
      const rect = canvas.getBoundingClientRect();
      g.touchX = ((e.clientX - rect.left) / rect.width) * W;
    };
    const onMouseUp = () => { gsRef.current.touchX = null; };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
      canvas.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseup',    onMouseUp);
    };
  }, [startGame]);

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    lastRef.current = performance.now();
    rafRef.current  = requestAnimationFrame(step);
    setUiHi(gsRef.current.hi);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [resize, step]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
        <span className="text-sm font-bold text-zinc-200 tracking-wider font-mono">SPACE JEWBLES</span>
        <span className="text-xs text-zinc-600 font-mono">Best: {uiHi.toLocaleString()}</span>
      </div>

      {/* HUD */}
      {uiPhase !== 'idle' && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-lg ${i < uiLives ? 'text-violet-400' : 'text-zinc-800'}`}>◆</span>
            ))}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-100 font-mono">{uiScore.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 font-mono">Wave {uiWave}</p>
            {uiCombo >= 3 && (
              <p className="text-xs font-bold text-amber-400 font-mono">×{Math.min(8, 1 + Math.floor(uiCombo / 3))} combo!</p>
            )}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-950">
        <canvas
          ref={canvasRef}
          className="cursor-none touch-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Rarity legend (idle only) */}
      {uiPhase === 'idle' && (
        <div className="flex justify-center gap-4 px-4 py-3 text-xs font-mono text-zinc-600">
          {(['common', 'rare', 'epic', 'mythic'] as Rarity[]).map(r => (
            <span key={r} style={{ color: RARITY_COL[r].fill }}>{r}</span>
          ))}
        </div>
      )}
    </div>
  );
}
