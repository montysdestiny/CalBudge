"use client";

/**
 * Adapted from kokonut UI's Attract Button
 * (https://kokonutui.com/docs/components/attract-button — MIT).
 * Keeps the original magnet mechanism (a ring of particles that snap to
 * center on hover/touch via spring physics) but renders the button's
 * actual label via `children` instead of a hardcoded "Hover me" /
 * "Attracting" string, drops the magnet glyph, adds a solid/outline
 * variant, and reskins the button + particles to the ledger palette
 * instead of the stock violet theme. Replaces CalBudge's plain CtaButton
 * everywhere.
 */

import { motion, useAnimation } from "motion/react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface MagnetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  particleCount?: number;
  variant?: "solid" | "outline";
}

interface Particle {
  x: number;
  y: number;
}

export default function MagnetButton({
  className,
  children,
  particleCount = 8,
  variant = "solid",
  ...props
}: MagnetButtonProps) {
  const [isAttracting, setIsAttracting] = useState(false);
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: particleCount }, () => ({ x: Math.random() * 80 - 40, y: Math.random() * 80 - 40 }))
  );
  const particlesControl = useAnimation();

  const handleStart = useCallback(async () => {
    setIsAttracting(true);
    await particlesControl.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 50, damping: 10 } });
  }, [particlesControl]);

  const handleEnd = useCallback(async () => {
    setIsAttracting(false);
    await particlesControl.start(i => ({
      x: particles[i]?.x ?? 0,
      y: particles[i]?.y ?? 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    }));
  }, [particlesControl, particles]);

  return (
    <button
      type="button"
      className={cn(
        "relative cursor-pointer touch-none overflow-hidden rounded-lg border-2 px-5 py-3 text-[0.9375rem] font-bold",
        "transition-[transform,box-shadow,background] duration-100 ease-out",
        "shadow-[0_0_0_var(--color-ink)]",
        "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-ink)]",
        "active:translate-x-0 active:translate-y-0 active:shadow-none active:duration-[50ms]",
        "disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-paper",
        variant === "solid" ? "border-ink bg-ink text-paper hover:bg-ink-hover" : "border-ink bg-paper text-ink hover:bg-hover-tint",
        className
      )}
      onMouseEnter={handleStart}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      {...props}
    >
      {particles.map((p, index) => (
        <motion.div
          animate={particlesControl}
          className={cn("pointer-events-none absolute top-1/2 left-1/2 h-1 w-1 rounded-full bg-accent", isAttracting ? "opacity-100" : "opacity-0")}
          custom={index}
          initial={{ x: p.x, y: p.y }}
          key={index}
        />
      ))}
      <span className="relative flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
