import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contrastRatio } from './contrast.ts'
import { readGgThemeTokens, type GgTokenSet } from './readTokens.ts'

// Reads the REAL token values out of app/globals.css on every run — not a copy-pasted snapshot.
// If a token's hex value changes in the CSS, this test re-reads it and re-evaluates, so it can't
// silently drift from what actually ships.
const { bone, graphiteMedia, graphiteExplicit } = readGgThemeTokens()

const AA_NORMAL = 4.5
const SURFACES = ['paper', 'panel', 'sunken'] as const

test('Graphite media-query block and explicit [data-theme="dark"] block agree (no drift between the two dark-mode definitions)', () => {
  assert.deepEqual(graphiteMedia, graphiteExplicit)
})

for (const [themeName, t] of [['Bone', bone], ['Graphite', graphiteExplicit]] as [string, GgTokenSet][]) {
  for (const surface of SURFACES) {
    test(`${themeName}: ink-3 on ${surface} clears AA normal text (4.5:1) [from app/globals.css]`, () => {
      const ratio = contrastRatio(t.ink3, t[surface])
      assert.ok(ratio >= AA_NORMAL, `${themeName} ink-3 (${t.ink3}) vs ${surface} (${t[surface]}) = ${ratio.toFixed(2)}:1, need >= ${AA_NORMAL}`)
    })
  }
  test(`${themeName}: three-level hierarchy stays distinct (ink > ink-2 > ink-3 contrast on paper) [from app/globals.css]`, () => {
    const r1 = contrastRatio(t.ink, t.paper)
    const r2 = contrastRatio(t.ink2, t.paper)
    const r3 = contrastRatio(t.ink3, t.paper)
    assert.ok(r1 > r2 && r2 > r3, `expected ink(${r1.toFixed(2)}) > ink-2(${r2.toFixed(2)}) > ink-3(${r3.toFixed(2)})`)
  })
}
