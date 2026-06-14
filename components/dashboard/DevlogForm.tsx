'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify, stripDangerousUnicode } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

const MAX_CONTENT = 50000

export function DevlogForm({
  projectId,
  authorId,
}: {
  projectId: string
  authorId: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishNow, setPublishNow] = useState(true)
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

    const cleanTitle = stripDangerousUnicode(title.trim())
    const cleanContent = stripDangerousUnicode(content.trim())
    const slug = slugify(cleanTitle)
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

    router.push('/dashboard/projects')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className={labelCls}>Title *</label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Building the Combat System"
          maxLength={200}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls} style={{ marginBottom: 0 }}>Content * (Markdown)</label>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[300px] rounded-xl border border-gray-200 bg-white px-5 py-4">
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-sm text-gray-400 font-mono">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your devlog in Markdown…&#10;&#10;## What I worked on&#10;&#10;This week I focused on..."
            maxLength={MAX_CONTENT}
          />
        )}
        <p className="mt-1 flex justify-between text-[11px] font-mono text-gray-400">
          <span>Supports GitHub-flavored Markdown</span>
          <span>{content.length.toLocaleString()}/{MAX_CONTENT.toLocaleString()}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={publishNow}
          onClick={() => setPublishNow((p) => !p)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            publishNow ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              publishNow ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">
          {publishNow ? 'Publish immediately' : 'Save as draft'}
        </span>
      </div>

      {error && (
        <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push('/dashboard/projects')}
          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {publishNow ? 'Publish Devlog' : 'Save Draft'}
        </button>
      </div>
    </form>
  )
}
