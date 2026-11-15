import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Shared page furniture: width container, section labels and headings.

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-6', className)}>{children}</div>;
}

export function Eyebrow({ children, onInk = false }: { children: ReactNode; onInk?: boolean }) {
  return (
    <div className={cn('text-[0.9375rem]', onInk ? 'text-onink-text' : 'text-hint-text')}>
      {children}
    </div>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  children,
  onInk = false,
  className,
}: {
  id?: string;
  eyebrow?: string;
  children: ReactNode;
  onInk?: boolean;
  className?: string;
}) {
  return (
    <div className={className} data-reveal>
      {eyebrow && <Eyebrow onInk={onInk}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={cn(
          'mt-2 scroll-mt-24 text-[2rem] leading-[1.1] font-medium tracking-[-0.025em] text-balance sm:text-[2.75rem]',
          onInk ? 'text-paper' : 'text-ink',
        )}
      >
        {children}
      </h2>
    </div>
  );
}

/** The h1 with one phrase in gold. The text reads the same with or without the accent. */
export function AccentHeading({ text, accent }: { text: string; accent?: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  if (!accent || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-accent">{accent}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

/** Stagger for a row of revealing items. */
export const revealDelay = (index: number) => ({ '--reveal-delay': `${index * 70}ms` }) as CSSProperties;
