import Link from 'next/link'
import { relativeTime } from '@/lib/utils'
import { labelFor, CONTRACT_TYPES } from '@/lib/supabase/types'
import type { OpportunityRowData } from '@/lib/discovery/queries'

/**
 * A collaboration opportunity as a search result: what kind (seeking/offering) → the role → the
 * project it belongs to → the arrangement. Own small anatomy — an opportunity is an action to take
 * (apply), not a person or a project profile.
 */
export function GlyphOpportunityResultRow({ post }: { post: OpportunityRowData }) {
  const seeking = post.post_type === 'seeking_collaborator'
  const role = (seeking ? post.role_needed : post.role_offered) ?? (seeking ? 'a role' : 'help')
  const arrangement = [post.contract_type ? labelFor(CONTRACT_TYPES, post.contract_type) ?? post.contract_type : null, post.remote_allowed ? 'Remote OK' : null, post.location].filter(Boolean).join(' · ')
  const author = post.display_name || post.username

  return (
    <li className="border-b border-hair">
      <Link href={`/collaborate/${post.id}`} className="group block rounded-sm py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ember">
        <p className="font-medium text-ink group-hover:text-ember-ink [overflow-wrap:anywhere]">
          {seeking ? 'Seeking' : 'Offering'} <span className="text-ink">{role}</span>
          {post.project_title && <span className="text-ink-2"> · {post.project_title}</span>}
        </p>
        <p className="mt-0.5 text-small text-ink-3">
          {arrangement || 'Arrangement not specified'}
          <span> · {author}</span>
          <span> · {relativeTime(post.created_at)}</span>
        </p>
      </Link>
    </li>
  )
}
