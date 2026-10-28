// Lets plain Node (which strips TypeScript types natively) resolve the
// app's "@/..." import alias and extensionless .ts imports, so tests can
// import src/ modules directly. Registered by tests/register.mjs.
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const src = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../src')

export async function resolve(specifier, context, next) {
  let target = null
  if (specifier.startsWith('@/')) target = path.join(src, specifier.slice(2))
  else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier)
  }
  if (target && !path.extname(target)) {
    for (const ext of ['.ts', '.tsx']) if (existsSync(target + ext)) return next(pathToFileURL(target + ext).href, context)
  }
  if (target && specifier.startsWith('@/')) return next(pathToFileURL(target).href, context)
  return next(specifier, context)
}
