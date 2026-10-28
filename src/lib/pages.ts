// Landing pages. Each one is prerendered to its own URL at build time
// (scripts/prerender.mjs) with its own <title>/description, and runs the
// same calculator underneath. Numbers in the copy mirror src/lib/calc.ts.
// Adding a page? Also add its rewrite to vercel.json (the build checks).

import type { Goal } from '@/lib/calc';

export const SITE_URL = 'https://cal-budge.vercel.app';

export interface LandingPage {
  /** URL path, '/' for the homepage. */
  path: string;
  /** Short name used in "More calculators" links. */
  linkLabel: string;
  /** <title> and social title. */
  title: string;
  /** Headline and subline for the social preview image (scripts/og-images.mjs). */
  ogTitle: string;
  ogSubtitle: string;
  /** Meta description, ~150 characters. */
  description: string;
  h1: string;
  intro: string;
  cta: string;
  /** 'bulk' renders the coaches' CSV tool instead of the single-person calculator. */
  kind?: 'calculator' | 'bulk';
  /** Goal pre-selected on the goal step when started from this page. */
  presetGoal?: Goal;
  /** Page-specific explainer shown above the shared "how it works" content. */
  sections: { heading: string; paragraphs: string[] }[];
  /** Worked example with real numbers from src/lib/calc.ts (landing pages only). */
  example?: { heading: string; intro: string; columns: string[]; rows: string[][]; note?: string };
  /** Page-specific FAQ. Landing pages show these instead of the homepage's
   *  full method and FAQ, so each page has substantially its own content. */
  faqs?: { q: string; a: string }[];
}

export const PAGES: LandingPage[] = [
  {
    path: '/',
    ogTitle: 'Your daily calorie budget, split meal by meal.',
    ogSubtitle: 'BMR, TDEE and macros in about a minute',
    linkLabel: 'Calorie budget calculator',
    title: 'CalBudge | Daily Calorie Budget Calculator',
    description:
      'Work out your daily calorie budget in about a minute. BMR and TDEE calculated for you, split meal by meal, with a macro estimate. Free, no signup.',
    h1: 'Your daily calorie budget, split meal by meal.',
    intro:
      'Answer a few questions about your body and training. Get a daily calorie target you can actually plan around. Takes about a minute, no signup.',
    cta: 'Calculate my budget',
    sections: [],
  },
  {
    path: '/tdee-calculator',
    ogTitle: 'TDEE Calculator',
    ogSubtitle: 'Find your maintenance calories',
    linkLabel: 'TDEE calculator',
    title: 'TDEE Calculator: Find Your Maintenance Calories | CalBudge',
    description:
      'Free TDEE calculator. Find your total daily energy expenditure and maintenance calories from your age, size, training and daily steps. No signup.',
    h1: 'TDEE calculator: find your maintenance calories',
    intro:
      'Your TDEE is how many calories you burn in a day. Eat that much and your weight stays the same. Answer a few questions to get yours, plus a meal-by-meal plan built around it.',
    cta: 'Calculate my TDEE',
    sections: [
      {
        heading: 'What is TDEE?',
        paragraphs: [
          'TDEE stands for total daily energy expenditure: every calorie your body uses in a day. It is made up of your basal metabolic rate (the energy you burn at rest), plus everything you burn moving around, training and digesting food.',
          'Your TDEE is the same thing as your maintenance calories. It is the starting point for any diet: eat below it to lose weight, above it to gain.',
        ],
      },
      {
        heading: 'How this TDEE calculator works',
        paragraphs: [
          'CalBudge first estimates your BMR, then multiplies it by an activity factor between 1.2 and 1.9 based on how many gym and cardio sessions you do each week. Unlike most calculators, you can also enter your average daily steps, which nudges the factor up or down to reflect how active you are outside the gym.',
          'Your results show your TDEE alongside your BMR, so you can see exactly where the number comes from.',
        ],
      },
    ],
    example: {
      heading: 'Example: how training changes your TDEE',
      intro:
        'Take a 30-year-old man who is 180 cm tall and weighs 80 kg. His BMR is 1,780 calories a day. Here is how his maintenance calories change with the number of sessions he does each week (cardio sessions count as three quarters of a gym session):',
      columns: ['Sessions per week', 'Activity factor', 'TDEE (kcal/day)'],
      rows: [
        ['None', '1.2', '2,136'],
        ['1–2', '1.375', '2,448'],
        ['3–4', '1.465', '2,608'],
        ['5–6', '1.55', '2,759'],
        ['7–9', '1.725', '3,071'],
        ['10 or more', '1.9', '3,382'],
      ],
      note: 'Daily steps then fine-tune the result. Training 4 times a week, he would be at 2,530 calories on 4,000 steps a day and 2,708 on 12,000 steps: a difference of almost 180 calories from walking alone.',
    },
    faqs: [
      {
        q: 'How do I check whether my TDEE estimate is right?',
        a: 'Eat at your TDEE for two to three weeks and weigh yourself most mornings. If your weekly average stays flat, the estimate is right. If you are losing about 0.5 kg a week, your real TDEE is roughly 550 calories higher than the estimate (0.5 kg × 7,700 calories ÷ 7 days), and the same logic works in reverse if you are gaining.',
      },
      {
        q: 'Does my TDEE change as I lose weight?',
        a: 'Yes. A lighter body burns less energy: every 10 kg lost lowers your BMR by about 100 calories, and your TDEE by roughly 120 to 190 depending on how active you are. Recalculate after every 4 to 5 kg of change.',
      },
      {
        q: 'Should I count walking as cardio?',
        a: 'No, count it in your daily steps instead. Cardio sessions are for deliberate workouts like running, cycling or classes. Counting the same walk twice would overestimate your TDEE.',
      },
      {
        q: 'Why do different TDEE calculators give different numbers?',
        a: 'They use different BMR equations (the older Harris-Benedict equation usually gives higher results than Mifflin-St Jeor) and different ways of judging activity. Many ask you to pick one vague activity level; CalBudge counts your sessions and steps instead. Differences of 100 to 300 calories between calculators are normal.',
      },
      {
        q: 'Is TDEE the same as maintenance calories?',
        a: 'Yes. Your TDEE is the number of calories that keeps your weight stable, which is what maintenance calories means.',
      },
    ],
  },
  {
    path: '/bmr-calculator',
    ogTitle: 'BMR Calculator',
    ogSubtitle: 'Mifflin-St Jeor and Katch-McArdle',
    linkLabel: 'BMR calculator',
    title: 'BMR Calculator: Mifflin-St Jeor & Katch-McArdle | CalBudge',
    description:
      'Free BMR calculator using the Mifflin-St Jeor equation, or Katch-McArdle if you know your body fat percentage. See your BMR and TDEE side by side.',
    h1: 'BMR calculator',
    intro:
      'Find your basal metabolic rate: the calories your body burns at complete rest. CalBudge uses Mifflin-St Jeor by default and switches to Katch-McArdle if you know your body fat percentage.',
    cta: 'Calculate my BMR',
    sections: [
      {
        heading: 'What is BMR?',
        paragraphs: [
          'Your basal metabolic rate is the energy your body needs just to stay alive: breathing, circulation, keeping organs running. For most people it makes up the largest share of the calories they burn each day.',
          'BMR is not how much you should eat. To get your daily calorie needs, BMR is multiplied by an activity factor to give your TDEE.',
        ],
      },
      {
        heading: 'Mifflin-St Jeor or Katch-McArdle?',
        paragraphs: [
          'Mifflin-St Jeor works from your weight, height, age and sex, and is one of the most widely used equations for estimating BMR. It is the default here.',
          'Katch-McArdle works from your lean body mass instead, so it accounts for how much of your weight is muscle. If you enter your body fat percentage in the optional step, CalBudge uses Katch-McArdle automatically. If you already know your BMR from a lab test or smart scale, you can enter it directly.',
        ],
      },
    ],
    example: {
      heading: 'Example: working out BMR by hand',
      intro:
        'Here is the Mifflin-St Jeor equation step by step for a 35-year-old woman who is 165 cm tall and weighs 65 kg:',
      columns: ['Step', 'Calories'],
      rows: [
        ['10 × weight (65 kg)', '650'],
        ['+ 6.25 × height (165 cm)', '+ 1,031'],
        ['− 5 × age (35)', '− 175'],
        ['− 161 (women; men add 5)', '− 161'],
        ['BMR (Mifflin-St Jeor)', '1,345'],
        ['BMR (Katch-McArdle, at 28% body fat)', '1,381'],
      ],
      note: 'For Katch-McArdle, her lean mass is 65 kg × 0.72 = 46.8 kg, so her BMR is 370 + 21.6 × 46.8 = 1,381. The two equations land within 40 calories of each other here. They drift further apart for very muscular people, where Katch-McArdle is usually the better guide. Training 3 times a week, her TDEE comes to about 1,970 calories.',
    },
    faqs: [
      {
        q: 'Should I eat below my BMR to lose weight?',
        a: 'For most people, no. Your BMR is what your body needs at complete rest, before you move at all. CalBudge never sets a weight-loss target below 1.2 times your BMR, and never below 1,200 calories a day.',
      },
      {
        q: 'Why does BMR go down with age?',
        a: 'Mifflin-St Jeor subtracts 5 calories for every year of age, mostly reflecting the gradual loss of muscle and organ mass. Keeping up strength training is the most practical way to slow that decline.',
      },
      {
        q: 'How accurate is the Mifflin-St Jeor equation?',
        a: 'For most healthy adults it lands within about 10% of a lab measurement, and reviews comparing the common equations have found it the most reliable of them. It is still an average: your own BMR can be higher or lower.',
      },
      {
        q: 'Is the BMR from my smart scale accurate?',
        a: 'Smart scales estimate body fat with bioelectrical impedance, which can be off by several percentage points depending on hydration, and then apply an equation much like the ones here. Use it as a rough guide. A lab test such as indirect calorimetry is the only way to measure BMR directly.',
      },
      {
        q: 'What is the difference between BMR and RMR?',
        a: 'Resting metabolic rate (RMR) is measured under slightly less strict conditions than BMR, so it usually comes out a little higher. For planning your diet the two are close enough to use interchangeably.',
      },
    ],
  },
  {
    path: '/calorie-deficit-calculator',
    ogTitle: 'Calorie Deficit Calculator',
    ogSubtitle: 'How much to eat to lose weight',
    linkLabel: 'Calorie deficit calculator',
    title: 'Calorie Deficit Calculator: How Much to Eat to Lose Weight | CalBudge',
    description:
      'Free calorie deficit calculator. Choose a mild, moderate or aggressive pace and get a daily calorie target for weight loss, split meal by meal.',
    h1: 'Calorie deficit calculator',
    intro:
      'Find out how many calories to eat to lose weight. Pick a pace, and get a daily target with built-in safety limits, split across your meals.',
    cta: 'Calculate my deficit',
    presetGoal: 'cut',
    sections: [
      {
        heading: 'What is a calorie deficit?',
        paragraphs: [
          'A calorie deficit means eating fewer calories than your body burns (your TDEE). Your body makes up the difference from stored energy, mostly fat, so you lose weight over time.',
        ],
      },
      {
        heading: 'How big should your deficit be?',
        paragraphs: [
          'CalBudge offers three paces: mild (10% below your TDEE), moderate (20% below) and aggressive (27.5% below). A mild deficit is easier to stick to and better for keeping muscle. An aggressive one is faster but harder to sustain.',
          'Whatever pace you choose, your target never drops below 1.2 times your BMR or below 1,200 calories a day. If your chosen pace would go lower, CalBudge raises your target and tells you.',
          'Add a target weight and you will also get a rough estimate of how many weeks it could take.',
        ],
      },
    ],
    example: {
      heading: 'Example: the three paces side by side',
      intro:
        'A 30-year-old man, 180 cm and 80 kg, who trains 6 times a week has a TDEE of about 2,760 calories and a BMR of 1,780. This is what each pace gives him:',
      columns: ['Pace', 'Daily target', 'Daily deficit', 'Loss per week'],
      rows: [
        ['Mild (−10%)', '2,483', '276', '≈ 0.25 kg'],
        ['Moderate (−20%)', '2,207', '552', '≈ 0.5 kg'],
        ['Aggressive (−27.5%)', '2,136', '623', '≈ 0.57 kg'],
      ],
      note: 'The aggressive pace would put him at 2,000 calories, which is below 1.2 × his BMR (2,136). CalBudge raises his target to that floor and tells him so. For him, aggressive is barely faster than moderate and a lot harder to stick to.',
    },
    faqs: [
      {
        q: 'Is a 500-calorie deficit enough to lose weight?',
        a: 'Yes. A 500-calorie daily deficit adds up to 3,500 calories a week, or roughly 0.45 kg of fat at about 7,700 calories per kilogram. For most people that sits between the mild and moderate paces.',
      },
      {
        q: 'How fast should I lose weight?',
        a: 'A common guideline is 0.5% to 1% of your bodyweight per week. Slower losses make it easier to keep muscle and stick to the plan; faster ones are harder to sustain and usually cost more muscle.',
      },
      {
        q: 'Why did CalBudge raise my calorie target?',
        a: 'Because your chosen pace would have taken you below 1.2 times your BMR, or below 1,200 calories a day. This happens most often for smaller or less active people, whose TDEE is already close to their BMR.',
      },
      {
        q: "I'm in a deficit but not losing weight. Why?",
        a: 'Day-to-day water changes can hide fat loss for a week or two, and most people underestimate what they eat. Give it two to three weeks and compare weekly average weights. If nothing has moved, lower your target by 100 to 200 calories.',
      },
      {
        q: 'Should I eat back the calories I burn exercising?',
        a: 'No. Your training is already counted in your TDEE through the activity factor, so eating those calories back would cancel out part of your deficit.',
      },
    ],
  },
  {
    path: '/bulking-calculator',
    ogTitle: 'Bulking Calculator',
    ogSubtitle: 'Calories and macros for a lean bulk',
    linkLabel: 'Bulking calculator',
    title: 'Bulking Calculator: Calories for a Lean Bulk | CalBudge',
    description:
      'Free bulking calculator. Work out how many calories to eat to build muscle, from a lean bulk to an aggressive one, with a macro split and meal plan.',
    h1: 'Bulking calculator',
    intro:
      'Work out how many calories to eat to build muscle. Choose how fast you want to gain, and get a daily target with a protein-first macro split.',
    cta: 'Calculate my bulk',
    presetGoal: 'bulk',
    sections: [
      {
        heading: 'How many calories do you need to bulk?',
        paragraphs: [
          'To build muscle efficiently you need a calorie surplus: eating more than your TDEE. CalBudge offers three paces: mild (10% above your TDEE), moderate (20% above) and aggressive (25% above).',
          'A mild surplus, often called a lean bulk, keeps fat gain to a minimum. A bigger surplus can help if you struggle to gain weight, at the cost of more fat.',
        ],
      },
      {
        heading: 'Protein and macros for bulking',
        paragraphs: [
          'Your results include a macro estimate: protein at 1.8 g per kg of bodyweight, fat at 25% of your calories, and carbohydrates filling the rest to fuel your training. The meal split includes pre- and post-workout meals.',
        ],
      },
    ],
    example: {
      heading: 'Example: a lean bulk for a 70 kg lifter',
      intro:
        'A 24-year-old man, 178 cm and 70 kg, lifts 5 times a week. His TDEE is about 2,630 calories. Here is each pace:',
      columns: ['Pace', 'Daily target', 'Daily surplus', 'Gain per week'],
      rows: [
        ['Mild (+10%)', '2,894', '263', '≈ 0.24 kg'],
        ['Moderate (+20%)', '3,157', '526', '≈ 0.48 kg'],
        ['Aggressive (+25%)', '3,289', '658', '≈ 0.6 kg'],
      ],
      note: 'On the mild pace his macros come to 126 g protein, 417 g carbohydrates and 80 g fat. His day splits into a 520-calorie breakfast, 725-calorie lunch and dinner, and three 310-calorie snacks, one of them before training and one after.',
    },
    faqs: [
      {
        q: 'How fast should I gain weight on a bulk?',
        a: 'For most people, around 0.25% to 0.5% of bodyweight per week. Beginners can build muscle faster and may do well with the moderate pace; experienced lifters gain muscle slowly, so a bigger surplus mostly adds fat.',
      },
      {
        q: 'What is the difference between a lean bulk and a dirty bulk?',
        a: 'A lean bulk uses a small surplus, around 10% above maintenance, to gain muscle while keeping fat gain low. A dirty bulk means eating as much as possible, which gains weight quickly but much of it as fat that you later have to diet off.',
      },
      {
        q: 'Do I need more protein when bulking?',
        a: 'Not necessarily. CalBudge keeps protein at 1.8 g per kg of bodyweight on any goal, within the 1.6 to 2.2 g/kg range commonly recommended for people who strength train. The extra calories of a bulk go to carbohydrates and fat, which fuel your training.',
      },
      {
        q: "I'm eating my target but the scale isn't moving. What now?",
        a: 'Check your weekly average weight after two to three weeks. If it has not gone up, add 100 to 200 calories a day, mostly from carbohydrates, and check again.',
      },
      {
        q: 'How long should a bulk last?',
        a: 'Long enough to see real strength and size gains, usually several months. Set a target weight in the calculator to get an estimate of how many weeks it could take at your pace.',
      },
    ],
  },
  {
    path: '/macro-calculator',
    ogTitle: 'Macro Calculator',
    ogSubtitle: 'Protein, carbs and fat for your goal',
    linkLabel: 'Macro calculator',
    title: 'Macro Calculator: Protein, Carbs & Fat | CalBudge',
    description:
      'Free macro calculator. Get daily protein, carb and fat targets based on your bodyweight and goal, then copy them into MyFitnessPal, MacroFactor or Cal AI.',
    h1: 'Macro calculator',
    intro:
      'Get daily protein, carb and fat targets built around your calorie budget and bodyweight. Copy them straight into your tracking app.',
    cta: 'Calculate my macros',
    sections: [
      {
        heading: 'How your macros are calculated',
        paragraphs: [
          'First CalBudge works out your daily calorie target from your TDEE and goal. That target is then split into macros: protein at 1.8 g per kg of bodyweight, fat at 25% of your calories, and carbohydrates making up the remainder.',
          'Protein is set from bodyweight rather than as a percentage, so it stays high enough to protect muscle whether you are cutting or bulking.',
        ],
      },
      {
        heading: 'Use your macros in your tracker',
        paragraphs: [
          'On the results screen, choose "Export to app" to copy your calorie and macro targets in a format ready to paste into MyFitnessPal, MacroFactor or Cal AI. You can also download them as an image or PDF.',
        ],
      },
    ],
    example: {
      heading: 'Example: the same person on three goals',
      intro:
        'A 35-year-old woman, 165 cm and 65 kg, who trains 3 times a week has a maintenance of about 1,970 calories. Here are her macros on a mild cut, at maintenance and on a mild bulk:',
      columns: ['Goal', 'Calories', 'Protein', 'Carbs', 'Fat'],
      rows: [
        ['Mild cut', '1,774', '117 g', '216 g', '49 g'],
        ['Maintain', '1,971', '117 g', '253 g', '55 g'],
        ['Mild bulk', '2,168', '117 g', '290 g', '60 g'],
      ],
      note: 'Protein stays at 117 g (1.8 × 65 kg) whatever the goal. Fat moves with calories at 25% of the total, and carbohydrates absorb the rest of the change.',
    },
    faqs: [
      {
        q: 'Why is my protein the same whether I cut or bulk?',
        a: 'Because it is set from your bodyweight, not as a percentage of calories. A percentage would cut your protein just when you need it most: in a deficit, when you are trying to hold on to muscle.',
      },
      {
        q: 'What macro split is best for fat loss?',
        a: 'Your calorie target decides whether you lose weight. Within that, enough protein matters most for keeping muscle. How you divide the rest between carbohydrates and fat is mostly down to preference and what helps you stick to the plan.',
      },
      {
        q: 'Can I swap some carbs for fat?',
        a: 'Yes, as long as the calories stay the same. A gram of carbohydrate has 4 calories and a gram of fat has 9, so dropping 45 g of carbs (180 calories) makes room for 20 g of fat. Keep protein where it is.',
      },
      {
        q: 'How much protein do I need per kg of bodyweight?',
        a: 'Research on people who strength train puts the useful range at roughly 1.6 to 2.2 g per kg of bodyweight, with most of the benefit reached by about 1.6 g. CalBudge uses 1.8 g/kg, comfortably inside that range.',
      },
      {
        q: 'Do I have to hit my macros exactly?',
        a: 'No. Landing within 5 to 10 grams of each target is plenty. Hitting your calories and protein consistently matters far more than precision on carbs and fat.',
      },
    ],
  },
  {
    path: '/coaches',
    kind: 'bulk',
    ogTitle: 'Bulk Macro Calculator for Coaches',
    ogSubtitle: 'Upload your clients, get a report for each',
    linkLabel: 'Bulk calculator for coaches',
    title: 'Bulk Macro Calculator for Coaches: Client Reports from a CSV | CalBudge',
    description:
      'Free bulk calorie and macro calculator for coaches. Upload a CSV of clients and download a PDF report with targets, macros and meal splits for each.',
    h1: 'Bulk macro calculator for coaches',
    intro:
      'Upload a spreadsheet of your clients and get calorie targets, macro splits and meal plans for all of them at once. Download a PDF report with a page per client, or a spreadsheet of results.',
    cta: 'Upload client file',
    sections: [
      {
        heading: 'What the report includes',
        paragraphs: [
          'The PDF starts with a summary page listing every client with their goal, calorie target and macros. Each client then gets their own page with their daily target, maintenance calories (TDEE), BMR, a macro table with grams and calories, a meal-by-meal split and, if you included a target weight, an estimated timeline.',
          'Every client is calculated with exactly the same formulas and safety limits as the single-person calculator: Mifflin-St Jeor or Katch-McArdle for BMR, an activity factor from training and steps, and a target that never drops below 1.2 times BMR or 1,200 calories.',
        ],
      },
      {
        heading: 'Private by design',
        paragraphs: [
          'Your file is read and calculated entirely in your browser. Client names, measurements and results are never uploaded to a server, so you can use it with real client data.',
        ],
      },
    ],
  },
];

export function findPage(pathname: string): LandingPage {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return PAGES.find(p => p.path === normalized) ?? PAGES[0];
}
