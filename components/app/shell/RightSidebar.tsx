import Link from 'next/link'
import { Calendar, Clock, TestTube2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Event, PlaytestRequest } from '@/types/database'

async function LocalEvents() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, venue, city, is_online')
    .eq('city', 'Phoenix')
    .eq('is_published', true)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(4)

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-widest text-[var(--color-glyph-text-3)]">
        <Calendar size={11} />
        Local Events
      </h3>
      {!events?.length ? (
        <p className="font-sans text-xs text-[var(--color-glyph-text-3)]">
          No upcoming events in Phoenix — check back soon.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map(ev => (
            <li key={ev.id} className="rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] p-3">
              <p className="font-sans text-xs font-medium text-[var(--color-glyph-text)] leading-snug">
                {ev.title}
              </p>
              <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-[var(--color-glyph-text-3)]">
                <Clock size={9} />
                {new Date(ev.event_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {ev.venue ? ` · ${ev.venue}` : ev.is_online ? ' · Online' : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

async function OpenPlaytests() {
  const supabase = await createClient()
  const { data: playtests } = await supabase
    .from('playtest_requests')
    .select('id, title, platforms, estimated_minutes, max_testers, deadline')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-widest text-[var(--color-glyph-text-3)]">
        <TestTube2 size={11} />
        Open Playtests
      </h3>
      {!playtests?.length ? (
        <p className="font-sans text-xs text-[var(--color-glyph-text-3)]">
          No open playtests right now — post yours when you're ready.
        </p>
      ) : (
        <ul className="space-y-2">
          {playtests.map(pt => (
            <li key={pt.id}>
              <Link
                href={`/playtest`}
                className="block rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] p-3 transition hover:border-[var(--color-glyph-border-hi)]"
              >
                <p className="font-sans text-xs font-medium text-[var(--color-glyph-text)] leading-snug">
                  {pt.title}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {pt.platforms.slice(0, 2).map((plat: string) => (
                    <span
                      key={plat}
                      className="rounded-md bg-[var(--color-glyph-surface-3)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--color-glyph-text-3)]"
                    >
                      {plat}
                    </span>
                  ))}
                  {pt.estimated_minutes && (
                    <span className="rounded-md bg-[var(--color-glyph-surface-3)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--color-glyph-text-3)]">
                      ~{pt.estimated_minutes}m
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export async function RightSidebar() {
  return (
    <aside className="fixed right-0 top-14 hidden h-[calc(100vh-3.5rem)] w-[280px] flex-col gap-6 overflow-y-auto border-l border-[var(--color-glyph-border)] bg-[var(--color-glyph-black)] px-4 py-5 xl:flex">
      <LocalEvents />
      <div className="h-px bg-[var(--color-glyph-border)]" />
      <OpenPlaytests />
    </aside>
  )
}
