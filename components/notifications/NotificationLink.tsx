'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/** A row that leads somewhere. Following it marks the row (or merged rows) read; failure to mark never blocks navigation. */
export function NotificationLink({ ids, unread, href, children }: { ids: string[]; unread: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (!unread) return
        void createClient().from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids).is('read_at', null).then(() => undefined)
      }}
      className="flex min-h-11 items-start gap-3 rounded-control px-1 py-3 transition-colors duration-150 hover:bg-surface-muted focus-visible:bg-surface-muted"
    >
      {children}
    </Link>
  )
}
