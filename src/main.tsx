import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { loadGoogleAnalytics, readConsent } from './lib/consent'
import { findPage } from './lib/pages'

if (readConsent() === 'granted') loadGoogleAnalytics()

// Shared plan links carry the user's inputs after the # (lib/share.ts).
// Vercel Analytics reports the full URL by default, so strip the hash
// before anything is sent (GA does the same in lib/consent.ts).
const stripHash = <T extends { url: string }>(event: T): T => ({ ...event, url: event.url.split('#')[0] })

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App page={findPage(window.location.pathname)} />
    <Analytics beforeSend={stripHash} />
  </StrictMode>
)

// Production builds ship prerendered HTML (see scripts/prerender.mjs);
// hydrate it instead of re-rendering from scratch. Dev serves an empty root.
if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
