// Published sources behind CalBudge's method, cited on the guides and the
// About page. Only add a source here after checking the citation and link.

export interface Source {
  text: string;
  url?: string;
}

export const SOURCES = {
  mifflin1990: {
    text: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. American Journal of Clinical Nutrition. 1990;51(2):241–247.',
    url: 'https://doi.org/10.1093/ajcn/51.2.241',
  },
  frankenfield2005: {
    text: 'Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. Journal of the American Dietetic Association. 2005;105(5):775–789.',
    url: 'https://doi.org/10.1016/j.jada.2005.02.005',
  },
  katch: {
    text: 'McArdle WD, Katch FI, Katch VL. Exercise Physiology: Nutrition, Energy, and Human Performance. Lippincott Williams & Wilkins (Katch-McArdle equation for resting energy from lean body mass).',
  },
  jager2017: {
    text: 'Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition position stand: protein and exercise. Journal of the International Society of Sports Nutrition. 2017;14:20.',
    url: 'https://doi.org/10.1186/s12970-017-0177-8',
  },
  morton2018: {
    text: 'Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. British Journal of Sports Medicine. 2018;52(6):376–384.',
    url: 'https://doi.org/10.1136/bjsports-2017-097608',
  },
  schoenfeld2018: {
    text: 'Schoenfeld BJ, Aragon AA. How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution. Journal of the International Society of Sports Nutrition. 2018;15:10.',
    url: 'https://doi.org/10.1186/s12970-018-0215-1',
  },
  helms2014: {
    text: 'Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. Journal of the International Society of Sports Nutrition. 2014;11:20.',
    url: 'https://doi.org/10.1186/1550-2783-11-20',
  },
  hall2011: {
    text: 'Hall KD, Sacks G, Chandramohan D, et al. Quantification of the effect of energy imbalance on bodyweight. The Lancet. 2011;378(9793):826–837.',
    url: 'https://doi.org/10.1016/S0140-6736(11)60812-X',
  },
  iom2005: {
    text: 'Institute of Medicine. Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids (Macronutrients). National Academies Press; 2005.',
    url: 'https://doi.org/10.17226/10490',
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
