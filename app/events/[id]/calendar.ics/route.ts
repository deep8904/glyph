import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: evt } = await supabase
    .from('events')
    .select('title, description, city, country, venue, start_at, end_at, status')
    .eq('id', id)
    .maybeSingle()

  if (!evt || evt.status === 'draft') {
    return new NextResponse('Event not found', { status: 404 })
  }

  const location = [evt.venue, evt.city, evt.country].filter(Boolean).join(', ')
  const now = icsDate(new Date().toISOString())

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Glyph//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${id}@glyph.dev`,
    `DTSTAMP:${now}`,
    `DTSTART:${icsDate(evt.start_at)}`,
    `DTEND:${icsDate(evt.end_at)}`,
    `SUMMARY:${escapeIcs(evt.title)}`,
    evt.description ? `DESCRIPTION:${escapeIcs(evt.description.slice(0, 500))}` : '',
    location ? `LOCATION:${escapeIcs(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-${id}.ics"`,
    },
  })
}
