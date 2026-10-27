// Bulk estimates for coaches: parse a client CSV, run every row through the
// same calculator as the wizard (lib/calc.ts), and format the results.
// Everything runs in the browser; client data is never uploaded.

import {
  BOUNDS,
  type Goal,
  type MacroSplit,
  type Pace,
  type Sex,
  type WizardState,
  computeBMR,
  computeGoalEstimateWeeks,
  computeMacroSplit,
  computeMealSplit,
  computeTDEE,
  computeTarget,
  inToCm,
  lbToKg,
} from '@/lib/calc';

export const MAX_ROWS = 1000;

export const TEMPLATE_CSV = [
  'name,sex,age,height_cm,weight_kg,gym_per_week,cardio_per_week,goal,pace,steps,body_fat_pct,bmr,tdee,target_weight_kg',
  'Alex Example,male,30,180,82,4,2,cut,moderate,9000,,,,76',
  'Sam Example,female,27,165,60,3,1,bulk,mild,,24,,,63',
  'Jordan Example,,,,75,,,maintain,,,,,2600,',
].join('\n');

export interface ClientResult {
  row: number;
  name: string;
  goal: Goal;
  pace: Pace | null;
  targetKcal: number;
  tdeeKcal: number;
  bmrKcal: number | null;
  macros: MacroSplit | null;
  meals: { name: string; kcal: number }[];
  weeksToTarget: number | null;
  note: string | null;
  inputsSummary: string;
}

export interface RowError {
  row: number;
  name: string;
  problems: string[];
}

// ---- CSV parsing ----

/** RFC 4180-ish: quoted fields, escaped quotes, CRLF/LF. Detects , or ; separators. */
export function parseCsv(text: string): { rows: string[][]; separator: ',' | ';' } {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === separator) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(f => f.trim() !== '')) rows.push(row);
  return { rows, separator };
}

// ---- Row processing ----

const HEADER_ALIASES: Record<string, string> = {
  client: 'name', client_name: 'name', gender: 'sex',
  gym: 'gym_per_week', gym_sessions: 'gym_per_week', strength_per_week: 'gym_per_week',
  cardio: 'cardio_per_week', cardio_sessions: 'cardio_per_week',
  daily_steps: 'steps', body_fat: 'body_fat_pct', bodyfat: 'body_fat_pct', bf: 'body_fat_pct',
};

function normalizeHeader(h: string) {
  const key = h.trim().toLowerCase().replace(/[\s%-]+/g, '_').replace(/_+$/, '');
  return HEADER_ALIASES[key] ?? key;
}

const GOALS: Record<string, Goal> = {
  cut: 'cut', cutting: 'cut', lose: 'cut', fat_loss: 'cut',
  bulk: 'bulk', bulking: 'bulk', gain: 'bulk',
  maintain: 'maintain', maintaining: 'maintain', maintenance: 'maintain',
};
const PACES: Record<string, Pace> = { mild: 'mild', moderate: 'moderate', aggressive: 'aggressive' };
const SEXES: Record<string, Sex> = { m: 'male', male: 'male', man: 'male', f: 'female', female: 'female', woman: 'female' };

export function processCsv(text: string): { results: ClientResult[]; errors: RowError[]; fatal: string | null } {
  const { rows, separator } = parseCsv(text);
  if (rows.length < 2) return { results: [], errors: [], fatal: 'The file has no client rows. Use the template to get the columns right.' };
  if (rows.length - 1 > MAX_ROWS) return { results: [], errors: [], fatal: `That's ${rows.length - 1} clients; the limit is ${MAX_ROWS} per file. Split it into smaller files.` };

  const headers = rows[0].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(name);
  if (col('name') === -1) return { results: [], errors: [], fatal: 'Missing a "name" column. Use the template to get the columns right.' };
  const imperial = col('height_in') !== -1 || col('weight_lb') !== -1 || col('target_weight_lb') !== -1;

  const results: ClientResult[] = [];
  const errors: RowError[] = [];

  rows.slice(1).forEach((cells, i) => {
    const rowNum = i + 2; // spreadsheet row number (header is row 1)
    const get = (name: string) => (col(name) === -1 ? '' : (cells[col(name)] ?? '').trim());
    const name = get('name') || `Row ${rowNum}`;
    const problems: string[] = [];

    // European-format files (;-separated) usually use decimal commas.
    const num = (column: string, label: string, bounds: { min: number; max: number }, required: boolean): number | null => {
      const raw = get(column);
      if (raw === '') {
        if (required) problems.push(`${label} is missing`);
        return null;
      }
      const n = Number(separator === ';' ? raw.replace(',', '.') : raw);
      if (!Number.isFinite(n) || n < bounds.min || n > bounds.max) {
        problems.push(`${label} must be between ${bounds.min} and ${bounds.max} (got "${raw}")`);
        return null;
      }
      return n;
    };

    const goal = GOALS[get('goal').toLowerCase()];
    if (!goal) problems.push(`goal must be cut, bulk or maintain (got "${get('goal')}")`);
    const pace = PACES[get('pace').toLowerCase()] ?? null;
    if (goal && goal !== 'maintain' && !pace) problems.push(`pace must be mild, moderate or aggressive (got "${get('pace')}")`);

    const tdeeInput = num('tdee', 'tdee', BOUNDS.tdee, false);
    const knowsTDEE = tdeeInput != null;
    const weightRaw = imperial
      ? num('weight_lb', 'weight_lb', BOUNDS.weightLb, !knowsTDEE)
      : num('weight_kg', 'weight_kg', BOUNDS.weightKg, !knowsTDEE);
    const targetRaw = imperial
      ? num('target_weight_lb', 'target_weight_lb', BOUNDS.weightLb, false)
      : num('target_weight_kg', 'target_weight_kg', BOUNDS.weightKg, false);

    let sex: Sex | null = null;
    let age: number | null = null;
    let heightRaw: number | null = null;
    let gym: number | null = null;
    let cardio: number | null = null;
    let steps: number | null = null;
    let bodyFat: number | null = null;
    let knownBmr: number | null = null;
    if (!knowsTDEE) {
      sex = SEXES[get('sex').toLowerCase()] ?? null;
      if (!sex) problems.push(`sex must be male or female (got "${get('sex')}")`);
      age = num('age', 'age', BOUNDS.age, true);
      heightRaw = imperial ? num('height_in', 'height_in', BOUNDS.heightIn, true) : num('height_cm', 'height_cm', BOUNDS.heightCm, true);
      gym = num('gym_per_week', 'gym_per_week', BOUNDS.sessionsPerWeek, true);
      cardio = num('cardio_per_week', 'cardio_per_week', BOUNDS.sessionsPerWeek, true);
      steps = num('steps', 'steps', BOUNDS.steps, false);
      bodyFat = num('body_fat_pct', 'body_fat_pct', BOUNDS.bodyFatPct, false);
      knownBmr = num('bmr', 'bmr', BOUNDS.knownBmr, false);
    }

    if (problems.length > 0 || !goal) {
      errors.push({ row: rowNum, name, problems });
      return;
    }

    const state: WizardState = {
      unitSystem: imperial ? 'imperial' : 'metric',
      knowsTDEE,
      tdeeInput,
      sex,
      age,
      heightCm: heightRaw == null ? null : imperial ? inToCm(heightRaw) : heightRaw,
      weightKg: weightRaw == null ? null : imperial ? lbToKg(weightRaw) : weightRaw,
      gymFreq: gym,
      cardioFreq: cardio,
      steps,
      knownBMR: knownBmr,
      bodyFatPct: bodyFat,
      goal,
      pace: goal === 'maintain' ? null : pace,
      targetWeightKg: targetRaw == null ? null : imperial ? lbToKg(targetRaw) : targetRaw,
      tdee: null,
    };
    state.tdee = computeTDEE(state);

    const { target, cappedLow, cappedHigh, adjPct } = computeTarget(state);
    const targetKcal = Math.round(target);
    const weeks = computeGoalEstimateWeeks(state, adjPct);
    const wUnit = imperial ? 'lb' : 'kg';
    const hUnit = imperial ? 'in' : 'cm';

    results.push({
      row: rowNum,
      name,
      goal,
      pace: state.pace,
      targetKcal,
      tdeeKcal: Math.round(state.tdee),
      bmrKcal: knowsTDEE ? null : Math.round(computeBMR(state)),
      macros: state.weightKg != null ? computeMacroSplit(state.weightKg, targetKcal) : null,
      meals: computeMealSplit(targetKcal),
      weeksToTarget: weeks != null && weeks > 0 ? Math.round(weeks) : null,
      note: cappedLow
        ? 'Raised to a safe minimum'
        : cappedHigh
          ? 'Capped at a reasonable maximum'
          : state.weightKg == null
            ? 'No bodyweight, so no macros'
            : null,
      inputsSummary: knowsTDEE
        ? [`TDEE ${tdeeInput} kcal`, weightRaw != null && `${weightRaw} ${wUnit}`].filter(Boolean).join(', ')
        : [
            sex,
            `${age}y`,
            `${heightRaw} ${hUnit}`,
            `${weightRaw} ${wUnit}`,
            `${gym} gym / ${cardio} cardio per week`,
            steps != null && `${steps} steps`,
            bodyFat != null && `${bodyFat}% body fat`,
            knownBmr != null && `BMR ${knownBmr}`,
          ].filter(Boolean).join(', '),
    });
  });

  return { results, errors, fatal: null };
}

// ---- Output ----

export function goalLabel(r: Pick<ClientResult, 'goal' | 'pace'>) {
  const g = { cut: 'Cut', bulk: 'Bulk', maintain: 'Maintain' }[r.goal];
  return r.pace ? `${g} (${r.pace})` : g;
}

function csvCell(v: string | number | null) {
  const s = v == null ? '' : String(v);
  // Quote anything with separators/quotes; prefix formula-like text so
  // spreadsheet apps don't execute it.
  const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function resultsToCsv(results: ClientResult[]): string {
  const mealNames = results[0]?.meals.map(m => m.name) ?? [];
  const header = [
    'name', 'goal', 'target_kcal', 'maintenance_kcal', 'bmr_kcal', 'protein_g', 'carbs_g', 'fat_g',
    ...mealNames.map(m => `${m.toLowerCase().replace(/[^a-z]+/g, '_')}_kcal`),
    'weeks_to_target', 'note',
  ];
  const lines = results.map(r =>
    [
      r.name, goalLabel(r), r.targetKcal, r.tdeeKcal, r.bmrKcal,
      r.macros?.proteinG ?? null, r.macros?.carbsG ?? null, r.macros?.fatG ?? null,
      ...r.meals.map(m => m.kcal),
      r.weeksToTarget, r.note,
    ].map(csvCell).join(','),
  );
  return [header.join(','), ...lines].join('\r\n');
}
