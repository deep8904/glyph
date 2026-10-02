import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/** Reads app/globals.css from disk — the single authoritative source for --gg-* token values. */
export function loadGlobalsCss(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const cssPath = path.resolve(here, '../../app/globals.css')
  return readFileSync(cssPath, 'utf8')
}

/** Extracts the first `--name: #hex;` occurrence within a CSS text slice. Throws if absent. */
export function readHexToken(cssSlice: string, name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(cssSlice)
  if (!m) throw new Error(`Token --${name} not found`)
  return m[1]
}

const NAMES = ['gg-paper', 'gg-panel', 'gg-sunken', 'gg-ink', 'gg-ink-2', 'gg-ink-3'] as const
export type GgTokenSet = { paper: string; panel: string; sunken: string; ink: string; ink2: string; ink3: string }

function readAll(cssSlice: string): GgTokenSet {
  const [paper, panel, sunken, ink, ink2, ink3] = NAMES.map((n) => readHexToken(cssSlice, n))
  return { paper, panel, sunken, ink, ink2, ink3 }
}

/**
 * Reads the real Bone (light) and Graphite (dark) --gg-* token values straight out of
 * app/globals.css, anchored to the "Graphite & Bone + Ember" section (there are legacy-token
 * blocks earlier in the file with the same selector shapes, so anchoring matters). This is what
 * the contrast test checks — not a copy-pasted snapshot — so a real CSS edit changes the test result.
 */
export function readGgThemeTokens(cssText: string = loadGlobalsCss()): { bone: GgTokenSet; graphiteMedia: GgTokenSet; graphiteExplicit: GgTokenSet } {
  const start = cssText.indexOf('Graphite & Bone + Ember')
  if (start === -1) throw new Error('Could not find the "Graphite & Bone + Ember" section marker in globals.css')

  const mediaIdx = cssText.indexOf('@media (prefers-color-scheme: dark)', start)
  const explicitDarkIdx = cssText.indexOf(':root[data-theme="dark"]', start)
  const themeInlineIdx = cssText.indexOf('@theme inline', start)
  if (mediaIdx === -1 || explicitDarkIdx === -1 || themeInlineIdx === -1) {
    throw new Error('Could not locate the expected gg token block boundaries in globals.css')
  }

  const boneSlice = cssText.slice(start, mediaIdx)
  const graphiteMediaSlice = cssText.slice(mediaIdx, explicitDarkIdx)
  // The explicit [data-theme="dark"] override block, kept in sync with the media-query block by
  // convention — the test asserts they actually match, catching drift between the two.
  const graphiteExplicitSlice = cssText.slice(explicitDarkIdx, themeInlineIdx)

  return { bone: readAll(boneSlice), graphiteMedia: readAll(graphiteMediaSlice), graphiteExplicit: readAll(graphiteExplicitSlice) }
}
