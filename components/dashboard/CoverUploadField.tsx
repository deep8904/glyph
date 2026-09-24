'use client'

import { useRef, useState } from 'react'
import { ImageUp, RotateCcw, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadProjectImage, removeProjectImage, pathFromPublicUrl } from '@/lib/media/uploadProjectImage'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'

/**
 * Cover image: upload, replace, remove. No fake progress — the storage SDK has no byte-level
 * progress callback, so "uploading" is an honest indeterminate state, never a fabricated percent.
 */
export function CoverUploadField({
  id,
  value,
  onChange,
  ensureProjectId,
}: {
  id?: string
  value: string
  onChange: (url: string) => void
  /** Lazily creates the project row on first upload if it doesn't exist yet (a brand-new project
   *  has no id until something needs one) and returns its id. */
  ensureProjectId: () => Promise<string>
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [error, setError] = useState('')

  const pick = () => inputRef.current?.click()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setStatus('uploading')
    setError('')
    try {
      const projectId = await ensureProjectId()
      const result = await uploadProjectImage(supabase, projectId, 'cover', file)
      if ('error' in result) {
        setStatus('error')
        setError(result.error)
        return
      }
      const previous = value ? pathFromPublicUrl(value) : null
      onChange(result.url)
      setStatus('idle')
      // Best-effort: replace the old object only after the new one is confirmed saved, so a
      // failed replace never leaves the field with nothing.
      if (previous) removeProjectImage(supabase, previous)
    } catch {
      setStatus('error')
      setError('Could not start this upload. Try again.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = () => {
    const path = pathFromPublicUrl(value)
    onChange('')
    if (path) removeProjectImage(supabase, path)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-20 w-32 shrink-0 rounded-media border border-line object-cover" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button id={id} type="button" variant="secondary" size="sm" onClick={pick} disabled={status === 'uploading'} loading={status === 'uploading'}>
              <RotateCcw aria-hidden strokeWidth={1.75} className="size-3.5" /> Replace
            </Button>
            <IconButton label="Remove cover image" variant="secondary" size="sm" onClick={remove} disabled={status === 'uploading'}>
              <X aria-hidden strokeWidth={1.75} className="size-4" />
            </IconButton>
          </div>
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={pick}
          disabled={status === 'uploading'}
          className="flex h-20 w-full max-w-xs items-center justify-center gap-2 rounded-media border border-dashed border-line-strong bg-surface-muted text-small font-medium text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg disabled:pointer-events-none disabled:opacity-60"
        >
          {status === 'uploading' ? (
            <span className="inline-flex items-center gap-2"><span aria-hidden className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent motion-reduce:animate-none" /> Uploading…</span>
          ) : (
            <><ImageUp aria-hidden strokeWidth={1.75} className="size-4" /> Upload cover image</>
          )}
        </button>
      )}
      <p className="mt-1.5 text-micro text-fg-muted">PNG, JPEG, WebP, or GIF. Up to 5MB.</p>
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-2 text-small font-medium text-danger">
          {error} <button type="button" onClick={pick} className="underline underline-offset-2">Try again</button>
        </p>
      )}
    </div>
  )
}
