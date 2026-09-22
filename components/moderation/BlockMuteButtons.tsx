'use client'

import { useState, useTransition } from 'react'
import { BellOff, MoreHorizontal, Shield, ShieldOff, Bell, Flag } from 'lucide-react'
import { blockUser, unblockUser, muteUser, unmuteUser } from '@/app/actions/moderation'
import { reportContent } from '@/app/actions/admin'
import { MODERATION_REASONS } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu'
import { Select, Textarea } from '@/components/ui/controls'
import { toast } from '@/components/ui/Toast'

type Props = {
  targetId: string
  targetUsername: string
  isBlocked: boolean
  isMuted: boolean
  entityType?: string
  entityId?: string
}

/**
 * Block / mute (and report, when an entity is given) for another user, in one menu instead of
 * always-visible buttons. Behaviour and server actions are unchanged; the outcome is announced.
 */
export function BlockMuteButtons({ targetId, targetUsername, isBlocked: initialBlocked, isMuted: initialMuted, entityType, entityId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [muted, setMuted] = useState(initialMuted)
  const [message, setNote] = useState<string | null>(null)
  // Visible confirmation (toast) plus a guaranteed live-region announcement.
  const setMessage = (m: string) => { setNote(m); toast(m) }
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')

  function handleBlock() {
    startTransition(async () => {
      const result = blocked ? await unblockUser(targetId) : await blockUser(targetId)
      if ('error' in result) { setMessage(result.error) }
      else { setBlocked(!blocked); setMessage(blocked ? 'User unblocked.' : `@${targetUsername} blocked.`) }
    })
  }

  function handleMute() {
    startTransition(async () => {
      const result = muted ? await unmuteUser(targetId) : await muteUser(targetId)
      if ('error' in result) { setMessage(result.error) }
      else { setMuted(!muted); setMessage(muted ? 'User unmuted.' : `@${targetUsername} muted.`) }
    })
  }

  function handleReport() {
    if (!reportReason || !entityType || !entityId) return
    startTransition(async () => {
      const result = await reportContent(entityType, entityId, reportReason, reportDesc)
      if ('error' in result) { setMessage(result.error) }
      else { setShowReport(false); setMessage('Report submitted. Thank you.') }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Menu>
        <MenuTrigger asChild>
          <IconButton variant="secondary" label={`More actions for @${targetUsername}`} disabled={isPending}>
            <MoreHorizontal aria-hidden strokeWidth={1.75} className="size-4" />
          </IconButton>
        </MenuTrigger>
        <MenuContent>
          <MenuItem onSelect={handleMute}>
            {muted ? <Bell aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" /> : <BellOff aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" />}
            {muted ? 'Unmute' : 'Mute'} @{targetUsername}
          </MenuItem>
          <MenuItem onSelect={handleBlock} danger={!blocked}>
            {blocked ? <ShieldOff aria-hidden strokeWidth={1.75} className="size-4" /> : <Shield aria-hidden strokeWidth={1.75} className="size-4" />}
            {blocked ? 'Unblock' : 'Block'} @{targetUsername}
          </MenuItem>
          {entityType && entityId && (
            <MenuItem onSelect={() => setShowReport(true)}>
              <Flag aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" /> Report
            </MenuItem>
          )}
        </MenuContent>
      </Menu>

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent title="Report content" description="Tell the moderators what is wrong. Reports are reviewed by people.">
          <div className="space-y-4">
            <Field label="Reason" required>
              {(p) => (
                <Select {...p} value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  <option value="">Select a reason…</option>
                  {MODERATION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Details" hint="Optional.">
              {(p) => <Textarea {...p} value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} maxLength={2000} rows={3} />}
            </Field>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleReport} disabled={!reportReason} loading={isPending}>Submit report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p role="status" aria-live="polite" className="sr-only">{message}</p>
    </div>
  )
}
