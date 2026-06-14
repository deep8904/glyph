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
      className={`prose prose-sm sm:prose-base max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-indigo-300 prose-blockquote:text-gray-500 prose-img:rounded-2xl prose-hr:border-gray-200 ${className ?? ''}`}
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
