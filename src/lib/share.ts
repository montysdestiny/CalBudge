// Shareable plan links: the wizard inputs are encoded into the URL hash
// (#plan=...), so they never reach the server, and GA is configured to drop
// the hash (see lib/consent.ts). Decoding validates everything against the
// same BOUNDS the wizard uses, so a hand-edited link can't produce nonsense.

import { BOUNDS, type WizardState, computeTDEE } from '@/lib/calc';

const PARAM = 'plan';
const VERSION = 1;

type Shared = Omit<WizardState, 'tdee'> & { v: number };

function toBase64Url(s: string) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string) {
  return atob(s.replace(/-/g, '+').replace(/_/g, '/'));
}

export function encodePlan(state: WizardState): string {
  const { tdee: _tdee, ...inputs } = state;
  const payload: Shared = { v: VERSION, ...inputs };
  return `#${PARAM}=${toBase64Url(JSON.stringify(payload))}`;
}

function inRange(v: unknown, b: { min: number; max: number }): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= b.min && v <= b.max;
}

function optionalInRange(v: unknown, b: { min: number; max: number }) {
  return v === null || inRange(v, b);
}

export function decodePlan(hash: string): WizardState | null {
  const match = hash.match(new RegExp(`^#${PARAM}=([A-Za-z0-9_-]+)$`));
  if (!match) return null;

  let p: Partial<Shared>;
  try {
    p = JSON.parse(fromBase64Url(match[1]));
  } catch {
    return null;
  }
  if (p.v !== VERSION) return null;
  if (p.unitSystem !== 'metric' && p.unitSystem !== 'imperial') return null;
  if (p.goal !== 'cut' && p.goal !== 'bulk' && p.goal !== 'maintain') return null;
  if (p.goal !== 'maintain' && p.pace !== 'mild' && p.pace !== 'moderate' && p.pace !== 'aggressive') return null;
  if (!optionalInRange(p.weightKg, BOUNDS.weightKg) || !optionalInRange(p.targetWeightKg, BOUNDS.weightKg)) return null;

  if (p.knowsTDEE === true) {
    if (!inRange(p.tdeeInput, BOUNDS.tdee)) return null;
  } else if (p.knowsTDEE === false) {
    if (p.sex !== 'male' && p.sex !== 'female') return null;
    if (!inRange(p.age, BOUNDS.age) || !inRange(p.heightCm, BOUNDS.heightCm) || !inRange(p.weightKg, BOUNDS.weightKg)) return null;
    if (!inRange(p.gymFreq, BOUNDS.sessionsPerWeek) || !inRange(p.cardioFreq, BOUNDS.sessionsPerWeek)) return null;
    if (!optionalInRange(p.steps, BOUNDS.steps) || !optionalInRange(p.knownBMR, BOUNDS.knownBmr)) return null;
    if (!optionalInRange(p.bodyFatPct, BOUNDS.bodyFatPct)) return null;
  } else {
    return null;
  }

  const state: WizardState = {
    unitSystem: p.unitSystem,
    knowsTDEE: p.knowsTDEE,
    tdeeInput: p.tdeeInput ?? null,
    sex: p.sex ?? null,
    age: p.age ?? null,
    heightCm: p.heightCm ?? null,
    weightKg: p.weightKg ?? null,
    gymFreq: p.gymFreq ?? null,
    cardioFreq: p.cardioFreq ?? null,
    steps: p.steps ?? null,
    knownBMR: p.knownBMR ?? null,
    bodyFatPct: p.bodyFatPct ?? null,
    goal: p.goal,
    pace: p.goal === 'maintain' ? null : (p.pace ?? null),
    targetWeightKg: p.targetWeightKg ?? null,
    tdee: null,
  };
  state.tdee = computeTDEE(state);
  return state;
}
