'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/**
 * A notification row that leads somewhere. Following it marks the row (or its merged group) read;
 * a failure to mark must never block navigation, and must never surface as an uncaught rejection —
 * both `.then` and `.catch` resolve to nothing, so the click always completes normally either way.
 */
export function GlyphNotificationLink({ ids, unread, href, children, className }: { ids: string[]; unread: boolean; href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (!unread) return
        createClient().from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids).is('read_at', null)
          .then(() => undefined, () => undefined)
      }}
      className={className}
    >
      {children}
    </Link>
  )
}
