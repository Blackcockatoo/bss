"use client";

/**
 * Game-feel primitives shared by every arcade game: particle bursts,
 * floating score text, animated counters, combo flames, and screen shake.
 * All CSS/framer-motion driven — no canvas, cheap on mobile.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

// ===== PARTICLE BURSTS =====

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  shape: "dot" | "star";
}

export interface BurstOptions {
  /** Position as percentages of the container (0-100). */
  x: number;
  y: number;
  colors?: string[];
  count?: number;
  /** Spread radius in px. */
  radius?: number;
  starChance?: number;
}

let particleId = 0;

/**
 * Owns a pool of particles. Call `burst()` from event handlers;
 * render `<ParticleLayer particles={particles} />` inside a relative container.
 */
export function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const handle of timeouts.current) clearTimeout(handle);
    },
    [],
  );

  const burst = useCallback(
    ({
      x,
      y,
      colors = ["#22d3ee", "#a78bfa", "#fbbf24"],
      count = 14,
      radius = 70,
      starChance = 0.25,
    }: BurstOptions) => {
      const fresh: Particle[] = Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
        const speed = radius * (0.5 + Math.random() * 0.5);
        return {
          id: particleId++,
          x,
          y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: Math.random() < starChance ? ("star" as const) : ("dot" as const),
        };
      });
      setParticles((prev) => [...prev.slice(-60), ...fresh]);
      const ids = new Set(fresh.map((p) => p.id));
      timeouts.current.push(
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
        }, 900),
      );
    },
    [],
  );

  return { particles, burst };
}

export function ParticleLayer({ particles }: { particles: Particle[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          initial={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: particle.dx,
            y: particle.dy,
            scale: 0,
            opacity: 0,
            rotate: particle.shape === "star" ? 180 : 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.shape === "dot" ? particle.color : "transparent",
            borderRadius: particle.shape === "dot" ? "9999px" : 0,
            color: particle.color,
            fontSize: particle.size * 1.6,
            lineHeight: 0.6,
          }}
        >
          {particle.shape === "star" ? "✦" : null}
        </motion.span>
      ))}
    </div>
  );
}

// ===== FLOATING TEXT (score pops, judgements) =====

interface FloatingItem {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  scale: number;
}

let floatId = 0;

export function useFloatingText() {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const handle of timeouts.current) clearTimeout(handle);
    },
    [],
  );

  const pop = useCallback(
    (text: string, options: { x?: number; y?: number; color?: string; scale?: number } = {}) => {
      const item: FloatingItem = {
        id: floatId++,
        text,
        color: options.color ?? "#fbbf24",
        x: options.x ?? 50,
        y: options.y ?? 42,
        scale: options.scale ?? 1,
      };
      setItems((prev) => [...prev.slice(-6), item]);
      timeouts.current.push(
        setTimeout(() => {
          setItems((prev) => prev.filter((existing) => existing.id !== item.id));
        }, 950),
      );
    },
    [],
  );

  return { floatingItems: items, pop };
}

export function FloatingTextLayer({ items }: { items: FloatingItem[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, y: 8, scale: 0.6 }}
            animate={{ opacity: 1, y: -34, scale: item.scale }}
            exit={{ opacity: 0, y: -52, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="absolute -translate-x-1/2 whitespace-nowrap font-black tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            style={{ left: `${item.x}%`, top: `${item.y}%`, color: item.color }}
          >
            {item.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ===== SCREEN SHAKE =====

/**
 * Wrap the play area; call `shake()` on misses/impacts.
 */
export function useScreenShake() {
  const [shakeKey, setShakeKey] = useState(0);
  const shake = useCallback(() => setShakeKey((key) => key + 1), []);

  const ShakeWrap = useCallback(
    ({ children, className }: { children: ReactNode; className?: string }) => (
      <motion.div
        key={shakeKey}
        animate={
          shakeKey > 0
            ? { x: [0, -8, 7, -5, 4, -2, 0], y: [0, 3, -3, 2, -1, 0, 0] }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.4 }}
        className={className}
      >
        {children}
      </motion.div>
    ),
    [shakeKey],
  );

  return { shake, ShakeWrap };
}

// ===== ANIMATED NUMBER =====

export function AnimatedNumber({
  value,
  durationMs = 900,
  className,
  style,
}: {
  value: number;
  durationMs?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const startedAt = performance.now();
    let frame: number;

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
      else fromRef.current = value;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}

// ===== COMBO FLAME =====

export function ComboFlame({ combo, threshold = 4 }: { combo: number; threshold?: number }) {
  if (combo < threshold) return null;
  const heat = Math.min(1, (combo - threshold) / 12);
  return (
    <motion.div
      initial={{ scale: 0, rotate: -12 }}
      animate={{ scale: 1 + heat * 0.3, rotate: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 16 }}
      className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold"
      style={{
        borderColor: `rgba(251, 191, 36, ${0.4 + heat * 0.6})`,
        backgroundColor: `rgba(180, 83, 9, ${0.2 + heat * 0.3})`,
        color: heat > 0.6 ? "#fef3c7" : "#fbbf24",
        boxShadow: `0 0 ${8 + heat * 18}px rgba(251, 191, 36, ${0.25 + heat * 0.45})`,
      }}
    >
      <Flame className="h-3.5 w-3.5" />
      {combo}x
    </motion.div>
  );
}

// ===== MASTERY STARS =====

export function MasteryStars({
  earned,
  total = 5,
  size = "text-sm",
}: {
  earned: number;
  total?: number;
  size?: string;
}) {
  return (
    <span className={`inline-flex gap-0.5 ${size}`} aria-label={`${earned} of ${total} mastery stars`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={i < earned ? "text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" : "text-slate-700"}
        >
          ★
        </span>
      ))}
    </span>
  );
}
