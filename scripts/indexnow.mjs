// Tells Bing, Yandex and other IndexNow engines that every landing page in
// src/lib/pages.ts has changed, so they recrawl within hours. Run after a
// deploy that changes page content:  npm run indexnow
// The key file public/ed819e4db0e1077543b70cda466a584f.txt proves we own the site; keep it deployed.
import { PAGES, SITE_URL } from '../src/lib/pages.ts'

const KEY = 'ed819e4db0e1077543b70cda466a584f'
const host = new URL(SITE_URL).host

const keyRes = await fetch(`${SITE_URL}/${KEY}.txt`)
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
  throw new Error(`indexnow: ${SITE_URL}/${KEY}.txt isn't live yet; deploy first`)
}

const urlList = PAGES.map(p => (p.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${p.path}`))
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList }),
})
// 200 = accepted, 202 = accepted, key validation pending.
if (res.status !== 200 && res.status !== 202) throw new Error(`indexnow: HTTP ${res.status} ${await res.text()}`)
console.log(`indexnow: submitted ${urlList.length} URLs (HTTP ${res.status})`)
