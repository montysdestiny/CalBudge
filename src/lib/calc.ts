// ---- Config (functional_spec.md §3: percentages must be configurable, not hardcoded) ----

export const MEAL_SPLIT_CONFIG = {
  breakfast: 0.179,
  lunch: 0.25,
  dinner: 0.25,
  extraShareTotal: 0.321,
  extraMealLabels: ['Snack', 'Pre-workout', 'Post-workout'],
};

export const PACE_ADJUSTMENTS: Record<'cut' | 'bulk', Record<'mild' | 'moderate' | 'aggressive', number>> = {
  cut: { mild: -0.10, moderate: -0.20, aggressive: -0.275 },
  bulk: { mild: 0.10, moderate: 0.20, aggressive: 0.25 },
};

const KCAL_PER_KG_FAT = 7700;

// Input bounds — the primary defense against extreme/nonsensical
// recommendations. Every numeric field in the wizard validates against
// these (see the Step* components in App.tsx), so wildly out-of-range
// inputs never reach the calculators in the first place.
export const BOUNDS = {
  age: { min: 13, max: 100 },
  heightCm: { min: 100, max: 250 },
  heightIn: { min: 39, max: 98 },
  weightKg: { min: 30, max: 300 },
  weightLb: { min: 66, max: 660 },
  sessionsPerWeek: { min: 0, max: 14 },
  steps: { min: 0, max: 50000 },
  knownBmr: { min: 500, max: 5000 },
  bodyFatPct: { min: 3, max: 60 },
  tdee: { min: 800, max: 6000 },
} as const;

// Absolute backstop on the final daily target, independent of how it was
// derived (calculated from BMR, or typed in directly on the "I know my
// TDEE" path, which has no BMR to size a floor/ceiling off of). 1200kcal
// is a commonly-cited universal safe-minimum; 6000kcal is a generous but
// non-absurd ceiling.
const ABSOLUTE_MIN_TARGET_KCAL = 1200;
const ABSOLUTE_MAX_TARGET_KCAL = 6000;

export type Sex = 'male' | 'female';
export type Goal = 'cut' | 'bulk' | 'maintain';
export type Pace = 'mild' | 'moderate' | 'aggressive';

export interface WizardState {
  unitSystem: 'metric' | 'imperial';
  knowsTDEE: boolean | null;
  tdeeInput: number | null;
  sex: Sex | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  gymFreq: number | null;
  cardioFreq: number | null;
  steps: number | null;
  knownBMR: number | null;
  bodyFatPct: number | null;
  goal: Goal | null;
  pace: Pace | null;
  targetWeightKg: number | null;
  tdee: number | null;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
export function round5(n: number) {
  return Math.round(n / 5) * 5;
}
export function lbToKg(lb: number) {
  return lb * 0.453592;
}
export function inToCm(inch: number) {
  return inch * 2.54;
}

export function computeBMR(state: WizardState): number {
  if (state.knownBMR != null) return state.knownBMR;
  if (state.bodyFatPct != null && state.weightKg != null) {
    const leanMassKg = state.weightKg * (1 - state.bodyFatPct / 100);
    return 370 + 21.6 * leanMassKg;
  }
  const s = state.sex === 'male' ? 5 : -161;
  return 10 * (state.weightKg ?? 0) + 6.25 * (state.heightCm ?? 0) - 5 * (state.age ?? 0) + s;
}

// Combined gym+cardio -> multiplier lookup. Starting-point brackets per
// functional_spec.md §2.5 (sedentary 1.2 -> very active 1.9); cardio
// weighted at 0.75x gym for combined score since it's typically less
// systemically taxing per session. Flagged in spec as needing real-world
// tuning.
const MEDIAN_STEPS_BY_BASE: Record<number, number> = {
  1.2: 4000, 1.375: 6000, 1.465: 7500, 1.55: 9000, 1.725: 11000, 1.9: 13000,
};

export function activityMultiplier(gymFreq: number, cardioFreq: number, steps: number | null) {
  const score = gymFreq + cardioFreq * 0.75;
  let base: number;
  if (score <= 0) base = 1.2;
  else if (score <= 2) base = 1.375;
  else if (score <= 4) base = 1.465;
  else if (score <= 6) base = 1.55;
  else if (score <= 9) base = 1.725;
  else base = 1.9;

  if (steps != null && !Number.isNaN(steps)) {
    const median = MEDIAN_STEPS_BY_BASE[base];
    const delta = steps - median;
    base += clamp((delta / 2000) * 0.025, -0.075, 0.075);
  }
  return base;
}

export function computeTDEE(state: WizardState): number {
  if (state.knowsTDEE) return state.tdeeInput ?? 0;
  return computeBMR(state) * activityMultiplier(state.gymFreq ?? 0, state.cardioFreq ?? 0, state.steps);
}

export function computeTarget(state: WizardState) {
  let target = state.tdee ?? 0;
  let adjPct = 0;
  if (state.goal && state.goal !== 'maintain' && state.pace) {
    adjPct = PACE_ADJUSTMENTS[state.goal][state.pace];
    target = (state.tdee ?? 0) * (1 + adjPct);
  }
  let cappedLow = false;
  let cappedHigh = false;

  // BMR-relative floor/ceiling — only meaningful when BMR was actually
  // computed (the "calculate my TDEE" path). ceiling of 2.5x mirrors the
  // widest realistic combination the app itself can produce (1.9x
  // very-active multiplier x 1.25 aggressive bulk ~= 2.375x), plus a
  // little headroom.
  if (!state.knowsTDEE) {
    const bmr = computeBMR(state);
    const floor = bmr * 1.2;
    const ceiling = bmr * 2.5;
    if (target < floor) { target = floor; cappedLow = true; }
    else if (target > ceiling) { target = ceiling; cappedHigh = true; }
  }

  // Absolute backstop, applied regardless of path — the only guard at all
  // for the "I know my TDEE" path, which has no BMR to size a cap off of.
  if (target < ABSOLUTE_MIN_TARGET_KCAL) { target = ABSOLUTE_MIN_TARGET_KCAL; cappedLow = true; }
  else if (target > ABSOLUTE_MAX_TARGET_KCAL) { target = ABSOLUTE_MAX_TARGET_KCAL; cappedHigh = true; }

  return { target, cappedLow, cappedHigh, adjPct };
}

export function computeMealSplit(X: number) {
  const c = MEAL_SPLIT_CONFIG;
  const perExtra = round5((X * c.extraShareTotal) / c.extraMealLabels.length);
  const rows = [
    { name: 'Breakfast', kcal: round5(X * c.breakfast) },
    { name: 'Lunch', kcal: round5(X * c.lunch) },
    { name: 'Dinner', kcal: round5(X * c.dinner) },
  ];
  c.extraMealLabels.forEach(name => rows.push({ name, kcal: perExtra }));
  return rows;
}

// When the user excludes a meal (e.g. no post-workout meal), its calories
// get redistributed across the remaining meals proportional to their
// existing share — a meal that was already twice the size of another
// absorbs twice as much of the freed calories, keeping the day's shape
// consistent rather than flattening everything to the same size.
export function redistributeMealSplit(rows: { name: string; kcal: number }[], excludedNames: string[]) {
  const remaining = rows.filter(r => !excludedNames.includes(r.name));
  if (remaining.length === 0) return [];
  const excludedKcal = rows.filter(r => excludedNames.includes(r.name)).reduce((sum, r) => sum + r.kcal, 0);
  const remainingTotal = remaining.reduce((sum, r) => sum + r.kcal, 0);
  return remaining.map(r => ({
    name: r.name,
    kcal: remainingTotal > 0
      ? round5(r.kcal + excludedKcal * (r.kcal / remainingTotal))
      : round5(r.kcal + excludedKcal / remaining.length),
  }));
}

export interface MacroSplit {
  proteinG: number;
  proteinKcal: number;
  fatG: number;
  fatKcal: number;
  carbsG: number;
  carbsKcal: number;
}

// Estimate, not a tracked/prescribed macro plan — no macro guidance in
// functional_spec.md, so this uses common general-fitness heuristics:
// protein by bodyweight (1.8g/kg, within the typical 1.6-2.2g/kg range),
// fat as a fixed share of total calories (25%, within the 20-35% range),
// carbs fill the remainder. Requires a known bodyweight, which either path
// through the wizard can supply (basics form, or the optional field on
// the "I know my TDEE" step) — see the `macros` null-check in App.tsx.
export function computeMacroSplit(weightKg: number, targetKcal: number): MacroSplit {
  let proteinKcal = Math.round(1.8 * weightKg) * 4;
  let fatKcal = Math.round(targetKcal * 0.25);
  if (proteinKcal + fatKcal > targetKcal) {
    const scale = targetKcal / (proteinKcal + fatKcal);
    proteinKcal = Math.round(proteinKcal * scale);
    fatKcal = Math.round(fatKcal * scale);
  }
  const carbsKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  return {
    proteinG: Math.round(proteinKcal / 4),
    proteinKcal,
    fatG: Math.round(fatKcal / 9),
    fatKcal,
    carbsG: Math.round(carbsKcal / 4),
    carbsKcal,
  };
}

export function computeGoalEstimateWeeks(state: WizardState, adjPct: number): number | null {
  if (state.targetWeightKg == null || state.goal === 'maintain' || !adjPct || state.weightKg == null) return null;
  const diff = Math.abs(state.targetWeightKg - state.weightKg);
  if (diff === 0) return null;
  const totalKcal = diff * KCAL_PER_KG_FAT;
  const dailyAdjustmentKcal = Math.abs((state.tdee ?? 0) * adjPct);
  if (dailyAdjustmentKcal === 0) return null;
  return totalKcal / (dailyAdjustmentKcal * 7);
}
