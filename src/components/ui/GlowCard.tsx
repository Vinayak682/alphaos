"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  glowColor?: "primary" | "red" | "blue" | "purple";
}

const GLOW = {
  primary: "rgba(0,220,130,0.15)",
  red:     "rgba(255,60,80,0.15)",
  blue:    "rgba(60,140,255,0.15)",
  purple:  "rgba(160,80,255,0.15)",
};

export default function GlowCard({ children, className, glowColor = "primary" }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 25 });
  const sy = useSpring(y, { stiffness: 200, damping: 25 });
  const rotateX = useTransform(sy, [-100, 100], [3, -3]);
  const rotateY = useTransform(sx, [-100, 100], [-3, 3]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative bg-card border border-border rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_30px_-5px_var(--glow)]",
        className
      )}
      // @ts-expect-error css var
      style={{ "--glow": GLOW[glowColor], rotateX, rotateY, transformStyle: "preserve-3d" }}
    >
      {/* Spotlight gradient that follows cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
        style={{
          background: `radial-gradient(200px circle at ${sx}px ${sy}px, ${GLOW[glowColor]}, transparent 70%)`,
        }}
      />
      {children}
    </motion.div>
  );
}
