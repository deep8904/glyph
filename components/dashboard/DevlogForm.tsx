'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify, stripDangerousUnicode, cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'
import { updateDevlog } from '@/app/actions/devlogs'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/controls'

const MAX_CONTENT = 50000

export type ExistingDevlog = { id: string; slug: string; title: string; content: string; published: boolean }

/** Create/edit a devlog. Same fields, same validation, same submit behaviour as before — Phase K only changed the markup. */
export function DevlogForm({
  projectId,
  authorId,
  username,
  projectSlug,
  existing,
}: {
  projectId: string
  authorId: string
  username: string
  projectSlug: string | null
  existing?: ExistingDevlog
}) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!existing
  const projectHref = projectSlug ? `/p/${username}/${projectSlug}` : '/dashboard/projects'
  const backHref = isEdit && existing.published && projectSlug ? `/p/${username}/${projectSlug}/${existing.slug}` : projectHref

  const [title, setTitle] = useState(existing?.title ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [publishNow, setPublishNow] = useState(existing ? existing.published : true)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!content.trim()) {
      setError('Content is required.')
      return
    }
    if (content.length > MAX_CONTENT) {
      setError(`Content must be under ${MAX_CONTENT.toLocaleString()} characters.`)
      return
    }

    if (title.length > 200) {
      setError('Title must be under 200 characters.')
      return
    }

    setLoading(true)

    if (existing) {
      const result = await updateDevlog(existing.id, { title, content, published: publishNow })
      setLoading(false)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.push(publishNow && projectSlug ? `/p/${username}/${projectSlug}/${existing.slug}` : projectHref)
      router.refresh()
      return
    }

    const cleanTitle = stripDangerousUnicode(title.trim())
    const cleanContent = stripDangerousUnicode(content.trim())
    const slug = slugify(cleanTitle) || `update-${Date.now().toString(36)}`
    const { error: dbError } = await supabase.from('devlog_posts').insert({
      project_id: projectId,
      author_id: authorId,
      slug,
      title: cleanTitle,
      content: cleanContent,
      published_at: publishNow ? new Date().toISOString() : null,
    })

    setLoading(false)

    if (dbError) {
      if (dbError.code === '23505') {
        setError('A devlog with a similar title already exists for this project. Change the title slightly.')
      } else {
        setError(dbError.message)
      }
      return
    }

    router.push(publishNow && projectSlug ? `/p/${username}/${projectSlug}/${slug}` : projectHref)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="Title" required>
        {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Building the Combat System" maxLength={200} />}
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-small font-medium text-fg">Content (Markdown) <span aria-hidden className="text-danger">*</span></span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
            {preview ? <Pencil aria-hidden strokeWidth={1.75} className="size-3.5" /> : <Eye aria-hidden strokeWidth={1.75} className="size-3.5" />}
            {preview ? 'Edit' : 'Preview'}
          </Button>
        </div>

        {preview ? (
          <div className="min-h-[300px] rounded-control border border-line-strong bg-surface px-4 py-3">
            {content.trim() ? <MarkdownRenderer content={content} /> : <p className="text-small text-fg-muted">Nothing to preview yet.</p>}
          </div>
        ) : (
          <Textarea
            className="resize-y font-mono text-small leading-relaxed"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'Write your devlog in Markdown…\n\n## What I worked on\n\nThis week I focused on...'}
            maxLength={MAX_CONTENT}
          />
        )}
        <p className="mt-1 flex justify-between text-micro text-fg-muted">
          <span>Supports GitHub-flavored Markdown</span>
          <span>{content.length.toLocaleString()}/{MAX_CONTENT.toLocaleString()}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={publishNow}
          aria-label={publishNow ? 'Publish immediately' : 'Save as draft'}
          onClick={() => setPublishNow((p) => !p)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150',
            publishNow ? 'bg-accent' : 'bg-surface-muted border border-line-strong'
          )}
        >
          <span className={cn('inline-block size-4 rounded-full bg-surface-elevated shadow transition-transform duration-150', publishNow ? 'translate-x-6' : 'translate-x-1')} />
        </button>
        <span className="text-small text-fg-secondary">
          {publishNow ? (isEdit && existing?.published ? 'Published' : 'Publish immediately') : 'Draft — only you can see it'}
        </span>
      </div>

      {error && <p role="alert" className="text-small font-medium text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push(backHref)}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? (publishNow ? 'Save changes' : 'Save as draft') : publishNow ? 'Publish devlog' : 'Save draft'}
        </Button>
      </div>
    </form>
  )
}
