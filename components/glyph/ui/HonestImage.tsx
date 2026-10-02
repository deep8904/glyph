'use client'

import { useEffect, useRef } from 'react'
import { createNotifyOnceGuard } from '@/lib/glyph/notifyOnceGuard'

/**
 * Shared failed-media detection for plain content <img> tags (proven on the Project surface;
 * consumed by Profile, Dashboard, standalone Devlog, and Search).
 *
 * Catches both a post-hydration failure (`onError`) and a pre-hydration one — a request that
 * already failed before this component's effects ran. The pre-hydration check runs in a `useEffect`
 * (i.e. strictly after commit/hydration), never synchronously during mount/render, so a failure
 * notification can never fire while React is still reconciling the server-rendered markup against
 * the client's first render. SSR and the client's initial render are identical regardless of
 * outcome: this component always renders the same `<img>`; only the caller's `onFail`-driven
 * fallback state changes, and now only ever after that first commit. (A hydration-mismatch console
 * error seen while verifying an earlier version of this fix was traced to invalid nested `<li>`
 * markup in the temporary test fixture, not to this component — but the callback ref's synchronous,
 * during-render `onFail()` call it replaced was still an unsafe pattern in its own right, flagged
 * by React's own rules-of-hooks lint, and is correctly removed here regardless.)
 *
 * `onFail` is read through a ref (`onFailRef`), kept current via its own effect rather than a
 * `useCallback`/dependency, so an inline caller callback whose identity changes every render never
 * re-triggers the media check. `createNotifyOnceGuard` (see lib/glyph/notifyOnceGuard.ts) tracks the
 * currently mounted source independently from whether it has notified, so it stops the same failure
 * from notifying the parent twice (post-hydration check and a subsequent `onError`, in either order)
 * while still permitting a later, genuinely new failure of any source — including one that changed
 * away and successfully loaded in between — to notify again. The `[src]` effect explicitly observes
 * every source change (`observeSource`) before checking whether that source is broken, so a source
 * that never failed still clears the way for its next mount to notify.
 */
export function HonestImage({
  src,
  alt,
  className,
  style,
  loading,
  onFail,
}: {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
  onFail: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const onFailRef = useRef(onFail)
  const guardRef = useRef(createNotifyOnceGuard())

  // Keeps the latest onFail available to the other effect/handler without making it a dependency —
  // refs must only be written outside of render, so this runs after every commit instead.
  useEffect(() => {
    onFailRef.current = onFail
  })

  useEffect(() => {
    // Every source change must be observed before checking for a failure — otherwise a source that
    // changed away and loaded successfully (never calling tryNotify) would leave the guard still
    // pointed at the previous source, and a later re-mount of that source that genuinely fails again
    // would be wrongly suppressed as "already notified."
    guardRef.current.observeSource(src)
    const el = imgRef.current
    // Runs after commit: if the image had already finished (successfully or not) by the time this
    // effect fires — the pre-hydration case — this is the first safe moment to react to that.
    if (el && el.complete && el.naturalWidth === 0 && guardRef.current.tryNotify(src)) {
      onFailRef.current()
    }
  }, [src])

  const handleError = () => {
    if (guardRef.current.tryNotify(src)) onFailRef.current()
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={imgRef} src={src} alt={alt} className={className} style={style} loading={loading} onError={handleError} />
  )
}
