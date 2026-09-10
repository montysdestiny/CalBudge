import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Block,
  ENTRANCE_DURATION_MS,
  ErrorText,
  Field,
  NumberInput,
  SkipLink,
  STAGGER_MS,
  SummaryRow,
  ToggleGroup,
  staggerDelay,
} from '@/components/Blocks';
import energizerSvg from '@/assets/energizer.svg';
import personalTrainerSvg from '@/assets/personal-trainer.svg';
import AITextLoading from '@/components/kokonutui/ai-text-loading';
import BudgetLoadingPaths from '@/components/kokonutui/budget-loading-paths';
import BudgetRings from '@/components/kokonutui/budget-rings';
import ExportAppCard from '@/components/kokonutui/export-app-card';
import IntroFlipCard from '@/components/kokonutui/intro-flip-card';
import MagnetButton from '@/components/kokonutui/magnet-button';
import MealFlipCard from '@/components/kokonutui/meal-flip-card';
import { useOdometer } from '@/hooks/useOdometer';
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
  computeTDEE,
  computeTarget,
  inToCm,
  lbToKg,
  redistributeMealSplit,
} from '@/lib/calc';
import { exportNodeAsImage, exportNodeAsPdf } from '@/lib/export';

type StepId =
  | 'welcome'
  | 'entry'
  | 'tdee-input'
  | 'basics'
  | 'optional'
  | 'goal'
  | 'pace'
  | 'goal-estimate'
  | 'loading'
  | 'result';

interface HistoryEntry {
  label: string;
  value: string;
  editStepId: StepId;
}

const STEP_ORDER: StepId[] = ['entry', 'tdee-input', 'basics', 'optional', 'goal', 'pace', 'goal-estimate'];

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

export default function App() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [stepId, setStepId] = useState<StepId>('welcome');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Extra display-only fields (original raw input units, kept separate from
  // the SI values used in calc.ts) — mirrors the vanilla version's
  // heightDisplay/weightDisplay so re-opening "basics" shows the unit the
  // user actually typed in, not a converted value.
  const [heightDisplay, setHeightDisplay] = useState<number | null>(null);
  const [weightDisplay, setWeightDisplay] = useState<number | null>(null);

  const imperial = state.unitSystem === 'imperial';

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
    setState(INITIAL_STATE);
    setHistory([]);
    setHeightDisplay(null);
    setWeightDisplay(null);
    goTo('entry');
  }

  const blockDelay = staggerDelay(history.length);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-25">
        <BudgetLoadingPaths />
      </div>
      <img
        src={personalTrainerSvg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-16 -left-16 z-0 hidden w-[380px] opacity-[0.07] lg:block"
      />
      <img
        src={energizerSvg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed top-20 right-6 z-0 hidden w-[190px] opacity-[0.07] lg:block"
      />

      <header className="relative z-10 flex items-center justify-end border-b-2 border-ink bg-paper px-6 py-5">
        <MagnetButton
          variant="outline"
          particleCount={5}
          onClick={() => setState(s => ({ ...s, unitSystem: s.unitSystem === 'metric' ? 'imperial' : 'metric' }))}
          className="px-3.5 py-1.5 text-[0.8125rem] capitalize"
        >
          {state.unitSystem}
        </MagnetButton>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[560px]">
          {stepId === 'welcome' ? (
            <IntroFlipCard
              title="Ready to calculate your budget?"
              subtitle="Hover or tap to see how it works."
              description="Answer a few quick questions about yourself and your training, and get a daily calorie target with a meal-by-meal split."
              features={['BMR & TDEE calculated for you', 'Meal-by-meal calorie split', 'Macro estimate from your bodyweight']}
              cta="Let's start"
              onStart={() => goTo('entry')}
            />
          ) : (
            <>
              {history.map((h, idx) => (
                <SummaryRow key={`${h.editStepId}-${h.label}`} label={h.label} value={h.value} index={idx} onEdit={() => editStep(h.editStepId)} />
              ))}

              <Block className="mt-1 p-6" style={blockDelay}>
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
              onContinue={goal => {
                setState(s => {
                  const next = { ...s, goal, pace: goal === 'maintain' ? null : s.pace };
                  if (goal === 'maintain') next.tdee = computeTDEE(next);
                  return next;
                });
                pushSummary('Goal', goal[0].toUpperCase() + goal.slice(1), 'goal');
                goTo(goal === 'maintain' ? 'loading' : 'pace');
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
                goTo('loading');
              }}
            />
          )}

          {stepId === 'loading' && <StepLoading onDone={() => goTo('result')} />}

          {stepId === 'result' && <StepResult state={state} historyLength={history.length} onRestart={restart} />}
              </Block>
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t-2 border-ink bg-paper px-6 py-4 text-center text-xs text-hint-text">
        Estimates for informational purposes only — not medical advice. Consult a healthcare professional before changing your diet.
      </footer>
    </div>
  );
}

// ---- Step: entry ----

function StepEntry({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold">Have you already calculated your daily expenditure (TDEE)?</h2>
      <div className="mt-2 flex items-center gap-3">
        <MagnetButton onClick={onYes}>Yes, I know my TDEE</MagnetButton>
        <MagnetButton variant="outline" onClick={onNo}>No, calculate it</MagnetButton>
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
      <h2 className="mb-4 text-lg font-bold">What's your daily expenditure?</h2>
      <Field label="TDEE (kcal/day)">
        <NumberInput min={BOUNDS.tdee.min} max={BOUNDS.tdee.max} step={10} value={val} onChange={e => setVal(e.target.value)} />
        <ErrorText>{error}</ErrorText>
      </Field>
      <Field label={`Bodyweight (${weightUnit}) — optional`} hint="Enables a macro estimate on your results.">
        <NumberInput min={weightBounds.min} max={weightBounds.max} value={weight} onChange={e => setWeight(e.target.value)} />
        <ErrorText>{weightError}</ErrorText>
      </Field>
      <MagnetButton
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
      </MagnetButton>
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
      <h2 className="mb-4 text-lg font-bold">Tell us about you</h2>
      <ToggleGroup label="Sex" value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
      <ErrorText>{errors.sex}</ErrorText>
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
      <MagnetButton onClick={submit}>Continue</MagnetButton>
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
      <h2 className="mb-4 text-lg font-bold">Optional — refines your number</h2>
      <p className="mb-4 text-xs text-hint-text">Skip any of these and we'll use standard defaults instead.</p>
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
      <MagnetButton
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
      </MagnetButton>
    </>
  );
}

// ---- Step: goal ----

function StepGoal({ onContinue }: { onContinue: (goal: Goal) => void }) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState('');

  return (
    <>
      <h2 className="mb-4 text-lg font-bold">Are you cutting, bulking, or maintaining?</h2>
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
      <MagnetButton
        onClick={() => {
          if (!goal) { setError('Choose a goal to continue'); return; }
          onContinue(goal);
        }}
      >
        Continue
      </MagnetButton>
    </>
  );
}

// ---- Step: pace ----

function StepPace({ onContinue }: { onContinue: (pace: Pace) => void }) {
  const [pace, setPace] = useState<Pace | null>(null);
  const [error, setError] = useState('');

  return (
    <>
      <h2 className="mb-4 text-lg font-bold">Choose your pace</h2>
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
      <MagnetButton
        onClick={() => {
          if (!pace) { setError('Choose a pace to continue'); return; }
          onContinue(pace);
        }}
      >
        Continue
      </MagnetButton>
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
      <h2 className="mb-4 text-lg font-bold">Target weight — optional</h2>
      <p className="mb-4 text-xs text-hint-text">Get a rough timeline estimate. Skip if you'd rather not.</p>
      <Field label={`Target weight (${weightUnit})`}>
        <NumberInput min={weightBounds.min} max={weightBounds.max} value={val} onChange={e => setVal(e.target.value)} />
        <ErrorText>{error}</ErrorText>
      </Field>
      <div className="mt-2 flex items-center gap-3">
        <MagnetButton
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
        </MagnetButton>
        <SkipLink onClick={() => onDone(null)}>Skip</SkipLink>
      </div>
    </>
  );
}

// ---- Step: loading ----

const LOADING_TEXTS = ['Calculating your BMR...', 'Applying your activity multiplier...', 'Checking the safety floor...', 'Splitting your meals...'];
const LOADING_DURATION_MS = 2400;

function StepLoading({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onDone, LOADING_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [onDone]);

  return (
    <div className="relative -m-6 flex h-[220px] items-center justify-center overflow-hidden">
      <BudgetLoadingPaths />
      <div className="relative z-10">
        <AITextLoading texts={LOADING_TEXTS} interval={800} className="text-2xl from-ink via-hint-text to-ink" />
      </div>
    </div>
  );
}

// ---- Step: result ----

const MAIN_MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner'];

function StepResult({ state, historyLength, onRestart }: { state: WizardState; historyLength: number; onRestart: () => void }) {
  const { target, cappedLow, cappedHigh, adjPct } = useMemo(() => computeTarget(state), [state]);
  const X = Math.round(target);
  const rows = useMemo(() => computeMealSplit(X), [X]);
  const weeks = useMemo(() => computeGoalEstimateWeeks(state, adjPct), [state, adjPct]);

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
      if (kind === 'image') await exportNodeAsImage(exportRef.current, 'calbudge-budget.png');
      else await exportNodeAsPdf(exportRef.current, 'calbudge-budget.pdf');
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
        <div className="mb-2 text-[0.8125rem] font-bold tracking-wide text-muted-text uppercase">Export to other app</div>
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
      <div ref={exportRef}>
        {(cappedLow || cappedHigh) && (
          <Block className="mb-4 border-accent px-4 py-3.5 text-[0.875rem] font-medium" style={{ animationDelay: `${noticeDelay}ms` }}>
            {cappedLow
              ? `Your selected pace would go below a safe minimum, so we've adjusted your target to ${X}kcal/day.`
              : `Your selected pace would push well past a reasonable ceiling, so we've capped your target at ${X}kcal/day.`}
          </Block>
        )}

        <div className="mt-1">
          <div className="mb-2 text-[0.8125rem] font-bold tracking-wide text-muted-text uppercase">Today's budget</div>
          <Block
            className="mb-2 flex items-baseline justify-between bg-ink p-6 text-paper"
            style={{ animationDelay: `${totalDelay}ms` }}
          >
            <span className="text-[2.75rem] font-bold tabular-nums">{odometerValue.toLocaleString()}</span>
            <span className="text-sm font-medium text-onink-text">kcal target</span>
          </Block>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
        </div>

        {macros && (
          <div className="mt-4">
            <div className="mb-2 text-[0.8125rem] font-bold tracking-wide text-muted-text uppercase">Macros (estimated)</div>
            <Block className="px-6 py-6" style={{ animationDelay: `${macrosDelay}ms` }}>
              <BudgetRings rings={macroRings} className="justify-center" />
              <p className="mt-4 text-xs text-hint-text">
                Estimated from your bodyweight — protein at 1.8g/kg, fat at 25% of target, carbs filling the remainder. Not a prescribed plan.
              </p>
            </Block>
          </div>
        )}

        <div className="mt-4">
          <div className="mb-2 text-[0.8125rem] font-bold tracking-wide text-muted-text uppercase">Composition</div>
          <Block className="px-6 py-6" style={{ animationDelay: `${ringsDelay}ms` }}>
            <BudgetRings rings={rings} className="justify-center" />
          </Block>
        </div>

        {weeks != null && weeks > 0 && (
          <Block className="mt-4 border-line px-[18px] py-4 text-[0.875rem] text-muted-text" style={{ animationDelay: `${estimateDelay}ms` }}>
            At this pace, reaching your target weight is an estimated{' '}
            <span className="font-bold text-ink">{Math.round(weeks)} week{Math.round(weeks) === 1 ? '' : 's'}</span> away.
            <div className="mt-2 text-xs text-hint-text">
              This is an estimate, not a guarantee — adherence, water weight, and metabolic adaptation will affect actual results.
            </div>
          </Block>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <MagnetButton variant="outline" onClick={() => handleExport('image')} disabled={exportBusy !== null}>
          {exportBusy === 'image' ? 'Exporting...' : 'Download image'}
        </MagnetButton>
        <MagnetButton variant="outline" onClick={() => handleExport('pdf')} disabled={exportBusy !== null}>
          {exportBusy === 'pdf' ? 'Exporting...' : 'Download PDF'}
        </MagnetButton>
        <MagnetButton variant="outline" onClick={() => setShowExportApps(true)}>
          Export to app
        </MagnetButton>
      </div>
      <ErrorText>{exportError}</ErrorText>

      <div className="mt-6">
        <SkipLink onClick={onRestart}>Start over</SkipLink>
      </div>
    </>
  );
}
