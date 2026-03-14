"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, memo } from "react";

interface MoleculeProps {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
  speed: number;
  depth: number;
}

// Complex Molecular Structure unit (Atomism style)
const MoleculeUnit = memo(({ x, y, size, color, delay, speed, depth }: MoleculeProps) => {
  // Randomize the internal structure slightly based on delay
  const branches = (Math.floor(delay * 10) % 3) + 2; 
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [depth * 0.1, depth * 0.45, depth * 0.1],
        x: [0, 25 * depth, -25 * depth, 0],
        y: [0, -25 * depth, 25 * depth, 0],
        rotate: [0, 360]
      }}
      transition={{ 
        duration: speed, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay 
      }}
      className="absolute pointer-events-none"
      style={{ 
        left: x, 
        top: y, 
        width: size * depth, 
        height: size * depth,
        willChange: "transform, opacity",
        zIndex: Math.floor(depth * 10)
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
        {/* Central Core */}
        <circle cx="50" cy="50" r="15" fill={color} fillOpacity="0.8" />
        
        {/* Bonds and Outer Atoms */}
        {[...Array(branches)].map((_, i) => {
          const angle = (i * 360) / branches;
          const rad = (angle * Math.PI) / 180;
          const tx = 50 + Math.cos(rad) * 35;
          const ty = 50 + Math.sin(rad) * 35;
          
          return (
            <g key={i}>
              <line 
                x1="50" y1="50" x2={tx} y2={ty} 
                stroke={color} strokeWidth="4" strokeOpacity="0.4" 
              />
              <circle cx={tx} cy={ty} r="8" fill={color} fillOpacity="0.6" />
              {/* Secondary bonds for "Rise of Atomism" complexity */}
              {depth > 0.5 && (
                <circle cx={tx + 10} cy={ty - 5} r="4" fill={color} fillOpacity="0.3" />
              )}
            </g>
          );
        })}
        
        {/* Ambient Glow */}
        <defs>
          <radialGradient id={`glow-${delay}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill={`url(#glow-${delay})`} />
      </svg>
    </motion.div>
  );
});
MoleculeUnit.displayName = "MoleculeUnit";

export default function BiotechBackground() {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax layers
  const yFast = useTransform(scrollY, [0, 1000], [0, -250]);
  const ySlow = useTransform(scrollY, [0, 1000], [0, -120]);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const emerald = "#059669";
  const teal = "#0891B2";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-2] bg-[#F4FBF8]">
      {/* Central Ambient Glow */}
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] bg-gradient-radial from-[#A7D9C0]/15 to-transparent blur-[140px] opacity-30" />

      {/* Background Parallax - Slow (Distant) */}
      <motion.div style={{ y: ySlow }} className="absolute inset-0">
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
          {[...Array(12)].map((_, i) => (
            <motion.line
              key={`bond-slow-${i}`}
              x1={`${(i * 23) % 100}%`}
              y1={`${(i * 53) % 100}%`}
              x2={`${((i + 2) * 37) % 100}%`}
              y2={`${((i + 1) * 29) % 100}%`}
              stroke={teal}
              strokeWidth="0.4"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 12, repeat: Infinity }}
            />
          ))}
        </svg>
        {[...Array(15)].map((_, i) => (
          <MoleculeUnit 
            key={`mol-slow-${i}`}
            x={`${(i * 17) % 100}%`}
            y={`${(i * 47) % 100}%`}
            size={80} // Doubled from 40
            color={teal}
            speed={20 + (i % 6)}
            delay={i * 0.3}
            depth={0.25}
          />
        ))}
      </motion.div>

      {/* Foreground Parallax - Fast (Near) */}
      <motion.div style={{ y: yFast }} className="absolute inset-0">
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]">
          {[...Array(8)].map((_, i) => (
            <motion.line
              key={`bond-fast-${i}`}
              x1={`${(i * 31) % 100}%`}
              y1={`${(i * 17) % 100}%`}
              x2={`${((i + 1) * 41) % 100}%`}
              y2={`${((i + 2) * 31) % 100}%`}
              stroke={emerald}
              strokeWidth="1.2"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 7, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </svg>
        {[...Array(10)].map((_, i) => (
          <MoleculeUnit 
            key={`mol-fast-${i}`}
            x={`${(i * 29) % 100}%`}
            y={`${(i * 19) % 100}%`}
            size={180} // Substantially increased from 80
            color={i % 2 === 0 ? emerald : teal}
            speed={10 + (i % 3)} 
            delay={i * 0.5}
            depth={0.7}
          />
        ))}
      </motion.div>

      {/* Minimalist Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.1]" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #A7D9C0 0.8px, transparent 0.8px)', 
             backgroundSize: '100px 100px' 
           }} 
      />

      {/* Final Glass Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4FBF8]/80 via-transparent to-[#F4FBF8]/80" />
    </div>
  );
}
