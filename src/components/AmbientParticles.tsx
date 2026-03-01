'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { emotionToParticleParams } from '@/auralia/consciousness';

// Matches ExpandedEmotionalState in shared/auralia/guardianBehavior
type EmotionState =
  | 'serene' | 'calm' | 'curious' | 'playful' | 'contemplative'
  | 'affectionate' | 'restless' | 'yearning' | 'overwhelmed' | 'withdrawn'
  | 'ecstatic' | 'melancholic' | 'mischievous' | 'protective' | 'transcendent';

type FlowPattern = 'chaotic' | 'flowing' | 'pulsing' | 'spiral' | 'calm';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayPhase: number;
  swaySpeed: number;
  drift: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

// Map raw vitals (0-100) → one of 15 conscious emotional states
function vitalsToEmotion(
  hunger: number,
  hygiene: number,
  mood: number,
  energy: number,
): EmotionState {
  const avg = (hunger + hygiene + mood + energy) / 4;
  if (avg >= 85 && mood >= 80) return 'ecstatic';
  if (avg >= 75 && mood >= 70) return 'serene';
  if (avg >= 65 && energy >= 65 && mood >= 65) return 'playful';
  if (avg >= 60 && mood >= 70) return 'affectionate';
  if (energy >= 60 && mood >= 60 && hunger < 50) return 'mischievous';
  if (energy >= 60 && mood >= 60) return 'curious';
  if (avg >= 50 && energy < 45) return 'contemplative';
  if (avg >= 50) return 'calm';
  if (avg >= 40 && energy < 35) return 'protective';
  if (avg >= 35 && mood < 45) return 'yearning';
  if (hunger < 30 || hygiene < 30) return 'restless';
  if (avg < 30 && mood >= 40) return 'overwhelmed';
  if (avg < 30) return 'withdrawn';
  if (mood < 40) return 'melancholic';
  return 'calm';
}

// Emotion-based colour palettes — each state has its own feel
const EMOTION_COLORS: Record<EmotionState, string[]> = {
  ecstatic:      ['rgba(255,220,0,0.8)',   'rgba(255,100,200,0.7)', 'rgba(80,220,255,0.65)'],
  serene:        ['rgba(190,160,255,0.5)', 'rgba(220,200,255,0.4)', 'rgba(120,190,255,0.4)'],
  playful:       ['rgba(255,80,180,0.7)',  'rgba(80,220,200,0.65)', 'rgba(255,190,80,0.6)'],
  affectionate:  ['rgba(255,130,170,0.65)','rgba(255,180,210,0.5)', 'rgba(210,110,255,0.45)'],
  mischievous:   ['rgba(80,220,130,0.7)',  'rgba(60,210,255,0.6)',  'rgba(210,255,80,0.55)'],
  curious:       ['rgba(255,220,60,0.65)', 'rgba(80,200,255,0.55)', 'rgba(180,255,130,0.45)'],
  contemplative: ['rgba(110,90,210,0.5)',  'rgba(150,110,255,0.4)', 'rgba(80,130,210,0.4)'],
  calm:          ['rgba(139,92,246,0.4)',  'rgba(192,132,252,0.35)','rgba(34,211,238,0.3)'],
  protective:    ['rgba(255,185,0,0.65)',  'rgba(255,150,0,0.5)',   'rgba(210,110,0,0.4)'],
  yearning:      ['rgba(165,105,210,0.5)', 'rgba(210,150,255,0.4)', 'rgba(125,85,185,0.35)'],
  restless:      ['rgba(255,150,60,0.65)', 'rgba(255,110,80,0.55)', 'rgba(255,190,60,0.45)'],
  overwhelmed:   ['rgba(255,65,65,0.6)',   'rgba(255,130,60,0.5)',  'rgba(210,80,80,0.5)'],
  withdrawn:     ['rgba(120,130,150,0.22)','rgba(100,110,130,0.18)'],
  melancholic:   ['rgba(100,125,185,0.4)', 'rgba(125,145,205,0.35)','rgba(80,100,165,0.3)'],
  transcendent:  ['rgba(255,255,255,0.8)', 'rgba(200,185,255,0.7)', 'rgba(185,235,255,0.7)'],
};

/**
 * Ambient floating particles driven by the pet's conscious emotional state.
 * Emotion is derived from vitals and fed through the MOSS60 consciousness
 * system (emotionToParticleParams) so behaviour reflects the full 15-state
 * model rather than raw stat thresholds.
 */
export function AmbientParticles({ enabled = true }: { enabled?: boolean }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const pointerRef   = useRef({ x: 0, y: 0, active: false });

  const vitals = useStore(state => state.vitals);

  // Derive consciousness-backed particle config from vitals
  const consciousnessConfig = useMemo(() => {
    const { hunger, hygiene, mood, energy } = vitals;
    const emotion = vitalsToEmotion(hunger, hygiene, mood, energy);
    const avg01 = (hunger + hygiene + mood + energy) / 400; // 0–1

    // Simplified drives derived from vitals (matches GuardianDrive shape)
    const drives = {
      resonance:   mood    / 100,
      exploration: energy  / 100,
      connection:  (mood + hygiene) / 200,
      rest:        (100 - energy)   / 100,
      expression:  (mood + energy)  / 200,
    };

    // Simplified comfort from vitals average (matches ComfortState shape)
    const comfort = {
      overall: avg01,
      source: (
        avg01 >= 0.7 ? 'harmonized' :
        avg01 >= 0.5 ? 'seeking'     :
        avg01 >= 0.3 ? 'unsettled'   : 'distressed'
      ) as 'harmonized' | 'seeking' | 'unsettled' | 'distressed',
      unmetNeeds: [
        ...(hunger < 40  ? (['exploration'] as const) : []),
        ...(energy < 40  ? (['rest']        as const) : []),
        ...(mood   < 40  ? (['connection']  as const) : []),
        ...(hygiene < 40 ? (['resonance']   as const) : []),
      ],
      dominantDrive: (
        Object.entries(drives).sort(([, a], [, b]) => b - a)[0][0]
      ) as keyof typeof drives,
    };

    const params = emotionToParticleParams(emotion as any, comfort as any, drives as any);

    return {
      colors:        EMOTION_COLORS[emotion],
      spawnRate:     Math.min(0.12, params.particleCount / 350),
      speed:         Math.max(0.15, params.particleSpeed * 0.38),
      floatStrength: 0.7 + params.particleSpeed * 0.28,
      maxParticles:  Math.min(60, Math.max(6, params.particleCount + 10)),
      baseSize:      Math.max(1, params.particleSize * 0.85),
      colorIntensity:params.colorIntensity,
      flowPattern:   params.flowPattern as FlowPattern,
    };
  }, [vitals]);

  useEffect(() => {
    if (!enabled) return;
    // Respect the OS/browser "prefer reduced motion" setting.
    // Mirrors the same check used in src/lib/haptics.ts.
    // WCAG 2.2 SC 2.2.2: users must be able to pause/stop non-essential motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = particlesRef.current.map(p => ({
        ...p,
        x: Math.min(canvas.width,  Math.max(0,   p.x)),
        y: Math.min(canvas.height, Math.max(-20, p.y)),
      }));
    };

    const updatePointer = (x: number, y: number) => {
      pointerRef.current = { x, y, active: true };
    };
    const clearPointer = () => { pointerRef.current.active = false; };

    const handleMouseMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    };

    resizeCanvas();
    window.addEventListener('resize',     resizeCanvas);
    window.addEventListener('mousemove',  handleMouseMove, { passive: true });
    window.addEventListener('touchmove',  handleTouchMove, { passive: true });
    window.addEventListener('touchend',   clearPointer,    { passive: true });
    window.addEventListener('mouseleave', clearPointer);

    const {
      colors, spawnRate, speed, floatStrength,
      maxParticles, baseSize, flowPattern,
    } = consciousnessConfig;

    const spawnParticle = () => {
      particlesRef.current.push({
        x:         Math.random() * canvas.width,
        y:         canvas.height + 10,
        vx:        (Math.random() - 0.5) * speed * 1.4,
        vy:        -Math.random() * speed - 0.3,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.02,
        drift:     (Math.random() - 0.5) * 0.5,
        size:      Math.random() * baseSize + 1,
        opacity:   Math.random() * 0.5 + 0.3,
        color:     colors[Math.floor(Math.random() * colors.length)],
        life:      0,
        maxLife:   200 + Math.random() * 100,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn
      if (Math.random() < spawnRate && particlesRef.current.length < maxParticles) {
        spawnParticle();
      }

      // Update & draw
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;

        // Base float — all patterns use a gentle upward drift
        p.x += p.vx + p.drift + Math.sin(p.life * p.swaySpeed + p.swayPhase) * 0.4 * floatStrength;
        p.y += p.vy;

        // Flow-pattern-specific movement
        switch (flowPattern) {
          case 'chaotic':
            // Small random velocity nudges each frame
            p.vx += (Math.random() - 0.5) * 0.14;
            p.vy += (Math.random() - 0.5) * 0.05;
            // Clamp speed so they don't rocket off-screen
            {
              const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
              if (spd > 2.2) { p.vx = (p.vx / spd) * 2.2; p.vy = (p.vy / spd) * 2.2; }
            }
            break;

          case 'spiral': {
            // Tangential force — particles swirl around canvas centre
            const dcx = p.x - canvas.width  / 2;
            const dcy = p.y - canvas.height / 2;
            const tangential = 0.0025;
            p.vx += -dcy * tangential;
            p.vy +=  dcx * tangential;
            const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (spd > 1.8) { p.vx = (p.vx / spd) * 1.8; p.vy = (p.vy / spd) * 1.8; }
            break;
          }

          case 'calm':
            // Dampen horizontal drift so particles float almost straight up
            p.vx   *= 0.97;
            p.drift *= 0.97;
            break;

          // 'flowing' and 'pulsing' rely on the base sinusoidal sway above
          default:
            break;
        }

        // Boundary bounce (left/right edges)
        if (p.x < -20 || p.x > canvas.width + 20) {
          p.vx   *= -1;
          p.drift *= -1;
          p.x = Math.min(canvas.width + 20, Math.max(-20, p.x));
        }

        // Pointer/touch repulsion — particles feel aware of presence
        if (pointerRef.current.active) {
          const dx = p.x - pointerRef.current.x;
          const dy = p.y - pointerRef.current.y;
          const dSq = dx * dx + dy * dy;
          const influenceR = 180;
          if (dSq > 0 && dSq < influenceR * influenceR) {
            const dist  = Math.sqrt(dSq);
            const force = ((influenceR - dist) / influenceR) * 0.18;
            p.x += (dx / dist) * force * 8;
            p.y += (dy / dist) * force * 2;
          }
        }

        // Life-based fade
        const lifeRatio = p.life / p.maxLife;
        let currentOpacity = p.opacity * (1 - lifeRatio);

        // Pulsing pattern: beat the opacity
        if (flowPattern === 'pulsing') {
          currentOpacity *= 0.5 + 0.5 * Math.sin(p.life * 0.09 + p.swayPhase);
        }

        // Draw with glow
        ctx.save();
        ctx.globalAlpha  = Math.max(0, currentOpacity);
        ctx.fillStyle    = p.color;
        ctx.shadowColor  = p.color;
        ctx.shadowBlur   = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.life < p.maxLife && p.y > -20;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize',     resizeCanvas);
      window.removeEventListener('mousemove',  handleMouseMove);
      window.removeEventListener('touchmove',  handleTouchMove);
      window.removeEventListener('touchend',   clearPointer);
      window.removeEventListener('mouseleave', clearPointer);
      cancelAnimationFrame(animationRef.current);
    };
  }, [consciousnessConfig, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
