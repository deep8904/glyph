'use client'

import { useCallback, useState } from 'react'
import { SampleTag } from '@/components/glyph/ui/SampleTag'
import { isSampleMedia } from '@/lib/glyph/media'
import { cn } from '@/lib/utils'

/**
 * True when a mounted <img> node has already finished loading and failed — the case where the
 * server-rendered request errored before hydration attached the React `onError` handler. The
 * browser never refires `error` for an image that already errored pre-hydration, so `onError`
 * alone misses it; checking `complete && naturalWidth === 0` on the ref callback (which fires
 * during commit, right after the node mounts/hydrates) catches it too.
 */
function isAlreadyBroken(el: HTMLImageElement | null): boolean {
  return !!el && el.complete && el.naturalWidth === 0
}

/**
 * Honest cover media: a failed load never leaves a hero-sized empty rectangle. The whole section
 * unmounts on error so the page falls back to the identity-only composition — the same one used
 * when there was never a cover — rather than reserving dead space. Rendered server-side first
 * (plain <img>, no client-only markup, so no hydration mismatch), the error boundary only ever
 * removes content, both for a post-hydration failure (`onError`) and a pre-hydration one (ref check).
 */
export function GlyphCoverMedia({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const checkRef = useCallback((el: HTMLImageElement | null) => {
    if (isAlreadyBroken(el)) setFailed(true)
  }, [])
  if (failed) return null
  return (
    <section className="relative mt-10 overflow-hidden rounded-[14px] border border-hair">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={checkRef} src={src} alt={alt} className="aspect-video w-full object-cover" onError={() => setFailed(true)} />
      {isSampleMedia(src) && <SampleTag />}
    </section>
  )
}

export type Screenshot = { url: string; alt: string }

/**
 * Honest screenshot gallery: any screenshot that fails to load — whether the failure is observed
 * after hydration (`onError`) or the image was already broken when hydration attached (ref check
 * for `complete && naturalWidth === 0`) — is removed from the grid, not left as an empty cell. If
 * every screenshot fails, the whole section — heading included — disappears, since a heading over
 * an empty gallery is dishonest.
 */
export function GlyphScreenshotGallery({ title, screenshots }: { title: string; screenshots: Screenshot[] }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set())
  const visible = screenshots.filter((s) => !failedUrls.has(s.url))

  const markFailed = useCallback((url: string) => {
    setFailedUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)))
  }, [])
  const checkRef = useCallback((el: HTMLImageElement | null, url: string) => {
    if (isAlreadyBroken(el)) markFailed(url)
  }, [markFailed])

  if (visible.length === 0) return null

  return (
    <section aria-labelledby="screenshots" className="mt-10">
      <h2 id="screenshots" className="text-h2 font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((s, i) => (
          <div key={s.url} className={cn('relative overflow-hidden rounded-[10px] border border-hair', i === 0 && 'sm:col-span-2')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => checkRef(el, s.url)}
              src={s.url}
              alt={s.alt}
              loading="lazy"
              className="w-full object-cover"
              style={{ aspectRatio: '16 / 9' }}
              onError={() => markFailed(s.url)}
            />
            {isSampleMedia(s.url) && <SampleTag />}
          </div>
        ))}
      </div>
    </section>
  )
}
