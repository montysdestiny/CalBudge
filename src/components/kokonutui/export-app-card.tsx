"use client";

/**
 * Adapted from kokonut UI's Card Flip component (see meal-flip-card.tsx
 * for the fuller writeup of the source). Reuses the same hover-flip
 * mechanic as a preview — hovering shows where the copied text is meant
 * to go before committing — but here the entire card is the trigger
 * (not a button nested inside the rotating faces), so a click always
 * lands correctly regardless of which face is currently showing.
 */

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ExportAppCardProps {
  name: string;
  initials: string;
  destination: string;
  onCopy: () => Promise<void>;
}

export default function ExportAppCard({ name, initials, destination, onCopy }: ExportAppCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimeout.current), []);

  async function handleClick() {
    try {
      await onCopy();
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    setIsFlipped(true);
    window.clearTimeout(resetTimeout.current);
    resetTimeout.current = window.setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      className="group relative h-[148px] w-full cursor-pointer [perspective:2000px]"
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
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-ink bg-paper p-4 text-center"
          )}
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-ink text-[0.625rem] font-bold tracking-wide text-paper"
          >
            {initials}
          </span>
          <span className="text-[0.9375rem] font-bold">{name}</span>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-ink bg-ink p-4 text-center text-paper"
          )}
        >
          {status === "copied" ? (
            <>
              <Check aria-hidden="true" className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-onink-text">Copied — paste into {destination}</span>
            </>
          ) : status === "error" ? (
            <span className="text-xs font-medium text-onink-text">Couldn't copy — select the text manually</span>
          ) : (
            <span className="text-xs font-medium text-onink-text">Tap to copy for {destination}</span>
          )}
        </div>
      </div>
    </button>
  );
}
