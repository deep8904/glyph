'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': (defaultSchema.attributes?.['*'] ?? []).filter(
      (attr) => typeof attr === 'string' && !attr.startsWith('on')
    ),
  },
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
