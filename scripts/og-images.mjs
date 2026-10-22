// Generates the social preview images (public/og/*.png), one per landing
// page in src/lib/pages.ts. Run locally after changing page titles:
//   node scripts/og-images.mjs
// Needs Google Chrome (set CHROME_PATH if it isn't in the default spot).
// The PNGs are committed, so Vercel builds don't need Chrome.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PAGES } from '../src/lib/pages.ts'

const root = path.resolve(import.meta.dirname, '..')
const outDir = path.join(root, 'public/og')
const chrome =
  process.env.CHROME_PATH ??
  (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : 'google-chrome')
const fontUrl = pathToFileURL(
  path.join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
).href

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function ogImageName(pagePath) {
  return pagePath === '/' ? 'home.png' : `${pagePath.slice(1)}.png`
}

function html(page) {
  const long = page.ogTitle.length > 30
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Inter; src: url("${fontUrl}") format("woff2"); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #1B2A4A; font-family: Inter, sans-serif; color: #F4F6F9; }
  .frame { position: relative; height: 100%; padding: 64px 72px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 34px; font-weight: 700; letter-spacing: -0.01em; }
  .main { margin-top: auto; margin-bottom: auto; max-width: ${long ? 720 : 760}px; }
  h1 { font-size: ${long ? 64 : 80}px; line-height: 1.05; font-weight: 700; letter-spacing: -0.03em; text-wrap: balance; }
  .rule { width: 120px; height: 6px; background: #C9A227; border-radius: 3px; margin: 32px 0 26px; }
  .sub { font-size: 32px; color: #B9C2D1; }
  .foot { font-size: 24px; color: #8891A3; }
  .ring { position: absolute; right: -40px; top: 50%; transform: translateY(-50%); }
</style></head><body><div class="frame">
  <svg class="ring" width="440" height="440" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="17" fill="none" stroke="#24375c" stroke-width="5" />
    <circle cx="24" cy="24" r="17" fill="none" stroke="#C9A227" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="74 107" transform="rotate(-90 24 24)" />
  </svg>
  <div class="brand">
    <svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#F4F6F9" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#C7CEDA" stroke-width="6" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#C9A227" stroke-width="6" stroke-linecap="round"
        stroke-dasharray="61 88" transform="rotate(-90 24 24)" />
    </svg>
    CalBudge
  </div>
  <div class="main">
    <h1>${escapeHtml(page.ogTitle)}</h1>
    <div class="rule"></div>
    <div class="sub">${escapeHtml(page.ogSubtitle)}</div>
  </div>
  <div class="foot">cal-budge.vercel.app · Free, no signup</div>
</div></body></html>`
}

fs.mkdirSync(outDir, { recursive: true })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'calbudge-og-'))
for (const page of PAGES) {
  const htmlFile = path.join(tmp, 'page.html')
  fs.writeFileSync(htmlFile, html(page))
  const out = path.join(outDir, ogImageName(page.path))
  const res = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    '--virtual-time-budget=2000',
    `--screenshot=${out}`,
    pathToFileURL(htmlFile).href,
  ])
  if (res.status !== 0 || !fs.existsSync(out)) throw new Error(`og-images: Chrome failed for ${page.path}: ${res.stderr}`)
  console.log(`og-images: ${path.relative(root, out)}`)
}
fs.rmSync(tmp, { recursive: true, force: true })
