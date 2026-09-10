"use client";

/**
 * Adapted from kokonut UI's Card Flip component
 * (https://kokonutui.com/docs/components/card — @dorianbaffier, MIT).
 * Unlike meal-flip-card.tsx (which reshaped the original entirely), this
 * keeps closer to the stock title/subtitle-front,
 * description/features/CTA-back layout — it's a genuinely good fit for a
 * welcome screen. Still drops the orange glow-pulse decoration and stock
 * copy, reskins to the ledger palette, and adds click-to-flip alongside
 * hover so it works on touch devices.
 */

import { Dumbbell } from "lucide-react";
import { useState } from "react";
import MagnetButton from "@/components/kokonutui/magnet-button";
import { cn } from "@/lib/utils";

export interface IntroFlipCardProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  cta: string;
  onStart: () => void;
}

export default function IntroFlipCard({ title, subtitle, description, features, cta, onStart }: IntroFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group relative h-[360px] w-full [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(f => !f)}
    >
      <div
        className={cn(
          "relative h-full w-full",
          "[transform-style:preserve-3d]",
          "transition-[transform] duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]",
          "motion-reduce:transition-none",
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-ink bg-paper p-8 text-center"
          )}
        >
          <Dumbbell aria-hidden="true" className="mb-2 h-5 w-5 text-hint-text" />
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="max-w-xs text-[0.9375rem] text-muted-text">{subtitle}</p>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "flex flex-col justify-between rounded-lg border-2 border-ink bg-ink p-8 text-paper"
          )}
        >
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-[0.9375rem] text-onink-text">{description}</p>
            <ul className="mt-5 flex flex-col gap-2">
              {features.map(f => (
                <li key={f} className="flex items-baseline gap-2 text-sm text-onink-text">
                  <span className="text-accent">—</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <MagnetButton
            variant="outline"
            onClick={e => {
              e.stopPropagation();
              onStart();
            }}
          >
            {cta}
          </MagnetButton>
        </div>
      </div>
    </div>
  );
}
