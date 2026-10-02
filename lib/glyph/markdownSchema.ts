import type { Options as SanitizeOptions } from 'rehype-sanitize'

/**
 * The sanitize security contract, extracted (not weakened) from the legacy MarkdownRenderer so the
 * new Glyph rich-text presentation can reuse it without importing legacy presentation. Same schema:
 * strict allowlist, blocks script/iframe/object/embed/style/link/form/input/button/select, blocks
 * javascript:/data: URLs (except data:image/), no event-handler attributes.
 */
export const markdownSanitizeSchema: SanitizeOptions = {
  tagNames: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'em', 'del', 'code', 'pre', 'blockquote',
    'a',
    'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'details', 'summary',
    'div', 'span',
  ],
  attributes: {
    a: [['href', /^(?!javascript:|data:)/i], 'title', 'rel', 'target'],
    img: [['src', /^(?!javascript:)(?:https?:|data:image\/)/i], 'alt', 'title', 'width', 'height'],
    code: ['className'],
    pre: ['className'],
    th: ['align'],
    td: ['align'],
    '*': [],
  },
  protocols: {
    href: ['http', 'https', 'mailto', '#'],
    src: ['http', 'https'],
  },
  strip: ['script', 'iframe', 'object', 'embed', 'style', 'link', 'form', 'input', 'button', 'select'],
}
