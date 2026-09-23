import Link from 'next/link'
import { CONTRACT_TYPES } from '@/lib/supabase/types'
import { Section } from '@/components/ui/Section'

type CollabPost = { id: string; post_type: string; role_needed: string | null; role_offered: string | null; contract_type: string }

const CONTRACT_LABELS = Object.fromEntries(CONTRACT_TYPES.map((c) => [c.value, c.label])) as Record<string, string>

/** Can I work with this person? Availability sentence plus their open collaboration posts, as plain rows. */
export function CollaborationCard({ isOpenToCollab, posts, name }: { isOpenToCollab: boolean; posts: CollabPost[]; name: string }) {
  if (!isOpenToCollab && posts.length === 0) return null

  return (
    <Section id="collaboration" title="Collaboration">
      <p className="text-body text-fg-secondary">
        {isOpenToCollab ? `${name} is open to collaborating on indie projects.` : `${name} isn't currently taking on new collaborations.`}
      </p>
      {posts.length > 0 && (
        <ul className="mt-3 divide-y divide-line-subtle border-y border-line-subtle">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/collaborate/${post.id}`} className="group flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="truncate text-body text-fg group-hover:text-link">
                  {post.post_type === 'seeking_collaborator' ? `Seeking: ${post.role_needed ?? 'a role'}` : `Offering: ${post.role_offered ?? 'any role'}`}
                </span>
                <span className="shrink-0 text-small text-fg-muted">{CONTRACT_LABELS[post.contract_type] ?? post.contract_type}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
