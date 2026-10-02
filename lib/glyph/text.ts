/**
 * Block-aware Markdown → plain-text excerpt for previews. Pure string transform — nothing is parsed
 * into HTML or executed, so it is safe for untrusted devlog content. Full devlog rendering is
 * unchanged; this is only for plain-text previews in the new Glyph presentation (no legacy helper).
 *
 * Guarantees:
 * - HTML is stripped, never executed or rendered.
 * - Words are preserved from headings (ATX + Setext), paragraphs, emphasis/strikethrough, links,
 *   inline code, blockquotes, and list items.
 * - Semantic block separation is preserved: blocks join with " — ", list items with "; ".
 * - Image destinations and fenced code are dropped; link labels are kept and their URLs discarded
 *   even when the URL contains balanced parentheses (no stray ")").
 * - Output is whitespace-normalized natural prose, deterministically truncated on a word boundary.
 */

/** Index of the ')' matching the '(' at openIdx, honoring nesting; -1 if unbalanced. */
function matchParen(s: string, openIdx: number): number {
  let depth = 0
  for (let j = openIdx; j < s.length; j++) {
    if (s[j] === '(') depth++
    else if (s[j] === ')') { depth--; if (depth === 0) return j }
  }
  return -1
}

/** Replace `[label](url)` with `label` and drop `![alt](url)` images. URL may contain balanced parens. */
function stripLinks(s: string): string {
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s[i] === '!' && s[i + 1] === '[') {
      const close = s.indexOf(']', i + 2)
      if (close !== -1 && s[close + 1] === '(') {
        const end = matchParen(s, close + 1)
        if (end !== -1) { i = end + 1; continue } // drop image entirely
      }
    }
    if (s[i] === '[') {
      const close = s.indexOf(']', i + 1)
      if (close !== -1 && s[close + 1] === '(') {
        const end = matchParen(s, close + 1)
        if (end !== -1) { out += s.slice(i + 1, close); i = end + 1; continue } // keep label, drop (url)
      }
    }
    out += s[i]; i++
  }
  return out
}

/** Inline cleanup applied to a single already-de-blocked line. */
function inline(s: string): string {
  let t = s
  t = t.replace(/`([^`]+)`/g, '$1')          // inline code → text
  t = stripLinks(t)                           // links/images (balanced parens safe)
  t = t.replace(/<[^>]+>/g, '')               // strip HTML tags (never executed)
  t = t.replace(/(\*\*\*|\*\*|\*|___|__|_|~~)(\S[\s\S]*?\S|\S)\1/g, '$2') // emphasis/strike → words
  t = t.replace(/[*_~`]/g, '')                // stray inline markers
  return t.replace(/\s+/g, ' ').trim()
}

export function toPlainText(md: string | null | undefined, max = 260): string {
  if (!md) return ''
  let src = md.replace(/\r\n?/g, '\n')
  // Drop fenced code blocks wholesale.
  src = src.replace(/```[\s\S]*?```/g, '\n\n').replace(/~~~[\s\S]*?~~~/g, '\n\n')
  // Setext headings: a text line underlined by === or --- becomes the heading text.
  src = src.replace(/^(?!\s*$)(.+)\n(?:=+|-+)[ \t]*$/gm, '$1\n')

  const lines = src.split('\n')
  const blocks: string[] = []
  let para: string[] = []       // wrapped lines of the current paragraph
  let list: string[] = []       // items of the current list

  const flushPara = () => { if (para.length) { const t = inline(para.join(' ')); if (t) blocks.push(t); para = [] } }
  const flushList = () => { if (list.length) { const items = list.map(inline).filter(Boolean); if (items.length) blocks.push(items.join('; ')); list = [] } }

  for (const raw of lines) {
    let line = raw.replace(/^\s+/, '')
    if (line.trim() === '') { flushPara(); flushList(); continue }        // blank = block boundary
    line = line.replace(/^#{1,6}\s+/, '')                                  // ATX heading marker
    line = line.replace(/^>\s?/, '')                                       // blockquote marker
    const listMatch = /^(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (listMatch) { flushPara(); list.push(listMatch[1]); continue }      // list item
    flushList()
    para.push(line)
  }
  flushPara(); flushList()

  let out = blocks.join(' — ').replace(/\s+/g, ' ').trim()
  if (max > 0 && out.length > max) {
    out = out.slice(0, max).replace(/\s+\S*$/, '').replace(/[\s—.,;:]+$/, '') + '…'
  }
  return out
}
