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
  /** Goal pre-selected on the goal step when started from this page. */
  presetGoal?: Goal;
  /** Page-specific explainer shown above the shared "how it works" content. */
  sections: { heading: string; paragraphs: string[] }[];
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
  },
];

export function findPage(pathname: string): LandingPage {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return PAGES.find(p => p.path === normalized) ?? PAGES[0];
}
