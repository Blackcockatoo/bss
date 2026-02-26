/**
 * Quantum Data Flow Premium Add-on
 * Extraordinary Ability: Real-time multi-dimensional data stream visualization.
 * Animation: Particle-based flow using Framer Motion.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface QuantumDataFlowProps {
  className?: string;
}

export const QuantumDataFlow: React.FC<QuantumDataFlowProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Simple CSS-based particle animation
    particlesRef.current.forEach((particle, i) => {
      if (particle) {
        const animate = () => {
          const x = Math.random() * 200 - 100;
          const y = Math.random() * 200 - 100;
          const duration = 2 + Math.random() * 3;

          particle.style.transition = `transform ${duration}s ease-in-out`;
          particle.style.transform = `translate(${x}px, ${y}px)`;

          setTimeout(animate, duration * 1000);
        };
        setTimeout(animate, i * 200);
      }
    });
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-8 bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl ${className}`}
    >
      {/* Background Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) particlesRef.current[i] = el;
          }}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Quantum Data Flow</h2>
        <p className="text-slate-400 mb-6">
          Processing multi-dimensional streams with zero latency.
        </p>

        {/* Animated Data Bars */}
        <div className="flex items-end gap-2 h-32">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [20, Math.random() * 100 + 20, 20] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
              className="w-4 bg-gradient-to-t from-cyan-600 to-blue-400 rounded-t-sm"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default QuantumDataFlow;
