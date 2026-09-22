'use client'

import { useState, useTransition } from 'react'
import { saveNotificationPreferences, type NotificationPrefs } from '@/app/actions/account'
import { Button } from '@/components/ui/Button'
import { FormStatus } from './FormStatus'

/** One family per real notification category. Each lists the events it covers, in the words the notification list uses. */
export const NOTIFICATION_FAMILIES: { key: keyof NotificationPrefs; label: string; events: string }[] = [
  { key: 'activity', label: 'Activity on your work', events: 'Someone follows you, comments on or replies in a devlog thread, or reacts to your devlog.' },
  { key: 'collaboration', label: 'Collaboration', events: 'Someone applies to your collaboration post; a post owner accepts, declines or closes something you applied to.' },
  { key: 'playtesting', label: 'Playtesting', events: 'Someone signs up to your playtest or sends feedback; a developer accepts or skips your sign-up.' },
  { key: 'studios', label: 'Studios', events: 'You are invited to a studio, an invitation you sent is accepted, or your role changes or you are removed.' },
  { key: 'publisher', label: 'Publisher messages', events: 'A verified publisher contacts you about a project. The message itself always stays in Publisher messages.' },
]

/** In-product preferences only. They are enforced where notifications are created, so a turned-off family is never stored. */
export function NotificationPreferencesForm({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial)
  const [saved, setSaved] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const dirty = NOTIFICATION_FAMILIES.some((c) => prefs[c.key] !== saved[c.key])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setNotice('')
    startTransition(async () => {
      const r = await saveNotificationPreferences(prefs)
      if ('error' in r) setError(r.error)
      else { setSaved(prefs); setNotice('Saved. This applies to new notifications from now on.') }
    })
  }

  return (
    <form onSubmit={submit}>
      <fieldset>
        <legend className="sr-only">Notify me in Glyph about</legend>
        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
          {NOTIFICATION_FAMILIES.map((c) => (
            <li key={c.key} className="relative flex items-start gap-3 py-3">
              <input
                id={`np-${c.key}`} type="checkbox" checked={prefs[c.key]} onChange={(e) => setPrefs((p) => ({ ...p, [c.key]: e.target.checked }))}
                aria-describedby={`np-${c.key}-d`} className="mt-0.5 size-5 shrink-0 accent-accent"
              />
              <label htmlFor={`np-${c.key}`} className="min-w-0 flex-1 cursor-pointer before:absolute before:inset-0 before:content-['']">
                <span className="block text-body font-medium text-fg">{c.label}</span>
                <span id={`np-${c.key}-d`} className="block text-small text-fg-secondary">{c.events}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <FormStatus error={error} notice={notice} className="mt-3 min-h-5" />
      <Button type="submit" variant="primary" loading={pending} disabled={!dirty} className="mt-2">Save preferences</Button>
    </form>
  )
}
