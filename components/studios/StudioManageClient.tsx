'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { controlClass } from '@/components/ui/controls'
import {
  addStudioProject, removeStudioProject, updateStudio, inviteStudioMember,
  updateMemberRole, removeStudioMember, leaveStudio, revokeStudioInvitation,
} from '@/app/actions/studios'
import { StatusText } from '@/components/workflow/StatusLabel'
import { STUDIO_SIZES } from '@/lib/supabase/types'
import { relativeTime } from '@/lib/utils'

type Role = 'owner' | 'admin' | 'member'
type Studio = { id: string; slug: string; name: string; description: string | null; website: string | null; location: string | null; size: string }
export type ManageMember = { userId: string; role: Role; username: string; displayName: string | null; joinedAt: string }
export type ManageInvitation = { id: string; inviteeUsername: string; inviteeName: string | null; role: string; createdAt: string; expiresAt: string; expired: boolean }
export type ManageProject = { projectId: string; title: string; ownerId: string; visibility: string | null }

const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' }
const fieldCls = `${controlClass} h-10 px-3 pointer-coarse:h-11`
const areaCls = `${controlClass} px-3 py-2 leading-6 resize-y`
const labelCls = 'mb-1.5 block text-bodyall font-medium text-fg'
const btn = buttonVariants({ variant: 'secondary', size: 'sm' })
const btnPrimary = buttonVariants({ variant: 'primary', size: 'sm' })

type Confirm =
  | { kind: 'remove'; userId: string; name: string }
  | { kind: 'leave' }
  | { kind: 'role'; userId: string; name: string; role: Role }
  | { kind: 'unlink'; projectId: string; title: string }
  | { kind: 'revoke'; id: string; name: string }

export function StudioManageClient({
  studio, viewerRole, currentUserId, members, invitations, studioProjects, myProjects,
}: {
  studio: Studio
  viewerRole: Role
  currentUserId: string
  members: ManageMember[]
  invitations: ManageInvitation[]
  studioProjects: ManageProject[]
  myProjects: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [roleDraft, setRoleDraft] = useState<{ userId: string; role: Role } | null>(null)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [selectedProject, setSelectedProject] = useState('')

  const isOwner = viewerRole === 'owner'
  const isManager = viewerRole === 'owner' || viewerRole === 'admin'
  const ownerCount = members.filter((m) => m.role === 'owner').length
  const otherMembers = members.length - 1

  const run = (fn: () => Promise<{ error: string } | { success: true }>, done: string) => {
    setError(''); setNotice('')
    startTransition(async () => {
      const result = await fn()
      if ('error' in result) setError(result.error)
      else { setNotice(done); setConfirm(null); setRoleDraft(null); router.refresh() }
    })
  }

  const linkedIds = new Set(studioProjects.map((p) => p.projectId))
  const linkable = myProjects.filter((p) => !linkedIds.has(p.id))
  const canRemove = (m: ManageMember) => m.userId !== currentUserId && (isOwner || (viewerRole === 'admin' && m.role === 'member'))

  return (
    <div className="space-y-12">
      <div role="status" aria-live="polite" className="min-h-0">
        {notice && <p className="rounded-media border border-success-line bg-success-subtle px-4 py-3 text-body text-success">{notice}</p>}
      </div>
      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-body text-danger">{error}</p>}

      <p className="text-body leading-relaxed text-fg-muted">
        You are {viewerRole === 'admin' ? 'an' : 'a'} <span className="font-medium text-fg">{ROLE_LABEL[viewerRole]}</span> of {studio.name}.{' '}
        Owners manage everything, including roles. Admins edit the studio, invite members and link their own projects. Members appear on the team.
      </p>

      {/* ── Details ───────────────────────────────────────── */}
      {isManager && (
        <section aria-labelledby="details-h">
          <h2 id="details-h" className="text-h3 font-semibold text-fg">Studio details</h2>
          <form
            className="mt-4 max-w-xl space-y-4"
            onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run(() => updateStudio(studio.id, fd), 'Studio details saved.') }}
          >
            <div><label htmlFor="s-name" className={labelCls}>Name</label><input id="s-name" name="name" defaultValue={studio.name} maxLength={200} required className={fieldCls} /></div>
            <div><label htmlFor="s-desc" className={labelCls}>About</label><textarea id="s-desc" name="description" defaultValue={studio.description ?? ''} maxLength={5000} rows={4} className={areaCls} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="s-size" className={labelCls}>Size</label>
                <select id="s-size" name="size" defaultValue={studio.size} className={fieldCls}>{STUDIO_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><label htmlFor="s-loc" className={labelCls}>Location</label><input id="s-loc" name="location" defaultValue={studio.location ?? ''} maxLength={100} className={fieldCls} /></div>
            </div>
            <div><label htmlFor="s-web" className={labelCls}>Website</label><input id="s-web" name="website" type="url" defaultValue={studio.website ?? ''} maxLength={500} placeholder="https://" className={fieldCls} /></div>
            <button type="submit" disabled={pending} className={btnPrimary}>{pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save details</button>
          </form>
        </section>
      )}

      {/* ── Members ───────────────────────────────────────── */}
      <section aria-labelledby="members-h">
        <h2 id="members-h" className="text-h3 font-semibold text-fg">Members <span className="font-mono text-small font-normal text-fg-muted">{members.length}</span></h2>
        <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
          {members.map((m) => {
            const name = m.displayName || m.username
            const self = m.userId === currentUserId
            const lastOwner = m.role === 'owner' && ownerCount <= 1
            const draft = roleDraft?.userId === m.userId ? roleDraft.role : null
            return (
              <li key={m.userId} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <p className="min-w-0 text-body text-fg [overflow-wrap:anywhere]">
                    <Link href={`/dev/${m.username}`} className="font-medium hover:text-link">{name}</Link>
                    <span className="text-fg-muted"> @{m.username}{self && ' · you'}</span>
                  </p>
                  <StatusText label={ROLE_LABEL[m.role]} tone={m.role === 'owner' ? 'positive' : 'neutral'} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isOwner && !self && (
                    draft ? (
                      <>
                        <label htmlFor={`role-${m.userId}`} className="sr-only">New role for {name}</label>
                        <select id={`role-${m.userId}`} value={draft} onChange={(e) => setRoleDraft({ userId: m.userId, role: e.target.value as Role })} className="min-h-11 rounded-media border border-line bg-white px-3 text-body">
                          <option value="member">Member</option><option value="admin">Admin</option><option value="owner">Owner</option>
                        </select>
                        <button type="button" disabled={draft === m.role} onClick={() => setConfirm({ kind: 'role', userId: m.userId, name, role: draft })} className={btn}>Review change</button>
                        <button type="button" onClick={() => setRoleDraft(null)} className={btn}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setRoleDraft({ userId: m.userId, role: m.role })} className={btn} aria-label={`Change role of ${name}`}>Change role</button>
                    )
                  )}
                  {canRemove(m) && !(lastOwner) && (
                    <button type="button" onClick={() => setConfirm({ kind: 'remove', userId: m.userId, name })} className={btn} aria-label={`Remove ${name} from ${studio.name}`}>Remove</button>
                  )}
                  {self && (
                    lastOwner && otherMembers > 0 ? (
                      <p className="text-body text-fg-muted">You are the last owner. Make another member an owner before you can leave.</p>
                    ) : (
                      <button type="button" onClick={() => setConfirm({ kind: 'leave' })} className={btn}>Leave studio</button>
                    )
                  )}
                </div>

                {confirm && ((confirm.kind === 'remove' && confirm.userId === m.userId) || (confirm.kind === 'role' && confirm.userId === m.userId) || (confirm.kind === 'leave' && self)) && (
                  <div role="group" aria-label="Confirm" className="mt-3 rounded-media border border-line bg-surface-muted p-4">
                    <p className="text-body text-fg">
                      {confirm.kind === 'remove' && <>Remove {confirm.name} from {studio.name}? They lose their place on the team and will be told.</>}
                      {confirm.kind === 'role' && <>Change {confirm.name} from {ROLE_LABEL[m.role]} to {ROLE_LABEL[confirm.role]}? They will be told.{confirm.role === 'owner' && ' Owners can manage everything, including removing you.'}</>}
                      {confirm.kind === 'leave' && <>Leave {studio.name}? You will lose access to manage it. {m.role === 'owner' && otherMembers === 0 ? 'You are the only member, so the studio will be closed.' : 'You can be invited again.'}</>}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={pending} className={btnPrimary}
                        onClick={() => {
                          if (confirm.kind === 'remove') run(() => removeStudioMember(studio.id, confirm.userId), `${confirm.name} was removed.`)
                          else if (confirm.kind === 'role') run(() => updateMemberRole(studio.id, confirm.userId, confirm.role), `${confirm.name} is now ${ROLE_LABEL[confirm.role]}.`)
                          else { setError(''); startTransition(async () => { const r = await leaveStudio(studio.id); if ('error' in r) setError(r.error); else router.push('/dashboard/studios') }) }
                        }}>
                        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                        {confirm.kind === 'remove' ? 'Remove member' : confirm.kind === 'role' ? 'Change role' : 'Leave studio'}
                      </button>
                      <button type="button" onClick={() => setConfirm(null)} className={btn}>Cancel</button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Invitations ───────────────────────────────────── */}
      {isManager && (
        <section aria-labelledby="invites-h">
          <h2 id="invites-h" className="text-h3 font-semibold text-fg">Invitations</h2>
          <p className="mt-1 text-body text-fg-muted">People join only when they accept. Invitations expire after 14 days.</p>
          {invitations.length > 0 ? (
            <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
              {invitations.map((i) => {
                const name = i.inviteeName || i.inviteeUsername
                return (
                  <li key={i.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <p className="min-w-0 text-body text-fg [overflow-wrap:anywhere]">
                        <span className="font-medium">{name}</span> <span className="text-fg-muted">@{i.inviteeUsername} · as {i.role} · sent {relativeTime(i.createdAt)}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <StatusText label={i.expired ? 'Expired' : 'Pending'} tone={i.expired ? 'negative' : 'attention'} />
                        {!(confirm?.kind === 'revoke' && confirm.id === i.id) && (
                          <button type="button" onClick={() => setConfirm({ kind: 'revoke', id: i.id, name })} className={btn} aria-label={`Cancel invitation to ${name}`}>Cancel invitation</button>
                        )}
                      </div>
                    </div>
                    {confirm?.kind === 'revoke' && confirm.id === i.id && (
                      <div role="group" aria-label="Confirm" className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-body text-fg-secondary">Cancel the invitation to {name}? They will no longer be able to accept it.</span>
                        <button type="button" disabled={pending} onClick={() => run(() => revokeStudioInvitation(i.id), `Invitation to ${name} cancelled.`)} className={btnPrimary}>Cancel invitation</button>
                        <button type="button" onClick={() => setConfirm(null)} className={btn}>Keep</button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 border-y border-line-subtle py-4 text-body text-fg-muted">No pending invitations.</p>
          )}
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => { e.preventDefault(); if (!inviteUsername.trim()) return; run(async () => { const r = await inviteStudioMember(studio.id, inviteUsername, inviteRole); if ('success' in r) setInviteUsername(''); return r }, 'Invitation sent. They will see it in their notifications and studios.') }}
          >
            <div className="flex-1"><label htmlFor="inv-user" className={labelCls}>Invite by username</label>
              <input id="inv-user" value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="username" autoComplete="off" className={fieldCls} /></div>
            <div><label htmlFor="inv-role" className={labelCls}>Role</label>
              <select id="inv-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')} className={fieldCls}>
                <option value="member">Member</option>{isOwner && <option value="admin">Admin</option>}
              </select></div>
            <button type="submit" disabled={pending || !inviteUsername.trim()} className={btnPrimary}>{pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Send invitation</button>
          </form>
        </section>
      )}

      {/* ── Projects ──────────────────────────────────────── */}
      <section aria-labelledby="projects-h">
        <h2 id="projects-h" className="text-h3 font-semibold text-fg">Projects <span className="font-mono text-small font-normal text-fg-muted">{studioProjects.length}</span></h2>
        <p className="mt-1 text-body text-fg-muted">Only public projects appear on the studio page. Linking does not copy a project; it stays on its creator&apos;s page.</p>
        {studioProjects.length === 0 ? (
          <p className="mt-2 border-y border-line-subtle py-4 text-body text-fg-muted">No projects linked yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
            {studioProjects.map((p) => {
              const canUnlink = isManager || p.ownerId === currentUserId
              return (
                <li key={p.projectId} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <p className="min-w-0 text-body text-fg [overflow-wrap:anywhere]">
                      <span className="font-medium">{p.title}</span>
                      {p.visibility && p.visibility !== 'public' && <span className="text-fg-muted"> · {p.visibility === 'private' ? 'private' : 'unlisted'} — hidden from the studio page</span>}
                    </p>
                    {canUnlink && !(confirm?.kind === 'unlink' && confirm.projectId === p.projectId) && (
                      <button type="button" onClick={() => setConfirm({ kind: 'unlink', projectId: p.projectId, title: p.title })} className={btn} aria-label={`Unlink ${p.title} from ${studio.name}`}>Unlink</button>
                    )}
                  </div>
                  {confirm?.kind === 'unlink' && confirm.projectId === p.projectId && (
                    <div role="group" aria-label="Confirm" className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-body text-fg-secondary">Unlink {p.title} from {studio.name}? The project itself is not deleted.</span>
                      <button type="button" disabled={pending} onClick={() => run(() => removeStudioProject(studio.id, p.projectId), `${p.title} unlinked.`)} className={btnPrimary}>Unlink project</button>
                      <button type="button" onClick={() => setConfirm(null)} className={btn}>Keep linked</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {isManager && (
          linkable.length > 0 ? (
            <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); if (!selectedProject) return; run(async () => { const r = await addStudioProject(studio.id, selectedProject); if ('success' in r) setSelectedProject(''); return r }, 'Project linked.') }}>
              <div className="flex-1"><label htmlFor="link-project" className={labelCls}>Link one of your projects</label>
                <select id="link-project" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className={fieldCls}>
                  <option value="">Choose a project</option>{linkable.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select></div>
              <button type="submit" disabled={!selectedProject || pending} className={btnPrimary}>Link project</button>
            </form>
          ) : (
            <p className="mt-3 text-body text-fg-muted">You have no unlinked projects. Create one from <Link href="/dashboard/projects" className="font-medium text-link hover:text-accent-hover">your projects</Link>.</p>
          )
        )}
      </section>
    </div>
  )
}
