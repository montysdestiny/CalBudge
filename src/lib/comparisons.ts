import type { Article } from '@/lib/articles';

// Comparison pages: CalBudge next to the tools people weigh it against.
// Bottom of the funnel: people searching these are close to choosing.
//
// Keep them honest and checkable. Only state facts about other products that
// are in their own public material, say where they are better, and re-check
// prices and features at least every six months (update `updated`). Prices
// are US list prices and vary by region; they are given as approximate.
// CalBudge has no affiliation with any of these companies.

const CHECKED = 'November 2026';

export const COMPARISONS: Article[] = ([
  {
    slug: 'best-free-calorie-and-macro-calculators',
    linkLabel: 'Best free calorie and macro calculators',
    title: 'Best Free Calorie and Macro Calculators (2026 Comparison) | CalBudge',
    description:
      'CalBudge, MyFitnessPal, MacroFactor, Cronometer and TDEE Calculator compared: what is free, whether you need an account, which formulas they use and who each one suits.',
    h1: 'The best free calorie and macro calculators, compared',
    dek: 'Calculators set your numbers; trackers log your food. Here is what each popular option does for free, and which one fits what you need.',
    ogTitle: 'Best free macro calculators',
    ogSubtitle: 'CalBudge, MyFitnessPal, MacroFactor and more',
    published: '2026-11-21',
    readMinutes: 6,
    shortAnswer:
      'To set your calorie and macro targets for free without an account, use a calculator: CalBudge (adds a meal-by-meal split and a bulk tool for coaches) or TDEE Calculator. To log food every day, use a tracker: MyFitnessPal and Cronometer have free tiers, while MacroFactor is paid but adjusts your targets to your weight trend. Many people set targets in a calculator and enter them into their tracker.',
    body: [
      { h2: 'Calculators and trackers do different jobs' },
      {
        p: 'A calculator answers “how much should I eat?” once: it estimates your BMR and TDEE and turns your goal into a daily target. A tracker answers “how much am I eating?” every day, by logging food. Most trackers include a goal-setting step, but it is usually short, and some put the finer controls behind a subscription. The two work well together: get your numbers from a calculator, then type them into the tracker you like.',
      },
      { h2: 'At a glance' },
      {
        table: {
          columns: ['', 'Free to use', 'Account needed', 'Food logging', 'Adjusts targets to your results', 'Best for'],
          rows: [
            ['CalBudge', 'Yes, all of it', 'No', 'No', 'No (guides you to recalculate)', 'Targets with a meal split; coaches doing many clients'],
            ['TDEE Calculator', 'Yes', 'No', 'No', 'No', 'A quick TDEE estimate'],
            ['MyFitnessPal', 'Free tier; Premium about $80/year', 'Yes', 'Yes', 'No', 'Logging with a huge food database'],
            ['Cronometer', 'Free tier; Gold is paid', 'Yes', 'Yes', 'No', 'Detailed micronutrient tracking'],
            ['MacroFactor', 'No free tier; about $72/year after a trial', 'Yes', 'Yes', 'Yes, weekly', 'Serious dieters who log every day'],
          ],
          caption: `Checked ${CHECKED} from each product’s public information. Prices are approximate US list prices and vary by region.`,
        },
      },
      { h2: 'CalBudge' },
      {
        p: 'A free calorie and macro calculator with no signup. It estimates BMR with Mifflin-St Jeor, or Katch-McArdle when you know your body fat, sets your activity from gym and cardio sessions plus daily steps, and gives a target for your goal with a safety floor on every cut. It then splits that target meal by meal, with protein, carbohydrate and fat for each. Answers are processed in your browser. You can copy the targets into MyFitnessPal, MacroFactor or Cal AI, or save them as an image or PDF. Coaches can [upload a whole client list](/coaches) and get a PDF report for every client.',
      },
      {
        p: 'Where it falls short: CalBudge does not log food, and it does not adjust your targets automatically as your weight changes. You recalculate when your weight moves, or follow [this guide when progress stalls](/guides/not-losing-weight-in-calorie-deficit).',
      },
      { h2: 'TDEE Calculator (tdeecalculator.net)' },
      {
        p: 'A long-running free calculator. Its own documentation says it uses Mifflin-St Jeor and switches to Katch-McArdle when you enter a body fat percentage, the same pair of formulas CalBudge uses. A good choice if all you want is a maintenance estimate.',
      },
      { h2: 'MyFitnessPal' },
      {
        p: 'The best-known food tracker, with a very large food database. The free tier covers a full food diary with calorie and macro tracking, with ads. Macro goals on the free tier are set as percentages of calories; goals in grams, per-meal goals, barcode scanning and an ad-free app need Premium. [CalBudge vs MyFitnessPal](/guides/calbudge-vs-myfitnesspal) goes into detail.',
      },
      { h2: 'Cronometer' },
      {
        p: 'A tracker known for detail: the free tier tracks calories, macros and micronutrients, and includes a barcode scanner. Gold, the paid plan, removes ads and adds extra tools and reports. Best if you care about vitamins and minerals as much as calories. See [CalBudge vs Cronometer](/guides/calbudge-vs-cronometer).',
      },
      { h2: 'MacroFactor' },
      {
        p: 'A paid tracker whose main feature is an algorithm that estimates your real energy expenditure from your logged food and weight trend, and adjusts your targets each week. It has no free tier after the trial. Worth it if you log consistently and want the app to do the adjusting. See [CalBudge vs MacroFactor](/guides/calbudge-vs-macrofactor).',
      },
      { h2: 'Which should you use?' },
      {
        list: [
          'You want your numbers, free, without signing up: [CalBudge](/) or TDEE Calculator. Choose CalBudge if you also want each meal planned out.',
          'You want to log food without paying: MyFitnessPal or Cronometer, with targets from a calculator.',
          'You log every day and want targets that adapt: MacroFactor.',
          'You coach several clients: CalBudge’s [bulk calculator](/coaches) does a whole roster from one spreadsheet, free. See [the options for coaches compared](/guides/best-macro-calculator-for-personal-trainers).',
        ],
      },
      {
        tip: 'Whichever tracker you pick, a calculator is the quickest way to set it up. Get your targets from CalBudge, then copy them across in one tap.',
      },
    ],
    faqs: [
      {
        q: 'What is the most accurate calorie calculator?',
        a: 'Most good calculators use the same equations: Mifflin-St Jeor, which reviews have found the most reliable for healthy adults, or Katch-McArdle when body fat is known. Differences between calculators come mostly from how they estimate activity. Any estimate is a starting point; adjust after two to three weeks based on your weight trend.',
      },
      {
        q: 'Is there a free macro calculator without signing up?',
        a: 'Yes. CalBudge needs no account or email and works out calories, macros and a meal-by-meal split. TDEE Calculator also works without an account.',
      },
      {
        q: 'Do I need a tracking app if I use a calculator?',
        a: 'Not necessarily. Some people eat to a meal plan built from their targets. Tracking food helps you check you are actually hitting the numbers, so many people use both: a calculator for the targets and a tracker for the logging.',
      },
    ],
    calculator: { path: '/', label: 'Calculate my targets' },
    related: ['calbudge-vs-myfitnesspal', 'calbudge-vs-macrofactor', 'calbudge-vs-cronometer'],
  },
  {
    slug: 'best-macro-calculator-for-personal-trainers',
    linkLabel: 'Macro calculators for coaches compared',
    title: 'Best Free Macro Calculator for Personal Trainers and Coaches (2026) | CalBudge',
    description:
      'How personal trainers can calculate calories and macros for many clients at once: bulk calculators, spreadsheet templates, single-client calculators and coaching platforms compared.',
    h1: 'The best way to calculate macros for all your clients',
    dek: 'Most free macro calculators do one person at a time. Here are the options for a whole client list, from spreadsheets to bulk tools, and what each costs.',
    ogTitle: 'Macro calculators for coaches',
    ogSubtitle: 'Do your whole client list at once',
    published: '2026-11-21',
    readMinutes: 5,
    shortAnswer:
      'To calculate calories and macros for many clients at once for free, use CalBudge’s bulk calculator: upload a spreadsheet of clients (CSV, up to 1,000 per file) and get every client’s calorie target, TDEE, BMR, macros and meal split, with a PDF report. It needs no account and the file never leaves your browser. The alternatives are building your own Google Sheets formulas, entering clients one by one into a single-person calculator, or a paid coaching platform.',
    body: [
      { h2: 'The four ways to do it' },
      {
        table: {
          columns: ['', 'Clients at once', 'Cost', 'Setup', 'Output', 'Best for'],
          rows: [
            ['CalBudge bulk calculator', 'Yes, from one spreadsheet', 'Free, no account', 'Fill in a template', 'PDF report per client, or CSV', 'Setting starting targets for a roster'],
            ['Your own spreadsheet formulas', 'Yes, one row per client', 'Free', 'Write and check the formulas yourself', 'Whatever you build', 'Coaches who want to customise the maths'],
            ['Single-person calculators', 'No, one at a time', 'Usually free', 'None', 'On-screen numbers', 'An occasional new client'],
            ['Coaching platforms with nutrition tools', 'Per client, inside the app', 'Paid subscription, often after a trial', 'Onboard each client', 'Targets in the client’s app', 'Delivering and tracking plans day to day'],
          ],
          caption: `Checked ${CHECKED}.`,
        },
      },
      { h2: 'CalBudge’s bulk calculator' },
      {
        p: 'Download the template, add one client per row (name, sex, age, height, weight, gym and cardio sessions per week, goal and pace; steps, body fat and target weight are optional), and upload it. Every client is calculated with Mifflin-St Jeor, or Katch-McArdle when you include body fat, an activity factor from sessions and steps, and a target that never drops below 1.2 × BMR or 1,200 calories. You get a summary page plus a page per client with their target, TDEE, BMR, macros, a meal-by-meal split and, with a target weight, a timeline. The spreadsheet is read in your browser and never uploaded, which matters for client health data.',
      },
      { p: 'Where it stops: it sets starting targets. It does not deliver plans to clients’ phones or track their check-ins. [Open the bulk calculator](/coaches).' },
      { h2: 'Building your own spreadsheet' },
      {
        p: 'A Google Sheets or Excel sheet with one row per client and formula columns for BMR, TDEE, target and macros is free and fully customisable. The catch is the work: writing the formulas, adding safety limits so no target goes too low, handling kg and lb, and making something presentable to send. [Our method for coaches](/guides/how-to-calculate-macros-for-clients) lists the formulas if you want to build it.',
      },
      { h2: 'Single-person macro calculators' },
      {
        p: 'Free calculators such as CalBudge’s own [macro calculator](/macro-calculator) are quick for one person. For a roster you re-enter every client by hand and copy the results out, which is fine for one new client a week and slow for thirty.',
      },
      { h2: 'Coaching platforms' },
      {
        p: 'Paid coaching platforms, Everfit and Trainerize among them, include nutrition tools alongside programming, messaging and check-ins. They make sense if you want clients to receive and log their plans in an app. They cost a monthly subscription, and targets are set client by client as you onboard them.',
      },
      {
        tip: 'A common setup: calculate starting targets for everyone in CalBudge’s bulk calculator, then enter them into whichever app your clients already use.',
      },
    ],
    faqs: [
      {
        q: 'Is there a free tool to calculate macros for all my clients at once?',
        a: 'Yes. CalBudge’s bulk calculator takes a CSV of up to 1,000 clients and calculates calories, TDEE, BMR, macros and a meal split for each, with a downloadable PDF report. It is free, needs no account, and processes the file in your browser.',
      },
      {
        q: 'Can I import my client spreadsheet from Excel or Google Sheets?',
        a: 'Yes. Save or download it as CSV from Excel, Google Sheets or Numbers. CalBudge’s template shows the column names; heights and weights can be in cm and kg or inches and pounds.',
      },
      {
        q: 'Is it safe to upload client data to a macro calculator?',
        a: 'It depends where the data goes. CalBudge’s bulk calculator never uploads it: the file is read and the reports are created on your own device.',
      },
    ],
    calculator: { path: '/coaches', label: 'Open the bulk calculator' },
    related: ['how-to-calculate-macros-for-clients', 'best-free-calorie-and-macro-calculators', 'calbudge-vs-myfitnesspal'],
  },
  {
    slug: 'calbudge-vs-myfitnesspal',
    linkLabel: 'CalBudge vs MyFitnessPal',
    title: 'CalBudge vs MyFitnessPal: Calorie Calculator Compared | CalBudge',
    description:
      'CalBudge and MyFitnessPal compared for setting calorie and macro goals: cost, accounts, formulas, gram-based macros and meal planning. Use them together for free.',
    h1: 'CalBudge vs MyFitnessPal',
    dek: 'One sets your targets, the other logs your food. Here is where each is stronger, and how to use both without paying for Premium.',
    ogTitle: 'CalBudge vs MyFitnessPal',
    ogSubtitle: 'Setting calorie and macro goals compared',
    published: '2026-11-21',
    readMinutes: 4,
    shortAnswer:
      'MyFitnessPal is a food tracker; CalBudge is a calculator. Use CalBudge to work out your calories and gram-based macro targets for free, with no account, then log food in MyFitnessPal. On MyFitnessPal’s free tier, macro goals are set as percentages; goals in grams need Premium (about $80 a year in the US).',
    body: [
      { h2: 'Side by side' },
      {
        table: {
          columns: ['', 'CalBudge', 'MyFitnessPal'],
          rows: [
            ['What it is', 'Calorie and macro calculator', 'Food and exercise tracker'],
            ['Price', 'Free', 'Free tier; Premium about $80/year'],
            ['Account', 'Not needed', 'Required'],
            ['Food logging and database', 'No', 'Yes, very large database'],
            ['How it estimates your calories', 'Mifflin-St Jeor or Katch-McArdle, activity from sessions and steps', 'Built into sign-up, from your profile and activity level'],
            ['Macro targets in grams', 'Yes, free', 'Premium (free tier uses percentages)'],
            ['Meal-by-meal targets', 'Yes, free', 'Per-meal goals are Premium'],
            ['Barcode scanning', 'No', 'Premium'],
            ['Bulk tool for coaches', 'Yes, free', 'No'],
          ],
          caption: `MyFitnessPal details from its public plan information, checked ${CHECKED}. Prices vary by region.`,
        },
      },
      { h2: 'Where MyFitnessPal is better' },
      {
        p: 'Logging. MyFitnessPal’s food database is one of the largest available, it syncs with many fitness apps and devices, and the free tier lets you keep a full food diary. If you want to record what you eat every day, it does something CalBudge does not do at all.',
      },
      { h2: 'Where CalBudge is better' },
      {
        list: [
          'Precise targets for free: calories plus protein, carbohydrate and fat in grams, without Premium.',
          'More control over the estimate: enter your body fat to use Katch-McArdle, or a BMR you already know, and your activity is worked out from training sessions and daily steps rather than one activity label.',
          'A meal-by-meal split, so you know what breakfast, lunch, dinner and snacks should look like.',
          'No account, no email, no ads. Your answers are processed in your browser.',
          'Coaches can calculate a whole client list at once with the [bulk calculator](/coaches).',
        ],
      },
      { h2: 'Use them together' },
      {
        p: 'Work out your targets on [CalBudge](/), then tap MyFitnessPal under the results to copy your calories and macros, with the place to enter them in the app (Goals, then Nutrition Goals). On the free tier, MyFitnessPal stores macros as percentages, so enter your calories and choose the percentages closest to your gram targets; with Premium you can enter the grams exactly.',
      },
      { tip: 'Recalculate in CalBudge every 4 to 5 kg of weight change and update the goal in MyFitnessPal, since your maintenance moves with your weight.' },
    ],
    faqs: [
      {
        q: 'Is the MyFitnessPal calorie goal accurate?',
        a: 'It is a reasonable starting estimate, but it rests on a single activity level you choose. CalBudge builds activity from how many sessions you train and your daily steps, and lets you use body fat for a more precise BMR. Either way, check your weight trend after two to three weeks and adjust.',
      },
      {
        q: 'Can I set macros in grams on MyFitnessPal for free?',
        a: 'On the free tier, macro goals are percentages of your calories; gram-based goals are a Premium feature. CalBudge gives your macros in grams for free, which you can convert to the nearest percentages for the free tier.',
      },
      {
        q: 'Does CalBudge replace MyFitnessPal?',
        a: 'No. CalBudge sets your targets; it does not log food. Use it alongside MyFitnessPal, or any tracker.',
      },
    ],
    calculator: { path: '/', label: 'Get my targets for MyFitnessPal' },
    related: ['best-free-calorie-and-macro-calculators', 'calbudge-vs-macrofactor', 'calbudge-vs-cronometer'],
  },
  {
    slug: 'calbudge-vs-macrofactor',
    linkLabel: 'CalBudge vs MacroFactor',
    title: 'CalBudge vs MacroFactor: Free Calculator or Adaptive App? | CalBudge',
    description:
      'CalBudge and MacroFactor compared: a free calorie and macro calculator against a paid tracker that adapts your targets weekly. Cost, features and who each suits.',
    h1: 'CalBudge vs MacroFactor',
    dek: 'MacroFactor adapts your targets every week if you log every day. CalBudge sets them for free in a minute. Which you need depends on how you diet.',
    ogTitle: 'CalBudge vs MacroFactor',
    ogSubtitle: 'Free calculator or adaptive tracker?',
    published: '2026-11-21',
    readMinutes: 4,
    shortAnswer:
      'MacroFactor is a paid food tracker (about $72 a year in the US after a free trial, with no free tier) that adjusts your calorie and macro targets every week from your logged food and weight. CalBudge is a free calculator that sets your targets in about a minute, with no account. Choose MacroFactor if you will log daily and want the app to adjust for you; choose CalBudge for free targets, a meal split or a whole client list.',
    body: [
      { h2: 'Side by side' },
      {
        table: {
          columns: ['', 'CalBudge', 'MacroFactor'],
          rows: [
            ['What it is', 'Calorie and macro calculator', 'Food tracker with adaptive targets'],
            ['Price', 'Free', 'About $72/year after a trial; no free tier'],
            ['Account', 'Not needed', 'Required'],
            ['Food logging', 'No', 'Yes'],
            ['Targets adapt to your results', 'No: recalculate as your weight changes', 'Yes, weekly, from intake and weight trend'],
            ['Starting estimate', 'Mifflin-St Jeor or Katch-McArdle, sessions and steps', 'Initial estimate, then learned from your data'],
            ['Meal-by-meal split', 'Yes', 'No'],
            ['Bulk tool for coaches', 'Yes, free', 'No'],
          ],
          caption: `MacroFactor details from its public app listing and website, checked ${CHECKED}. Prices vary by region.`,
        },
      },
      { h2: 'Where MacroFactor is better' },
      {
        p: 'Adjusting over time. Any formula, CalBudge’s included, gives an estimate that can be off by a few hundred calories for a given person. MacroFactor corrects for that automatically by comparing what you log with how your weight trend moves, then updating your targets each week. If you log consistently, that removes most of the guesswork.',
      },
      { h2: 'Where CalBudge is better' },
      {
        list: [
          'It is free, with nothing to subscribe to or cancel.',
          'No account, and nothing to log: your targets in about a minute.',
          'A meal-by-meal split, useful if you eat to a plan rather than logging.',
          'The same correction MacroFactor automates, done by hand: [this guide](/guides/not-losing-weight-in-calorie-deficit) shows how to adjust from your weight trend.',
          'A free [bulk calculator for coaches](/coaches), for setting starting targets for a whole client list.',
        ],
      },
      { h2: 'Using CalBudge with MacroFactor' },
      {
        p: 'If you want to set your own starting point, work out your targets on [CalBudge](/) and tap MacroFactor under the results to copy them, with where to enter them (Nutrition, Targets, Custom Target).',
      },
    ],
    faqs: [
      {
        q: 'Is MacroFactor free?',
        a: 'No. MacroFactor offers a free trial, then needs a subscription; it has no free tier. CalBudge is free with no account.',
      },
      {
        q: 'Is MacroFactor more accurate than a calculator?',
        a: 'Over time, yes, if you log your food and weight consistently: it learns your real expenditure. On day one both start from an estimate. You can get much of the same benefit for free by checking your weekly average weight and adjusting your calculator target by 100 to 200 calories.',
      },
      {
        q: 'Can I use CalBudge targets in MacroFactor?',
        a: 'Yes. CalBudge copies your calories and macros in a format ready to enter as a custom target.',
      },
    ],
    calculator: { path: '/', label: 'Calculate my targets free' },
    related: ['best-free-calorie-and-macro-calculators', 'calbudge-vs-myfitnesspal', 'not-losing-weight-in-calorie-deficit'],
  },
  {
    slug: 'calbudge-vs-cronometer',
    linkLabel: 'CalBudge vs Cronometer',
    title: 'CalBudge vs Cronometer: Calories, Macros and Micronutrients | CalBudge',
    description:
      'CalBudge and Cronometer compared: a free no-signup calorie and macro calculator against a detailed food tracker with micronutrients. What each does and how to use both.',
    h1: 'CalBudge vs Cronometer',
    dek: 'Cronometer tracks everything you eat, down to vitamins and minerals. CalBudge works out what you should be eating. They fit together.',
    ogTitle: 'CalBudge vs Cronometer',
    ogSubtitle: 'Calculator and tracker compared',
    published: '2026-11-21',
    readMinutes: 3,
    shortAnswer:
      'Cronometer is a food tracker whose free tier logs calories, macros and micronutrients, with a barcode scanner; its paid Gold plan removes ads and adds extra tools. CalBudge is a free calculator that sets your calorie and macro targets and a meal-by-meal split, with no account. Use CalBudge to set your numbers and Cronometer to track them.',
    body: [
      { h2: 'Side by side' },
      {
        table: {
          columns: ['', 'CalBudge', 'Cronometer'],
          rows: [
            ['What it is', 'Calorie and macro calculator', 'Detailed food tracker'],
            ['Price', 'Free', 'Free tier; Gold is paid'],
            ['Account', 'Not needed', 'Required'],
            ['Food logging', 'No', 'Yes, with a free barcode scanner'],
            ['Micronutrients', 'No', 'Yes'],
            ['Meal-by-meal targets', 'Yes', 'No'],
            ['Bulk tool for coaches', 'Yes, free', 'No'],
          ],
          caption: `Cronometer details from its public plan information, checked ${CHECKED}.`,
        },
      },
      { h2: 'Where Cronometer is better' },
      {
        p: 'Detail. Cronometer tracks vitamins, minerals and other nutrients as well as calories and macros, and much of it is free. If you want to check that your diet covers more than protein, carbohydrate and fat, it is one of the most thorough free options.',
      },
      { h2: 'Where CalBudge is better' },
      {
        list: [
          'No account or app: your targets in about a minute in the browser.',
          'Activity worked out from training sessions and daily steps, and Katch-McArdle when you know your body fat.',
          'A target for every meal, with protein, carbohydrate and fat for each.',
          'A free [bulk calculator for coaches](/coaches), for a whole client list at once.',
        ],
      },
      { h2: 'Use them together' },
      {
        p: 'Calculate your targets on [CalBudge](/), then enter your calories and macro grams as custom targets in Cronometer and log against them.',
      },
    ],
    faqs: [
      {
        q: 'Is Cronometer free?',
        a: 'Cronometer has a free tier that tracks calories, macros and micronutrients. Gold is a paid upgrade that removes ads and adds extra tools.',
      },
      {
        q: 'Should I use Cronometer or a calculator to set my calories?',
        a: 'Use a calculator to choose the numbers and a tracker to hit them. CalBudge gives you calories, macros and a meal split; Cronometer records what you actually eat.',
      },
    ],
    calculator: { path: '/', label: 'Calculate my targets' },
    related: ['best-free-calorie-and-macro-calculators', 'calbudge-vs-myfitnesspal', 'how-much-protein-per-day'],
  },
] as Article[]).map(a => ({ ...a, comparison: true }));
