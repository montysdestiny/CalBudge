// Guides: question-answering articles for the top and middle of the funnel.
// Each one opens with a short, quotable answer (what search snippets and AI
// assistants pick up), then explains, then links to the matching calculator.
// Every worked number here comes from src/lib/calc.ts; update both together.
// Copy supports [label](/path) links, like pages.ts.

import { COMPARISONS } from '@/lib/comparisons';

export type ArticleBlock =
  | { h2: string }
  | { p: string }
  | { list: string[] }
  | { table: { columns: string[]; rows: string[][]; caption?: string } }
  | { tip: string };

export interface Article {
  slug: string;
  /** Short name for link lists. */
  linkLabel: string;
  title: string;
  description: string;
  h1: string;
  /** One-line standfirst under the headline. */
  dek: string;
  ogTitle: string;
  ogSubtitle: string;
  /** ISO dates. */
  published: string;
  updated?: string;
  readMinutes: number;
  /** Two or three sentences that fully answer the headline question. */
  shortAnswer: string;
  body: ArticleBlock[];
  faqs: { q: string; a: string }[];
  /** The calculator this guide leads into. */
  calculator: { path: string; label: string };
  related: string[];
  /** Comparison pages are listed separately from guides. */
  comparison?: boolean;
}

const GUIDES: Article[] = [
  {
    slug: 'how-many-calories-to-lose-weight',
    linkLabel: 'How many calories to lose weight',
    title: 'How Many Calories Should I Eat to Lose Weight? | CalBudge',
    description:
      'How to work out a calorie deficit that works: find your maintenance calories, pick a pace, and stay above a safe minimum. With a worked example.',
    h1: 'How many calories should I eat to lose weight?',
    dek: 'Find your maintenance, take off 10 to 20%, and check the scale after three weeks. Here is how, with real numbers.',
    ogTitle: 'How many calories to lose weight?',
    ogSubtitle: 'Find your deficit in two steps',
    published: '2026-11-15',
    readMinutes: 6,
    shortAnswer:
      'Eat about 10 to 20% fewer calories than your TDEE (your maintenance calories). For most adults that is a deficit of roughly 250 to 550 calories a day, which loses about 0.25 to 0.5 kg a week. Keep your target above 1.2 times your BMR, and above 1,200 calories a day.',
    body: [
      { h2: 'Step 1: find your maintenance calories' },
      {
        p: 'Weight loss starts from your TDEE (total daily energy expenditure): the calories you burn in a day. It is your [BMR](/bmr-calculator), the energy you use at rest, multiplied by an activity factor between 1.2 and 1.9 for how much you train and move. Eat at your TDEE and your weight stays the same. The [TDEE calculator](/tdee-calculator) works it out from your age, height, weight, sessions per week and daily steps.',
      },
      { h2: 'Step 2: choose how big a deficit to run' },
      {
        p: 'The deficit is how far below maintenance you eat. Bigger deficits lose weight faster but are harder to stick to, and cost more muscle. These are the three paces CalBudge uses:',
      },
      {
        table: {
          columns: ['Pace', 'Below TDEE', 'Best for'],
          rows: [
            ['Mild', '10%', 'Keeping muscle, long diets, people near their goal weight'],
            ['Moderate', '20%', 'Most people with a clear amount to lose'],
            ['Aggressive', '27.5%', 'Short phases with plenty to lose'],
          ],
        },
      },
      { h2: 'A worked example' },
      {
        p: 'Take a 30-year-old man who is 180 cm tall, weighs 80 kg and trains 4 times a week. His BMR is 1,780 calories and his TDEE is about 2,608.',
      },
      {
        table: {
          columns: ['Pace', 'Daily target', 'Daily deficit', 'Loss per week'],
          rows: [
            ['Mild (−10%)', '2,347', '261', '≈ 0.24 kg'],
            ['Moderate (−20%)', '2,136', '472', '≈ 0.43 kg'],
            ['Aggressive (−27.5%)', '2,136', '472', '≈ 0.43 kg'],
          ],
          caption: 'Calculated with the Mifflin-St Jeor equation and CalBudge’s activity factors.',
        },
      },
      {
        p: 'Moderate and aggressive land on the same number. A 20% cut would put him at 2,086 calories, which is below 1.2 times his BMR (2,136), so the target is raised to that floor. For him, going harder than moderate only makes the diet more miserable without making it faster. At 472 calories a day, losing 8 kg would take about 19 weeks.',
      },
      { h2: 'How much weight will you lose?' },
      {
        p: 'A kilogram of body fat holds roughly 7,700 calories. A 500-calorie daily deficit adds up to 3,500 calories a week, or a little under half a kilo. Expect the first week to drop more than that: as you eat fewer carbohydrates, your body lets go of the water stored with them. That early drop is water, not fat.',
      },
      { h2: 'Why there is a floor' },
      {
        p: 'Very low targets are hard to stick to, make it difficult to get enough protein and nutrients, and cost more muscle. CalBudge never sets a weight-loss target below 1.2 times your BMR or below 1,200 calories a day. If your chosen pace would go lower, it raises the target and tells you. Smaller and less active people hit the floor most often, because their TDEE is already close to their BMR.',
      },
      { h2: 'Check and adjust after two to three weeks' },
      {
        list: [
          'Weigh yourself most mornings, after the toilet and before eating, and compare weekly averages rather than single days.',
          'Losing about what you expected? Keep going.',
          'Weekly average flat after three weeks? Lower your target by 100 to 200 calories, or [check the usual reasons](/guides/not-losing-weight-in-calorie-deficit) first.',
          'Losing much faster than planned and feeling drained? Eat 100 to 200 calories more.',
          'Recalculate after every 4 to 5 kg lost. A lighter body burns less: the same man at 90 kg has a TDEE of about 2,754, almost 150 calories more than at 80 kg.',
        ],
      },
      {
        tip: 'Pair the deficit with enough protein (about 1.6 to 2.2 g per kg of bodyweight) and some strength training, so more of what you lose is fat rather than muscle. See [how much protein you need](/guides/how-much-protein-per-day).',
      },
    ],
    faqs: [
      {
        q: 'Is 1,200 calories a day enough?',
        a: '1,200 is the absolute minimum CalBudge will set, not a target to aim for. For most people, especially anyone active or larger, it is far below what they need, and a smaller deficit will work better over the long run.',
      },
      {
        q: 'Should I eat back the calories I burn exercising?',
        a: 'Not if your target comes from a TDEE that already counts your training. The activity factor includes your sessions, so eating exercise calories back cancels part of the deficit.',
      },
      {
        q: 'Is it better to lose weight slowly?',
        a: 'For most people, yes. A common guideline is 0.5% to 1% of bodyweight a week. Slower losses keep more muscle and are easier to stick to, which matters more than speed.',
      },
    ],
    calculator: { path: '/calorie-deficit-calculator', label: 'Calculate my deficit' },
    related: ['not-losing-weight-in-calorie-deficit', 'bmr-vs-tdee', 'how-much-protein-per-day'],
  },
  {
    slug: 'how-much-protein-per-day',
    linkLabel: 'How much protein you need',
    title: 'How Much Protein Do I Need a Day? By Bodyweight | CalBudge',
    description:
      'How much protein to eat a day if you train: 1.6 to 2.2 g per kg of bodyweight. A table by bodyweight, how to spread it across meals, and easy sources.',
    h1: 'How much protein do I need a day?',
    dek: 'The research-backed range, a table you can read your number off, and how to actually hit it.',
    ogTitle: 'How much protein do I need?',
    ogSubtitle: 'Grams per day, by bodyweight',
    published: '2026-11-15',
    readMinutes: 5,
    shortAnswer:
      'If you strength train, aim for about 1.6 to 2.2 g of protein per kg of bodyweight a day (0.7 to 1 g per lb). Most of the muscle-building benefit is reached by about 1.6 g/kg. If you do not train, the standard adult guideline is 0.8 g/kg. CalBudge uses 1.8 g/kg.',
    body: [
      { h2: 'Protein by bodyweight' },
      {
        p: 'Protein needs scale with your size, so they are given per kilogram of bodyweight rather than as a percentage of calories. Here is what the common range works out to:',
      },
      {
        table: {
          columns: ['Bodyweight', '1.6 g/kg', '1.8 g/kg', '2.2 g/kg'],
          rows: [
            ['55 kg (121 lb)', '88 g', '99 g', '121 g'],
            ['65 kg (143 lb)', '104 g', '117 g', '143 g'],
            ['75 kg (165 lb)', '120 g', '135 g', '165 g'],
            ['85 kg (187 lb)', '136 g', '153 g', '187 g'],
            ['95 kg (209 lb)', '152 g', '171 g', '209 g'],
            ['105 kg (231 lb)', '168 g', '189 g', '231 g'],
          ],
        },
      },
      {
        p: 'The bottom of the range covers most people. The top end is useful in a hard diet, when protein helps hold on to muscle and keeps you fuller.',
      },
      { h2: 'Keep protein the same when you cut' },
      {
        p: 'Many calculators set protein as a percentage of calories, which means it drops when you diet, exactly when you need it most. The [macro calculator](/macro-calculator) holds protein at 1.8 g per kg whether you are [cutting](/calorie-deficit-calculator), maintaining or [bulking](/bulking-calculator), and moves carbohydrates and fat instead.',
      },
      { h2: 'If you carry a lot of body fat' },
      {
        p: 'Grams per kilogram of total bodyweight can overshoot for people with a lot of fat to lose, because fat tissue needs little protein. A practical fix is to use your goal weight instead of your current weight. Someone at 110 kg aiming for 85 kg would eat around 150 g, not 200 g.',
      },
      { h2: 'Spread it across the day' },
      {
        p: 'Your daily total matters most. Splitting it into three to five meals of roughly 0.4 g per kg each (about 30 g for a 75 kg person) is an easy way to get there, and gives your muscles a steady supply. A [meal-by-meal calorie split](/guides/how-to-split-calories-across-meals) makes this simple to plan.',
      },
      { h2: 'Easy ways to get 25 to 30 g' },
      {
        list: [
          '100 g cooked chicken breast: about 31 g',
          'A 170 g pot of plain Greek yogurt with a handful of nuts: about 20 to 25 g',
          '3 large eggs: about 18 g',
          '100 g drained tinned tuna: about 25 g',
          'A cup of cooked lentils with 100 g of firm tofu: about 30 g',
          'A scoop of whey or plant protein in milk: about 25 to 30 g',
        ],
      },
      {
        tip: 'Figures are typical values and vary by brand. Check the label for anything packaged. To see what you actually eat, including vitamins and minerals, log a few days in a tracker such as Cronometer: [CalBudge vs Cronometer](/guides/calbudge-vs-cronometer) shows how to set it up with your targets.',
      },
    ],
    faqs: [
      {
        q: 'Is eating a lot of protein bad for you?',
        a: 'For healthy adults, intakes around 1.6 to 2.2 g per kg are widely used and well tolerated. If you have kidney disease or another medical condition, talk to your doctor before raising your protein.',
      },
      {
        q: 'Do I need protein straight after a workout?',
        a: 'It helps a little, but your total for the day matters far more. Having a protein-rich meal within a few hours either side of training is plenty.',
      },
      {
        q: 'Do women need less protein than men?',
        a: 'Per kilogram of bodyweight, no. The same 1.6 to 2.2 g/kg range applies. Women usually need fewer grams in total because they tend to weigh less.',
      },
    ],
    calculator: { path: '/macro-calculator', label: 'Calculate my macros' },
    related: ['how-many-calories-to-lose-weight', 'how-to-split-calories-across-meals', 'how-to-calculate-macros-for-clients'],
  },
  {
    slug: 'bmr-vs-tdee',
    linkLabel: 'BMR vs TDEE',
    title: 'BMR vs TDEE: What’s the Difference? | CalBudge',
    description:
      'BMR is what you burn at rest; TDEE is what you burn in a whole day. How each is calculated, how far apart they are, and which one to plan your diet around.',
    h1: 'BMR vs TDEE: what’s the difference?',
    dek: 'Two numbers every calorie calculator shows you, and why only one of them is how much to eat.',
    ogTitle: 'BMR vs TDEE',
    ogSubtitle: 'Which number to eat by',
    published: '2026-11-15',
    readMinutes: 4,
    shortAnswer:
      'BMR (basal metabolic rate) is the calories your body burns at complete rest. TDEE (total daily energy expenditure) is the calories you burn in a whole day, including training and everyday movement. TDEE is your BMR multiplied by an activity factor of about 1.2 to 1.9. Plan your diet around your TDEE, not your BMR.',
    body: [
      { h2: 'BMR: the cost of staying alive' },
      {
        p: 'BMR is the energy you would burn lying still all day: breathing, circulation, keeping your organs and brain running. For most people it is the largest part of their daily burn. It depends mainly on your size, age, sex and how much muscle you carry. The [BMR calculator](/bmr-calculator) uses the Mifflin-St Jeor equation, or Katch-McArdle if you know your body fat percentage.',
      },
      { h2: 'TDEE: everything you burn in a day' },
      { p: 'TDEE adds everything on top of your BMR:' },
      {
        list: [
          'Exercise: gym sessions, runs, classes, sport.',
          'Everyday movement: walking, standing, chores, fidgeting. This varies more between people than you might expect, which is why CalBudge asks for your daily steps.',
          'Digesting food: a smaller share, roughly a tenth of what you eat.',
        ],
      },
      {
        p: 'Calculators fold all of this into one activity factor. CalBudge picks it from your gym and cardio sessions per week, then fine-tunes it with your steps.',
      },
      { h2: 'Same body, different TDEE' },
      {
        p: 'A 28-year-old woman, 170 cm and 70 kg, has a BMR of 1,462 calories whatever she does. Her TDEE depends on how much she trains:',
      },
      {
        table: {
          columns: ['Gym sessions a week', 'BMR', 'TDEE'],
          rows: [
            ['None', '1,462', '1,754'],
            ['2', '1,462', '2,010'],
            ['4', '1,462', '2,141'],
            ['6', '1,462', '2,265'],
          ],
          caption: 'Without daily steps entered. Steps move the result by up to about 110 calories either way for her.',
        },
      },
      { h2: 'Which number should you eat by?' },
      {
        p: 'Your TDEE. It is your maintenance: eat at it to stay the same weight, [below it to lose](/calorie-deficit-calculator), [above it to gain](/bulking-calculator). Eating at your BMR would mean a big deficit for anyone who moves at all, and CalBudge never sets a weight-loss target below 1.2 times your BMR.',
      },
      {
        tip: 'Both numbers are estimates. The real test is your weight over two to three weeks at a steady intake. If it holds still, you have found your true TDEE.',
      },
    ],
    faqs: [
      {
        q: 'Is it safe to eat at my BMR?',
        a: 'For most active people it is a bigger deficit than they need, and harder to sustain. A deficit of 10 to 20% below TDEE is usually a better place to start.',
      },
      {
        q: 'Does building muscle raise my BMR?',
        a: 'Yes, a little. Muscle burns more at rest than fat, and Katch-McArdle accounts for it by working from lean mass. The bigger effect of training is on your TDEE, through the sessions themselves.',
      },
      {
        q: 'What is the difference between TDEE and maintenance calories?',
        a: 'None. Your TDEE is the number of calories that keeps your weight stable, which is what maintenance means.',
      },
    ],
    calculator: { path: '/tdee-calculator', label: 'Calculate my TDEE' },
    related: ['how-many-calories-to-lose-weight', 'how-much-protein-per-day', 'not-losing-weight-in-calorie-deficit'],
  },
  {
    slug: 'how-to-split-calories-across-meals',
    linkLabel: 'How to split calories across meals',
    title: 'How to Split Your Calories Across Meals | CalBudge',
    description:
      'A simple way to divide your daily calories into breakfast, lunch, dinner and snacks, what to do if you skip a meal, and how to fuel your training.',
    h1: 'How to split your calories across meals',
    dek: 'A daily number is easier to hit when you know what each meal should look like.',
    ogTitle: 'How to split your calories',
    ogSubtitle: 'Breakfast, lunch, dinner and snacks',
    published: '2026-11-15',
    readMinutes: 5,
    shortAnswer:
      'There is no single best split: total calories and protein matter most. A practical default is about 18% of your calories at breakfast, 25% each at lunch and dinner, and the other 32% across snacks and food around training. If you skip a meal, move its calories to your other meals in proportion, so your daily total stays the same.',
    body: [
      { h2: 'A default split that works for most people' },
      {
        p: 'Here is the split CalBudge uses, shown for a 2,200-calorie day. Lunch and dinner are the anchors, breakfast is lighter, and three smaller eating occasions cover snacks and training:',
      },
      {
        table: {
          columns: ['Meal', 'Share', 'Calories at 2,200'],
          rows: [
            ['Breakfast', '≈ 18%', '395'],
            ['Lunch', '25%', '550'],
            ['Dinner', '25%', '550'],
            ['Snack', '≈ 11%', '235'],
            ['Pre-workout', '≈ 11%', '235'],
            ['Post-workout', '≈ 11%', '235'],
          ],
          caption: 'Each meal is rounded to the nearest 5 calories.',
        },
      },
      { h2: 'If you skip a meal' },
      {
        p: 'Plenty of people never eat a pre-workout snack, or skip breakfast. That is fine. Move those calories to your other meals, bigger meals taking a bigger share, so the shape of your day stays the same. Here is the same 2,200-calorie day without the two training snacks:',
      },
      {
        table: {
          columns: ['Meal', 'Calories'],
          rows: [
            ['Breakfast', '500'],
            ['Lunch', '700'],
            ['Dinner', '700'],
            ['Snack', '300'],
          ],
        },
      },
      {
        p: 'Skipping breakfast instead gives about 670 calories each at lunch and dinner, and 285 for each of the three smaller meals. In the calculator, tap the × on any meal and this happens for you.',
      },
      { h2: 'Does meal timing matter?' },
      {
        p: 'Less than people think. Eating more or fewer times a day does not speed up or slow down your metabolism in any way that matters, and the research on skipping breakfast points the same way. Choose the pattern you can stick to. Two things are worth planning around, though:',
      },
      {
        list: [
          'Protein at most meals. Three to five servings of about 0.4 g per kg of bodyweight spreads it well. See [how much protein you need](/guides/how-much-protein-per-day).',
          'Food around training. A small carbohydrate-based snack an hour or two before a hard session, and a protein-rich meal afterwards, help you train well and recover.',
        ],
      },
      {
        tip: 'Getting hungry at night? Move 100 to 200 calories from lunch to an evening snack. The total is what counts.',
      },
    ],
    faqs: [
      {
        q: 'Is it bad to skip breakfast?',
        a: 'Not for weight loss, as long as your daily total and protein stay on target. Some people find a decent breakfast curbs snacking later; others feel better waiting. Both work.',
      },
      {
        q: 'How many meals a day should I eat?',
        a: 'Whatever suits your schedule. Three meals and one or two snacks is easy for most people, and makes it simple to spread your protein.',
      },
      {
        q: 'Is it bad to eat late at night?',
        a: 'A calorie eaten at 9pm counts the same as one at noon. If late eating leads to overeating or poor sleep, shift some of it earlier, but there is no metabolic penalty in itself.',
      },
    ],
    calculator: { path: '/', label: 'Get my meal split' },
    related: ['how-much-protein-per-day', 'how-many-calories-to-lose-weight', 'bmr-vs-tdee'],
  },
  {
    slug: 'not-losing-weight-in-calorie-deficit',
    linkLabel: 'Not losing weight in a deficit',
    title: 'Not Losing Weight in a Calorie Deficit? 5 Reasons | CalBudge',
    description:
      'In a calorie deficit but the scale won’t move? The five usual reasons, from water retention to a TDEE estimate that’s too high, and a three-week plan to fix it.',
    h1: 'Not losing weight in a calorie deficit? Here’s why',
    dek: 'If the scale has stalled, it is almost always one of five things. Here is how to tell which.',
    ogTitle: 'Not losing weight in a deficit?',
    ogSubtitle: 'Five reasons and how to fix them',
    published: '2026-11-15',
    readMinutes: 6,
    shortAnswer:
      'Usually it is water hiding fat loss for a week or two, eating more than you think, a TDEE estimate that is too high for you, or your TDEE falling as you lose weight. Compare weekly average weights for two to three weeks before changing anything. If the average still has not moved, lower your target by 100 to 200 calories.',
    body: [
      { h2: '1. Water is hiding the fat loss' },
      {
        p: 'Your weight can swing by a kilo or more from day to day with salt, carbohydrates, stress, sleep, hard training and, for many women, the menstrual cycle. Fat loss of half a kilo a week is easily hidden for a week or two. Weigh yourself most mornings and compare weekly averages: if this week is lower than last week, it is working.',
      },
      { h2: '2. You are eating more than you think' },
      {
        p: 'Almost everyone underestimates what they eat, and it is rarely the meals. Common culprits:',
      },
      {
        list: [
          'Cooking oil and butter: a tablespoon of oil is about 120 calories.',
          'Drinks: lattes, juice, alcohol.',
          'Bites, tastes and finishing the kids’ plates.',
          'Weekends: five careful days and two relaxed ones can cancel the week’s deficit.',
          'Eyeballed portions: weigh things like rice, pasta, cereal and peanut butter for a week.',
        ],
      },
      { h2: '3. Your TDEE estimate is too high' },
      {
        p: 'Every calculator gives an average. Your real maintenance can be a few hundred calories higher or lower, and people who sit most of the day outside their workouts are often lower. If you have tracked carefully for three weeks and the average has not moved, treat that intake as your true maintenance and go 10 to 20% below it.',
      },
      { h2: '4. You have lost weight and not recalculated' },
      {
        p: 'A lighter body burns less. An 80 kg man who trains 4 times a week burns about 150 calories a day less than he did at 90 kg, so a deficit that worked at the start gets smaller as you go. Recalculate with the [TDEE calculator](/tdee-calculator) after every 4 to 5 kg.',
      },
      { h2: '5. You are moving less without noticing' },
      {
        p: 'When you diet, it is common to move less outside the gym: fewer steps, less fidgeting, more sitting. Keep an eye on your daily step count and try to hold it steady.',
      },
      { h2: 'A three-week plan' },
      {
        list: [
          'Week 1: weigh and log everything you eat and drink, oils and drinks included. Weigh yourself most mornings.',
          'Week 2: keep going. Compare this week’s average weight with last week’s.',
          'Week 3: if the average has dropped, carry on. If it is flat, lower your target by 100 to 200 calories, or add 2,000 steps a day.',
          'Then check again after another two weeks.',
        ],
      },
      {
        p: 'This is the adjustment adaptive apps such as MacroFactor make for you each week from your logged food and weight. Doing it by hand is free; [CalBudge vs MacroFactor](/guides/calbudge-vs-macrofactor) compares the two approaches.',
      },
      {
        tip: 'If you are eating carefully and losing nothing for months, or are gaining without explanation, talk to a doctor. Some medical conditions and medications affect weight.',
      },
    ],
    faqs: [
      {
        q: 'Can you be in a calorie deficit and not lose weight?',
        a: 'Not over the long run. A real deficit always loses weight, but water changes can hide it for a week or two. If several weeks pass with no change, the deficit is smaller than you think.',
      },
      {
        q: 'Is “starvation mode” real?',
        a: 'Your body does burn somewhat less when you diet, partly because you weigh less and partly because you move less. It shrinks your deficit but does not stop fat loss or make you gain weight on fewer calories.',
      },
      {
        q: 'Should I cut calories more if I stall?',
        a: 'Only after two to three weeks of careful tracking with a flat weekly average, and by 100 to 200 calories at a time. Do not drop below 1.2 times your BMR or 1,200 calories a day.',
      },
    ],
    calculator: { path: '/calorie-deficit-calculator', label: 'Recalculate my deficit' },
    related: ['how-many-calories-to-lose-weight', 'bmr-vs-tdee', 'how-much-protein-per-day'],
  },
  {
    slug: 'how-to-calculate-macros-for-clients',
    linkLabel: 'How coaches calculate client macros',
    title: 'How to Calculate Macros for Your Clients: A Coach’s Guide | CalBudge',
    description:
      'A step-by-step method for personal trainers and nutrition coaches to set calorie and macro targets for clients, with worked examples and a free bulk tool.',
    h1: 'How to calculate macros for your clients',
    dek: 'A repeatable method for personal trainers and coaches, from BMR to a macro split, and how to do a whole client list at once.',
    ogTitle: 'Macros for your clients',
    ogSubtitle: 'A step-by-step guide for coaches',
    published: '2026-11-15',
    readMinutes: 6,
    shortAnswer:
      'Estimate each client’s BMR (Mifflin-St Jeor, or Katch-McArdle if you trust their body fat reading), multiply it by an activity factor to get TDEE, adjust for their goal, then set protein from bodyweight (about 1.6 to 2.2 g/kg), fat at 20 to 35% of calories, and carbohydrates for the rest. For a whole roster, CalBudge’s free bulk calculator does every client from one spreadsheet.',
    body: [
      { h2: 'Step 1: estimate BMR' },
      {
        p: 'Use Mifflin-St Jeor by default: 10 × weight (kg) + 6.25 × height (cm) − 5 × age, plus 5 for men or minus 161 for women. If you have a reliable body fat measurement, Katch-McArdle (370 + 21.6 × lean mass in kg) is usually better for muscular clients. More detail on the [BMR calculator](/bmr-calculator).',
      },
      { h2: 'Step 2: multiply by an activity factor' },
      {
        p: 'Factors run from 1.2 for no training to 1.9 for very high training volume. Count sessions rather than asking clients to rate themselves: people overestimate how active they are. Daily steps are the best way to catch the difference between a desk worker and someone on their feet all day.',
      },
      { h2: 'Step 3: adjust for the goal' },
      {
        list: [
          'Fat loss: 10 to 20% below TDEE for most clients, up to about 25% for short phases.',
          'Muscle gain: 10% above TDEE for most; up to 20% for beginners or hard gainers.',
          'Maintenance or recomposition: eat at TDEE.',
          'Set a floor. CalBudge never goes below 1.2 × BMR or 1,200 calories a day, whatever the pace.',
        ],
      },
      { h2: 'Step 4: split into macros' },
      {
        p: 'Set protein first, from bodyweight: 1.6 to 2.2 g/kg, or from goal weight for clients with a lot of fat to lose. Then fat at 20 to 35% of calories. Carbohydrates fill the remainder. CalBudge uses 1.8 g/kg protein and 25% fat.',
      },
      { h2: 'Three example clients' },
      {
        table: {
          columns: ['Client', 'Goal', 'TDEE', 'Target', 'Protein', 'Carbs', 'Fat'],
          rows: [
            ['Woman, 42, 162 cm, 78 kg, 2 sessions, 6,000 steps', 'Moderate cut', '1,955', '1,706*', '140 g', '180 g', '47 g'],
            ['Man, 26, 183 cm, 74 kg, 5 sessions', 'Lean bulk', '2,726', '2,999', '133 g', '429 g', '83 g'],
            ['Woman, 55, 158 cm, 60 kg, 3 sessions, 9,000 steps', 'Maintain', '1,709', '1,709', '108 g', '213 g', '47 g'],
          ],
          caption: '* A 20% cut would have put her at 1,564, below 1.2 × her BMR (1,706), so the target is raised to the floor.',
        },
      },
      { h2: 'Step 5: review every two to four weeks' },
      {
        p: 'The formula is a starting point. Compare each client’s weekly average weight with what you expected and adjust by 100 to 200 calories. Recalculate after every 4 to 5 kg of change. For clients who stall, [these are the usual reasons](/guides/not-losing-weight-in-calorie-deficit).',
      },
      { h2: 'Doing a whole client list at once' },
      {
        p: 'Working this out by hand for 30 clients takes an afternoon. The [bulk calculator for coaches](/coaches) does it from one spreadsheet: upload a CSV with each client’s details and get a PDF with a summary page and a page per client (targets, BMR, TDEE, macros and a meal split), or a spreadsheet of results. The file is processed entirely in your browser and never uploaded.',
      },
      {
        tip: 'Keep the same method for every client. When everyone is calculated the same way, it is easier to spot who is responding differently.',
      },
      {
        p: 'Clients often already use a tracking app. [This comparison of calculators and trackers](/guides/best-free-calorie-and-macro-calculators) shows how CalBudge targets fit MyFitnessPal, MacroFactor and Cronometer, so you can hand clients numbers in the app they know.',
      },
    ],
    faqs: [
      {
        q: 'Which BMR formula should coaches use?',
        a: 'Mifflin-St Jeor for most clients; reviews comparing the common equations have found it the most reliable for healthy adults. Switch to Katch-McArdle when you have a body fat reading you trust, especially for lean, muscular clients.',
      },
      {
        q: 'Should every client get the same macro split?',
        a: 'Set protein the same way for everyone, from bodyweight. How you divide the rest between carbohydrates and fat can follow preference and training: endurance athletes usually want more carbohydrate.',
      },
      {
        q: 'Is it safe to put client data in an online calculator?',
        a: 'Check where it goes. CalBudge’s bulk calculator reads the file in your browser and never sends it anywhere, so no client data reaches a server.',
      },
    ],
    calculator: { path: '/coaches', label: 'Open the bulk calculator' },
    related: ['how-much-protein-per-day', 'how-many-calories-to-lose-weight', 'not-losing-weight-in-calorie-deficit'],
  },
];

/** Guides first, then the comparison pages (src/lib/comparisons.ts). */
export const ARTICLES: Article[] = [...GUIDES, ...COMPARISONS];

export const articlePath = (slug: string) => `/guides/${slug}`;
export const findArticle = (slug: string) => ARTICLES.find(a => a.slug === slug);

/** A few guides to link from a calculator page: the ones that lead into it first. */
export function guidesFor(path: string, count = 3) {
  const own = GUIDES.filter(a => a.calculator.path === path);
  return [...own, ...GUIDES.filter(a => !own.includes(a))].slice(0, count);
}
