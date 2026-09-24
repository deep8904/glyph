'use client'

import { useRef, useState } from 'react'
import { ImageUp, ChevronUp, ChevronDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadProjectImage, removeProjectImage, pathFromPublicUrl } from '@/lib/media/uploadProjectImage'
import { IconButton } from '@/components/ui/IconButton'

const MAX_SCREENSHOTS = 6

type Pending = { id: string; name: string; status: 'uploading' | 'error'; error?: string }

/**
 * Screenshots: multi-upload (several files at once, each with its own independent honest status —
 * one failing never blocks or loses the others), remove, and reorder. Order is array position in
 * the existing `screenshots` column — no new column, the data model already carried an order,
 * it just never had a UI to change it. Up/down buttons rather than drag-and-drop: fully keyboard
 * and screen-reader operable without a drag library, and six items never need more than that.
 */
export function ScreenshotsUploadField({
  id,
  value,
  onChange,
  ensureProjectId,
}: {
  id?: string
  value: string[]
  onChange: (urls: string[]) => void
  ensureProjectId: () => Promise<string>
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending[]>([])
  const slotsLeft = MAX_SCREENSHOTS - value.length - pending.length

  const pick = () => inputRef.current?.click()

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const selected = Array.from(files).slice(0, Math.max(slotsLeft, 0))
    if (selected.length === 0) return

    const entries = selected.map((file) => ({ id: crypto.randomUUID(), file }))
    setPending((p) => [...p, ...entries.map(({ id, file }) => ({ id, name: file.name, status: 'uploading' as const }))])

    // Independent — one failure never blocks or removes the others.
    await Promise.all(
      entries.map(async ({ id, file }) => {
        try {
          const projectId = await ensureProjectId()
          const result = await uploadProjectImage(supabase, projectId, 'screenshots', file)
          if ('error' in result) {
            setPending((p) => p.map((x) => (x.id === id ? { ...x, status: 'error', error: result.error } : x)))
            return
          }
          onChange([...value, result.url])
          setPending((p) => p.filter((x) => x.id !== id))
        } catch {
          setPending((p) => p.map((x) => (x.id === id ? { ...x, status: 'error', error: 'Could not start this upload. Try again.' } : x)))
        }
      })
    )
  }

  const dismissFailed = (id: string) => setPending((p) => p.filter((x) => x.id !== id))

  const remove = (i: number) => {
    const path = pathFromPublicUrl(value[i])
    onChange(value.filter((_, idx) => idx !== i))
    if (path) removeProjectImage(supabase, path)
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="sr-only" onChange={(e) => { handleFiles(e.target.files); if (inputRef.current) inputRef.current.value = '' }} />
      {(value.length > 0 || pending.length > 0) && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, i) => (
            <li key={url} className="group relative overflow-hidden rounded-media border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-video w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-fg/70 p-1 backdrop-blur-sm">
                <div className="flex items-center gap-0.5">
                  <IconButton label={`Move screenshot ${i + 1} earlier`} variant="ghost" size="sm" className="size-7 text-white hover:bg-white/20 hover:text-white" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ChevronUp aria-hidden strokeWidth={1.75} className="size-3.5" />
                  </IconButton>
                  <IconButton label={`Move screenshot ${i + 1} later`} variant="ghost" size="sm" className="size-7 text-white hover:bg-white/20 hover:text-white" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                    <ChevronDown aria-hidden strokeWidth={1.75} className="size-3.5" />
                  </IconButton>
                </div>
                <IconButton label={`Remove screenshot ${i + 1}`} variant="ghost" size="sm" className="size-7 text-white hover:bg-white/20 hover:text-white" onClick={() => remove(i)}>
                  <X aria-hidden strokeWidth={1.75} className="size-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-media border border-line-subtle bg-surface-muted px-2 text-center">
              {p.status === 'uploading' ? (
                <>
                  <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent motion-reduce:animate-none" />
                  <span className="line-clamp-1 text-micro text-fg-muted">{p.name}</span>
                </>
              ) : (
                <>
                  <span className="text-micro font-medium text-danger">{p.error}</span>
                  <button type="button" onClick={() => dismissFailed(p.id)} className="text-micro font-medium text-link underline-offset-2 hover:underline">Dismiss</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {slotsLeft > 0 && (
        <button
          id={id}
          type="button"
          onClick={pick}
          className="flex h-11 items-center gap-2 rounded-media border border-dashed border-line-strong bg-surface-muted px-4 text-small font-medium text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg"
        >
          <ImageUp aria-hidden strokeWidth={1.75} className="size-4" /> Add screenshots
        </button>
      )}
      <p className="mt-1.5 text-micro text-fg-muted">PNG, JPEG, WebP, or GIF. Up to 5MB each, {MAX_SCREENSHOTS} total.</p>
    </div>
  )
}
