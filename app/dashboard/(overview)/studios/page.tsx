import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { StatusText } from '@/components/workflow/StatusLabel'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { InvitationActions } from '@/components/studios/InvitationCard'
import { relativeTime } from '@/lib/utils'

type Membership = { role: string; studios: { slug: string; name: string; description: string | null; status: string } | null }
type Invite = { id: string; role: string; created_at: string; expires_at: string; studios: { name: string; slug: string } | null; profiles: { username: string; display_name: string | null } | null }

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' }

export default async function MyStudiosPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const [{ data: memberships }, { data: invites }] = await Promise.all([
    supabase.from('studio_members').select('role, studios!studio_id(slug, name, description, status)').eq('user_id', user.id).returns<Membership[]>(),
    supabase
      .from('studio_invitations')
      .select('id, role, created_at, expires_at, studios!studio_id(name, slug), profiles!invited_by(username, display_name)')
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .returns<Invite[]>(),
  ])
  const mine = (memberships ?? []).filter((m) => m.studios && m.studios.status === 'active')
  const pending = invites ?? []

  return (
    <AppShell
      displayName={displayName}
      email={email}
      nav={nav}
      headerLabel="Studios"
      headerAction={
        <Button asChild variant="primary" size="sm"><Link href="/dashboard/studios/new">New studio</Link></Button>
      }
    >
      <div className="max-w-3xl space-y-10">
        <h1 className="text-h1 font-semibold text-fg">Your studios</h1>

        {pending.length > 0 && (
          <section aria-labelledby="inv-h">
            <h2 id="inv-h" className="text-h3 font-semibold text-fg">Invitations <span className="font-mono text-small font-normal text-fg-muted">{pending.length}</span></h2>
            <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
              {pending.map((i) => (
                <li key={i.id} className="py-4">
                  <p className="text-body text-fg [overflow-wrap:anywhere]">
                    <span className="font-medium">{i.profiles?.display_name ?? i.profiles?.username ?? 'Someone'}</span> invited you to join{' '}
                    <Link href={`/studios/${i.studios?.slug}`} className="font-medium text-link hover:text-accent-hover">{i.studios?.name}</Link> as {i.role}.
                  </p>
                  <p className="mt-0.5 text-small text-fg-muted">Sent {relativeTime(i.created_at)} · expires {new Date(i.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. You are not a member until you accept.</p>
                  <div className="mt-3"><InvitationActions invitationId={i.id} studioName={i.studios?.name ?? 'the studio'} /></div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="mine-h">
          <h2 id="mine-h" className="text-h3 font-semibold text-fg">Your studios</h2>
          {mine.length === 0 ? (
            <div className="mt-2 border-y border-line-subtle py-6">
              <p className="text-body text-fg-secondary">You are not in a studio.</p>
              <p className="mt-1 text-body text-fg-muted">A studio is a shared identity for a team and the games it makes. Create one, or accept an invitation from another studio.</p>
              <Link href="/dashboard/studios/new" className="mt-3 inline-flex min-h-11 items-center text-body font-medium text-link hover:text-accent-hover">Create a studio</Link>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
              {mine.map((m) => (
                <li key={m.studios!.slug}>
                  <Link href={`/dashboard/studios/${m.studios!.slug}`} className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4 hover:text-link">
                    <span className="min-w-0">
                      <span className="block text-body font-medium text-fg [overflow-wrap:anywhere]">{m.studios!.name}</span>
                      {m.studios!.description && <span className="line-clamp-1 text-body text-fg-muted">{m.studios!.description}</span>}
                    </span>
                    <StatusText label={ROLE_LABEL[m.role] ?? m.role} tone={m.role === 'owner' ? 'positive' : 'neutral'} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}
