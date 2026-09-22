'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { type Options as SanitizeOptions } from 'rehype-sanitize'

// Strict schema: allow safe block/inline HTML from remark-gfm output only.
// Explicitly blocks: script, iframe, object, embed, style, link, form, input, on* handlers,
// javascript: and data: URLs (except data:image/), srcdoc, and all event attributes.
const sanitizeSchema: SanitizeOptions = {
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

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={`prose prose-glyph max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-h2 prose-h2:text-h2 prose-h3:text-h3 prose-a:underline-offset-2 hover:prose-a:text-accent-hover prose-code:rounded prose-code:bg-surface-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.875em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-media prose-img:rounded-media prose-blockquote:font-normal ${className ?? ''}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
