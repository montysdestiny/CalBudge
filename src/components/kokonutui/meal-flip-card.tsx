"use client";

/**
 * Adapted from kokonut UI's Card Flip component
 * (https://kokonutui.com/docs/components/card — @dorianbaffier, MIT).
 * Keeps the original 3D flip mechanism (hover-triggered rotateY,
 * backface-hidden front/back faces, same easing curve) but reshapes the
 * front/back content around a single ledger figure instead of the stock
 * title/subtitle/description/features/CTA marketing-card layout, and
 * drops the decorative glow-pulse animation to match CalBudge's
 * "color is functional, not decorative" rule.
 */

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface MealFlipCardProps {
  name: string;
  kcal: number;
  percentOfTotal: number;
  excluded: boolean;
  onToggleExclude: () => void;
}

export default function MealFlipCard({ name, kcal, percentOfTotal, excluded, onToggleExclude }: MealFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (excluded) {
    return (
      <div className="flex h-[132px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line p-4 text-center">
        <span className="text-[0.9375rem] font-medium text-hint-text line-through">{name}</span>
        <button
          type="button"
          onClick={onToggleExclude}
          className="flex cursor-pointer items-center gap-1 text-xs font-medium text-accent underline"
        >
          <Plus aria-hidden="true" className="h-3 w-3" />
          Add back
        </button>
      </div>
    );
  }

  return (
    <div
      className="group relative h-[132px] w-full [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      {/* Rendered outside the rotating layer so it stays put (and clickable)
          across the flip instead of being carried away with the front face. */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onToggleExclude();
        }}
        aria-label={`Remove ${name}`}
        className="absolute right-4 top-4 z-10 cursor-pointer text-hint-text hover:text-deficit"
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </button>

      <div
        className={cn(
          "meal-flip-inner relative h-full w-full",
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
            "flex flex-col justify-between rounded-lg border-2 border-ink bg-paper p-4"
          )}
        >
          <span className="pr-5 text-[0.9375rem] font-medium">{name}</span>
          <span className="text-2xl font-bold tabular-nums">{kcal}</span>
        </div>

        {/* Back */}
        <div
          className={cn(
            "meal-flip-back absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "flex flex-col justify-between rounded-lg border-2 border-ink bg-ink p-4 text-paper"
          )}
        >
          <span className="text-[0.9375rem] font-medium">{name}</span>
          <div>
            <span className="text-2xl font-bold tabular-nums">{kcal}</span>
            <span className="ml-1.5 text-sm text-onink-text">kcal</span>
          </div>
          <span className="text-xs font-medium text-onink-text">{percentOfTotal}% of daily target</span>
        </div>
      </div>
    </div>
  );
}
