import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { PAGES, SITE_URL, findPage } from './lib/pages'

export { PAGES, SITE_URL }

// Used at build time only (scripts/prerender.mjs) to bake each landing
// page's HTML into dist/, so crawlers that don't run JS still see content.
export function render(pathname: string) {
  return renderToString(
    <StrictMode>
      <App page={findPage(pathname)} />
    </StrictMode>,
  )
}
