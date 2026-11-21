import type { Article } from '@/lib/articles';
import { computeMacroSplit, computeMealSplit, redistributeMealSplit } from '@/lib/calc';

// "Macros for N calories" pages. Every number is computed from calc.ts, the
// same code as the calculator, so the pages can never drift from the tool.
// Keep the list short: a page per common target, not one per number.

export const CALORIE_TARGETS = [1500, 1800, 2000, 2200, 2500, 3000];
const WEIGHTS = [55, 65, 75, 85, 95];
const REF_WEIGHT = 70;
const SNACKS = ['Snack', 'Pre-workout', 'Post-workout'];

const n = (x: number) => x.toLocaleString('en-US');
export const caloriesSlug = (kcal: number) => `macros-for-${kcal}-calories`;

function page(kcal: number, i: number): Article {
  const ref = computeMacroSplit(REF_WEIGHT, kcal);
  const six = computeMealSplit(kcal);
  const four = redistributeMealSplit(six, ['Pre-workout', 'Post-workout']);
  const three = redistributeMealSplit(six, SNACKS);
  const kcalOf = (rows: { name: string; kcal: number }[], name: string) => rows.find(r => r.name === name)?.kcal ?? 0;
  const neighbours = [CALORIE_TARGETS[i - 1], CALORIE_TARGETS[i + 1]].filter(Boolean).map(caloriesSlug);
  const k = n(kcal);
  const tdee20 = Math.round(kcal / 0.8 / 10) * 10;
  const lossPerWeek = (Math.round(((tdee20 - kcal) * 7) / 7700 * 20) / 20).toFixed(2).replace(/0$/, '');
  return {
    slug: caloriesSlug(kcal),
    linkLabel: `Macros for ${k} calories`,
    title: `Macros for ${k} Calories: Protein, Carbs & Fat | CalBudge`,
    description: `How to split ${k} calories a day into protein, carbs and fat, for your bodyweight, and how to divide ${k} calories into meals. Worked numbers, free calculator.`,
    h1: `Macros for ${k} calories a day`,
    dek: `Protein, carbohydrate and fat targets for a ${k}-calorie day at different bodyweights, and how to split it into three to six meals.`,
    ogTitle: `Macros for ${k} calories`,
    ogSubtitle: 'Protein, carbs and fat, meal by meal',
    published: '2026-11-21',
    readMinutes: 3,
    shortAnswer: `On ${k} calories a day, a good starting split for a 70 kg person is about ${ref.proteinG} g protein, ${ref.carbsG} g carbohydrates and ${ref.fatG} g fat: protein at 1.8 g per kg of bodyweight, fat at 25% of calories, and carbohydrates for the rest. Protein depends on your weight, so check your row in the table below.`,
    body: [
      { h2: `${k} calories: macros by bodyweight` },
      {
        p: 'Protein is set from bodyweight (1.8 g per kg, within the 1.6 to 2.2 g/kg range recommended for people who train), fat is 25% of calories, and carbohydrates fill the rest. Fat stays the same at every weight because it follows calories, not weight.',
      },
      {
        table: {
          columns: ['Bodyweight', 'Protein', 'Carbs', 'Fat'],
          rows: WEIGHTS.map(w => {
            const m = computeMacroSplit(w, kcal);
            return [`${w} kg (${Math.round(w * 2.20462)} lb)`, `${m.proteinG} g`, `${m.carbsG} g`, `${m.fatG} g`];
          }),
          caption: `Each row adds up to about ${k} calories (protein and carbohydrates 4 kcal per gram, fat 9).`,
        },
      },
      { h2: `How to split ${k} calories into meals` },
      {
        table: {
          columns: ['Meals', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'],
          rows: [
            ['3, no snacks', n(kcalOf(three, 'Breakfast')), n(kcalOf(three, 'Lunch')), n(kcalOf(three, 'Dinner')), '–'],
            ['4, one snack', n(kcalOf(four, 'Breakfast')), n(kcalOf(four, 'Lunch')), n(kcalOf(four, 'Dinner')), n(kcalOf(four, 'Snack'))],
            ['6, snack plus food around training', n(kcalOf(six, 'Breakfast')), n(kcalOf(six, 'Lunch')), n(kcalOf(six, 'Dinner')), `3 × ${n(kcalOf(six, 'Snack'))}`],
          ],
          caption: 'Calories per meal, rounded to the nearest 5. Split your macros in the same proportions.',
        },
      },
      {
        p: `The [meal calorie calculator](/meal-calorie-calculator) does this for your own target, with protein, carbs and fat for every meal. More on choosing a split in [how to split calories across meals](/guides/how-to-split-calories-across-meals).`,
      },
      { h2: `Is ${k} calories right for you?` },
      {
        p: `It depends on your maintenance calories (TDEE). ${k} calories is a deficit for someone whose maintenance is higher, maintenance for someone who burns about ${k} a day, and a surplus for someone smaller or less active. Work out your own with the [TDEE calculator](/tdee-calculator), then aim 10 to 20% below it to lose weight or about 10% above it to build muscle.`,
      },
      {
        tip: `Whatever your target, keep a weight-loss target above 1.2 times your BMR and above 1,200 calories a day. CalBudge applies both limits automatically.`,
      },
    ],
    faqs: [
      {
        q: `How much protein should I eat on ${k} calories?`,
        a: `Base it on your bodyweight rather than your calories: about 1.6 to 2.2 g per kg. At 1.8 g/kg that is ${computeMacroSplit(60, kcal).proteinG} g for a 60 kg person and ${computeMacroSplit(80, kcal).proteinG} g at 80 kg.`,
      },
      {
        q: `Is ${k} calories enough to lose weight?`,
        a: `Only if it is below your maintenance. If your TDEE is around ${n(tdee20)}, ${k} calories is a 20% deficit of about ${n(tdee20 - kcal)} calories a day, which loses roughly ${lossPerWeek} kg a week. Check your weekly average weight after two to three weeks and adjust by 100 to 200 calories.`,
      },
      {
        q: `What is a good macro split for ${k} calories?`,
        a: `A protein-first split: protein from bodyweight, fat at 20 to 35% of calories, carbohydrates for the rest. For a 70 kg person on ${k} calories, that is about ${ref.proteinG} g protein, ${ref.carbsG} g carbs and ${ref.fatG} g fat.`,
      },
    ],
    calculator: { path: '/macro-calculator', label: 'Calculate my macros' },
    related: [...neighbours, 'how-much-protein-per-day'],
    sources: ['jager2017', 'iom2005', 'schoenfeld2018'],
    series: 'calories',
  };
}

export const CALORIE_PAGES: Article[] = CALORIE_TARGETS.map(page);
