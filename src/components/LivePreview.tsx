import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/Blocks';
import {
  type Goal,
  type WizardState,
  computeBMR,
  computeMacroSplit,
  computeMealSplit,
  computeTDEE,
  computeTarget,
} from '@/lib/calc';
import { cn } from '@/lib/utils';

// The hero's working example: a real plan from src/lib/calc.ts that visitors
// can play with before they enter anything of their own. Trains 6 times a week
// so a moderate cut stays above the safety floor at every weight on the slider.
const EXAMPLE: WizardState = {
  unitSystem: 'metric',
  knowsTDEE: false,
  tdeeInput: null,
  sex: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  gymFreq: 6,
  cardioFreq: 0,
  steps: null,
  knownBMR: null,
  bodyFatPct: null,
  goal: 'cut',
  pace: 'moderate',
  targetWeightKg: null,
  tdee: null,
};

const GOALS: { value: Goal; label: string }[] = [
  { value: 'cut', label: 'Cut' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'bulk', label: 'Bulk' },
];

/** Eases a displayed number to its new value. Starts on the value, so the server render matches. */
function useTween(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = from.current;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / 350);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (value - start) * eased);
      setShown(next);
      from.current = next;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
}

export default function LivePreview({ preset, onStart }: { preset?: Goal; onStart: () => void }) {
  const [goal, setGoal] = useState<Goal>(preset ?? 'cut');
  const [weight, setWeight] = useState(80);

  const plan = useMemo(() => {
    const state: WizardState = { ...EXAMPLE, goal, weightKg: weight, pace: goal === 'maintain' ? null : 'moderate' };
    state.tdee = computeTDEE(state);
    const target = Math.round(computeTarget(state).target);
    return {
      target,
      tdee: Math.round(state.tdee),
      bmr: Math.round(computeBMR(state)),
      macros: computeMacroSplit(weight, target),
      meals: computeMealSplit(target),
    };
  }, [goal, weight]);

  const shownTarget = useTween(plan.target);
  const largestMeal = Math.max(...plan.meals.map(m => m.kcal));
  const { macros, target } = plan;
  const macroParts = [
    { label: 'Protein', grams: macros.proteinG, kcal: macros.proteinKcal, color: 'bg-ink' },
    { label: 'Carbs', grams: macros.carbsG, kcal: macros.carbsKcal, color: 'bg-accent' },
    { label: 'Fat', grams: macros.fatG, kcal: macros.fatKcal, color: 'bg-hint-text' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_24px_60px_-20px_rgba(27,42,74,0.35)]">
      <div className="grid md:grid-cols-[1.05fr_1fr]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[0.9375rem] text-hint-text">Try it: example plan</div>
            <div role="group" aria-label="Example goal" className="flex rounded-full bg-hover-tint p-1 text-sm">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  type="button"
                  aria-pressed={goal === g.value}
                  onClick={() => setGoal(g.value)}
                  className={cn(
                    'cursor-pointer rounded-full px-3 py-1.5 transition-colors duration-150',
                    goal === g.value ? 'bg-ink text-paper' : 'text-muted-text hover:text-ink',
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 font-display text-6xl font-bold tracking-tight text-ink tabular-nums sm:text-7xl">
            {shownTarget.toLocaleString('en-US')}
          </div>
          <div className="mt-1 text-sm font-medium text-muted-text">calories a day</div>

          <label className="mt-6 block">
            <span className="flex justify-between text-sm font-medium text-muted-text">
              <span>Bodyweight</span>
              <span className="font-bold text-ink tabular-nums">{weight} kg</span>
            </span>
            <input
              type="range"
              min={50}
              max={120}
              value={weight}
              onChange={e => setWeight(Number(e.target.value))}
              className="range-gold mt-3 w-full cursor-pointer"
              style={{ '--pct': `${((weight - 50) / 70) * 100}%` } as CSSProperties}
            />
          </label>
          <p className="mt-2 text-xs text-hint-text">A 30-year-old man, 180 cm, training 6 times a week, moderate pace.</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 tabular-nums">
            <div>
              <dt className="text-xs font-medium text-muted-text">BMR</dt>
              <dd className="mt-0.5 text-lg font-bold text-ink">{plan.bmr.toLocaleString('en-US')}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-text">TDEE</dt>
              <dd className="mt-0.5 text-lg font-bold text-ink">{plan.tdee.toLocaleString('en-US')}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-line bg-paper/70 p-6 sm:p-8 md:border-t-0 md:border-l">
          <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
            {macroParts.map(p => (
              <div key={p.label} className={cn(p.color, 'transition-[width] duration-300')} style={{ width: `${(p.kcal / target) * 100}%` }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm tabular-nums">
            {macroParts.map(p => (
              <div key={p.label}>
                <div className="text-xs font-medium text-muted-text">{p.label}</div>
                <div className="font-bold text-ink">{p.grams} g</div>
              </div>
            ))}
          </div>

          <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
            {plan.meals.map(m => (
              <li key={m.name} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="font-medium text-ink">{m.name}</span>
                <span className="h-2 overflow-hidden rounded-full bg-hover-tint" aria-hidden="true">
                  <span className="block h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${(m.kcal / largestMeal) * 100}%` }} />
                </span>
                <span className="text-right font-bold text-ink tabular-nums">{m.kcal}</span>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="mt-6 flex w-full items-center justify-center gap-2" onClick={onStart}>
            Use my own numbers
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
