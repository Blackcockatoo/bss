/**
 * Ethereal Background Engine Premium Add-on
 * Extraordinary Ability: Reactive, generative background patterns.
 * Animation: Mouse-tracking spring physics and gradient shifts.
 */

'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface EtherealBackgroundProps {
  className?: string;
}

export const EtherealBackground: React.FC<EtherealBackgroundProps> = ({ className = '' }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set(clientX - innerWidth / 2);
      mouseY.set(clientY - innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className={`relative w-full h-64 bg-black rounded-3xl overflow-hidden border border-white/10 ${className}`}>
      {/* Reactive Gradient Beams */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute inset-0 opacity-30"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-fuchsia-500 via-blue-500 to-cyan-500 blur-[120px] rounded-full" />
      </motion.div>

      {/* Floating Mesh Grid (using CSS pattern instead of external image) */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
          ETHEREAL ENGINE
        </h2>
        <p className="text-slate-500 text-sm tracking-widest mt-2">REACTIVE VISUAL ENVIRONMENT</p>
      </div>
    </div>
  );
};

export default EtherealBackground;
