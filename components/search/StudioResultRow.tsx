import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { STUDIO_SIZES } from '@/lib/supabase/types'
import { isHttpsUrl } from '@/lib/utils'
import type { StudioRowData } from '@/lib/discovery/queries'

const SIZE_LABELS = Object.fromEntries(STUDIO_SIZES.map((s) => [s.value, s.label])) as Record<string, string>

/**
 * A studio as a search result: team identity first (logo/plate, name, verified), then size — no
 * project thumbnails here, that's the studio page's job. Same anatomy as the Studios directory row
 * so a studio looks like itself everywhere it appears.
 */
export function StudioResultRow({ studio }: { studio: StudioRowData }) {
  return (
    <li className="flex items-center gap-3 py-4">
      {isHttpsUrl(studio.logo_url) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={studio.logo_url!} alt="" className="size-11 shrink-0 rounded-media border border-line bg-surface-muted object-cover" />
      ) : (
        <Avatar name={studio.name} size="lg" />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-center gap-2 text-body font-medium text-fg [overflow-wrap:anywhere]">
          <Link href={`/studios/${studio.slug}`} data-result-link className="hover:text-link focus-visible:text-link">{studio.name}</Link>
          {studio.verified && <Badge tone="success">Verified</Badge>}
        </h3>
        <p className="text-small text-fg-muted">{SIZE_LABELS[studio.size] ?? studio.size}</p>
        {studio.description && <p className="mt-0.5 line-clamp-1 text-small text-fg-secondary">{studio.description}</p>}
      </div>
    </li>
  )
}
