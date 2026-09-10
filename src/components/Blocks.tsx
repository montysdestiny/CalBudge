import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const STAGGER_MS = 45;
export const ENTRANCE_DURATION_MS = 220;
export function staggerDelay(index: number) {
  return { animationDelay: `${index * STAGGER_MS}ms` };
}
export { STAGGER_MS };

/** A 2px-bordered block — the base unit of the ledger's visual language. */
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
      className={cn('animate-block-in rounded-lg border-2 border-ink bg-paper', className)}
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
  index,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  index: number;
}) {
  return (
    <Block
      className="mb-2 flex items-center justify-between px-4 py-3 text-[0.9375rem] transition-colors hover:bg-hover-tint"
      style={staggerDelay(index)}
    >
      <span className="font-medium text-muted-text">{label}</span>
      <span>
        <span className="font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={onEdit}
          className="ml-3 cursor-pointer border-none bg-none p-0 text-[0.8125rem] text-ink underline"
        >
          Edit
        </button>
      </span>
    </Block>
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
        'w-full rounded-lg border-2 border-ink bg-paper px-3 py-2.5 text-base font-bold text-ink tabular-nums',
        'shadow-[0_0_0_var(--color-accent)] transition-[transform,box-shadow,background] duration-100 ease-out',
        'focus:-translate-x-0.5 focus:-translate-y-0.5 focus:bg-focus-bg focus:shadow-[2px_2px_0_var(--color-accent)] focus:outline-none',
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
                'cursor-pointer rounded-lg border-2 border-ink px-4 py-2 text-[0.9375rem] font-medium',
                'shadow-[0_0_0_var(--color-ink)] transition-[transform,box-shadow,background] duration-100 ease-out',
                'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-0 active:translate-y-0 active:shadow-none active:duration-[50ms]',
                selected ? 'bg-ink text-paper hover:bg-ink-hover' : 'bg-paper text-ink hover:bg-hover-tint'
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
