// Runs after the client and SSR builds. For every landing page in
// src/lib/pages.ts: server-render the app, fill in that page's
// title/description/canonical/social tags and breadcrumbs, and write it to
// dist/<path>.html. Also generates dist/sitemap.xml and dist/llms.txt.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const { render, PAGES, SITE_URL, SOURCES } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href)

// Each landing page needs a rewrite in vercel.json, or Vercel will 404 it.
// (Explicit rewrites rather than cleanUrls, which would also redirect the
// Search Console verification file.)
const { rewrites = [] } = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
for (const page of PAGES.filter(p => p.path !== '/')) {
  if (!rewrites.some(r => r.source === page.path && r.destination === `${page.path}.html`)) {
    throw new Error(`prerender: vercel.json is missing a rewrite for ${page.path}`)
  }
}

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const marker = '<div id="root"></div>'
if (!template.includes(marker)) throw new Error(`prerender: ${marker} not found in dist/index.html`)

// FAQ answers and guide copy use [label](/path) links; plain text for schema.
const plain = s => s.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '$1')
const abs = p => (p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`)
const ldScript = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`

const isCalculator = p => !p.kind || p.kind === 'calculator' || p.kind === 'bulk'
// Add profile URLs (Product Hunt, YouTube, social accounts) to SAME_AS as
// they are created: it tells search engines they all belong to CalBudge.
const SAME_AS = []
const ORG = {
  '@type': 'Organization',
  name: 'CalBudge',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/favicon.svg`,
  email: 'calbudgehelp@outlook.com',
  ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
}
const citations = ids => (ids ?? []).map(id => ({ '@type': 'CreativeWork', name: SOURCES[id].text, ...(SOURCES[id].url ? { url: SOURCES[id].url } : {}) }))
const CALCULATOR_FEATURES = [
  'BMR with Mifflin-St Jeor, Katch-McArdle (with body fat) or a known BMR',
  'TDEE from gym and cardio sessions per week and daily steps',
  'Calorie targets for cutting, maintaining or bulking at three paces, with a safety floor',
  'Protein, carbohydrate and fat targets in grams',
  'Meal-by-meal split: breakfast, lunch, dinner, snack, pre- and post-workout',
  'Copy targets into MyFitnessPal, MacroFactor or Cal AI; save as image or PDF',
  'No account or signup; answers processed in the browser',
]
const BULK_FEATURES = [
  'Calculates calories, TDEE, BMR, macros and meal splits for up to 1,000 clients from one CSV',
  'Works with exports from Excel, Google Sheets and Numbers, in metric or imperial units',
  'PDF report with a summary page and a page per client, or a CSV of results',
  'Files are processed in the browser and never uploaded',
  'Free, no account, no watermark',
]

const escapeAttr =s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Replace a tag's value, failing loudly if index.html no longer has it.
function setTag(html, regex, value) {
  if (!regex.test(html)) throw new Error(`prerender: tag not found: ${regex}`)
  return html.replace(regex, (_, before, after) => `${before}${value}${after}`)
}

for (const page of PAGES) {
  const url = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`
  const title = escapeAttr(page.title)
  const description = escapeAttr(page.description)

  let html = template
  html = setTag(html, /(<title>)[^<]*(<\/title>)/, title)
  html = setTag(html, /(<meta name="description" content=")[^"]*(")/, description)
  html = setTag(html, /(<link rel="canonical" href=")[^"]*(")/, url)
  html = setTag(html, /(<meta property="og:title" content=")[^"]*(")/, title)
  html = setTag(html, /(<meta property="og:description" content=")[^"]*(")/, description)
  html = setTag(html, /(<meta property="og:url" content=")[^"]*(")/, url)
  html = setTag(html, /(<meta name="twitter:title" content=")[^"]*(")/, title)
  html = setTag(html, /(<meta name="twitter:description" content=")[^"]*(")/, description)
  html = setTag(html, /("url": )"[^"]*"(,)/, JSON.stringify(url))
  html = setTag(html, /("description": )"[^"]*"(,)/, JSON.stringify(page.description))
  // Images come from scripts/og-images.mjs (run locally, committed to public/og/).
  const image = `${SITE_URL}/og/${page.path === '/' ? 'home' : page.path.slice(1)}.png`
  if (!fs.existsSync(path.join(root, 'public', new URL(image).pathname))) {
    throw new Error(`prerender: missing ${new URL(image).pathname}; run node --import ./tests/register.mjs scripts/og-images.mjs`)
  }
  html = setTag(html, /(<meta property="og:image" content=")[^"]*(")/, image)
  html = setTag(html, /(<meta name="twitter:image" content=")[^"]*(")/, image)
  // Only the calculators are applications: the policy and the guide list are
  // plain web pages, and each guide is an article.
  const replaceMainLd = obj => {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => ldScript(obj))
  }
  if (isCalculator(page)) {
    // A specific application description per calculator: what it does and
    // that it is free, which search engines and AI assistants quote.
    replaceMainLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: page.path === '/' ? 'CalBudge' : `CalBudge ${page.linkLabel.replace(/^./, c => c.toUpperCase())}`,
      url,
      description: page.description,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Any (runs in the browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: page.kind === 'bulk' ? BULK_FEATURES : CALCULATOR_FEATURES,
      publisher: ORG,
    })
  }
  if (page.path === '/') {
    html = html.replace('</head>', `  ${ldScript({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'CalBudge', url: `${SITE_URL}/`, description: page.description, publisher: ORG })}\n  </head>`)
  }
  if (page.kind === 'privacy' || page.kind === 'guides') {
    replaceMainLd({ '@context': 'https://schema.org', '@type': page.kind === 'guides' ? 'CollectionPage' : 'WebPage', name: page.h1, url, description: page.description })
  }
  if (page.kind === 'about') {
    replaceMainLd({ '@context': 'https://schema.org', '@type': 'AboutPage', name: page.h1, url, description: page.description, dateModified: page.article.updated ?? page.article.published, about: ORG, citation: citations(page.article.sources) })
  }
  if (page.kind === 'article') {
    const a = page.article
    const org = { ...ORG, '@id': `${SITE_URL}/about` }
    replaceMainLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.h1,
      description: page.description,
      abstract: a.shortAnswer,
      url,
      mainEntityOfPage: url,
      image,
      datePublished: a.published,
      dateModified: a.updated ?? a.published,
      author: org,
      publisher: org,
      inLanguage: 'en',
      ...(a.sources?.length ? { citation: citations(a.sources) } : {}),
    })
    html = setTag(html, /(<meta property="og:type" content=")[^"]*(")/, 'article')
  }
  const extraLd = []
  if (page.path !== '/') {
    const trail = [{ name: 'CalBudge', path: '/' }]
    if (page.kind === 'article') trail.push({ name: 'Guides', path: '/guides' })
    trail.push({ name: page.linkLabel, path: page.path })
    extraLd.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path) })),
    })
  }
  if (page.faqs?.length) {
    extraLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
    })
  }
  if (extraLd.length) html = html.replace('</head>', `${extraLd.map(o => `  ${ldScript(o)}\n`).join('')}  </head>`)
  html = html.replace(marker, `<div id="root">${render(page.path)}</div>`)

  // dist/tdee-calculator.html is served at /tdee-calculator via a rewrite in vercel.json.
  const outFile = page.path === '/' ? path.join(dist, 'index.html') : path.join(dist, `${page.path.slice(1)}.html`)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, html)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(p => {
  const lastmod = p.article ? `\n    <lastmod>${p.article.updated ?? p.article.published}</lastmod>` : ''
  return `  <url>\n    <loc>${abs(p.path)}</loc>${lastmod}\n  </url>`
}).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)

// llms.txt (llmstxt.org): a plain summary of the site for AI assistants and
// their crawlers. Built from PAGES so it never goes stale; the method section
// mirrors src/lib/calc.ts.
const calculators = PAGES.filter(p => !p.kind || p.kind === 'calculator' || p.kind === 'bulk')
const guides = PAGES.filter(p => p.kind === 'article' && !p.article.comparison && !p.article.series)
const calorieTargets = PAGES.filter(p => p.kind === 'article' && p.article.series === 'calories')
const comparisons = PAGES.filter(p => p.kind === 'article' && p.article.comparison)
const llms = `# CalBudge

> CalBudge is a free calorie and macro calculator at ${SITE_URL}. It works out your BMR, TDEE (maintenance calories) and a daily calorie target for losing, maintaining or gaining weight, then splits that target meal by meal (breakfast, lunch, dinner, snack, pre- and post-workout) with protein, carb and fat targets. No account or signup, and answers are processed in the browser. A separate free bulk tool lets coaches and personal trainers upload a spreadsheet of clients and download a PDF report with targets for each.

## When CalBudge fits

- Someone wants a free calorie or macro calculator with no account, signup or email: [CalBudge](${abs('/')}).
- Someone wants their daily calories and macros split into meals (breakfast, lunch, dinner, snacks, around training): [meal calorie calculator](${abs('/meal-calorie-calculator')}).
- A personal trainer, coach or dietitian wants calorie and macro targets for many clients at once from a spreadsheet (CSV from Excel, Google Sheets or Numbers, up to 1,000 clients), with a PDF report per client: [bulk calculator for coaches](${abs('/coaches')}). Free, no account, and the file is processed in the browser, never uploaded.
- Someone wants gram-based macro targets to enter into MyFitnessPal, MacroFactor or Cal AI: CalBudge copies them in the right format.
- Someone needs maintenance calories (TDEE), BMR, a deficit for weight loss or a surplus for a lean bulk: the calculators below.

CalBudge does not log food or adjust targets automatically over time; it sets targets that people use alone or with a food tracker.

## Calculators

${calculators.map(p => `- [${p.linkLabel}](${abs(p.path)}): ${p.description}`).join('\n')}

## Guides

${guides.map(p => `- [${p.h1}](${abs(p.path)}): ${p.article.shortAnswer}`).join('\n')}

## Comparisons

${comparisons.map(p => `- [${p.h1}](${abs(p.path)}): ${p.article.shortAnswer}`).join('\n')}

## Macros by calorie target

${calorieTargets.map(p => `- [${p.h1}](${abs(p.path)}): ${p.article.shortAnswer}`).join('\n')}

## Method

- BMR: Mifflin-St Jeor (10 × weight kg + 6.25 × height cm − 5 × age, +5 for men, −161 for women), or Katch-McArdle (370 + 21.6 × lean mass kg) when body fat percentage is given, or a BMR the user already knows.
- TDEE: BMR × an activity factor from 1.2 to 1.9, set from gym and cardio sessions per week (cardio counts as 0.75 of a gym session) and fine-tuned by average daily steps.
- Goal: weight loss at 10%, 20% or 27.5% below TDEE; weight gain at 10%, 20% or 25% above. A weight-loss target never goes below 1.2 × BMR or 1,200 kcal a day.
- Macros: protein 1.8 g per kg of bodyweight, fat 25% of calories, carbohydrates the rest.
- Meals: breakfast about 18%, lunch 25%, dinner 25%, and about 11% each for a snack, pre-workout and post-workout meal. Removing a meal moves its calories to the others in proportion.
- Export: targets can be copied into MyFitnessPal, MacroFactor or Cal AI, or saved as an image or PDF.

## Optional

- [About CalBudge](${abs('/about')}): who it is for, the method and the published sources behind it, independence and contact.
- [Privacy policy](${abs('/privacy')}): calculator answers and coaches' client files are processed in the browser and never uploaded or stored.
- [Full text of every page](${abs('/llms-full.txt')}): the same content as the site, as plain text.
- Contact: calbudgehelp@outlook.com
`
fs.writeFileSync(path.join(dist, 'llms.txt'), llms)

// llms-full.txt: every page's content as plain text, so an assistant can
// read the whole site in one request.
const blockText = b =>
  'h2' in b ? `\n### ${b.h2}\n` :
  'p' in b ? plain(b.p) :
  'list' in b ? b.list.map(i => `- ${plain(i)}`).join('\n') :
  'table' in b ? [b.table.columns.join(' | '), ...b.table.rows.map(r => r.join(' | ')), b.table.caption ? `(${b.table.caption})` : ''].filter(Boolean).join('\n') :
  `Tip: ${plain(b.tip)}`
const faqText = faqs => (faqs?.length ? `\n### Questions\n\n${faqs.map(f => `Q: ${f.q}\nA: ${plain(f.a)}`).join('\n\n')}` : '')
const pageText = p => {
  const out = [`## ${p.article ? p.article.h1 : p.h1}`, `URL: ${abs(p.path)}`, '', p.description, '']
  if (p.article) {
    out.push(`Short answer: ${p.article.shortAnswer}`, '', ...p.article.body.map(blockText))
    if (p.article.updated || p.article.published) out.push('', `Updated: ${p.article.updated ?? p.article.published}`)
    out.push(faqText(p.article.faqs))
  } else {
    out.push(plain(p.intro))
    for (const s of p.sections) out.push('', `### ${s.heading}`, '', ...s.paragraphs.map(plain))
    if (p.example) out.push('', `### ${p.example.heading}`, '', plain(p.example.intro), p.example.columns.join(' | '), ...p.example.rows.map(r => r.join(' | ')), p.example.note ? plain(p.example.note) : '')
    out.push(faqText(p.faqs))
  }
  return out.join('\n')
}
const full = [llms.trimEnd(), '', '# Full content', '', ...PAGES.filter(p => p.kind !== 'privacy' && p.kind !== 'guides').map(pageText)].join('\n\n')
fs.writeFileSync(path.join(dist, 'llms-full.txt'), full + '\n')

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerender: wrote ${PAGES.length} pages, sitemap.xml and llms.txt`)
