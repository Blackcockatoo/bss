"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import { getCockatooDataUri } from "@/lib/cockatooSprites";

type JewbleLoadingScreenProps = {
  /** Optional external progress 0–100. If omitted, a smooth fake progress is used. */
  progress?: number;
  /** Optional explicit status label. If omitted, it's derived from progress. */
  statusMessage?: string;
};

const STAGE_MESSAGES: { threshold: number; label: string }[] = [
  { threshold: 0, label: "Priming the astral circuits…" },
  { threshold: 10, label: "Summoning the Yellow-tailed Black Cockatoo…" },
  { threshold: 25, label: "Weaving golden filaments into the mandala…" },
  { threshold: 45, label: "Syncing prime tails with the lattice…" },
  { threshold: 65, label: "Focusing cyan light through the halo…" },
  { threshold: 85, label: "Harmonising soul, seed, and shell…" },
  { threshold: 100, label: "Docking into the Jewble cockpit…" },
];

const ambientSparkleVariants = {
  pulse: {
    opacity: [0.15, 0.5, 0.15],
    scale: [1, 1.08, 1],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export function JewbleLoadingScreen(props: JewbleLoadingScreenProps) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [isDodging, setIsDodging] = useState(false);
  const dodgeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = props.progress ?? internalProgress;

  useEffect(() => {
    if (props.progress !== undefined) return;
    const controls = animate(0, 92, {
      duration: 9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setInternalProgress(v),
    });
    return () => controls.stop();
  }, [props.progress]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = useMemo(
    () => circumference * (1 - safeProgress / 100),
    [circumference, safeProgress]
  );

  const derivedLabel = useMemo(() => {
    let current = STAGE_MESSAGES[0].label;
    for (const stage of STAGE_MESSAGES) {
      if (safeProgress >= stage.threshold) current = stage.label;
    }
    return current;
  }, [safeProgress]);

  const displayLabel = props.statusMessage ?? derivedLabel;

  const glow = useMotionValue(0);
  const glowScale = useTransform(glow, [0, 1], [1, 1.1]);
  const glowOpacity = useTransform(glow, [0, 1], [0.2, 0.6]);

  useEffect(() => {
    const controls = animate(glow, 1, {
      duration: 6,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [glow]);

  useEffect(() => {
    return () => {
      if (dodgeTimeout.current) {
        clearTimeout(dodgeTimeout.current);
        dodgeTimeout.current = null;
      }
    };
  }, []);

  const handleDodge = useCallback(() => {
    if (isDodging) return;
    setIsDodging(true);
    if (dodgeTimeout.current) {
      clearTimeout(dodgeTimeout.current);
    }
    dodgeTimeout.current = setTimeout(() => {
      setIsDodging(false);
      dodgeTimeout.current = null;
    }, 450);
  }, [isDodging]);

  const cockatooVariants = {
    orbit: {
      x: [-80, 0, 80, 0, -80],
      y: [0, 40, 0, -40, 0],
      rotate: [8, -4, 4, -8, 8],
      transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
    },
    dodge: {
      x: [0, 0, 0],
      y: [-20, -110, -20],
      rotate: [0, -20, 5],
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  };

  return (
    <div
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden"
      onPointerDown={handleDodge}
      onTouchStart={handleDodge}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />
        <div className="absolute -inset-32 opacity-80 blur-3xl bg-[radial-gradient(circle_at_10%_0%,rgba(250,204,21,0.16),transparent_60%),radial-gradient(circle_at_80%_110%,rgba(34,211,238,0.18),transparent_60%)]" />
        <motion.div
          variants={ambientSparkleVariants}
          animate="pulse"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,250,252,0.05),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(148,163,184,0.08),transparent_60%)]"
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl px-6">
        <div className="relative border border-slate-800/80 bg-slate-950/70 rounded-3xl shadow-[0_0_60px_rgba(8,47,73,0.9)] overflow-hidden backdrop-blur-xl">
          <div className="relative h-1.5 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900" />
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-amber-400 via-cyan-300 to-emerald-400"
              animate={{ x: ["-40%", "120%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 p-8">
            <div className="relative flex items-center justify-center w-full md:w-1/2 aspect-square">
              <motion.div
                style={{ scale: glowScale, opacity: glowOpacity }}
                className="absolute inset-4 rounded-full bg-[conic-gradient(from_0deg,rgba(250,204,21,0.18),rgba(56,189,248,0.2),rgba(45,212,191,0.16),rgba(250,204,21,0.18))] blur-xl"
              />

              <motion.svg className="relative w-64 h-64 drop-shadow-[0_0_25px_rgba(8,47,73,0.8)]" viewBox="0 0 220 220">
                <defs>
                  <radialGradient id="mandalaFill" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="rgba(15,23,42,1)" />
                    <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                  </radialGradient>
                  <linearGradient id="mandalaStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#facc15" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>

                <circle cx="110" cy="110" r="72" fill="url(#mandalaFill)" stroke="#020617" strokeWidth="1" />

                {[0, 60, 120].map((angle) => (
                  <g key={angle} transform={`rotate(${angle},110,110)`}>
                    <line x1="110" y1="32" x2="110" y2="188" stroke="rgba(148,163,184,0.45)" strokeWidth="1" strokeLinecap="round" />
                  </g>
                ))}

                <motion.circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="url(#mandalaStroke)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  initial={false}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 20px rgba(56,189,248,0.7))" }}
                />

                <motion.circle
                  cx="110"
                  cy="110"
                  r="46"
                  fill="none"
                  stroke="rgba(148,163,184,0.45)"
                  strokeWidth="1.4"
                  strokeDasharray="4 8"
                  animate={{ rotate: 360 }}
                  style={{ originX: "110px", originY: "110px" }}
                  transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                />
              </motion.svg>

              <motion.div
                className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-slate-50 to-cyan-200 shadow-[0_0_40px_rgba(250,250,250,0.75)] flex items-center justify-center cursor-pointer"
                variants={cockatooVariants}
                animate={isDodging ? "dodge" : "orbit"}
                onClick={handleDodge}
                whileHover={{ scale: 1.08 }}
              >
                <Image
                  src={getCockatooDataUri("flying")}
                  alt="Jewble Cockatoo"
                  width={56}
                  height={56}
                  priority
                  className="w-14 h-14 select-none pointer-events-none"
                />
              </motion.div>
            </div>

            <div className="w-full md:w-1/2 space-y-6">
              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-cyan-300/70 mb-2">Jewble // Meta-Pet</p>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">The Celestial Flight</h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Your cockpit is spinning up. Our cockatoo is tracing figure-eights through a gold–cyan mandala while the core experience boots in the background.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{displayLabel}</span>
                  <span>{Math.round(safeProgress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-900/80 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 via-cyan-300 to-emerald-400"
                    initial={{ width: "0%" }}
                    animate={{ width: `${safeProgress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="text-[0.7rem] text-slate-400 leading-relaxed">
                Tip: tap or click the cockatoo to make it briefly dodge off its orbit.  
                It’ll always snap back to the flight path—just like Jewble recovering from a cold start.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
