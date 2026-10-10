import type { ReactNode } from 'react';
import { Button } from '@/components/Blocks';

// Long-form homepage content below the hero. It's prerendered into
// index.html at build time, so it's what search engines index. Every
// number here mirrors src/lib/calc.ts; update both together.

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-6 text-2xl font-bold tracking-tight text-ink">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-base font-bold text-ink">{children}</h3>;
}

function Prose({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-text">{children}</p>;
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <code className="mt-3 block rounded-md bg-hover-tint px-3 py-2 font-mono text-[0.8125rem] text-ink">{children}</code>
  );
}

const STEPS = [
  { title: 'Tell us about you', body: 'Age, height, weight, sex and how often you train. Already know your TDEE? Skip straight to your goal.' },
  { title: 'Pick a goal and pace', body: 'Cutting, bulking or maintaining, at a mild, moderate or aggressive pace.' },
  { title: 'Get your budget', body: 'A daily calorie target split across your meals, with a macro estimate. Save it or copy it into your tracker.' },
];

const PACES = [
  { pace: 'Mild', cut: '−10%', bulk: '+10%' },
  { pace: 'Moderate', cut: '−20%', bulk: '+20%' },
  { pace: 'Aggressive', cut: '−27.5%', bulk: '+25%' },
];

const MEALS = [
  { meal: 'Breakfast', share: '≈18%' },
  { meal: 'Lunch', share: '25%' },
  { meal: 'Dinner', share: '25%' },
  { meal: 'Snack, pre-workout, post-workout', share: '≈11% each' },
];

const FAQS = [
  {
    q: 'What is TDEE?',
    a: 'TDEE (total daily energy expenditure) is the number of calories you burn in a day, including exercise and everyday movement. Eating at your TDEE maintains your weight; eating below it loses weight, and above it gains weight.',
  },
  {
    q: "What's the difference between BMR and TDEE?",
    a: 'BMR (basal metabolic rate) is what your body burns at complete rest. TDEE is your BMR multiplied by an activity factor that accounts for training and daily movement, so it is always higher.',
  },
  {
    q: 'How accurate is a calorie calculator?',
    a: 'Any formula is an estimate. Treat your number as a starting point: track your weight for two to three weeks, then adjust up or down by 100 to 200 calories if you are not moving in the direction you expect.',
  },
  {
    q: 'Can I use my own TDEE or BMR?',
    a: 'Yes. If you already know your TDEE, choose "Yes, I know my TDEE" at the start. If you know your BMR from a lab test or smart scale, enter it in the optional step and CalBudge will use it instead of a formula.',
  },
  {
    q: 'Can I use CalBudge with MyFitnessPal, MacroFactor or Cal AI?',
    a: 'Yes. On the results screen, choose "Export to app" to copy your calorie and macro targets in a format ready to paste into those apps. You can also download your budget as an image or PDF.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. CalBudge is free and there is no signup. The calculation runs in your browser and your answers are not saved anywhere.',
  },
];

export default function HomeContent({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-20 space-y-20">
      <section aria-labelledby="how-it-works">
        <SectionHeading id="how-it-works">How it works</SectionHeading>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <div className="font-mono text-sm text-hint-text tabular-nums">0{i + 1}</div>
              <div className="mt-1 text-sm font-bold text-ink">{s.title}</div>
              <p className="mt-1 text-sm text-muted-text">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="the-maths">
        <SectionHeading id="the-maths">How CalBudge calculates your calories</SectionHeading>
        <Prose>
          No black box. These are the exact formulas and numbers the calculator uses, so you can check the working.
        </Prose>

        <SubHeading>1. Basal metabolic rate (BMR)</SubHeading>
        <Prose>
          By default, BMR comes from the Mifflin-St Jeor equation, one of the most widely used formulas for estimating
          resting energy needs:
        </Prose>
        <Formula>Men: 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5</Formula>
        <Formula>Women: 10 × weight (kg) + 6.25 × height (cm) − 5 × age − 161</Formula>
        <Prose>
          If you enter your body fat percentage, CalBudge switches to the Katch-McArdle equation, which works from lean
          mass and tends to be more accurate for people who know their body composition:
        </Prose>
        <Formula>370 + 21.6 × lean body mass (kg)</Formula>

        <SubHeading>2. Total daily energy expenditure (TDEE)</SubHeading>
        <Prose>
          Your BMR is multiplied by an activity factor between 1.2 (sedentary) and 1.9 (very active), based on your gym
          and cardio sessions per week. If you add your average daily steps, the factor is nudged up or down slightly to
          match how much you move outside the gym.
        </Prose>

        <SubHeading>3. Your daily target</SubHeading>
        <Prose>To lose or gain weight, your TDEE is adjusted by the pace you choose:</Prose>
        <table className="mt-4 w-full text-left text-[0.9375rem]">
          <thead>
            <tr className="border-b border-line text-xs tracking-wide text-hint-text uppercase">
              <th className="py-2 font-medium">Pace</th>
              <th className="py-2 font-medium">Cutting</th>
              <th className="py-2 font-medium">Bulking</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {PACES.map(p => (
              <tr key={p.pace} className="border-b border-line">
                <td className="py-2 font-medium text-ink">{p.pace}</td>
                <td className="py-2 text-muted-text">{p.cut}</td>
                <td className="py-2 text-muted-text">{p.bulk}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Prose>
          For safety, a cut never goes below 1.2 × your BMR, and no target ever goes below 1,200 calories a day. If your
          chosen pace would cross that line, CalBudge raises your target and tells you.
        </Prose>

        <SubHeading>4. Macros</SubHeading>
        <Prose>
          If you give your bodyweight, CalBudge estimates a macro split: protein at 1.8 g per kg of bodyweight, fat at 25%
          of your calories, and carbohydrates making up the rest.
        </Prose>

        <SubHeading>5. Meal-by-meal split</SubHeading>
        <Prose>Your daily target is divided across six eating occasions:</Prose>
        <table className="mt-4 w-full text-left text-[0.9375rem]">
          <tbody className="tabular-nums">
            {MEALS.map(m => (
              <tr key={m.meal} className="border-b border-line">
                <td className="py-2 font-medium text-ink">{m.meal}</td>
                <td className="py-2 text-right text-muted-text">{m.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Prose>
          Skip a meal you don't eat and its calories are spread across the others in proportion to their size.
        </Prose>

        <SubHeading>6. Time to your target weight</SubHeading>
        <Prose>
          If you set a target weight, CalBudge estimates the timeline using roughly 7,700 calories per kilogram of body
          weight. Real progress varies with water weight, adherence and metabolic adaptation, so treat it as a rough guide.
        </Prose>
      </section>

      <section aria-labelledby="faq">
        <SectionHeading id="faq">Frequently asked questions</SectionHeading>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {FAQS.map(f => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-hint-text transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-text">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-line pt-10">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Ready to find your number?</h2>
        <Prose>It takes about a minute. Free, no signup.</Prose>
        <Button className="mt-6" onClick={onStart}>
          Calculate my budget
        </Button>
      </section>
    </div>
  );
}
