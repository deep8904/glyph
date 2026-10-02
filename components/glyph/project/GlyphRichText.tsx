import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { markdownSanitizeSchema } from '@/lib/glyph/markdownSchema'
import { cn } from '@/lib/utils'

/**
 * New Glyph rich-text presentation for long-form Project/devlog content. GitHub-flavored Markdown,
 * strict sanitization (same contract as the legacy renderer, extracted to lib/glyph/markdownSchema
 * — not weakened), themed from --gg-* tokens via `.prose-gg` (both themes). No legacy import.
 */
export function GlyphRichText({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('prose-gg prose max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-h2 prose-h2:text-h2 prose-h3:text-h3 prose-a:underline-offset-2 hover:prose-a:text-ember-ink prose-code:rounded prose-code:bg-sunken prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.875em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-[10px] prose-img:rounded-[10px] prose-blockquote:font-normal', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
