import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const STAGGER_MS = 45;
export const ENTRANCE_DURATION_MS = 220;
export function staggerDelay(index: number) {
  return { animationDelay: `${index * STAGGER_MS}ms` };
}
export { STAGGER_MS };

/** A white card: the base unit of the wizard and results. */
export function Block({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('animate-block-in rounded-2xl border border-line bg-card', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="animate-block-in border-b border-line py-3 text-sm last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-muted-text">{label}</span>
        <button type="button" onClick={onEdit} className="cursor-pointer border-none bg-transparent p-0 text-[0.8125rem] font-medium text-ink underline underline-offset-2">
          Edit
        </button>
      </div>
      <div className="mt-0.5 font-bold text-ink tabular-nums">{value}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-[18px]">
      <label className="mb-1.5 block text-[0.8125rem] font-medium text-muted-text">{label}</label>
      {children}
      {hint && <div className="mt-1 text-xs text-hint-text">{hint}</div>}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="mt-1.5 text-[0.8125rem] font-medium text-deficit">{children}</div>;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      type="number"
      className={cn(
        'w-full rounded-lg border border-input bg-card px-3.5 py-3 text-base font-bold text-ink tabular-nums',
        'transition-[border-color,box-shadow] duration-150 ease-out hover:border-ink',
        'focus:border-ink focus:shadow-[0_0_0_3px_rgb(201_162_39_/_0.35)] focus:outline-none',
        className
      )}
      {...rest}
    />
  );
}

export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'cursor-pointer rounded-lg border px-4 py-2.5 text-[0.9375rem] font-semibold transition-colors duration-150',
                selected ? 'border-ink bg-ink text-paper hover:bg-ink-hover' : 'border-input bg-card text-ink hover:border-ink'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function Button({
  variant = 'solid',
  className,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline' | 'gold' }) {
  return (
    <button
      type={type}
      className={cn(
        'cursor-pointer rounded-lg border border-ink px-5 py-3 text-[0.9375rem] font-bold transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-paper',
        variant === 'solid' && 'bg-ink text-paper hover:bg-ink-hover',
        variant === 'outline' && 'bg-transparent text-ink hover:bg-hover-tint',
        variant === 'gold' && 'border-accent bg-accent text-ink hover:border-accent-hover hover:bg-accent-hover',
        className
      )}
      {...props}
    />
  );
}

export function SkipLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-none bg-none text-[0.875rem] font-medium text-muted-text underline hover:text-ink"
    >
      {children}
    </button>
  );
}
