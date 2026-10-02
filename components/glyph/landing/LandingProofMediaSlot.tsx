'use client'

import { useState } from 'react'
import { HonestImage } from '@/components/glyph/ui/HonestImage'
import { SampleTag } from '@/components/glyph/ui/SampleTag'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { isSampleMedia } from '@/lib/glyph/media'
import { initialMediaTrack, observeMediaSource, markMediaFailed, shouldShowImage, type MediaTrackState } from '@/lib/glyph/landingMediaSlot'

/**
 * The landing page's one media slot — cover, failed-cover, and no-cover all share this exact
 * wrapper, so geometry never shifts between states. Uses the approved shared `HonestImage`
 * mechanism (the same one Profile's build snapshot uses) for both pre- and post-hydration failure
 * detection, rather than reimplementing the callback-ref check here.
 *
 * Failure is tracked per *currently observed* source (`lib/glyph/landingMediaSlot`'s pure state
 * machine, mirroring `createNotifyOnceGuard`), not a bare boolean and not a simple "last failed URL"
 * string — a genuine transition of the `coverUrl` prop always re-arms the new observation, even when
 * it returns to a source that failed before, and even across an intervening no-cover.
 *
 * The transition itself is resolved directly in the render body (`track.src !== coverUrl`) — React's
 * own documented pattern for "adjusting state when a prop changes" without an Effect
 * (react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes). This repo's
 * stricter hooks lint refuses both an Effect that calls `setState` unconditionally in its body
 * (`react-hooks/set-state-in-effect`) and any ref read/write during render (`react-hooks/refs`) — this
 * is the one remaining sanctioned option, and it resolves in the same render pass, so there is no
 * interim fallback flash on an ordinary cover-to-cover swap. Only a genuine, later failure — reported
 * from `HonestImage`'s own effect/event handling, never from this component's render — calls the
 * setter from an actual event callback.
 */
export function LandingProofMediaSlot({ coverUrl, alt, monogramName }: { coverUrl: string | null; alt: string; monogramName: string }) {
  const [track, setTrack] = useState<MediaTrackState>(() => initialMediaTrack(coverUrl))

  if (track.src !== coverUrl) {
    setTrack(observeMediaSource(track, coverUrl))
  }

  const showImage = shouldShowImage(track, coverUrl)

  const handleFail = () => {
    setTrack((prev) => markMediaFailed(prev, coverUrl))
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] border border-hair bg-sunken sm:aspect-square">
      {showImage ? (
        <>
          <HonestImage src={coverUrl as string} alt={alt} className="size-full object-cover" onFail={handleFail} />
          {isSampleMedia(coverUrl) && <SampleTag />}
        </>
      ) : (
        <div className="flex size-full items-center justify-center">
          <GAvatar name={monogramName} size={56} />
        </div>
      )}
    </div>
  )
}
