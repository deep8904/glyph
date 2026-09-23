import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { STUDIO_SIZES } from '@/lib/supabase/types'
import { isHttpsUrl } from '@/lib/utils'

export const metadata = { title: 'Studios — Glyph' }

const SIZE_LABELS = Object.fromEntries(STUDIO_SIZES.map((s) => [s.value, s.label]))

type StudioRow = { id: string; slug: string; name: string; description: string | null; logo_url: string | null; size: string; verified: boolean }

/**
 * Public studio directory — closes the gap where a studio was only reachable via a known slug.
 * A studio is an identity, not a portfolio: this list shows who they are, not what they've shipped
 * (that's each member's project pages). Newest first; no ranking, no follower counts.
 */
export default async function StudiosIndexPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('studios')
    .select('id, slug, name, description, logo_url, size, verified')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<StudioRow[]>()

  const studios = data ?? []

  return (
    <DiscoveryFrame label="Studios">
      {() => (
        <div>
          <h1 className="text-h1 font-semibold text-fg">Studios</h1>
          <p className="mt-1 max-w-prose text-small text-fg-secondary">Teams. The work lives on each project&apos;s own page.</p>

          {error ? (
            <ErrorState className="mt-6" title="Studios could not be loaded" description="This may be temporary." retryHref="/studios" />
          ) : studios.length === 0 ? (
            <EmptyState className="mt-6" kind="first-use" icon={Building2} title="No studios yet" description="Studios appear here once a team creates one." />
          ) : (
            <ul className="mt-6 divide-y divide-line-subtle border-y border-line-subtle">
              {studios.map((s) => (
                <li key={s.id}>
                  <Link href={`/studios/${s.slug}`} className="flex min-h-11 items-start gap-3 py-3 hover:bg-surface-muted focus-visible:bg-surface-muted sm:min-h-0">
                    {isHttpsUrl(s.logo_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo_url} alt="" className="size-10 shrink-0 rounded-media border border-line bg-surface-muted object-cover" />
                    ) : (
                      <Avatar name={s.name} size="lg" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-body font-medium text-fg [overflow-wrap:anywhere]">
                        {s.name}
                        {s.verified && <Badge tone="success">Verified</Badge>}
                      </p>
                      <p className="text-small text-fg-muted">{SIZE_LABELS[s.size] ?? s.size}</p>
                      {s.description && <p className="mt-0.5 line-clamp-1 text-small text-fg-secondary">{s.description}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DiscoveryFrame>
  )
}
