"use client";

/**
 * Adapted from kokonut UI's Background Paths
 * (https://kokonutui.com/docs/components/background-paths — @dorianbaffier, MIT).
 * Extracts just the animated flowing-path mechanism as a container-bound
 * backdrop layer instead of the original's full-viewport hero section
 * (which also carried its own title/CTA chrome), and swaps the stock
 * purple/pink/blue gradient for the ledger's ink/mustard palette.
 */

import { motion } from "motion/react";
import { memo, useMemo } from "react";

interface Point {
  x: number;
  y: number;
}

interface PathData {
  id: string;
  d: string;
  opacity: number;
  width: number;
}

function generatePath(index: number, amplitude: number): string {
  const phase = index * 0.2;
  const segments = 8;
  const startX = 2400;
  const startY = 800;
  const endX = -2400;
  const endY = -800 + index * 25;
  const points: Point[] = [];

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;
    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;
    const amplitudeFactor = 1 - eased * 0.3;
    const wave1 = Math.sin(progress * Math.PI * 3 + phase) * (amplitude * 0.7 * amplitudeFactor);
    const wave2 = Math.cos(progress * Math.PI * 4 + phase) * (amplitude * 0.3 * amplitudeFactor);
    points.push({ x: baseX, y: baseY + wave1 + wave2 });
  }

  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const tension = 0.4;
      const cp1x = prev.x + (p.x - prev.x) * tension;
      const cp2x = prev.x + (p.x - prev.x) * (1 - tension);
      return `C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");
}

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export default memo(function BudgetLoadingPaths() {
  const paths: PathData[] = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: generateId("path"),
        d: generatePath(i, 120),
        opacity: 0.12 + i * 0.015,
        width: 3 + i * 0.25,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid slice" viewBox="-2400 -800 4800 1600">
        <title>Loading background</title>
        <defs>
          <linearGradient id="calbudge-path-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--color-ink)" stopOpacity={0.5} />
            <stop offset="50%" stopColor="var(--color-accent)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="var(--color-ink)" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        {paths.map((path, i) => (
          <motion.path
            animate={{ opacity: path.opacity, scale: 1, y: [0, -12, 0] }}
            d={path.d}
            initial={{ opacity: 0, scale: 0.9 }}
            key={path.id}
            stroke="url(#calbudge-path-gradient)"
            strokeLinecap="round"
            strokeWidth={path.width}
            transition={{
              opacity: { duration: 1 },
              scale: { duration: 1 },
              y: { duration: 6 + i * 0.3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", repeatType: "reverse" },
            }}
          />
        ))}
      </svg>
    </div>
  );
});
