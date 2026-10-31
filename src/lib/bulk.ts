// Bulk estimates for coaches: read a client CSV, run every row through the
// same calculator as the wizard (lib/calc.ts), and format the results.
// Everything runs in the browser; client data is never uploaded.
// Tests: tests/bulk.test.mjs (npm test).

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
export const MAX_FILE_BYTES = 5_000_000;

export const TEMPLATE_CSV = [
  'name,sex,age,height_cm,weight_kg,gym_per_week,cardio_per_week,goal,pace,steps,body_fat_pct,bmr,tdee,target_weight_kg',
  'Alex Example,male,30,180,82,4,2,cut,moderate,9000,,,,76',
  'Sam Example,female,27,165,60,3,1,bulk,mild,,24,,,63',
  'Jordan Example,,,,75,,,maintain,,,,,2600,',
].join('\r\n');

export interface ClientResult {
  /** Spreadsheet row number in the uploaded file. */
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

// ---- File decoding ----

/**
 * Turns uploaded bytes into text. Handles what spreadsheet apps actually
 * produce: UTF-8 (with or without BOM), Excel's "Unicode Text" (UTF-16),
 * and Excel-on-Windows "CSV" (Windows-1252). Rejects Excel/Numbers files
 * uploaded by mistake with a fixable message.
 */
export function decodeFileBytes(bytes: Uint8Array): { text: string } | { error: string } {
  const startsWith = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (startsWith(0x50, 0x4b, 0x03, 0x04) || startsWith(0xd0, 0xcf, 0x11, 0xe0)) {
    return {
      error:
        'That looks like an Excel or Numbers file, not a CSV. In your spreadsheet app choose File > Save As (or Download / Export) > CSV, then upload that file.',
    };
  }
  if (startsWith(0xff, 0xfe)) return { text: new TextDecoder('utf-16le').decode(bytes.subarray(2)) };
  if (startsWith(0xfe, 0xff)) return { text: new TextDecoder('utf-16be').decode(bytes.subarray(2)) };
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    // Not valid UTF-8: almost certainly Excel's default Windows "CSV".
    return { text: new TextDecoder('windows-1252').decode(bytes) };
  }
}

// ---- CSV parsing ----

export type Separator = ',' | ';' | '\t';

/**
 * RFC 4180-style parser: quoted fields (with separators, quotes and line
 * breaks inside), CRLF/LF. Detects comma, semicolon or tab separators.
 * Each record keeps its spreadsheet row number (blank rows count), so
 * error messages point at the right row.
 */
export function parseCsv(text: string): { records: { row: number; cells: string[] }[]; separator: Separator } {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const separator = ([',', ';', '\t'] as Separator[]).reduce((best, ch) => (count(ch) > count(best) ? ch : best));

  const records: { row: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let field = '';
  let inQuotes = false;
  let recordIndex = 0;
  const endRecord = () => {
    cells.push(field);
    field = '';
    if (cells.some(f => f.trim() !== '')) records.push({ row: recordIndex + 1, cells });
    cells = [];
    recordIndex++;
  };
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"' && field.trim() === '') {
      // Opening quote (leading spaces before it are dropped).
      field = '';
      inQuotes = true;
    } else if (ch === separator) {
      cells.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      endRecord();
    } else field += ch;
  }
  if (field !== '' || cells.length > 0) endRecord();
  return { records, separator };
}

// ---- Column names ----

const HEADER_ALIASES: Record<string, string> = {
  client: 'name', client_name: 'name', full_name: 'name', gender: 'sex',
  height_inches: 'height_in', height_inch: 'height_in',
  weight_kgs: 'weight_kg', weight_lbs: 'weight_lb', weight_pounds: 'weight_lb',
  target_weight_kgs: 'target_weight_kg', target_weight_lbs: 'target_weight_lb',
  goal_weight_kg: 'target_weight_kg', goal_weight_lb: 'target_weight_lb', goal_weight_lbs: 'target_weight_lb',
  gym: 'gym_per_week', gym_sessions: 'gym_per_week', gym_sessions_per_week: 'gym_per_week',
  strength_per_week: 'gym_per_week', strength_sessions_per_week: 'gym_per_week',
  cardio: 'cardio_per_week', cardio_sessions: 'cardio_per_week', cardio_sessions_per_week: 'cardio_per_week',
  daily_steps: 'steps', steps_per_day: 'steps', average_steps: 'steps', avg_daily_steps: 'steps', average_daily_steps: 'steps',
  body_fat: 'body_fat_pct', bodyfat: 'body_fat_pct', bf: 'body_fat_pct', body_fat_percent: 'body_fat_pct', body_fat_percentage: 'body_fat_pct',
  bmr_kcal: 'bmr', tdee_kcal: 'tdee', maintenance_kcal: 'tdee', maintenance_calories: 'tdee',
};

const KNOWN_COLUMNS = new Set([
  'name', 'sex', 'age', 'height_cm', 'height_in', 'weight_kg', 'weight_lb', 'gym_per_week', 'cardio_per_week',
  'goal', 'pace', 'steps', 'body_fat_pct', 'bmr', 'tdee', 'target_weight_kg', 'target_weight_lb',
]);

/** "Height (cm)" -> height_cm, "Body fat %" -> body_fat_pct, "Gym per week" -> gym_per_week. */
function normalizeHeader(h: string) {
  const key = h
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return HEADER_ALIASES[key] ?? key;
}

const wordKey = (s: string) => s.trim().toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '');

const GOALS: Record<string, Goal> = {
  cut: 'cut', cutting: 'cut', lose: 'cut', fat_loss: 'cut', weight_loss: 'cut', lose_weight: 'cut', lose_fat: 'cut', deficit: 'cut',
  bulk: 'bulk', bulking: 'bulk', gain: 'bulk', gain_weight: 'bulk', weight_gain: 'bulk', muscle_gain: 'bulk',
  build_muscle: 'bulk', gain_muscle: 'bulk', lean_bulk: 'bulk', surplus: 'bulk',
  maintain: 'maintain', maintaining: 'maintain', maintenance: 'maintain', maintain_weight: 'maintain',
};
const PACES: Record<string, Pace> = {
  mild: 'mild', slow: 'mild', moderate: 'moderate', medium: 'moderate', normal: 'moderate', aggressive: 'aggressive', fast: 'aggressive',
};
const SEXES: Record<string, Sex> = { m: 'male', male: 'male', man: 'male', f: 'female', female: 'female', woman: 'female' };

// ---- Numbers ----

const UNIT_WORDS: Record<string, string> = {
  kg: 'kg', kgs: 'kg', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb', cm: 'cm', in: 'in', inch: 'in', inches: 'in', '"': 'in',
  '%': '%', kcal: 'kcal', cal: 'kcal', calories: 'kcal', y: 'y', yr: 'y', yrs: 'y', years: 'y', steps: 'steps',
};

/**
 * Reads a number the way people type it into spreadsheets: "80", "80.5",
 * "80,5" (European), "9,000" / "9.000" / "9 000" (thousands), "80kg",
 * "70 in". A unit is accepted only if it matches the column's own unit.
 * Ambiguous separators resolve to whichever reading fits the bounds,
 * preferring the convention of the file's separator.
 */
export function parseNumber(
  raw: string,
  separator: Separator,
  bounds: { min: number; max: number },
  unit: string,
): { value: number } | { error: string } {
  const m = raw.trim().match(/^([-+]?[\d\s.,]*\d)\s*([a-z%"]*)$/i);
  if (!m) return { error: `isn't a number` };
  if (m[2]) {
    const typed = UNIT_WORDS[m[2].toLowerCase()];
    if (typed !== unit) return { error: typed ? `is in ${typed} but this column is ${unit || 'a plain number'}` : `has unrecognised text "${m[2]}"` };
  }
  const digits = m[1].replace(/\s+/g, '');
  const candidates: number[] = [];
  const hasComma = digits.includes(',');
  const hasDot = digits.includes('.');
  if (hasComma && hasDot) {
    // Whichever mark comes last is the decimal point.
    candidates.push(
      digits.lastIndexOf(',') > digits.lastIndexOf('.')
        ? Number(digits.replace(/\./g, '').replace(',', '.'))
        : Number(digits.replace(/,/g, '')),
    );
  } else if (hasComma || hasDot) {
    const mark = hasComma ? ',' : '.';
    const parts = digits.split(mark);
    const asThousands = Number(parts.join(''));
    const asDecimal = parts.length === 2 ? Number(`${parts[0]}.${parts[1]}`) : NaN;
    const looksLikeThousands = parts.length >= 2 && /^[-+]?\d{1,3}$/.test(parts[0]) && parts.slice(1).every(p => /^\d{3}$/.test(p));
    // "9,000" in a comma file and "9.000" in a semicolon file are thousands.
    const preferThousands = looksLikeThousands && (mark === ',' ? separator !== ';' : separator === ';');
    candidates.push(...(looksLikeThousands ? (preferThousands ? [asThousands, asDecimal] : [asDecimal, asThousands]) : [asDecimal]));
  } else candidates.push(Number(digits));

  const fit = candidates.find(n => Number.isFinite(n) && n >= bounds.min && n <= bounds.max);
  return fit !== undefined ? { value: fit } : { error: `must be between ${bounds.min} and ${bounds.max}` };
}

// ---- Row processing ----

export interface BulkOutcome {
  results: ClientResult[];
  errors: RowError[];
  /** A problem with the whole file; nothing was processed. */
  fatal: string | null;
  /** Non-blocking notes, e.g. columns that were ignored. */
  warnings: string[];
  separator: Separator;
}

type Measured = { metric: number | null; display: string | null };

export function processCsv(text: string): BulkOutcome {
  const { records, separator } = parseCsv(text);
  const fail = (fatal: string): BulkOutcome => ({ results: [], errors: [], fatal, warnings: [], separator });
  if (records.length < 2) return fail('The file has no client rows. Download the template to see the expected layout.');
  if (records.length - 1 > MAX_ROWS) {
    return fail(`That's ${records.length - 1} clients; the limit is ${MAX_ROWS} per file. Split it into smaller files.`);
  }

  const headers = records[0].cells.map(normalizeHeader);
  const col = (name: string) => headers.indexOf(name);
  const has = (...names: string[]) => names.some(n => col(n) !== -1);

  const missing: string[] = [];
  if (!has('name')) missing.push('name');
  if (!has('goal')) missing.push('goal');
  if (!has('tdee')) {
    if (!has('sex')) missing.push('sex');
    if (!has('age')) missing.push('age');
    if (!has('height_cm', 'height_in')) missing.push('height_cm (or height_in)');
    if (!has('weight_kg', 'weight_lb')) missing.push('weight_kg (or weight_lb)');
    if (!has('gym_per_week')) missing.push('gym_per_week');
    if (!has('cardio_per_week')) missing.push('cardio_per_week');
  }
  if (missing.length > 0) {
    return fail(`Missing column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}. Download the template to see the expected layout.`);
  }

  const warnings: string[] = [];
  const ignored = records[0].cells.filter((h, i) => h.trim() !== '' && !KNOWN_COLUMNS.has(headers[i]));
  if (ignored.length > 0) {
    warnings.push(
      `Ignored column${ignored.length === 1 ? '' : 's'} the calculator doesn't use: ${ignored.map(h => `"${h.trim()}"`).join(', ')}. Check the spelling if one of these should have counted.`,
    );
  }

  const results: ClientResult[] = [];
  const errors: RowError[] = [];

  for (const { row: rowNum, cells } of records.slice(1)) {
    const get = (name: string) => (col(name) === -1 ? '' : (cells[col(name)] ?? '').trim());
    const name = get('name').replace(/\s+/g, ' ').slice(0, 80) || `Row ${rowNum}`;
    const problems: string[] = [];

    const num = (column: string, bounds: { min: number; max: number }, unit: string, required: boolean): number | null => {
      const raw = get(column);
      if (raw === '') {
        if (required) problems.push(`${column} is missing`);
        return null;
      }
      const parsed = parseNumber(raw, separator, bounds, unit);
      if ('error' in parsed) {
        problems.push(`${column} ${parsed.error} (got "${raw}")`);
        return null;
      }
      return parsed.value;
    };
    // A measurement can be given in either unit per row, but not both.
    const measure = (
      metric: string,
      imperial: string,
      bounds: { metric: { min: number; max: number }; imperial: { min: number; max: number } },
      units: [string, string],
      toMetric: (n: number) => number,
      required: boolean,
    ): Measured => {
      const hasMetric = get(metric) !== '';
      const hasImperial = get(imperial) !== '';
      if (hasMetric && hasImperial) {
        problems.push(`fill in only one of ${metric} or ${imperial}`);
        return { metric: null, display: null };
      }
      if (!hasMetric && !hasImperial) {
        if (required) problems.push(`${metric} (or ${imperial}) is missing`);
        return { metric: null, display: null };
      }
      if (hasImperial) {
        const v = num(imperial, bounds.imperial, units[1], required);
        return { metric: v == null ? null : toMetric(v), display: v == null ? null : `${v} ${units[1]}` };
      }
      const v = num(metric, bounds.metric, units[0], required);
      return { metric: v, display: v == null ? null : `${v} ${units[0]}` };
    };
    const weightBounds = { metric: BOUNDS.weightKg, imperial: BOUNDS.weightLb };

    const goalRaw = get('goal');
    const goal = GOALS[wordKey(goalRaw)];
    if (!goal) problems.push(goalRaw === '' ? 'goal is missing' : `goal must be cut, bulk or maintain (got "${goalRaw}")`);
    const paceRaw = get('pace');
    const pace = PACES[wordKey(paceRaw)] ?? null;
    if (goal && goal !== 'maintain' && !pace) {
      problems.push(paceRaw === '' ? 'pace is missing (mild, moderate or aggressive)' : `pace must be mild, moderate or aggressive (got "${paceRaw}")`);
    }

    const tdeeInput = num('tdee', BOUNDS.tdee, 'kcal', false);
    const knowsTDEE = tdeeInput != null;
    const weight = measure('weight_kg', 'weight_lb', weightBounds, ['kg', 'lb'], lbToKg, !knowsTDEE);
    const target = measure('target_weight_kg', 'target_weight_lb', weightBounds, ['kg', 'lb'], lbToKg, false);

    let sex: Sex | null = null;
    let age: number | null = null;
    let height: Measured = { metric: null, display: null };
    let gym: number | null = null;
    let cardio: number | null = null;
    let steps: number | null = null;
    let bodyFat: number | null = null;
    let knownBmr: number | null = null;
    if (!knowsTDEE) {
      const sexRaw = get('sex');
      sex = SEXES[wordKey(sexRaw)] ?? null;
      if (!sex) problems.push(sexRaw === '' ? 'sex is missing (male or female)' : `sex must be male or female (got "${sexRaw}")`);
      age = num('age', BOUNDS.age, 'y', true);
      height = measure('height_cm', 'height_in', { metric: BOUNDS.heightCm, imperial: BOUNDS.heightIn }, ['cm', 'in'], inToCm, true);
      gym = num('gym_per_week', BOUNDS.sessionsPerWeek, '', true);
      cardio = num('cardio_per_week', BOUNDS.sessionsPerWeek, '', true);
      steps = num('steps', BOUNDS.steps, 'steps', false);
      bodyFat = num('body_fat_pct', BOUNDS.bodyFatPct, '%', false);
      knownBmr = num('bmr', BOUNDS.knownBmr, 'kcal', false);
    }

    if (problems.length > 0 || !goal) {
      errors.push({ row: rowNum, name, problems });
      continue;
    }

    const state: WizardState = {
      unitSystem: weight.display?.endsWith('lb') ? 'imperial' : 'metric',
      knowsTDEE,
      tdeeInput,
      sex,
      age,
      heightCm: height.metric,
      weightKg: weight.metric,
      gymFreq: gym,
      cardioFreq: cardio,
      steps,
      knownBMR: knownBmr,
      bodyFatPct: bodyFat,
      goal,
      pace: goal === 'maintain' ? null : pace,
      targetWeightKg: target.metric,
      tdee: null,
    };
    state.tdee = computeTDEE(state);

    const { target: rawTarget, cappedLow, cappedHigh } = computeTarget(state);
    const targetKcal = Math.round(rawTarget);
    const weeks = computeGoalEstimateWeeks(state, rawTarget);

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
        ? [`TDEE ${tdeeInput} kcal`, weight.display].filter(Boolean).join(', ')
        : [
            sex,
            `${age}y`,
            height.display,
            weight.display,
            `${gym} gym / ${cardio} cardio per week`,
            steps != null && `${steps} steps`,
            bodyFat != null && `${bodyFat}% body fat`,
            knownBmr != null && `BMR ${knownBmr}`,
          ]
            .filter(Boolean)
            .join(', '),
    });
  }

  return { results, errors, fatal: null, warnings, separator };
}

// ---- Output ----

// ---- Which names the PDF can print ----
// jsPDF's built-in Helvetica only covers Windows-1252 (Western European).
// public/fonts/NotoSans-*.ttf (subset: Latin incl. Vietnamese, Greek,
// Cyrillic) is loaded only when a name needs it. Other scripts (CJK, Arabic,
// Hebrew, Indic...) would need very large fonts, so those names print as
// "Client (row N)"; the on-screen table and CSV keep them intact.

const WIN_ANSI_EXTRAS = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const NOTO_RANGES: [number, number][] = [
  [0x0000, 0x036f], [0x0370, 0x03ff], [0x0400, 0x052f], [0x1e00, 0x1fff], [0x2000, 0x214f], [0x2190, 0x21ff],
];

export type NameSupport = 'builtin' | 'needs-font' | 'unsupported';

export function nameSupport(name: string): NameSupport {
  let needsFont = false;
  for (const ch of name) {
    const cp = ch.codePointAt(0)!;
    if (cp <= 0xff || WIN_ANSI_EXTRAS.includes(ch)) continue;
    if (!NOTO_RANGES.some(([a, b]) => cp >= a && cp <= b)) return 'unsupported';
    needsFont = true;
  }
  return needsFont ? 'needs-font' : 'builtin';
}


export function goalLabel(r: Pick<ClientResult, 'goal' | 'pace'>) {
  const g = { cut: 'Cut', bulk: 'Bulk', maintain: 'Maintain' }[r.goal];
  return r.pace ? `${g} (${r.pace})` : g;
}

function csvCell(v: string | number | null, separator: Separator) {
  const s = v == null ? '' : String(v);
  // Prefix formula-like text so spreadsheet apps don't execute it (CSV
  // injection), then quote anything containing separators, quotes or breaks.
  const safe = /^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return safe.includes(separator) || /["\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Results as CSV, using the uploaded file's separator so it opens the same way in the coach's spreadsheet app. */
export function resultsToCsv(results: ClientResult[], separator: Separator = ','): string {
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
    ]
      .map(v => csvCell(v, separator))
      .join(separator),
  );
  return [header.join(separator), ...lines].join('\r\n');
}
