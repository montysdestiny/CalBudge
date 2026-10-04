// Injects the server-rendered homepage into dist/index.html after the
// client and SSR builds have both run.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const indexPath = path.join(root, 'dist/index.html')
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href)

const template = fs.readFileSync(indexPath, 'utf8')
const marker = '<div id="root"></div>'
if (!template.includes(marker)) throw new Error(`prerender: ${marker} not found in dist/index.html`)

fs.writeFileSync(indexPath, template.replace(marker, `<div id="root">${render()}</div>`))
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log('prerender: homepage HTML injected into dist/index.html')
