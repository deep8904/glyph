'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify, stripDangerousUnicode, isHttpsUrl } from '@/lib/utils'
import { ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'
import type { Project } from '@/lib/supabase/types'
import { createDraftProject } from '@/app/actions/projects'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/controls'
import { CoverUploadField } from '@/components/dashboard/CoverUploadField'
import { ScreenshotsUploadField } from '@/components/dashboard/ScreenshotsUploadField'

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
  lifecycle: 'draft' | 'published'
  cover_url: string
  screenshots: string[]
  link_github: string
  link_itch: string
  link_website: string
}

const LINK_KEYS = { github: 'GitHub', itch: 'itch.io', website: 'Website' } as const
const MAX_SCREENSHOTS = 6

function linkValue(links: Record<string, string> | null | undefined, label: string) {
  const hit = Object.entries(links ?? {}).find(([k]) => k.toLowerCase() === label.toLowerCase())
  return hit?.[1] ?? ''
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
    visibility: p?.visibility ?? 'private',
    // Archived isn't a form choice (it's a separate, confirmed action on the edit page) — an
    // archived project shown here defaults to 'published' so saving the form doesn't accidentally
    // un-archive it via a stale radio value; the edit page's own Restore action is the real path.
    lifecycle: p?.lifecycle === 'draft' ? 'draft' : 'published',
    cover_url: p?.cover_url ?? p?.cover_image_url ?? '',
    screenshots: (p?.screenshots as string[] | undefined) ?? [],
    link_github: linkValue(p?.external_links, LINK_KEYS.github),
    link_itch: linkValue(p?.external_links, LINK_KEYS.itch),
    link_website: linkValue(p?.external_links, LINK_KEYS.website),
  }
}

/** Create/edit a project. Same fields, same validation, same submit behaviour as before — Phase K only changed the markup. */
export function ProjectForm({
  projectId,
  initial,
  ownerId,
  username: initialUsername = '',
}: {
  projectId?: string
  initial?: Partial<Project>
  ownerId: string
  username?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  // Archiving is its own confirmed action, not a form field — never let a routine save of this
  // form change an archived project's lifecycle as a side effect.
  const isArchived = initial?.lifecycle === 'archived'

  const [form, setForm] = useState<ProjectFormData>(toForm(initial))
  const [slugManual, setSlugManual] = useState(!!initial?.slug)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Starts as the prop (already-existing project) or undefined (new project, no row yet). A
  // media upload before the first Save lazily creates the row via ensureProjectId below — from
  // that point on this form is editing a real project, not batching everything into one insert.
  // Mirrored in a ref (not just state) so handlers always read the freshest id even if invoked
  // from a closure captured before the id existed — state alone can't guarantee that timing.
  const [liveProjectId, setLiveProjectIdState] = useState<string | undefined>(projectId)
  const liveProjectIdRef = useRef(liveProjectId)
  const setLiveProjectId = (id: string) => { liveProjectIdRef.current = id; setLiveProjectIdState(id) }
  const isEdit = !!liveProjectId

  // Same reasoning for screenshots: several uploads can complete close together, and each one's
  // "append" must see every prior append, not a stale render's snapshot — a ref updated
  // synchronously at call time (not through React's async state batching) is what makes that safe.
  // Initialised from the initial form value; the handlers below are its only writers, and each
  // updates the ref and the state together, so the two never diverge.
  const screenshotsRef = useRef(form.screenshots)

  const set = (key: keyof Omit<ProjectFormData, 'screenshots'>, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const ensureProjectId = async (): Promise<string> => {
    if (liveProjectIdRef.current) return liveProjectIdRef.current
    const result = await createDraftProject(form.title)
    if ('error' in result) throw new Error(result.error)
    setLiveProjectId(result.id)
    return result.id
  }

  // Media autosaves the instant it's confirmed, independent of the form's own Save button — the
  // most failure-prone part of authoring (a network hiccup, a closed tab) is exactly where losing
  // work would hurt most. Text fields stay save-on-submit; this is deliberately scoped, not a
  // general autosave system (a project's title/description are cheap to retype if a session is
  // truly abandoned; a re-uploaded image is not).
  const persistMedia = (patch: { cover_url?: string | null; screenshots?: string[] }) => {
    const id = liveProjectIdRef.current
    if (!id) return // Shouldn't happen — ensureProjectId always runs first — but never throw from here.
    void supabase.from('projects').update(patch).eq('id', id).eq('owner_id', ownerId)
  }

  const setCoverUrl = (url: string) => {
    setForm((f) => ({ ...f, cover_url: url }))
    persistMedia({ cover_url: url || null })
  }
  const addScreenshot = (url: string) => {
    const next = [...screenshotsRef.current, url]
    screenshotsRef.current = next
    setForm((f) => ({ ...f, screenshots: next }))
    persistMedia({ screenshots: next })
  }
  const removeScreenshotAt = (i: number) => {
    const next = screenshotsRef.current.filter((_, idx) => idx !== i)
    screenshotsRef.current = next
    setForm((f) => ({ ...f, screenshots: next }))
    persistMedia({ screenshots: next })
  }
  const reorderScreenshots = (urls: string[]) => {
    screenshotsRef.current = urls
    setForm((f) => ({ ...f, screenshots: urls }))
    persistMedia({ screenshots: urls })
  }

  // Slug follows the title until the user edits the slug themselves.
  const setTitle = (value: string) =>
    setForm((f) => ({ ...f, title: value, ...(slugManual && f.slug ? {} : { slug: slugify(value) }) }))

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

    const coverUrl = form.cover_url.trim()
    const screenshotUrls = form.screenshots
    const linkEntries: [string, string][] = [
      [LINK_KEYS.github, form.link_github.trim()],
      [LINK_KEYS.itch, form.link_itch.trim()],
      [LINK_KEYS.website, form.link_website.trim()],
    ]
    if (coverUrl && !isHttpsUrl(coverUrl)) {
      setError('Cover image must be a full https:// URL.')
      setLoading(false)
      return
    }
    if (screenshotUrls.length > MAX_SCREENSHOTS) {
      setError(`Add at most ${MAX_SCREENSHOTS} screenshots.`)
      setLoading(false)
      return
    }
    if (screenshotUrls.some((u) => !isHttpsUrl(u))) {
      // Should be unreachable through normal use — every URL here came from a successful
      // upload — but kept as a defensive check against state corruption.
      setError('Something went wrong with a screenshot. Remove and re-add it.')
      setLoading(false)
      return
    }
    if (linkEntries.some(([, u]) => u && !isHttpsUrl(u))) {
      setError('Links must be full https:// URLs.')
      setLoading(false)
      return
    }
    // Keep any external_links keys this form does not manage (e.g. set elsewhere).
    const managed = new Set(Object.values(LINK_KEYS).map((k) => k.toLowerCase()))
    const externalLinks: Record<string, string> = {}
    for (const [k, v] of Object.entries((initial?.external_links as Record<string, string> | undefined) ?? {})) {
      if (!managed.has(k.toLowerCase())) externalLinks[k] = v
    }
    for (const [k, u] of linkEntries) if (u) externalLinks[k] = u

    const payload = {
      cover_url: coverUrl || null,
      screenshots: screenshotUrls,
      external_links: externalLinks,
      title: s(form.title),
      slug: form.slug.trim(),
      short_description: s(form.short_description) || null,
      long_description: s(form.long_description) || null,
      tags,
      engine: form.engine || null,
      genre: s(form.genre) || null,
      stage: form.stage || null,
      visibility: form.visibility,
      // Preserve 'archived' through an unrelated edit — see isArchived above.
      lifecycle: isArchived ? 'archived' : form.lifecycle,
    }

    let dbError: { code?: string; message: string } | null = null

    if (isEdit && liveProjectId) {
      const { error: e } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', liveProjectId)
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

    router.push(isEdit && form.slug ? `/p/${initialUsername}/${form.slug}` : '/dashboard/projects')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="Project title" required>
        {(p) => <Input {...p} value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hollow Tide" maxLength={200} />}
      </Field>

      <Field label="URL slug" required hint={isEdit ? "Changing the slug changes this project's public URL and every devlog link under it." : undefined}>
        {(p) => (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-small text-fg-muted">/p/you/</span>
            <Input
              {...p}
              className="pl-[4.5rem]"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true)
                set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
              }}
              placeholder="hollow-tide"
              maxLength={60}
            />
          </div>
        )}
      </Field>

      <Field label="Short description">
        {(p) => <Input {...p} value={form.short_description} onChange={(e) => set('short_description', e.target.value)} placeholder="One line on what it is." maxLength={200} />}
      </Field>

      <Field label="Long description (Markdown)" hint={`${form.long_description.length}/5000`}>
        {(p) => <Textarea {...p} className="font-mono text-small" rows={8} value={form.long_description} onChange={(e) => set('long_description', e.target.value)} placeholder="Tell the full story of your project. Markdown is supported." maxLength={5000} />}
      </Field>

      <Field label="Tags" hint="Comma-separated, max 20.">
        {(p) => <Input {...p} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="platformer, pixel art, solo dev" maxLength={500} />}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Engine">
          {(p) => (
            <Select {...p} value={form.engine} onChange={(e) => set('engine', e.target.value)}>
              <option value="">Select…</option>
              {ENGINES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Genre">
          {(p) => <Input {...p} value={form.genre} onChange={(e) => set('genre', e.target.value)} placeholder="e.g. Metroidvania" maxLength={100} />}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Stage" hint="Where the game itself is — independent of whether the page is published.">
          {(p) => (
            <Select {...p} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
              <option value="">Select…</option>
              {PROJECT_STAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Status" hint={isArchived ? 'This project is archived. Restore it from the project page to change this.' : 'Draft is only visible to you, regardless of the Visibility setting below.'}>
          {(p) => (
            <Select {...p} value={isArchived ? 'archived' : form.lifecycle} disabled={isArchived} onChange={(e) => set('lifecycle', e.target.value as ProjectFormData['lifecycle'])}>
              {isArchived && <option value="archived">Archived</option>}
              <option value="draft">Draft — only you can see it</option>
              <option value="published">Published</option>
            </Select>
          )}
        </Field>
      </div>

      <Field label="Visibility">
        {(p) => (
          <div>
            <Select {...p} value={form.visibility} onChange={(e) => set('visibility', e.target.value as ProjectFormData['visibility'])}>
              <option value="public">Public — visible to everyone</option>
              <option value="unlisted">Unlisted — only via direct link</option>
              <option value="private">Private — only you</option>
            </Select>
            {form.visibility === 'private' && <Badge tone="neutral" className="mt-2">Private by default</Badge>}
          </div>
        )}
      </Field>

      <fieldset className="flex flex-col gap-4 rounded-panel border border-line p-5">
        <legend className="px-2 text-small font-semibold text-fg-secondary">Media &amp; links</legend>
        <Field label="Cover image">
          {(p) => <CoverUploadField id={p.id} value={form.cover_url} onChange={setCoverUrl} ensureProjectId={ensureProjectId} />}
        </Field>
        <Field label="Screenshots">
          {(p) => <ScreenshotsUploadField id={p.id} value={form.screenshots} onAdd={addScreenshot} onRemove={removeScreenshotAt} onReorder={reorderScreenshots} ensureProjectId={ensureProjectId} />}
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="GitHub">
            {(p) => <Input {...p} value={form.link_github} onChange={(e) => set('link_github', e.target.value)} placeholder="https://github.com/…" maxLength={500} />}
          </Field>
          <Field label="itch.io">
            {(p) => <Input {...p} value={form.link_itch} onChange={(e) => set('link_itch', e.target.value)} placeholder="https://you.itch.io/…" maxLength={500} />}
          </Field>
          <Field label="Website">
            {(p) => <Input {...p} value={form.link_website} onChange={(e) => set('link_website', e.target.value)} placeholder="https://…" maxLength={500} />}
          </Field>
        </div>
      </fieldset>

      {error && <p role="alert" className="text-small font-medium text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push('/dashboard/projects')}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{isEdit ? 'Save changes' : 'Create project'}</Button>
      </div>
    </form>
  )
}
