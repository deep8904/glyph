import Link from 'next/link'
import { isHttpsUrl } from '@/lib/utils'
import { StatusText } from '@/components/workflow/StatusLabel'

export type PublisherListRow = { id: string; company_name: string; description: string | null; website: string | null }

/** One verified publisher in the directory: who they are and where to find them. Identity only — relationships live on project pages. Renders an <li>. */
export function PublisherRow({ publisher }: { publisher: PublisherListRow }) {
  const site = isHttpsUrl(publisher.website) ? new URL(publisher.website).hostname : null
  return (
    <li className="py-4">
      <h2 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
        <Link href={`/publishers/${publisher.id}`} className="inline-flex min-h-11 items-center hover:text-link focus-visible:text-link sm:min-h-0">{publisher.company_name}</Link>
      </h2>
      <p className="text-small"><StatusText label="Verified" tone="positive" />{site && <span className="text-fg-muted"> · {site}</span>}</p>
      {publisher.description && <p className="mt-1 line-clamp-2 max-w-prose text-body text-fg-secondary">{publisher.description}</p>}
    </li>
  )
}
