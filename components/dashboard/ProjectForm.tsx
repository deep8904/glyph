'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify, stripDangerousUnicode } from '@/lib/utils'
import { ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'
import type { Project } from '@/lib/supabase/types'

type ProjectFormData = {
  title: string
  slug: string
  short_description: string
  long_description: string
  tags: string
  engine: string
  genre: string
  stage: string
  visibility: 'public' | 'unlisted' | 'private'
}

function toForm(p?: Partial<Project>): ProjectFormData {
  return {
    title: p?.title ?? '',
    slug: p?.slug ?? '',
    short_description: p?.short_description ?? '',
    long_description: p?.long_description ?? '',
    tags: (p?.tags ?? []).join(', '),
    engine: p?.engine ?? '',
    genre: p?.genre ?? '',
    stage: p?.stage ?? '',
    visibility: p?.visibility ?? 'public',
  }
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export function ProjectForm({
  projectId,
  initial,
  ownerId,
}: {
  projectId?: string
  initial?: Partial<Project>
  ownerId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!projectId

  const [form, setForm] = useState<ProjectFormData>(toForm(initial))
  const [slugManual, setSlugManual] = useState(!!initial?.slug)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slugManual && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }))
    }
  }, [form.title, slugManual])

  const set = (key: keyof ProjectFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Project title is required.')
      return
    }
    if (!form.slug.trim()) {
      setError('Slug is required.')
      return
    }
    if (!/^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$/.test(form.slug) && form.slug.length < 2) {
      setError('Slug must be lowercase letters, numbers, and hyphens (2–60 chars).')
      return
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20)

    setLoading(true)

    const s = (v: string) => stripDangerousUnicode(v.trim())

    if (form.title.length > 200 || form.short_description.length > 200 || form.long_description.length > 5000 || form.genre.length > 100) {
      setError('One or more fields exceeds the maximum allowed length.')
      setLoading(false)
      return
    }

    const payload = {
      title: s(form.title),
      slug: form.slug.trim(),
      short_description: s(form.short_description) || null,
      long_description: s(form.long_description) || null,
      tags,
      engine: form.engine || null,
      genre: s(form.genre) || null,
      stage: form.stage || null,
      visibility: form.visibility,
    }

    let dbError: { code?: string; message: string } | null = null

    if (isEdit) {
      const { error: e } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId)
        .eq('owner_id', ownerId)
      dbError = e
    } else {
      const { error: e } = await supabase.from('projects').insert({
        ...payload,
        owner_id: ownerId,
        is_primary: false,
      })
      dbError = e
    }

    setLoading(false)

    if (dbError) {
      if (dbError.code === '23505') {
        setError('You already have a project with that slug. Choose a different one.')
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
        <label className={labelCls}>Project Title *</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Hollow Tide"
          maxLength={200}
        />
      </div>

      <div>
        <label className={labelCls}>URL Slug *</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400">
            /p/you/
          </span>
          <input
            className={`${inputCls} pl-[4.5rem]`}
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true)
              set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
            }}
            placeholder="hollow-tide"
            maxLength={60}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Short Description</label>
        <input
          className={inputCls}
          value={form.short_description}
          onChange={(e) => set('short_description', e.target.value)}
          placeholder="One line on what it is."
          maxLength={200}
        />
      </div>

      <div>
        <label className={labelCls}>Long Description (Markdown)</label>
        <textarea
          className={`${inputCls} resize-none font-mono text-xs`}
          rows={8}
          value={form.long_description}
          onChange={(e) => set('long_description', e.target.value)}
          placeholder="Tell the full story of your project. Markdown is supported."
          maxLength={5000}
        />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{form.long_description.length}/5000</p>
      </div>

      <div>
        <label className={labelCls}>Tags (comma-separated, max 20)</label>
        <input
          className={inputCls}
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="platformer, pixel art, solo dev"
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Engine</label>
          <select className={selectCls} value={form.engine} onChange={(e) => set('engine', e.target.value)}>
            <option value="">Select…</option>
            {ENGINES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Genre</label>
          <input
            className={inputCls}
            value={form.genre}
            onChange={(e) => set('genre', e.target.value)}
            placeholder="e.g. Metroidvania"
            maxLength={100}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Stage</label>
          <select className={selectCls} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
            <option value="">Select…</option>
            {PROJECT_STAGES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Visibility</label>
          <select
            className={selectCls}
            value={form.visibility}
            onChange={(e) => set('visibility', e.target.value as ProjectFormData['visibility'])}
          >
            <option value="public">Public — visible to everyone</option>
            <option value="unlisted">Unlisted — only via direct link</option>
            <option value="private">Private — only you</option>
          </select>
        </div>
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
          {isEdit ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
