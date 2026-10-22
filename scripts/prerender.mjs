// Runs after the client and SSR builds. For every landing page in
// src/lib/pages.ts: server-render the app, fill in that page's
// title/description/canonical/social tags, and write it to
// dist/<path>.html. Also generates dist/sitemap.xml.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const { render, PAGES, SITE_URL } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href)

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

const escapeAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

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
  html = html.replace(marker, `<div id="root">${render(page.path)}</div>`)

  // dist/tdee-calculator.html is served at /tdee-calculator via a rewrite in vercel.json.
  const outFile = page.path === '/' ? path.join(dist, 'index.html') : path.join(dist, `${page.path.slice(1)}.html`)
  fs.writeFileSync(outFile, html)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(p => `  <url>\n    <loc>${p.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${p.path}`}</loc>\n  </url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerender: wrote ${PAGES.length} pages and sitemap.xml`)
