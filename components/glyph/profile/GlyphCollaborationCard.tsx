import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { CONTRACT_TYPES } from '@/lib/supabase/types'

type CollabPost = { id: string; post_type: string; role_needed: string | null; role_offered: string | null; contract_type: string }

const CONTRACT_LABELS = Object.fromEntries(CONTRACT_TYPES.map((c) => [c.value, c.label])) as Record<string, string>

/** Can I work with this person? Only rendered when open posts exist to act on — the header's
 * availability line already carries the plain open/closed status. */
export function GlyphCollaborationCard({ isOpenToCollab, posts, name }: { isOpenToCollab: boolean; posts: CollabPost[]; name: string }) {
  if (posts.length === 0) return null
  return (
    <div>
      <p className="text-small text-ink-2">
        {isOpenToCollab ? `${name} is open to collaborating on indie projects.` : `${name} isn't currently taking on new collaborations.`}
      </p>
      <ul className="mt-3 space-y-1">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/collaborate/${post.id}`} className="group flex min-h-11 items-center justify-between gap-3 rounded-[10px] px-2.5 py-2 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember">
              <span className="truncate text-small font-medium text-ink group-hover:text-ember-ink">
                {post.post_type === 'seeking_collaborator' ? `Seeking: ${post.role_needed ?? 'a role'}` : `Offering: ${post.role_offered ?? 'any role'}`}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-micro text-ink-3">
                {CONTRACT_LABELS[post.contract_type] ?? post.contract_type}
                <ArrowUpRight aria-hidden strokeWidth={1.75} className="size-3" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
