"use client";

/**
 * Adapted from kokonut UI's Apple Activity Card
 * (https://kokonutui.com/docs/components/apple-activity-card — MIT).
 * Keeps the original mechanism (three concentric animated SVG progress
 * rings, Motion-driven stroke-dashoffset reveal) but makes the ring data
 * a prop instead of a hardcoded Move/Exercise/Stand demo dataset, and
 * drops the neon gradient fills + glow filter for solid ledger colors —
 * these rings show real computed numbers, not decoration. `fraction`
 * drives the ring fill directly so the same component works for both
 * kcal-ratio rings (Composition) and gram-based rings (Macros), which
 * don't share a natural current/target shape.
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface RingDatum {
  label: string;
  fraction: number;
  display: string;
  color: string;
  size: number;
}

interface CircleProgressProps {
  data: RingDatum;
  index: number;
}

function CircleProgress({ data, index }: CircleProgressProps) {
  const strokeWidth = 14;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const value = Math.min(100, Math.max(0, data.fraction));
  const progress = ((100 - value) / 100) * circumference;

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
    >
      <svg
        aria-label={`${data.label} — ${Math.round(value)}%`}
        className="-rotate-90"
        height={data.size}
        viewBox={`0 0 ${data.size} ${data.size}`}
        width={data.size}
      >
        <title>{`${data.label} — ${Math.round(value)}%`}</title>
        <circle cx={data.size / 2} cy={data.size / 2} fill="none" r={radius} stroke="var(--color-line)" strokeWidth={strokeWidth} />
        <motion.circle
          animate={{ strokeDashoffset: progress }}
          cx={data.size / 2}
          cy={data.size / 2}
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          r={radius}
          stroke={data.color}
          strokeDasharray={circumference}
          strokeLinecap="butt"
          strokeWidth={strokeWidth}
          transition={{ duration: 1, delay: index * 0.15, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  );
}

export default function BudgetRings({ rings, className }: { rings: RingDatum[]; className?: string }) {
  const outerSize = rings[0]?.size ?? 180;
  return (
    <div className={cn('flex items-center', className)}>
      <div className="relative shrink-0" style={{ height: outerSize, width: outerSize }}>
        {rings.map((r, i) => (
          <CircleProgress data={r} index={i} key={r.label} />
        ))}
      </div>
      <div className="ml-6 flex flex-col gap-3">
        {rings.map(r => (
          <div className="flex flex-col" key={r.label}>
            <span className="text-xs font-medium tracking-wide text-muted-text uppercase">{r.label}</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: r.color }}>
              {r.display}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
