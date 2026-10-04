import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'

// Used at build time only (scripts/prerender.mjs) to bake the homepage's
// HTML into dist/index.html, so crawlers that don't run JS still see content.
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
