import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toPlainText } from './text.ts'

test('1. ATX heading then paragraph — separated, no #', () => {
  const out = toPlainText('## Public Alpha is out\n\nAfter 40 days of development, the build is playable.')
  assert.equal(out, 'Public Alpha is out — After 40 days of development, the build is playable.')
  assert.ok(!out.includes('#'))
})

test('2. Multiple paragraphs — joined with a separator', () => {
  const out = toPlainText('First paragraph here.\n\nSecond paragraph here.')
  assert.equal(out, 'First paragraph here. — Second paragraph here.')
})

test('3. Setext heading — underline removed, text kept', () => {
  const out = toPlainText('The honest post-mortem\n=====\n\nThe original combat system was rough.')
  assert.equal(out, 'The honest post-mortem — The original combat system was rough.')
  assert.ok(!out.includes('='))
})

test('4. Ordered and unordered lists — items joined', () => {
  assert.equal(toPlainText('- Floors 1-3\n- Two bosses\n- New UI'), 'Floors 1-3; Two bosses; New UI')
  assert.equal(toPlainText('1. First\n2. Second'), 'First; Second')
})

test('5. Link URL containing parentheses — label kept, no stray )', () => {
  const out = toPlainText('See the [wiki entry](https://en.wikipedia.org/wiki/Roguelike_(video_games)) for context.')
  assert.equal(out, 'See the wiki entry for context.')
  assert.ok(!out.includes(')'))
  assert.ok(!out.includes('http'))
})

test('6. Inline code — backticks removed, text kept', () => {
  assert.equal(toPlainText('Call `speak()` to start.'), 'Call speak() to start.')
})

test('7. Fenced code — dropped', () => {
  const out = toPlainText('Intro line.\n\n```ts\nconst x = 1\n```\n\nOutro line.')
  assert.equal(out, 'Intro line. — Outro line.')
  assert.ok(!out.includes('const x'))
})

test('8. Raw HTML — tags stripped, not rendered', () => {
  const out = toPlainText('Danger <script>alert(1)</script> and <b>bold</b> text.')
  assert.ok(!out.includes('<'))
  assert.ok(!out.includes('>'))
  assert.ok(out.includes('bold'))
})

test('9. Emphasis and strikethrough — markers gone, words kept', () => {
  assert.equal(toPlainText('A **momentum meter** that ~~charged~~ on _dodges_.'), 'A momentum meter that charged on dodges.')
})

test('10. Truncation — word-safe with ellipsis', () => {
  const long = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima'
  const out = toPlainText(long, 24)
  assert.ok(out.endsWith('…'))
  assert.ok(out.length <= 25)
  assert.ok(!/\S…$/.test(out) === false || out.slice(0, -1).split(' ').every((w) => long.includes(w))) // no partial word
  assert.ok(!out.slice(0, -1).endsWith(' '))
})
