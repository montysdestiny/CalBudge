import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Block,
  Button,
  ENTRANCE_DURATION_MS,
  ErrorText,
  Field,
  NumberInput,
  SkipLink,
  STAGGER_MS,
  SummaryRow,
  ToggleGroup,
} from '@/components/Blocks';
import BudgetRings from '@/components/kokonutui/budget-rings';
import ExportAppCard from '@/components/kokonutui/export-app-card';
import BulkEstimator from '@/components/BulkEstimator';
import CookieBanner from '@/components/CookieBanner';
import { ArticlePage, GuidesIndex } from '@/components/Article';
import HomeContent from '@/components/HomeContent';
import PrivacyPolicy from '@/components/PrivacyPolicy';
import MealFlipCard from '@/components/kokonutui/meal-flip-card';
import { useOdometer } from '@/hooks/useOdometer';
import { useReveal } from '@/hooks/useReveal';
import { EXTERNAL_APPS, copyTargetsForApp } from '@/lib/appExport';
import {
  BOUNDS,
  type Goal,
  type Pace,
  type Sex,
  type WizardState,
  computeGoalEstimateWeeks,
  computeMacroSplit,
  computeMealSplit,
  computeBMR,
  computeTDEE,
  computeTarget,
  inToCm,
  lbToKg,
  redistributeMealSplit,
} from '@/lib/calc';
import { readConsent, track } from '@/lib/consent';
import { ARTICLES, articlePath } from '@/lib/articles';
import { type LandingPage, PAGES, isCalculatorPage } from '@/lib/pages';
import { decodePlan, encodePlan } from '@/lib/share';

type StepId =
  | 'welcome'
  | 'entry'
  | 'tdee-input'
  | 'basics'
  | 'optional'
  | 'goal'
  | 'pace'
  | 'goal-estimate'
  | 'result';

interface HistoryEntry {
  label: string;
  value: string;
  editStepId: StepId;
}

const STEP_ORDER: StepId[] = ['entry', 'tdee-input', 'basics', 'optional', 'goal', 'pace', 'goal-estimate'];

const STEP_TOTAL = 6;
const PROGRESS: Partial<Record<StepId, { step: number; label: string }>> = {
  entry: { step: 1, label: 'Getting started' },
  'tdee-input': { step: 2, label: 'Your TDEE' },
  basics: { step: 2, label: 'About you' },
  optional: { step: 3, label: 'Optional details' },
  goal: { step: 4, label: 'Your goal' },
  pace: { step: 5, label: 'Your pace' },
  'goal-estimate': { step: 6, label: 'Target weight' },
};

const INITIAL_STATE: WizardState = {
  unitSystem: 'metric',
  knowsTDEE: null,
  tdeeInput: null,
  sex: null,
  age: null,
  heightCm: null,
  weightKg: null,
  gymFreq: null,
  cardioFreq: null,
  steps: null,
  knownBMR: null,
  bodyFatPct: null,
  goal: null,
  pace: null,
  targetWeightKg: null,
  tdee: null,
};

export default function App({ page }: { page: LandingPage }) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [stepId, setStepId] = useState<StepId>('welcome');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Opened after mount (not during render) so the prerendered HTML and the
  // first client render match.
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);
  useEffect(() => {
    if (readConsent() === null) setCookieBannerOpen(true);
  }, []);
  // A shared plan link (#plan=...) opens straight to that plan's results.
  // Applied after mount for the same hydration reason as above.
  const [sharedView, setSharedView] = useState(false);
  useEffect(() => {
    const plan = decodePlan(window.location.hash);
    if (!plan) return;
    setState(plan);
    setSharedView(true);
    track('shared_plan_open');
    setStepId('result');
  }, []);
  // Extra display-only fields (original raw input units, kept separate from
  // the SI values used in calc.ts) — mirrors the vanilla version's
  // heightDisplay/weightDisplay so re-opening "basics" shows the unit the
  // user actually typed in, not a converted value.
  const [heightDisplay, setHeightDisplay] = useState<number | null>(null);
  const [weightDisplay, setWeightDisplay] = useState<number | null>(null);

  const imperial = state.unitSystem === 'imperial';
  const isBulk = page.kind === 'bulk';
  const isPrivacy = page.kind === 'privacy';
  const isGuide = page.kind === 'article' || page.kind === 'guides';
  // Pages without the single-person wizard: the logo just goes home.
  const standalone = isBulk || isPrivacy || isGuide;

  function pushSummary(label: string, value: string, editStepId: StepId) {
    setHistory(h => [...h.filter(e => !(e.editStepId === editStepId && e.label === label)), { label, value, editStepId }]);
  }

  function truncateFrom(editStepId: StepId) {
    const idx = STEP_ORDER.indexOf(editStepId);
    setHistory(h => h.filter(e => STEP_ORDER.indexOf(e.editStepId) < idx));
  }

  function goTo(id: StepId) {
    setStepId(id);
  }

  function editStep(editStepId: StepId) {
    truncateFrom(editStepId);
    goTo(editStepId);
  }

  function restart() {
    if (sharedView) {
      window.history.replaceState(null, '', window.location.pathname);
      setSharedView(false);
    }
    setState(INITIAL_STATE);
    setHistory([]);
    setHeightDisplay(null);
    setWeightDisplay(null);
    goTo('entry');
  }

  useReveal(stepId);
  // The wizard replaces the long landing page, so start each screen at the top.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stepId]);

  function start() {
    track('calculator_start', { source: page.path });
    goTo('entry');
  }

  const inWizard = !standalone && stepId !== 'welcome';
  const isResult = stepId === 'result';
  const progress = PROGRESS[stepId];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 text-ink backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <button
            type="button"
            onClick={() => {
              if (standalone) {
                window.location.href = '/';
                return;
              }
              restart();
              goTo('welcome');
            }}
            className="flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 text-ink"
            aria-label="CalBudge home"
          >
            <LogoMark />
            <span className="text-lg font-medium tracking-tight">CalBudge</span>
          </button>
          {!inWizard && (
            <nav aria-label="Page sections" className="hidden items-center gap-7 text-sm text-muted-text md:flex">
              {isBulk ? (
                <a href="/" className="hover:text-ink">Single calculator</a>
              ) : isPrivacy || isGuide ? (
                <>
                  <a href="/" className="hover:text-ink">Calculator</a>
                  <a href="/guides" className="hover:text-ink">Guides</a>
                  <a href="/coaches" className="hover:text-ink">For coaches</a>
                </>
              ) : (
                <>
                  <a href="#how-it-works" className="hover:text-ink">How it works</a>
                  {/* The full method lives on the homepage; landing pages link to it. */}
                  <a href={page.path === '/' ? '#the-maths' : '/#the-maths'} className="hover:text-ink">The maths</a>
                  <a href="#faq" className="hover:text-ink">FAQ</a>
                  <a href="/guides" className="hover:text-ink">Guides</a>
                  <a href="/coaches" className="hover:text-ink">For coaches</a>
                </>
              )}
            </nav>
          )}
          {/* On the coaches page, units come from the CSV's column names. */}
          {inWizard ? (
            <UnitSwitch
              imperial={imperial}
              onChange={next => setState(s => ({ ...s, unitSystem: next ? 'imperial' : 'metric' }))}
            />
          ) : isBulk ? (
            <a href="#upload" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors duration-150 hover:bg-ink-hover">
              Upload clients
            </a>
          ) : isPrivacy || isGuide ? (
            <a href={page.article?.calculator.path ?? '/'} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors duration-150 hover:bg-ink-hover">
              Open calculator
            </a>
          ) : (
            <button type="button" onClick={start} className="cursor-pointer rounded-full border-none bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors duration-150 hover:bg-ink-hover">
              Get my number
            </button>
          )}
        </div>
        {!inWizard && <ScrollProgress key={stepId} />}
      </header>

      <main className="flex-1">
        {isBulk ? (
          <BulkEstimator page={page} />
        ) : isPrivacy ? (
          <PrivacyPolicy onCookieSettings={() => setCookieBannerOpen(true)} />
        ) : page.kind === 'article' ? (
          <ArticlePage page={page} />
        ) : page.kind === 'guides' ? (
          <GuidesIndex page={page} />
        ) : stepId === 'welcome' ? (
          <HomeContent page={page} onStart={start} />
        ) : isResult ? (
          <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:py-14">
            {history.length > 0 && (
              <details className="mb-6 rounded-2xl border border-line bg-card px-5 py-3">
                <summary className="cursor-pointer text-sm font-bold text-ink">Your answers ({history.length})</summary>
                <div className="mt-2">
                  {history.map(h => (
                    <SummaryRow key={`${h.editStepId}-${h.label}`} label={h.label} value={h.value} onEdit={() => editStep(h.editStepId)} />
                  ))}
                </div>
              </details>
            )}
            <StepResult state={state} historyLength={history.length} shared={sharedView} onRestart={restart} />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
            {progress && (
              <div className="mb-8">
                <div className="flex items-baseline justify-between text-sm font-medium text-muted-text">
                  <span className="font-bold text-ink">{progress.label}</span>
                  <span className="tabular-nums">Step {progress.step} of {STEP_TOTAL}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hover-tint" aria-hidden="true">
                  <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(progress.step / STEP_TOTAL) * 100}%` }} />
                </div>
              </div>
            )}
            <div className={history.length > 0 ? 'grid items-start gap-6 lg:grid-cols-[1fr_300px]' : 'mx-auto max-w-2xl'}>
              <Block className="p-6 sm:p-8" key={stepId}>
          {stepId === 'entry' && (
            <StepEntry
              onYes={() => {
                setState(s => ({ ...s, knowsTDEE: true }));
                pushSummary('Know TDEE?', 'Yes', 'entry');
                goTo('tdee-input');
              }}
              onNo={() => {
                setState(s => ({ ...s, knowsTDEE: false }));
                pushSummary('Know TDEE?', 'No', 'entry');
                goTo('basics');
              }}
            />
          )}

          {stepId === 'tdee-input' && (
            <StepTdeeInput
              imperial={imperial}
              onContinue={(val, weightRaw) => {
                setState(s => ({
                  ...s,
                  tdeeInput: val,
                  weightKg: weightRaw != null ? (imperial ? lbToKg(weightRaw) : weightRaw) : null,
                }));
                const parts = [`${val} kcal`];
                if (weightRaw != null) parts.push(`${weightRaw}${imperial ? 'lb' : 'kg'} bodyweight`);
                pushSummary('TDEE', parts.join(', '), 'tdee-input');
                goTo('goal');
              }}
            />
          )}

          {stepId === 'basics' && (
            <StepBasics
              imperial={imperial}
              heightDisplay={heightDisplay}
              weightDisplay={weightDisplay}
              onContinue={vals => {
                setHeightDisplay(vals.heightRaw);
                setWeightDisplay(vals.weightRaw);
                setState(s => ({
                  ...s,
                  sex: vals.sex,
                  age: vals.age,
                  heightCm: imperial ? inToCm(vals.heightRaw) : vals.heightRaw,
                  weightKg: imperial ? lbToKg(vals.weightRaw) : vals.weightRaw,
                  gymFreq: vals.gym,
                  cardioFreq: vals.cardio,
                }));
                pushSummary(
                  'You',
                  `${vals.sex}, ${vals.age}y, ${vals.heightRaw}${imperial ? 'in' : 'cm'}, ${vals.weightRaw}${imperial ? 'lb' : 'kg'}`,
                  'basics'
                );
                pushSummary('Training', `${vals.gym} gym / ${vals.cardio} cardio per week`, 'basics');
                goTo('optional');
              }}
            />
          )}

          {stepId === 'optional' && (
            <StepOptional
              onContinue={vals => {
                setState(s => ({ ...s, steps: vals.steps, knownBMR: vals.bmr, bodyFatPct: vals.bf }));
                const parts: string[] = [];
                if (vals.steps != null) parts.push(`${vals.steps} steps`);
                if (vals.bmr != null) parts.push(`BMR ${vals.bmr}`);
                if (vals.bf != null) parts.push(`${vals.bf}% BF`);
                pushSummary('Optional', parts.length ? parts.join(', ') : 'Skipped', 'optional');
                goTo('goal');
              }}
            />
          )}

          {stepId === 'goal' && (
            <StepGoal
              preset={page.presetGoal}
              onContinue={goal => {
                setState(s => {
                  const next = { ...s, goal, pace: goal === 'maintain' ? null : s.pace };
                  if (goal === 'maintain') next.tdee = computeTDEE(next);
                  return next;
                });
                pushSummary('Goal', goal[0].toUpperCase() + goal.slice(1), 'goal');
                goTo(goal === 'maintain' ? 'result' : 'pace');
              }}
            />
          )}

          {stepId === 'pace' && (
            <StepPace
              onContinue={pace => {
                setState(s => ({ ...s, pace }));
                pushSummary('Pace', pace[0].toUpperCase() + pace.slice(1), 'pace');
                goTo('goal-estimate');
              }}
            />
          )}

          {stepId === 'goal-estimate' && (
            <StepGoalEstimate
              imperial={imperial}
              onDone={targetWeightRaw => {
                setState(s => {
                  const next = { ...s, targetWeightKg: targetWeightRaw != null ? (imperial ? lbToKg(targetWeightRaw) : targetWeightRaw) : null };
                  next.tdee = computeTDEE(next);
                  return next;
                });
                if (targetWeightRaw != null) {
                  pushSummary('Target weight', `${targetWeightRaw}${imperial ? 'lb' : 'kg'}`, 'goal-estimate');
                }
                track('results_view', { goal: state.goal ?? 'unknown' });
                goTo('result');
              }}
            />
          )}
              </Block>
              {history.length > 0 && (
                <aside aria-label="Your answers" className="order-first rounded-2xl border border-line bg-card px-5 py-4 lg:sticky lg:top-24 lg:order-none">
                  <div className="pb-1 text-[0.9375rem] text-hint-text">Your answers</div>
                  {history.map(h => (
                    <SummaryRow key={`${h.editStepId}-${h.label}`} label={h.label} value={h.value} onEdit={() => editStep(h.editStepId)} />
                  ))}
                </aside>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-line bg-paper text-muted-text">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 text-ink">
              <LogoMark />
              <span className="text-lg font-medium tracking-tight">CalBudge</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Estimates for informational purposes only, not medical advice. Talk to a healthcare professional before
              changing your diet.
            </p>
          </div>
          <nav aria-label="Calculators">
            <div className="text-sm font-medium text-ink">Calculators</div>
            <ul className="mt-3 space-y-2 text-sm">
              {PAGES.filter(isCalculatorPage).map(p => (
                <li key={p.path}>
                  <a href={p.path} className="hover:text-ink">{p.linkLabel}</a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Guides">
            <div className="text-sm font-medium text-ink">Guides</div>
            <ul className="mt-3 space-y-2 text-sm">
              {ARTICLES.map(a => (
                <li key={a.slug}>
                  <a href={articlePath(a.slug)} className="hover:text-ink">{a.linkLabel}</a>
                </li>
              ))}
              <li>
                <a href="/guides" className="font-medium hover:text-ink">All guides</a>
              </li>
            </ul>
          </nav>
          <div>
            <div className="text-sm font-medium text-ink">About your data</div>
            <p className="mt-3 text-sm leading-relaxed">Your answers and client files stay in your browser. Nothing is uploaded or stored.</p>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm">
              <a href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy policy</a>
              <button
                type="button"
                onClick={() => setCookieBannerOpen(true)}
                className="cursor-pointer border-none bg-transparent p-0 text-sm text-muted-text underline underline-offset-2 hover:text-ink"
              >
                Cookie settings
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-6 py-5 text-xs">© {new Date().getFullYear()} CalBudge</div>
        </div>
      </footer>
      {cookieBannerOpen && <CookieBanner onClose={() => setCookieBannerOpen(false)} />}
    </div>
  );
}

// ---- Header pieces ----

function LogoMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="var(--color-ink-deep)" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#3a4d75" strokeWidth="6" />
      <circle
        cx="24"
        cy="24"
        r="14"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="61 88"
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

function UnitSwitch({ imperial, onChange }: { imperial: boolean; onChange: (imperial: boolean) => void }) {
  const options = [
    { label: 'kg / cm', value: false },
    { label: 'lb / in', value: true },
  ];
  return (
    <div role="group" aria-label="Units" className="flex rounded-full bg-hover-tint p-0.5 text-[0.8125rem]">
      {options.map(opt => {
        const selected = imperial === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={
              'cursor-pointer rounded-full border-none px-3 py-1.5 transition-colors duration-150 ' +
              (selected ? 'bg-ink text-paper' : 'bg-transparent text-muted-text hover:text-ink')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Thin gold bar under the header showing how far down the page you are. */
function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return <div ref={bar} aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />;
}

// ---- Step: entry ----

function StepEntry({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <>
      <h2 className="mb-5 font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">Have you already calculated your daily expenditure (TDEE)?</h2>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button onClick={onYes}>Yes, I know my TDEE</Button>
        <Button variant="outline" onClick={onNo}>No, calculate it</Button>
      </div>
    </>
  );
}

// ---- Step: tdee-input ----

function StepTdeeInput({ imperial, onContinue }: { imperial: boolean; onContinue: (val: number, weightRaw: number | null) => void }) {
  const [val, setVal] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [weightError, setWeightError] = useState('');
  const weightBounds = imperial ? BOUNDS.weightLb : BOUNDS.weightKg;
  const weightUnit = imperial ? 'lb' : 'kg';

  return (
    <>
      <h2 className="mb-5 font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">What's your daily expenditure?</h2>
      <Field label="TDEE (kcal/day)">
        <NumberInput min={BOUNDS.tdee.min} max={BOUNDS.tdee.max} step={10} value={val} onChange={e => setVal(e.target.value)} />
        <ErrorText>{error}</ErrorText>
      </Field>
      <Field label={`Bodyweight (${weightUnit}, optional)`} hint="Enables a macro estimate on your results.">
        <NumberInput min={weightBounds.min} max={weightBounds.max} value={weight} onChange={e => setWeight(e.target.value)} />
        <ErrorText>{weightError}</ErrorText>
      </Field>
      <Button
        onClick={() => {
          const n = parseFloat(val);
          if (Number.isNaN(n) || n < BOUNDS.tdee.min || n > BOUNDS.tdee.max) {
            setError(`Enter a TDEE between ${BOUNDS.tdee.min} and ${BOUNDS.tdee.max} kcal.`);
            return;
          }
          setError('');
          const hasWeight = weight.trim() !== '';
          const w = parseFloat(weight);
          if (hasWeight && (Number.isNaN(w) || w < weightBounds.min || w > weightBounds.max)) {
            setWeightError(`Enter a bodyweight between ${weightBounds.min} and ${weightBounds.max}${weightUnit}, or leave it blank.`);
            return;
          }
          setWeightError('');
          onContinue(n, hasWeight ? w : null);
        }}
      >
        Continue
      </Button>
    </>
  );
}

// ---- Step: basics ----

interface BasicsValues { sex: Sex; age: number; heightRaw: number; weightRaw: number; gym: number; cardio: number }

function StepBasics({
  imperial,
  heightDisplay,
  weightDisplay,
  onContinue,
}: {
  imperial: boolean;
  heightDisplay: number | null;
  weightDisplay: number | null;
  onContinue: (vals: BasicsValues) => void;
}) {
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState(heightDisplay != null ? String(heightDisplay) : '');
  const [weight, setWeight] = useState(weightDisplay != null ? String(weightDisplay) : '');
  const [gym, setGym] = useState('');
  const [cardio, setCardio] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const heightBounds = imperial ? BOUNDS.heightIn : BOUNDS.heightCm;
  const weightBounds = imperial ? BOUNDS.weightLb : BOUNDS.weightKg;
  const heightUnit = imperial ? 'in' : 'cm';
  const weightUnit = imperial ? 'lb' : 'kg';

  function submit() {
    const ageN = parseFloat(age);
    const heightN = parseFloat(height);
    const weightN = parseFloat(weight);
    const gymN = parseFloat(gym);
    const cardioN = parseFloat(cardio);
    const nextErrors: Record<string, string> = {};
    if (!sex) nextErrors.sex = 'Sex is required to calculate BMR';
    if (Number.isNaN(ageN) || ageN < BOUNDS.age.min || ageN > BOUNDS.age.max) {
      nextErrors.age = `Age must be between ${BOUNDS.age.min} and ${BOUNDS.age.max}`;
    }
    if (Number.isNaN(heightN) || heightN < heightBounds.min || heightN > heightBounds.max) {
      nextErrors.height = `Height must be between ${heightBounds.min} and ${heightBounds.max}${heightUnit}`;
    }
    if (Number.isNaN(weightN) || weightN < weightBounds.min || weightN > weightBounds.max) {
      nextErrors.weight = `Weight must be between ${weightBounds.min} and ${weightBounds.max}${weightUnit}`;
    }
    if (Number.isNaN(gymN) || gymN < BOUNDS.sessionsPerWeek.min || gymN > BOUNDS.sessionsPerWeek.max) {
      nextErrors.gym = `Gym sessions must be between ${BOUNDS.sessionsPerWeek.min} and ${BOUNDS.sessionsPerWeek.max} per week`;
    }
    if (Number.isNaN(cardioN) || cardioN < BOUNDS.sessionsPerWeek.min || cardioN > BOUNDS.sessionsPerWeek.max) {
      nextErrors.cardio = `Cardio sessions must be between ${BOUNDS.sessionsPerWeek.min} and ${BOUNDS.sessionsPerWeek.max} per week`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !sex) return;
    onContinue({ sex, age: ageN, heightRaw: heightN, weightRaw: weightN, gym: gymN, cardio: cardioN });
  }

  return (
    <>
      <h2 className="mb-5 font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">Tell us about you</h2>
      <ToggleGroup label="Sex" value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
      <ErrorText>{errors.sex}</ErrorText>
      <div className="grid gap-x-4 sm:grid-cols-2">
      <Field label="Age (years)">
        <NumberInput min={BOUNDS.age.min} max={BOUNDS.age.max} value={age} onChange={e => setAge(e.target.value)} />
        <ErrorText>{errors.age}</ErrorText>
      </Field>
      <Field label={`Height (${heightUnit})`}>
        <NumberInput min={heightBounds.min} max={heightBounds.max} value={height} onChange={e => setHeight(e.target.value)} />
        <ErrorText>{errors.height}</ErrorText>
      </Field>
      <Field label={`Weight (${weightUnit})`}>
        <NumberInput min={weightBounds.min} max={weightBounds.max} value={weight} onChange={e => setWeight(e.target.value)} />
        <ErrorText>{errors.weight}</ErrorText>
      </Field>
      <Field label="Gym / strength sessions per week">
        <NumberInput min={BOUNDS.sessionsPerWeek.min} max={BOUNDS.sessionsPerWeek.max} value={gym} onChange={e => setGym(e.target.value)} />
        <ErrorText>{errors.gym}</ErrorText>
      </Field>
      <Field label="Cardio sessions per week">
        <NumberInput min={BOUNDS.sessionsPerWeek.min} max={BOUNDS.sessionsPerWeek.max} value={cardio} onChange={e => setCardio(e.target.value)} />
        <ErrorText>{errors.cardio}</ErrorText>
      </Field>
      </div>
      <Button onClick={submit}>Continue</Button>
    </>
  );
}

// ---- Step: optional ----

interface OptionalValues { steps: number | null; bmr: number | null; bf: number | null }

function StepOptional({ onContinue }: { onContinue: (vals: OptionalValues) => void }) {
  const [steps, setSteps] = useState('');
  const [bmr, setBmr] = useState('');
  const [bf, setBf] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <>
      <h2 className="mb-5 font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">A few optional details</h2>
      <p className="mb-5 text-sm text-muted-text">Each one makes your number more accurate. Skip any you don't know and we'll use standard defaults.</p>
      <Field label="Average daily steps" hint="Refines your activity multiplier.">
        <NumberInput min={BOUNDS.steps.min} max={BOUNDS.steps.max} value={steps} onChange={e => setSteps(e.target.value)} />
        <ErrorText>{errors.steps}</ErrorText>
      </Field>
      <Field label="Known BMR (kcal/day)" hint="If set, skips the BMR formula entirely.">
        <NumberInput min={BOUNDS.knownBmr.min} max={BOUNDS.knownBmr.max} value={bmr} onChange={e => setBmr(e.target.value)} />
        <ErrorText>{errors.bmr}</ErrorText>
      </Field>
      <Field label="Body fat %" hint="If set, uses Katch-McArdle instead of Mifflin-St Jeor.">
        <NumberInput min={BOUNDS.bodyFatPct.min} max={BOUNDS.bodyFatPct.max} value={bf} onChange={e => setBf(e.target.value)} />
        <ErrorText>{errors.bf}</ErrorText>
      </Field>
      <Button
        onClick={() => {
          const hasSteps = steps.trim() !== '';
          const hasBmr = bmr.trim() !== '';
          const hasBf = bf.trim() !== '';
          const s = parseFloat(steps);
          const b = parseFloat(bmr);
          const f = parseFloat(bf);
          const nextErrors: Record<string, string> = {};
          if (hasSteps && (Number.isNaN(s) || s < BOUNDS.steps.min || s > BOUNDS.steps.max)) {
            nextErrors.steps = `Steps must be between ${BOUNDS.steps.min} and ${BOUNDS.steps.max}, or left blank`;
          }
          if (hasBmr && (Number.isNaN(b) || b < BOUNDS.knownBmr.min || b > BOUNDS.knownBmr.max)) {
            nextErrors.bmr = `BMR must be between ${BOUNDS.knownBmr.min} and ${BOUNDS.knownBmr.max}, or left blank`;
          }
          if (hasBf && (Number.isNaN(f) || f < BOUNDS.bodyFatPct.min || f > BOUNDS.bodyFatPct.max)) {
            nextErrors.bf = `Body fat % must be between ${BOUNDS.bodyFatPct.min} and ${BOUNDS.bodyFatPct.max}, or left blank`;
          }
          setErrors(nextErrors);
          if (Object.keys(nextErrors).length > 0) return;
          onContinue({
            steps: hasSteps ? s : null,
            bmr: hasBmr ? b : null,
            bf: hasBf ? f : null,
          });
        }}
      >
        Continue
      </Button>
    </>
  );
}

// ---- Step: goal ----

function StepGoal({ preset, onContinue }: { preset?: Goal; onContinue: (goal: Goal) => void }) {
  const [goal, setGoal] = useState<Goal | null>(preset ?? null);
  const [error, setError] = useState('');

  return (
    <>
      <h2 className="mb-5 font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">Are you cutting, bulking, or maintaining?</h2>
      <ToggleGroup
        label="Goal"
        value={goal}
        onChange={setGoal}
        options={[
          { value: 'cut', label: 'Cutting' },
          { value: 'bulk', label: 'Bulking' },
          { value: 'maintain', label: 'Maintaining' },
        ]}
      />
      <ErrorText>{error}</ErrorText>
      <Button
        onClick={() => {
          if (!goal) { setError('Choose a goal to continue'); return; }
          onContinue(goal);
        }}
      >
        Continue
      </Button>
    </>
  );
}

// ---- Step: pace ----

function StepPace({ onContinue }: { onContinue: (pace: Pace) => void }) {
  const [pace, setPace] = useState<Pace | null>(null);
  const [error, setError] = useState('');

  return (
    <>
      <h2 className="mb-5 font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">Choose your pace</h2>
      <ToggleGroup
        label="Pace"
        value={pace}
        onChange={setPace}
        options={[
          { value: 'mild', label: 'Mild (±10%)' },
          { value: 'moderate', label: 'Moderate (±20%)' },
          { value: 'aggressive', label: 'Aggressive' },
        ]}
      />
      <ErrorText>{error}</ErrorText>
      <Button
        onClick={() => {
          if (!pace) { setError('Choose a pace to continue'); return; }
          onContinue(pace);
        }}
      >
        Continue
      </Button>
    </>
  );
}

// ---- Step: goal-estimate ----

function StepGoalEstimate({ imperial, onDone }: { imperial: boolean; onDone: (targetWeightRaw: number | null) => void }) {
  const [val, setVal] = useState('');
  const [error, setError] = useState('');
  const weightBounds = imperial ? BOUNDS.weightLb : BOUNDS.weightKg;
  const weightUnit = imperial ? 'lb' : 'kg';

  return (
    <>
      <h2 className="mb-5 font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">Got a target weight?</h2>
      <p className="mb-5 text-sm text-muted-text">We'll estimate roughly how long it could take. Optional.</p>
      <Field label={`Target weight (${weightUnit})`}>
        <NumberInput min={weightBounds.min} max={weightBounds.max} value={val} onChange={e => setVal(e.target.value)} />
        <ErrorText>{error}</ErrorText>
      </Field>
      <div className="mt-2 flex items-center gap-3">
        <Button
          onClick={() => {
            const hasVal = val.trim() !== '';
            if (!hasVal) { onDone(null); return; }
            const n = parseFloat(val);
            if (Number.isNaN(n) || n < weightBounds.min || n > weightBounds.max) {
              setError(`Enter a target weight between ${weightBounds.min} and ${weightBounds.max}${weightUnit}, or leave it blank.`);
              return;
            }
            setError('');
            onDone(n);
          }}
        >
          Set my budget
        </Button>
        <SkipLink onClick={() => onDone(null)}>Skip</SkipLink>
      </div>
    </>
  );
}

// ---- Step: result ----

const MAIN_MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner'];

function StepResult({
  state,
  historyLength,
  shared,
  onRestart,
}: {
  state: WizardState;
  historyLength: number;
  shared: boolean;
  onRestart: () => void;
}) {
  const [linkStatus, setLinkStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copyPlanLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname + encodePlan(state));
      setLinkStatus('copied');
      track('share_link_copy');
    } catch {
      setLinkStatus('failed');
    }
  }

  const { target, cappedLow, cappedHigh } = useMemo(() => computeTarget(state), [state]);
  const X = Math.round(target);
  const rows = useMemo(() => computeMealSplit(X), [X]);
  const weeks = useMemo(() => computeGoalEstimateWeeks(state, target), [state, target]);

  const macros = useMemo(() => (state.weightKg != null ? computeMacroSplit(state.weightKg, X) : null), [state.weightKg, X]);

  const [excludedMeals, setExcludedMeals] = useState<Set<string>>(new Set());
  function toggleExclude(name: string) {
    setExcludedMeals(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        if (rows.length - next.size <= 1) return prev; // always keep at least one meal
        next.add(name);
      }
      return next;
    });
  }
  const excludedList = useMemo(() => [...excludedMeals], [excludedMeals]);
  const redistributedRows = useMemo(() => redistributeMealSplit(rows, excludedList), [rows, excludedList]);
  const kcalByName = useMemo(() => new Map(redistributedRows.map(r => [r.name, r.kcal])), [redistributedRows]);

  const exportRef = useRef<HTMLDivElement>(null);
  const [exportBusy, setExportBusy] = useState<'image' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState('');
  const [showExportApps, setShowExportApps] = useState(false);

  async function handleExport(kind: 'image' | 'pdf') {
    if (!exportRef.current) return;
    setExportError('');
    setExportBusy(kind);
    try {
      // Loaded on demand: jsPDF + html-to-image are a large share of the
      // bundle and most visitors never export.
      const { exportNodeAsImage, exportNodeAsPdf } = await import('@/lib/export');
      if (kind === 'image') await exportNodeAsImage(exportRef.current, 'calbudge-budget.png');
      else await exportNodeAsPdf(exportRef.current, 'calbudge-budget.pdf');
      track('export', { format: kind });
    } catch {
      setExportError(`Could not generate the ${kind === 'image' ? 'image' : 'PDF'}. Try again.`);
    } finally {
      setExportBusy(null);
    }
  }

  const resultBaseDelay = (historyLength + 1) * STAGGER_MS;
  let staggerStep = 0;
  const noticeDelay = cappedLow || cappedHigh ? resultBaseDelay + staggerStep++ * STAGGER_MS : 0;
  const totalDelay = resultBaseDelay + staggerStep++ * STAGGER_MS;
  const rowDelays = rows.map(() => resultBaseDelay + staggerStep++ * STAGGER_MS);
  const macrosDelay = resultBaseDelay + staggerStep++ * STAGGER_MS;
  const ringsDelay = resultBaseDelay + staggerStep++ * STAGGER_MS;
  const estimateDelay = resultBaseDelay + staggerStep++ * STAGGER_MS;

  const odometerValue = useOdometer(X, totalDelay + ENTRANCE_DURATION_MS);

  const tdeeRounded = Math.round(state.tdee ?? X);
  const bmrRounded = state.knowsTDEE ? null : Math.round(computeBMR(state));
  const mainMealsKcal = redistributedRows.filter(r => MAIN_MEAL_NAMES.includes(r.name)).reduce((sum, r) => sum + r.kcal, 0);
  const extrasKcal = redistributedRows.filter(r => !MAIN_MEAL_NAMES.includes(r.name)).reduce((sum, r) => sum + r.kcal, 0);
  const rings = useMemo(
    () => [
      { label: 'Budget vs. maintenance', fraction: (X / tdeeRounded) * 100, display: `${X}/${tdeeRounded} KCAL`, color: 'var(--color-accent)', size: 180 },
      { label: 'Main meals', fraction: (mainMealsKcal / X) * 100, display: `${mainMealsKcal}/${X} KCAL`, color: 'var(--color-ink)', size: 140 },
      { label: 'Extras', fraction: (extrasKcal / X) * 100, display: `${extrasKcal}/${X} KCAL`, color: 'var(--color-hint-text)', size: 100 },
    ],
    [X, tdeeRounded, mainMealsKcal, extrasKcal]
  );
  const macroRings = useMemo(
    () =>
      macros
        ? [
            { label: 'Protein', fraction: (macros.proteinKcal / X) * 100, display: `${macros.proteinG}g`, color: 'var(--color-ink)', size: 180 },
            { label: 'Carbs', fraction: (macros.carbsKcal / X) * 100, display: `${macros.carbsG}g`, color: 'var(--color-accent)', size: 140 },
            { label: 'Fat', fraction: (macros.fatKcal / X) * 100, display: `${macros.fatG}g`, color: 'var(--color-surplus)', size: 100 },
          ]
        : [],
    [macros, X]
  );
  const macroTargets = useMemo(
    () => ({
      calories: X,
      proteinG: macros?.proteinG ?? null,
      carbsG: macros?.carbsG ?? null,
      fatG: macros?.fatG ?? null,
    }),
    [X, macros]
  );

  if (showExportApps) {
    return (
      <>
        <div className="mb-3 text-[0.9375rem] text-hint-text">Export to other app</div>
        <Block className="p-6">
          <p className="mb-5 text-[0.9375rem] text-muted-text">
            Copy your targets in a format ready to paste into another tracker's custom goals screen.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {EXTERNAL_APPS.map(app => (
              <ExportAppCard
                key={app.id}
                name={app.name}
                initials={app.initials}
                destination={app.destination}
                onCopy={() => copyTargetsForApp(app.id, macroTargets)}
              />
            ))}
          </div>
          {!macros && (
            <p className="mt-5 text-xs text-hint-text">
              Add your bodyweight earlier in the flow to include a macro split in the copied targets.
            </p>
          )}
        </Block>
        <div className="mt-6">
          <SkipLink onClick={() => setShowExportApps(false)}>← Back to results</SkipLink>
        </div>
      </>
    );
  }

  return (
    <>
      {shared && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-sm text-muted-text">
          <span>You're viewing a plan someone shared with you.</span>
          <Button className="py-1.5 text-sm" onClick={onRestart}>
            Calculate your own
          </Button>
        </div>
      )}
      <div ref={exportRef}>
        {(cappedLow || cappedHigh) && (
          <Block className="mb-4 border-accent px-4 py-3.5 text-[0.875rem] font-medium" style={{ animationDelay: `${noticeDelay}ms` }}>
            {cappedLow
              ? `Your selected pace would go below a safe minimum, so we've adjusted your target to ${X}kcal/day.`
              : `Your selected pace would push well past a reasonable ceiling, so we've capped your target at ${X}kcal/day.`}
          </Block>
        )}

        <div className="ledger-lines animate-block-in overflow-hidden rounded-2xl bg-ink p-7 text-paper sm:p-9" style={{ animationDelay: `${totalDelay}ms` }}>
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-[0.9375rem] text-onink-text">Today's budget</div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-6xl font-bold tracking-tight tabular-nums sm:text-7xl">{odometerValue.toLocaleString()}</span>
                <span className="text-base font-medium text-onink-text">kcal target</span>
              </div>
            </div>
            <dl className="flex gap-8 text-sm tabular-nums">
              <div>
                <dt className="text-onink-text">Maintenance (TDEE)</dt>
                <dd className="mt-0.5 text-lg font-bold">{tdeeRounded.toLocaleString()} kcal</dd>
              </div>
              {bmrRounded != null && (
                <div>
                  <dt className="text-onink-text">BMR</dt>
                  <dd className="mt-0.5 text-lg font-bold">{bmrRounded.toLocaleString()} kcal</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="mt-8 mb-3 text-[0.9375rem] text-hint-text">Meal by meal</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map((r, i) => {
            const isExcluded = excludedMeals.has(r.name);
            const displayKcal = kcalByName.get(r.name) ?? 0;
            return (
              <div key={r.name} className="animate-block-in" style={{ animationDelay: `${rowDelays[i]}ms` }}>
                <MealFlipCard
                  name={r.name}
                  kcal={isExcluded ? r.kcal : displayKcal}
                  percentOfTotal={isExcluded ? 0 : Math.round((displayKcal / X) * 100)}
                  excluded={isExcluded}
                  onToggleExclude={() => toggleExclude(r.name)}
                />
              </div>
            );
          })}
        </div>

        <div className={macros ? 'mt-8 grid grid-cols-1 gap-4 md:grid-cols-2' : 'mt-8'}>
          {macros && (
            <div className="flex min-w-0 flex-col">
              <div className="mb-3 text-[0.9375rem] text-hint-text">Macros (estimated)</div>
              <Block className="flex-1 p-4 sm:p-6" style={{ animationDelay: `${macrosDelay}ms` }}>
                <BudgetRings rings={macroRings} className="justify-center" />
                <p className="mt-4 text-xs text-hint-text">
                  Estimated from your bodyweight: protein at 1.8g/kg, fat at 25% of your target, carbs make up the rest. Not a prescribed plan.
                </p>
              </Block>
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <div className="mb-3 text-[0.9375rem] text-hint-text">Composition</div>
            <Block className="flex-1 p-4 sm:p-6" style={{ animationDelay: `${ringsDelay}ms` }}>
              <BudgetRings rings={rings} className="justify-center" />
            </Block>
          </div>
        </div>

        {weeks != null && weeks > 0 && (
          <Block className="mt-4 px-6 py-5 text-[0.9375rem] text-muted-text" style={{ animationDelay: `${estimateDelay}ms` }}>
            At this pace, reaching your target weight is an estimated{' '}
            <span className="font-bold text-ink">{Math.round(weeks)} week{Math.round(weeks) === 1 ? '' : 's'}</span> away.
            <div className="mt-2 text-xs text-hint-text">
              This is an estimate, not a guarantee. Adherence, water weight and metabolic adaptation all affect real results.
            </div>
          </Block>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => handleExport('image')} disabled={exportBusy !== null}>
          {exportBusy === 'image' ? 'Exporting...' : 'Download image'}
        </Button>
        <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exportBusy !== null}>
          {exportBusy === 'pdf' ? 'Exporting...' : 'Download PDF'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowExportApps(true);
            track('export', { format: 'app' });
          }}
        >
          Export to app
        </Button>
        <Button variant="outline" onClick={copyPlanLink}>
          {linkStatus === 'copied' ? 'Link copied' : 'Copy link to my plan'}
        </Button>
      </div>
      <ErrorText>{exportError}</ErrorText>
      <ErrorText>{linkStatus === 'failed' ? "Couldn't copy the link. Try again." : ''}</ErrorText>

      <div className="mt-6">
        <SkipLink onClick={onRestart}>Start over</SkipLink>
      </div>
    </>
  );
}
