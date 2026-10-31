// Tests for the coaches' bulk calculator (src/lib/bulk.ts, src/lib/bulkReport.ts).
// Run: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  MAX_ROWS,
  TEMPLATE_CSV,
  decodeFileBytes,
  nameSupport,
  parseCsv,
  parseNumber,
  processCsv,
  resultsToCsv,
} from '@/lib/bulk'
import { buildBulkReport } from '@/lib/bulkReport'
import {
  BOUNDS,
  computeBMR,
  computeGoalEstimateWeeks,
  computeMacroSplit,
  computeMealSplit,
  computeTDEE,
  computeTarget,
  inToCm,
  lbToKg,
} from '@/lib/calc'

const HEADER = 'name,sex,age,height_cm,weight_kg,gym_per_week,cardio_per_week,goal,pace'
const row = (s) => processCsv(`${HEADER}\n${s}`)
const one = (s) => {
  const out = row(s)
  assert.equal(out.fatal, null, out.fatal)
  assert.deepEqual(out.errors, [], JSON.stringify(out.errors))
  return out.results[0]
}

// ---- Decoding ----

test('decodes UTF-8, UTF-8 with BOM, UTF-16LE and Windows-1252', () => {
  const utf8 = new TextEncoder().encode('name\nJosé')
  assert.equal(decodeFileBytes(utf8).text, 'name\nJosé')
  assert.equal(decodeFileBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...utf8])).text.replace(/^﻿/, ''), 'name\nJosé')
  const utf16 = new Uint8Array([0xff, 0xfe, ...[...'name\tJosé'].flatMap(c => [c.charCodeAt(0), 0])])
  assert.equal(decodeFileBytes(utf16).text, 'name\tJosé')
  const cp1252 = new Uint8Array([...Buffer.from('name\nJos'), 0xe9, 0x20, 0x80])
  assert.equal(decodeFileBytes(cp1252).text, 'name\nJosé €')
})

test('rejects Excel / Numbers files with a fixable message', () => {
  for (const sig of [[0x50, 0x4b, 0x03, 0x04], [0xd0, 0xcf, 0x11, 0xe0]]) {
    const out = decodeFileBytes(new Uint8Array([...sig, 1, 2, 3]))
    assert.match(out.error, /Excel or Numbers file/)
  }
})

// ---- CSV parsing ----

test('parses quoted fields, escaped quotes, line breaks and CRLF', () => {
  const { records } = parseCsv('a,b,c\r\n"x, y","say ""hi""","line1\nline2"\r\n')
  assert.deepEqual(records[1].cells, ['x, y', 'say "hi"', 'line1\nline2'])
})

test('detects comma, semicolon and tab separators', () => {
  assert.equal(parseCsv('a,b,c\n1,2,3').separator, ',')
  assert.equal(parseCsv('a;b;c\n1;2;3').separator, ';')
  assert.equal(parseCsv('a\tb\tc\n1\t2\t3').separator, '\t')
})

test('row numbers match the spreadsheet even with blank rows and multi-line cells', () => {
  const csv = `${HEADER}\nA,male,30,180,80,4,2,cut,mild\n\n,,,,,,,,\n"B\nB",male,9,180,80,4,2,cut,mild\nC,male,30,180,80,4,2,cut,nope\n`
  const out = processCsv(csv)
  assert.deepEqual(out.results.map(r => r.row), [2])
  assert.deepEqual(out.errors.map(e => e.row), [5, 6])
  assert.equal(out.errors[0].name, 'B B', 'line breaks in names are collapsed')
})

test('strips BOM and ignores trailing blank lines', () => {
  const out = processCsv(`﻿${HEADER}\nA,male,30,180,80,4,2,cut,mild\n\n\n`)
  assert.equal(out.results.length, 1)
})

// ---- Columns ----

test('accepts common header spellings', () => {
  const out = processCsv(
    'Client Name,Gender,Age,Height (cm),Weight (kg),Gym sessions per week,Cardio,Goal,Pace,Body fat %,Steps per day\nA,M,30,180,80,4,2,Cut,Mild,20,8000',
  )
  assert.equal(out.fatal, null)
  assert.equal(out.results.length, 1)
  assert.match(out.results[0].inputsSummary, /20% body fat/)
  assert.match(out.results[0].inputsSummary, /8000 steps/)
})

test('reports missing columns once, not on every row', () => {
  const out = processCsv('name,sex,age,height_cm,weight_kg,gym_per_week\nA,male,30,180,80,4')
  assert.match(out.fatal, /Missing columns: goal, cardio_per_week/)
})

test('a tdee column makes body-measurement columns optional', () => {
  const out = processCsv('name,goal,pace,tdee\nA,cut,mild,2500')
  assert.equal(out.fatal, null)
  assert.equal(out.results[0].targetKcal, 2250)
})

test('warns about unknown columns but still processes', () => {
  const out = processCsv(`${HEADER},wieght_kg,notes\nA,male,30,180,80,4,2,cut,mild,90,likes oats`)
  assert.equal(out.results.length, 1)
  assert.match(out.warnings[0], /"wieght_kg", "notes"/)
})

test('fatal errors for empty, header-only and over-limit files', () => {
  assert.match(processCsv('').fatal, /no client rows/)
  assert.match(processCsv(HEADER).fatal, /no client rows/)
  const many = (n) => `${HEADER}\n` + Array.from({ length: n }, (_, i) => `C${i},male,30,180,80,4,2,cut,mild`).join('\n')
  assert.equal(processCsv(many(MAX_ROWS)).results.length, MAX_ROWS)
  assert.match(processCsv(many(MAX_ROWS + 1)).fatal, /limit is 1000/)
})

// ---- Numbers ----

test('reads numbers the way people type them', () => {
  const kg = BOUNDS.weightKg
  const steps = BOUNDS.steps
  const cases = [
    ['80', ',', kg, 'kg', 80],
    ['80.5', ',', kg, 'kg', 80.5],
    ['80,5', ';', kg, 'kg', 80.5],
    ['80kg', ',', kg, 'kg', 80],
    ['80 KG', ',', kg, 'kg', 80],
    ['9,000', ',', steps, 'steps', 9000],
    ['9.000', ';', steps, 'steps', 9000],
    ['9 000', ',', steps, 'steps', 9000],
    ['12,500 steps', ',', steps, 'steps', 12500],
    ['1.234,5', ';', BOUNDS.tdee, 'kcal', 1234.5],
    ['1,234.5', ',', BOUNDS.tdee, 'kcal', 1234.5],
    ['2,500', ';', BOUNDS.tdee, 'kcal', 2500], // 2.5 is out of range, so thousands
    ['70"', ',', BOUNDS.heightIn, 'in', 70],
  ]
  for (const [raw, sep, bounds, unit, want] of cases) {
    assert.deepEqual(parseNumber(raw, sep, bounds, unit), { value: want }, raw)
  }
})

test('rejects wrong units, text and out-of-range values with clear reasons', () => {
  assert.match(parseNumber('176lb', ',', BOUNDS.weightKg, 'kg').error, /is in lb but this column is kg/)
  assert.match(parseNumber('thirty', ',', BOUNDS.age, 'y').error, /isn't a number/)
  assert.match(parseNumber('80 stone', ',', BOUNDS.weightKg, 'kg').error, /unrecognised text "stone"/)
  assert.match(parseNumber('-80', ',', BOUNDS.weightKg, 'kg').error, /between 30 and 300/)
  assert.match(parseNumber('1e3', ',', BOUNDS.weightKg, 'kg').error, /unrecognised|isn't/)
})

// ---- Row validation ----

test('explains every problem in a bad row', () => {
  const out = row('Bad,robot,9,99,25,20,2,shred,')
  const problems = out.errors[0].problems.join(' | ')
  for (const want of ['goal must be cut, bulk or maintain (got "shred")', 'sex must be male or female (got "robot")', 'age must be between 13 and 100', 'height_cm must be between 100 and 250', 'weight_kg must be between 30 and 300', 'gym_per_week must be between 0 and 14']) {
    assert.ok(problems.includes(want), `missing "${want}" in: ${problems}`)
  }
})

test('pace is required except for maintain, and ignored for maintain', () => {
  assert.match(row('A,male,30,180,80,4,2,cut,').errors[0].problems[0], /pace is missing/)
  assert.equal(one('A,male,30,180,80,4,2,maintain,aggressive').pace, null)
})

test('accepts goal, pace and sex synonyms', () => {
  const out = processCsv(`${HEADER}\nA,F,30,165,60,3,1,Fat loss,slow\nB,Woman,30,165,60,3,1,lose weight,Fast\nC,m,30,180,80,4,2,Muscle gain,medium\nD,MALE,30,180,80,4,2,Maintenance,`)
  assert.deepEqual(out.errors, [])
  assert.deepEqual(out.results.map(r => [r.goal, r.pace]), [['cut', 'mild'], ['cut', 'aggressive'], ['bulk', 'moderate'], ['maintain', null]])
})

test('each row may use kg/cm or lb/in, but not both for one measurement', () => {
  const out = processCsv('name,sex,age,height_cm,height_in,weight_kg,weight_lb,gym_per_week,cardio_per_week,goal,pace\nM,male,30,180,,80,,4,2,cut,mild\nI,male,30,,70.866,,176.37,4,2,cut,mild\nX,male,30,180,70,80,,4,2,cut,mild')
  assert.equal(out.results.length, 2)
  assert.ok(Math.abs(out.results[0].targetKcal - out.results[1].targetKcal) <= 1, 'same person in either unit')
  assert.match(out.errors[0].problems[0], /only one of height_cm or height_in/)
})

test('blank names fall back to the row number', () => {
  assert.equal(one(',male,30,180,80,4,2,cut,mild').name, 'Row 2')
})

// ---- Calculations ----

test('hand-checked results', () => {
  // Mifflin-St Jeor, male: 10*80 + 6.25*180 - 5*30 + 5 = 1780; score 4+1.5 -> 1.55
  const a = one('A,male,30,180,80,4,2,cut,moderate')
  assert.equal(a.bmrKcal, 1780)
  assert.equal(a.tdeeKcal, 2759)
  assert.equal(a.targetKcal, 2207)
  assert.deepEqual([a.macros.proteinG, a.macros.fatG, a.macros.carbsG], [144, 61, 270])
  // Female: 10*60 + 6.25*165 - 5*26 - 161 = 1340.25
  assert.equal(one('B,female,26,165,60,3,1,maintain,').bmrKcal, 1340)
  // Katch-McArdle: 370 + 21.6 * 60 * 0.76 = 1354.96
  const k = processCsv(`${HEADER},body_fat_pct\nK,female,26,165,60,3,1,bulk,mild,24`).results[0]
  assert.equal(k.bmrKcal, 1355)
  assert.equal(k.targetKcal, 2184)
  // Known BMR overrides formulas
  assert.equal(processCsv(`${HEADER},bmr\nB,male,30,180,80,0,0,maintain,,2000`).results[0].tdeeKcal, 2400)
  // Timeline: 6 kg * 7700 / (2759 * 0.2 * 7) = 11.96 weeks
  assert.equal(processCsv(`${HEADER},target_weight_kg\nT,male,30,180,80,4,2,cut,moderate,74`).results[0].weeksToTarget, 12)
  // A target raised to the 1.2 x BMR floor gives a smaller real deficit:
  // TDEE 2607.7, floor 2136, so 8 kg * 7700 / (471.7 * 7) = 18.66 weeks
  // (the -27.5% pace alone would have claimed about 12).
  assert.equal(processCsv(`${HEADER},target_weight_kg\nF,male,30,180,80,4,0,cut,aggressive,72`).results[0].weeksToTarget, 19)
  // A cut raised to 1,200 kcal sits above this client's TDEE (1,142): no timeline.
  assert.equal(processCsv(`${HEADER},target_weight_kg\nTiny,female,55,150,45,0,0,cut,aggressive,40`).results[0].weeksToTarget, null)
})

test('safety limits are applied and flagged', () => {
  const low = one('Tiny,female,55,150,45,0,0,cut,aggressive')
  assert.equal(low.targetKcal, 1200)
  assert.equal(low.note, 'Raised to a safe minimum')
  const tdeeLow = processCsv('name,goal,pace,tdee\nT,cut,aggressive,1300').results[0]
  assert.equal(tdeeLow.targetKcal, 1200)
})

test('TDEE-only rows: no BMR, macros only with bodyweight', () => {
  const out = processCsv('name,goal,pace,tdee,weight_kg\nA,cut,mild,2500,72\nB,maintain,,2600,')
  assert.equal(out.results[0].bmrKcal, null)
  assert.equal(out.results[0].macros.proteinG, 130)
  assert.equal(out.results[1].macros, null)
  assert.equal(out.results[1].note, 'No bodyweight, so no macros')
})

test('500 random clients match the single-person calculator exactly', () => {
  let seed = 42
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const between = (b, dp = 0) => Number((b.min + rand() * (b.max - b.min)).toFixed(dp))
  const lines = []
  const states = []
  for (let i = 0; i < 500; i++) {
    const imperial = rand() < 0.3
    const s = {
      unitSystem: imperial ? 'imperial' : 'metric',
      knowsTDEE: false, tdeeInput: null,
      sex: pick(['male', 'female']), age: between(BOUNDS.age),
      gymFreq: between(BOUNDS.sessionsPerWeek), cardioFreq: between(BOUNDS.sessionsPerWeek),
      steps: rand() < 0.5 ? between(BOUNDS.steps) : null,
      knownBMR: rand() < 0.1 ? between(BOUNDS.knownBmr) : null,
      bodyFatPct: rand() < 0.3 ? between({ min: 8, max: 45 }, 1) : null,
      goal: pick(['cut', 'bulk', 'maintain']), pace: null, targetWeightKg: null, tdee: null,
    }
    s.pace = s.goal === 'maintain' ? null : pick(['mild', 'moderate', 'aggressive'])
    const h = imperial ? between(BOUNDS.heightIn, 1) : between(BOUNDS.heightCm, 1)
    const w = imperial ? between(BOUNDS.weightLb, 1) : between(BOUNDS.weightKg, 1)
    const tw = rand() < 0.5 ? (imperial ? between(BOUNDS.weightLb, 1) : between(BOUNDS.weightKg, 1)) : null
    s.heightCm = imperial ? inToCm(h) : h
    s.weightKg = imperial ? lbToKg(w) : w
    s.targetWeightKg = tw == null ? null : imperial ? lbToKg(tw) : tw
    states.push(s)
    lines.push([`C${i}`, s.sex, s.age, imperial ? '' : h, imperial ? h : '', imperial ? '' : w, imperial ? w : '', s.gymFreq, s.cardioFreq, s.goal, s.pace ?? '', s.steps ?? '', s.bodyFatPct ?? '', s.knownBMR ?? '', imperial ? '' : tw ?? '', imperial ? tw ?? '' : ''].join(','))
  }
  const out = processCsv('name,sex,age,height_cm,height_in,weight_kg,weight_lb,gym_per_week,cardio_per_week,goal,pace,steps,body_fat_pct,bmr,target_weight_kg,target_weight_lb\n' + lines.join('\n'))
  assert.deepEqual(out.errors, [])
  assert.equal(out.results.length, 500)
  out.results.forEach((r, i) => {
    const s = { ...states[i] }
    s.tdee = computeTDEE(s)
    const { target } = computeTarget(s)
    const X = Math.round(target)
    const weeks = computeGoalEstimateWeeks(s, target)
    assert.equal(r.targetKcal, X, `client ${i} target`)
    assert.equal(r.tdeeKcal, Math.round(s.tdee), `client ${i} tdee`)
    assert.equal(r.bmrKcal, Math.round(computeBMR(s)), `client ${i} bmr`)
    assert.deepEqual(r.macros, computeMacroSplit(s.weightKg, X), `client ${i} macros`)
    assert.deepEqual(r.meals, computeMealSplit(X), `client ${i} meals`)
    assert.equal(r.weeksToTarget, weeks != null && weeks > 0 ? Math.round(weeks) : null, `client ${i} weeks`)
  })
})

// ---- Output ----

test('the template processes cleanly', () => {
  const out = processCsv(TEMPLATE_CSV)
  assert.equal(out.fatal, null)
  assert.deepEqual(out.errors, [])
  assert.deepEqual(out.warnings, [])
  assert.equal(out.results.length, 3)
})

test('results CSV round-trips and blocks spreadsheet formulas', () => {
  const out = processCsv(`${HEADER}\n"Smith, ""JJ"" Jamie",male,30,180,80,4,2,cut,mild\n=HYPERLINK(1),male,30,180,80,4,2,cut,mild\n@SUM,male,30,180,80,4,2,cut,mild\nZoë,female,30,165,60,3,1,maintain,`)
  for (const sep of [',', ';', '\t']) {
    const csv = resultsToCsv(out.results, sep)
    const back = parseCsv(csv)
    assert.equal(back.separator, sep)
    assert.deepEqual(back.records.slice(1).map(r => r.cells[0]), ['Smith, "JJ" Jamie', "'=HYPERLINK(1)", "'@SUM", 'Zoë'])
    assert.equal(back.records[1].cells[2], String(out.results[0].targetKcal))
    assert.ok(back.records.every(r => r.cells.length === back.records[0].cells.length), 'every row has every column')
  }
})

// ---- PDF ----

test('PDF: summary page plus one page per client; long lists continue with headings', () => {
  const small = processCsv(TEMPLATE_CSV).results
  assert.equal(buildBulkReport(small).getNumberOfPages(), 1 + small.length)

  const many = processCsv(`${HEADER}\n` + Array.from({ length: 80 }, (_, i) => `Client ${i},male,30,180,80,4,2,cut,mild`).join('\n')).results
  const pdf = buildBulkReport(many)
  const text = pdf.output()
  const summaryPages = pdf.getNumberOfPages() - 80
  assert.ok(summaryPages >= 2, 'an 80-client summary spills onto a second page')
  assert.equal(text.split('(TARGET KCAL)').length - 1, summaryPages, 'column headings repeat on each summary page')
  for (const name of ['Client 0', 'Client 79']) assert.ok(text.includes(`(${name})`), name)
})

test('PDF: names it cannot print fall back to the row number', () => {
  assert.equal(nameSupport('José Müller'), 'builtin')
  assert.equal(nameSupport('Łukasz'), 'needs-font')
  assert.equal(nameSupport('Дмитрий'), 'needs-font')
  assert.equal(nameSupport('Nguyễn'), 'needs-font')
  assert.equal(nameSupport('李雷'), 'unsupported')
  assert.equal(nameSupport('محمد'), 'unsupported')
  const results = processCsv(`${HEADER}\nJosé,male,30,180,80,4,2,cut,mild\nŁukasz,male,30,180,80,4,2,cut,mild\n李雷,male,30,180,80,4,2,cut,mild`).results
  const text = buildBulkReport(results).output()
  assert.ok(text.includes('(Jos\\351)') || text.includes('(José)'), 'Latin-1 names print with the built-in font')
  assert.ok(text.includes('(Client \\(row 3\\))'), 'needs-font name falls back when fonts are not supplied')
  assert.ok(text.includes('(Client \\(row 4\\))'), 'unsupported name falls back')
})

test('PDF: with the bundled font, extended-Latin, Greek and Cyrillic names print', () => {
  const font = (f) => fs.readFileSync(new URL(`../public/fonts/${f}`, import.meta.url)).toString('base64')
  const results = processCsv(`${HEADER}\nŁukasz,male,30,180,80,4,2,cut,mild\nΓιώργος,male,30,180,80,4,2,cut,mild\n李雷,male,30,180,80,4,2,cut,mild`).results
  const pdf = buildBulkReport(results, { regular: font('NotoSans-Regular.ttf'), bold: font('NotoSans-Bold.ttf') })
  const text = pdf.output()
  assert.equal(pdf.getNumberOfPages(), 4)
  assert.ok(!text.includes('(Client \\(row 2\\))') && !text.includes('(Client \\(row 3\\))'), 'printable names are not replaced')
  assert.ok(text.includes('NotoSans'), 'font embedded')
})

test('PDF: 1,000 clients build in reasonable time and size', () => {
  const results = processCsv(`${HEADER}\n` + Array.from({ length: 1000 }, (_, i) => `Client ${i},male,30,180,80,4,2,cut,mild`).join('\n')).results
  const t = performance.now()
  const bytes = buildBulkReport(results).output('arraybuffer').byteLength
  const ms = performance.now() - t
  assert.ok(ms < 15000, `took ${Math.round(ms)} ms`)
  assert.ok(bytes < 15_000_000, `${Math.round(bytes / 1e6)} MB`)
  console.log(`    1,000-client PDF: ${Math.round(ms)} ms, ${(bytes / 1e6).toFixed(1)} MB`)
})
