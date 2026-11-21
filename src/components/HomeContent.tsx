import type { ReactNode } from 'react';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { Button } from '@/components/Blocks';
import LivePreview from '@/components/LivePreview';
import RichText from '@/components/RichText';
import { AccentHeading, Container, Eyebrow, SectionHeading, revealDelay } from '@/components/Section';
import { computeMacroSplit, computeMealSplit } from '@/lib/calc';
import { articlePath, guidesFor } from '@/lib/articles';
import { type LandingPage, PAGES, isCalculatorPage } from '@/lib/pages';
import { cn } from '@/lib/utils';

// Tracker names link to the matching comparison page.
const EXPORT_CHIPS: { label: string; href?: string }[] = [
  { label: 'MyFitnessPal', href: '/guides/calbudge-vs-myfitnesspal' },
  { label: 'MacroFactor', href: '/guides/calbudge-vs-macrofactor' },
  { label: 'Cal AI' },
  { label: 'Image' },
  { label: 'PDF' },
  { label: 'Share link' },
];


// Everything on a calculator page before the wizard starts. It's prerendered
// at build time, so it's what search engines index. The homepage gets the full
// method and FAQ; landing pages get their own worked example and FAQ (from
// pages.ts) and link back here for the method, so they don't read as
// near-duplicates. Every number here mirrors src/lib/calc.ts; update both together.

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-xl font-bold tracking-tight text-paper">{children}</h3>;
}

function Prose({ children, onInk = false }: { children: ReactNode; onInk?: boolean }) {
  return <p className={cn('mt-3 text-base leading-relaxed', onInk ? 'text-onink-text' : 'text-muted-text')}>{children}</p>;
}

// Small link beside a method heading.
function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
      {children}
    </a>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return <code className="mt-3 block rounded-lg bg-ink-deep px-4 py-3 font-mono text-[0.8125rem] text-paper">{children}</code>;
}

const FACTS = [
  { value: '1 min', label: 'to your daily number' },
  { value: '6', label: 'eating occasions in your split' },
  { value: '2', label: 'published BMR equations' },
  { value: '0', label: 'accounts, sign-ups or ads' },
];

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

// Fair to the alternatives on purpose, including the row trackers win.
const COMPARE: { row: string; us: string | boolean; calculators: string | boolean; trackers: string | boolean }[] = [
  { row: 'Daily calorie target', us: true, calculators: true, trackers: true },
  { row: 'Target split meal by meal', us: true, calculators: 'Rarely', trackers: 'You plan it' },
  { row: 'Counts your sessions and steps', us: true, calculators: 'One activity level', trackers: 'Varies' },
  { row: 'Formulas shown in full', us: true, calculators: 'Sometimes', trackers: 'Rarely' },
  { row: 'No account needed', us: true, calculators: true, trackers: false },
  { row: 'Logs the food you eat each day', us: false, calculators: false, trackers: true },
  { row: 'Bulk client reports for coaches', us: true, calculators: false, trackers: false },
];

function CompareCell({ value, highlight = false }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) return <Check aria-label="Yes" className={cn('mx-auto h-5 w-5', highlight ? 'text-gold-ink' : 'text-ink')} />;
  if (value === false) return <Minus aria-label="No" className="mx-auto h-5 w-5 text-disabled" />;
  return <span className="text-sm text-muted-text">{value}</span>;
}

function Hero({ page, onStart }: { page: LandingPage; onStart: () => void }) {
  return (
    <section className="ledger-lines mt-3 mx-3 rounded-[28px] sm:mx-6 bg-ink pt-14 pb-44 text-center sm:pt-20">
      <Container className="relative">
        <div className="animate-block-in mx-auto inline-flex items-center gap-2 rounded-full border border-line-onink px-4 py-1.5 text-[0.8125rem] font-medium text-onink-text">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          Free. No signup. Runs in your browser.
        </div>
        <h1 className="animate-block-in mx-auto mt-6 max-w-4xl font-display text-[2.75rem] leading-[1.04] font-bold tracking-[-0.03em] text-balance text-paper sm:text-7xl">
          <AccentHeading text={page.h1} accent={page.h1Accent} />
        </h1>
        <p className="animate-block-in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-onink-text">{page.intro}</p>
        <div className="animate-block-in mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button variant="gold" className="flex items-center gap-2 px-7 py-3.5 text-base" onClick={onStart}>
            {page.cta}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
          <a
            href={page.example ? '#example' : '#the-maths'}
            className="rounded-full bg-white/10 px-7 py-3.5 text-base font-medium text-paper ring-1 ring-white/15 transition-colors duration-150 hover:bg-white/20"
          >
            {page.example ? 'See a worked example' : 'See how it’s calculated'}
          </a>
        </div>
      </Container>
    </section>
  );
}

function Facts() {
  return (
    <Container className="mt-16">
      <dl className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
        {FACTS.map((f, i) => (
          <div key={f.label} data-reveal style={revealDelay(i)} className="border-l-2 border-accent pl-5">
            <dd className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{f.value}</dd>
            <dt className="mt-1 text-sm font-medium text-muted-text">{f.label}</dt>
          </div>
        ))}
      </dl>
    </Container>
  );
}

function PageSections({ page }: { page: LandingPage }) {
  return (
    <Container className="mt-20 sm:mt-28">
      <div className="divide-y divide-line border-y border-line">
        {page.sections.map(sec => (
          <section key={sec.heading} className="grid gap-4 py-10 md:grid-cols-[1fr_1.6fr] md:gap-12" data-reveal>
            <h2 className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-ink">{sec.heading}</h2>
            <div>
              {sec.paragraphs.map(para => (
                <p key={para.slice(0, 40)} className="mt-3 text-base leading-relaxed text-muted-text first:mt-0">
                  <RichText text={para} />
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}

function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="mt-24 sm:mt-32">
      <Container>
        <SectionHeading id="how-it-works" eyebrow="How it works">
          Three steps, one number
        </SectionHeading>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={revealDelay(i)} className="border-t-2 border-ink pt-5">
              <div aria-hidden="true" className="font-display text-7xl leading-none font-bold tracking-tight text-accent tabular-nums">{i + 1}</div>
              <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-ink">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-text">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Features() {
  // Sample figures from the same 2,207 kcal plan as the hero's moderate cut.
  const meals = computeMealSplit(2207);
  const macros = computeMacroSplit(80, 2207);
  const largest = Math.max(...meals.map(m => m.kcal));
  const card = 'min-w-0 rounded-2xl bg-card p-7 shadow-ring';
  return (
    <section aria-labelledby="features" className="mt-24 sm:mt-32">
      <Container>
        <SectionHeading id="features" eyebrow="What you get">
          More than a number on a screen
        </SectionHeading>
        <div className="mt-12 grid gap-4 md:grid-cols-6">
          <div data-reveal className={cn(card, 'md:col-span-4')}>
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">A budget you can actually eat to</h3>
            <p className="mt-2 max-w-md text-base text-muted-text">
              Your target is divided across meals, snacks and workout fuel. Skip one and its calories move to the others.
            </p>
            <div className="mt-7 flex h-36 items-end gap-2 sm:gap-3">
              {meals.map(m => (
                <div key={m.name} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
                  <div className="text-xs font-bold text-ink tabular-nums">{m.kcal}</div>
                  <div className="mt-1 rounded-t-md bg-ink" style={{ height: `${(m.kcal / largest) * 70}%` }} />
                  <div className="mt-2 truncate text-[0.6875rem] font-medium text-muted-text">{m.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal style={revealDelay(1)} className={cn(card, 'flex flex-col border-ink bg-ink md:col-span-2')}>
            <h3 className="font-display text-xl font-bold tracking-tight text-paper">Take it with you</h3>
            <p className="mt-2 text-base text-onink-text">Copy your targets into your tracker, or save your plan.</p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-6 text-sm font-medium text-paper">
              {EXPORT_CHIPS.map(item => (
                <li key={item.label} className="rounded-full border border-line-onink px-3 py-1">
                  {item.href ? (
                    <a href={item.href} className="underline-offset-2 hover:underline">{item.label}</a>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ul>
            <a href="/guides/best-free-calorie-and-macro-calculators" className="mt-4 text-sm text-onink-text underline underline-offset-2 hover:text-paper">
              Using a tracker already? See how CalBudge compares
            </a>
          </div>

          <div data-reveal className={cn(card, 'md:col-span-3')}>
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">Protein set by your bodyweight</h3>
            <p className="mt-2 text-base text-muted-text">
              Protein stays high on a cut or a bulk. Fat follows your calories, and carbs fill the rest.
            </p>
            <div className="mt-6 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
              <div className="bg-ink" style={{ width: `${(macros.proteinKcal / 2207) * 100}%` }} />
              <div className="bg-accent" style={{ width: `${(macros.carbsKcal / 2207) * 100}%` }} />
              <div className="bg-hint-text" style={{ width: `${(macros.fatKcal / 2207) * 100}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-x-3 text-sm font-bold text-ink tabular-nums">
              <span>{macros.proteinG} g protein</span>
              <span>{macros.carbsG} g carbs</span>
              <span>{macros.fatG} g fat</span>
            </div>
          </div>

          <div data-reveal style={revealDelay(1)} className={cn(card, 'md:col-span-3')}>
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">Limits that keep it sensible</h3>
            <p className="mt-2 text-base text-muted-text">
              A cut never goes below 1.2 × your BMR or 1,200 calories. If your pace would cross that line, we raise your
              target and tell you.
            </p>
            <div className="mt-6 flex items-baseline gap-3 border-t border-line pt-4">
              <span className="font-display text-4xl font-bold tracking-tight text-ink">1.2 ×</span>
              <span className="text-sm font-medium text-muted-text">your BMR is the floor on every cut</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Example({ example }: { example: NonNullable<LandingPage['example']> }) {
  return (
    <section aria-labelledby="example" className="ledger-lines mt-24 mx-3 rounded-[28px] sm:mx-6 bg-ink py-20 sm:mt-32 sm:py-28">
      <Container className="relative">
        <SectionHeading id="example" eyebrow="Worked example" onInk className="max-w-3xl">
          {example.heading}
        </SectionHeading>
        <div className="max-w-3xl">
          <Prose onInk>
            <RichText onInk text={example.intro} />
          </Prose>
        </div>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line-onink bg-ink-raised" data-reveal>
          <table className="w-full min-w-[480px] text-left text-base">
            <thead>
              <tr className="border-b border-line-onink text-xs tracking-[0.08em] text-onink-text uppercase">
                {example.columns.map((c, i) => (
                  <th key={c} className={cn('px-6 py-4 font-semibold', i > 0 && 'text-right')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {example.rows.map(row => (
                <tr key={row[0]} className="border-b border-line-onink last:border-b-0">
                  {row.map((cell, i) => (
                    <td key={i} className={cn('px-6 py-4 text-paper', i === 0 ? 'font-semibold' : 'text-right')}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {example.note && (
          <div className="mt-3 max-w-3xl">
            <Prose onInk>
              <RichText onInk text={example.note} />
            </Prose>
          </div>
        )}
      </Container>
    </section>
  );
}

function MethodNote() {
  return (
    <section aria-labelledby="method" className="mt-20 sm:mt-28">
      <Container>
        <div className="grid gap-4 border-l-2 border-accent pl-6 md:grid-cols-[1fr_1.6fr] md:gap-12" data-reveal>
          <h2 id="method" className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-ink">
            Where the numbers come from
          </h2>
          <p className="text-base leading-relaxed text-muted-text">
            Every figure on this page comes from the same formulas the calculator uses: Mifflin-St Jeor or Katch-McArdle
            for BMR, an activity factor from your training and steps, and a target that never drops below 1.2 × your BMR
            or 1,200 calories. See{' '}
            <a href="/#the-maths" className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
              the full method
            </a>{' '}
            for every equation and percentage.
          </p>
        </div>
      </Container>
    </section>
  );
}

function Maths() {
  return (
    <section aria-labelledby="the-maths" className="ledger-lines mt-24 mx-3 rounded-[28px] sm:mx-6 bg-ink py-20 sm:mt-32 sm:py-28">
      <Container className="relative grid gap-12 lg:grid-cols-[1fr_1.7fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="the-maths" eyebrow="The maths" onInk>
            How CalBudge calculates your calories
          </SectionHeading>
          <Prose onInk>
            No black box. These are the exact formulas and numbers the calculator uses, so you can check the working.
          </Prose>
        </div>

        <div className="space-y-10">
          <div data-reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <SubHeading>1. Basal metabolic rate (BMR)</SubHeading>
              <InlineLink href="/bmr-calculator">BMR calculator</InlineLink>
            </div>
            <Prose onInk>
              By default, BMR comes from the Mifflin-St Jeor equation, one of the most widely used formulas for estimating
              resting energy needs:
            </Prose>
            <Formula>Men: 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5</Formula>
            <Formula>Women: 10 × weight (kg) + 6.25 × height (cm) − 5 × age − 161</Formula>
            <Prose onInk>
              If you enter your body fat percentage, CalBudge switches to the Katch-McArdle equation, which works from lean
              mass and tends to be more accurate for people who know their body composition:
            </Prose>
            <Formula>370 + 21.6 × lean body mass (kg)</Formula>
          </div>

          <div data-reveal className="border-t border-line-onink pt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <SubHeading>2. Total daily energy expenditure (TDEE)</SubHeading>
              <InlineLink href="/tdee-calculator">TDEE calculator</InlineLink>
            </div>
            <Prose onInk>
              Your BMR is multiplied by an activity factor between 1.2 (sedentary) and 1.9 (very active), based on your gym
              and cardio sessions per week. If you add your average daily steps, the factor is nudged up or down slightly to
              match how much you move outside the gym.
            </Prose>
          </div>

          <div data-reveal className="border-t border-line-onink pt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <SubHeading>3. Your daily target</SubHeading>
              <span className="flex gap-4">
                <InlineLink href="/calorie-deficit-calculator">Deficit</InlineLink>
                <InlineLink href="/bulking-calculator">Bulking</InlineLink>
              </span>
            </div>
            <Prose onInk>To lose or gain weight, your TDEE is adjusted by the pace you choose:</Prose>
            <table className="mt-4 w-full text-left text-base">
              <thead>
                <tr className="border-b border-line-onink text-xs tracking-[0.08em] text-onink-text uppercase">
                  <th className="py-2 font-semibold">Pace</th>
                  <th className="py-2 font-semibold">Cutting</th>
                  <th className="py-2 font-semibold">Bulking</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {PACES.map(p => (
                  <tr key={p.pace} className="border-b border-line-onink">
                    <td className="py-2.5 font-semibold text-paper">{p.pace}</td>
                    <td className="py-2.5 text-paper">{p.cut}</td>
                    <td className="py-2.5 text-paper">{p.bulk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Prose onInk>
              For safety, a cut never goes below 1.2 × your BMR, and no target ever goes below 1,200 calories a day. If your
              chosen pace would cross that line, CalBudge raises your target and tells you.
            </Prose>
          </div>

          <div data-reveal className="border-t border-line-onink pt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <SubHeading>4. Macros</SubHeading>
              <InlineLink href="/macro-calculator">Macro calculator</InlineLink>
            </div>
            <Prose onInk>
              If you give your bodyweight, CalBudge estimates a macro split: protein at 1.8 g per kg of bodyweight, fat at 25%
              of your calories, and carbohydrates making up the rest.
            </Prose>
          </div>

          <div data-reveal className="border-t border-line-onink pt-10">
            <SubHeading>5. Meal-by-meal split</SubHeading>
            <Prose onInk>Your daily target is divided across six eating occasions:</Prose>
            <table className="mt-4 w-full text-left text-base">
              <tbody className="tabular-nums">
                {MEALS.map(m => (
                  <tr key={m.meal} className="border-b border-line-onink">
                    <td className="py-2.5 font-semibold text-paper">{m.meal}</td>
                    <td className="py-2.5 text-right text-paper">{m.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Prose onInk>Skip a meal you don't eat and its calories are spread across the others in proportion to their size.</Prose>
          </div>

          <div data-reveal className="border-t border-line-onink pt-10">
            <SubHeading>6. Time to your target weight</SubHeading>
            <Prose onInk>
              If you set a target weight, CalBudge estimates the timeline using roughly 7,700 calories per kilogram of body
              weight. Real progress varies with water weight, adherence and metabolic adaptation, so treat it as a rough guide.
            </Prose>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Compare() {
  return (
    <section aria-labelledby="compare" className="mt-24 sm:mt-32">
      <Container>
        <SectionHeading id="compare" eyebrow="How it compares">
          Where CalBudge fits
        </SectionHeading>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line bg-card" data-reveal>
          <table className="w-full min-w-[640px] text-center">
            <thead>
              <tr className="border-b border-line text-sm">
                <th className="px-6 py-5 text-left font-medium text-muted-text">
                  <span className="sr-only">Feature</span>
                </th>
                <th className="bg-ink px-6 py-5 font-display text-base font-bold text-paper">CalBudge</th>
                <th className="px-6 py-5 font-semibold text-ink">Most free calculators</th>
                <th className="px-6 py-5 font-semibold text-ink">Calorie tracking apps</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(r => (
                <tr key={r.row} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-6 py-4 text-left text-base font-medium text-ink">
                    {r.row}
                  </th>
                  <td className="bg-hover-tint/60 px-6 py-4">
                    <CompareCell value={r.us} highlight />
                  </td>
                  <td className="px-6 py-4">
                    <CompareCell value={r.calculators} />
                  </td>
                  <td className="px-6 py-4">
                    <CompareCell value={r.trackers} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-hint-text">Typical features, not a review of any one product. Want to log food too? Copy your targets into a tracker.</p>
      </Container>
    </section>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section aria-labelledby="faq" className="mt-24 sm:mt-32">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.7fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="faq" eyebrow="FAQ">
            Frequently asked questions
          </SectionHeading>
        </div>
        <div className="divide-y divide-line border-y border-line" data-reveal>
          {items.map(f => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold tracking-tight text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-2xl leading-none font-normal text-gold-ink transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-muted-text">
                <RichText text={f.a} />
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CoachBand() {
  return (
    <section aria-labelledby="coaches-band" className="mt-24 sm:mt-32">
      <Container>
        <div className="grid items-center gap-8 rounded-2xl bg-ink p-8 sm:p-12 md:grid-cols-[1.4fr_1fr]" data-reveal>
          <div>
            <Eyebrow onInk>For coaches</Eyebrow>
            <h2 id="coaches-band" className="mt-3 font-display text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-paper sm:text-4xl">
              Got a whole client list? Do them all at once.
            </h2>
            <p className="mt-3 max-w-lg text-base text-onink-text">
              Upload one spreadsheet and get a report with a page per client. Your file stays in your browser.
            </p>
          </div>
          <a
            href="/coaches"
            className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-accent px-7 py-3.5 text-base font-medium text-ink transition-colors duration-150 hover:bg-accent-hover md:justify-self-end"
          >
            Open the bulk calculator
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </Container>
    </section>
  );
}

function MoreCalculators({ page }: { page: LandingPage }) {
  const others = PAGES.filter(p => p.path !== page.path && isCalculatorPage(p));
  return (
    <nav aria-labelledby="more-calculators" className="mt-24 sm:mt-32">
      <Container>
        <h2 id="more-calculators" className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-ink">
          More calculators
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((p, i) => (
            <li key={p.path} data-reveal style={revealDelay(i)}>
              <a
                href={p.path}
                className="group flex h-full items-center justify-between gap-4 rounded-xl bg-card px-5 py-4 shadow-ring transition-shadow duration-150 hover:shadow-[0_0_0_1px_var(--color-ink),0_6px_18px_-8px_rgb(27_42_74/0.35)]"
              >
                <span>
                  <span className="block font-bold text-ink">{p.linkLabel}</span>
                  <span className="mt-0.5 block text-sm text-muted-text">{p.ogSubtitle}</span>
                </span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink transition-transform duration-150 group-hover:translate-x-1" />
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

function GuideLinks({ page }: { page: LandingPage }) {
  return (
    <nav aria-labelledby="guide-links" className="mt-16">
      <Container>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="guide-links" className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-ink">
            Guides
          </h2>
          <a href="/guides" className="text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
            All guides
          </a>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guidesFor(page.path).map((a, i) => (
            <li key={a.slug} data-reveal style={revealDelay(i)}>
              <a
                href={articlePath(a.slug)}
                className="group flex h-full items-center justify-between gap-4 rounded-xl bg-card px-5 py-4 shadow-ring transition-shadow duration-150 hover:shadow-[0_0_0_1px_var(--color-ink),0_6px_18px_-8px_rgb(27_42_74/0.35)]"
              >
                <span className="font-bold text-ink">{a.h1}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink transition-transform duration-150 group-hover:translate-x-1" />
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

function CtaBand({ cta, onStart }: { cta: string; onStart: () => void }) {
  return (
    <section className="mt-24 mx-3 rounded-[28px] sm:mx-6 bg-accent py-16 text-center sm:mt-32 sm:py-20">
      <Container>
        <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance text-ink sm:text-6xl" data-reveal>
          Ready to find your number?
        </h2>
        <p className="mt-4 text-lg font-medium text-ink">It takes about a minute. Free, no signup.</p>
        <Button className="mt-8 px-7 py-3.5 text-base" onClick={onStart}>
          {cta}
        </Button>
      </Container>
    </section>
  );
}

export default function HomeContent({ page, onStart }: { page: LandingPage; onStart: () => void }) {
  const isHome = page.path === '/';
  return (
    <>
      <Hero page={page} onStart={onStart} />
      <Container className="relative z-10 -mt-32 max-w-5xl">
        <LivePreview preset={page.presetGoal} onStart={onStart} />
      </Container>
      {isHome && <Facts />}
      {page.sections.length > 0 && <PageSections page={page} />}
      <HowItWorks />
      {isHome && <Features />}
      {page.example && <Example example={page.example} />}
      {isHome ? <Maths /> : <MethodNote />}
      {isHome && <Compare />}
      <Faq items={page.faqs ?? []} />
      {isHome && <CoachBand />}
      <MoreCalculators page={page} />
      <GuideLinks page={page} />
      <CtaBand cta={page.cta} onStart={onStart} />
    </>
  );
}
