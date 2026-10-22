import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { loadGoogleAnalytics, readConsent } from './lib/consent'
import { findPage } from './lib/pages'

if (readConsent() === 'granted') loadGoogleAnalytics()

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App page={findPage(window.location.pathname)} />
    <Analytics />
  </StrictMode>
)

// Production builds ship prerendered HTML (see scripts/prerender.mjs);
// hydrate it instead of re-rendering from scratch. Dev serves an empty root.
if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
