/**
 * Timezone helpers for events. An event stores an absolute instant (`start_at`/`end_at`,
 * timestamptz) AND its canonical IANA timezone (`timezone`, e.g. "Europe/Berlin"). The instant is
 * the source of truth; the timezone says how to *interpret the host's input* and how to *display*
 * it — so a Berlin meetup reads "6:00 PM CEST" to everyone, everywhere, and DST is handled by the
 * IANA database rather than a frozen numeric offset (the directive's explicit requirement).
 *
 * No dependency: the offset is derived from `Intl` by formatting the same instant twice (once in
 * UTC, once in the target zone) and diffing. Reliable to the minute, which is all events need.
 */

/** Milliseconds that `tz` is ahead of UTC at the given instant (positive east of UTC). */
export function tzOffsetMs(instant: Date, tz: string): number {
  // en-US with the 24h hourCycle so parsing is unambiguous; both reads are of the SAME instant.
  const fmt = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(instant)
  const toMs = (parts: Intl.DateTimeFormatPart[]) => {
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value)
    return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'))
  }
  return toMs(fmt(tz)) - toMs(fmt('UTC'))
}

/**
 * Interpret a wall-clock string ("2026-10-15T18:00", no zone) as a local time in `tz` and return
 * the absolute UTC instant. One refinement pass handles the DST-boundary case where the offset at
 * the naive guess differs from the offset at the true instant.
 */
export function wallTimeInZoneToUtc(wall: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(wall)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number)
  const naiveUtcMs = Date.UTC(y, mo - 1, d, h, mi)
  const offset1 = tzOffsetMs(new Date(naiveUtcMs), tz)
  const guess = naiveUtcMs - offset1
  // Re-derive the offset at the guessed instant; if a DST transition changed it, correct once.
  const offset2 = tzOffsetMs(new Date(guess), tz)
  return new Date(naiveUtcMs - offset2)
}

/** Format an absolute instant in a specific timezone, always printing the zone name. */
export function formatInZone(
  instant: Date,
  tz: string,
  opts: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: tz }).format(instant)
}

/**
 * A curated set of common timezones for the event form's default list, plus whatever the
 * host's browser reports. Not the full ~400-entry IANA list (Intl.supportedValuesOf covers that
 * when we want a complete searchable picker) — this is the fast, sensible default set.
 */
export const COMMON_TIMEZONES = [
  'America/Los_Angeles', 'America/Denver', 'America/Phoenix', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid',
  'Europe/Athens', 'Europe/Moscow', 'Africa/Lagos', 'Africa/Johannesburg', 'Asia/Dubai',
  'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
] as const

/** Human label for a timezone, e.g. "Europe/Berlin (CEST)" — the current abbreviation helps a host
 *  recognise their own zone without needing to know IANA names. */
export function tzLabel(tz: string, now: Date = new Date()): string {
  const abbr = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value
  const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz
  return abbr && abbr !== tz ? `${city} (${abbr})` : city
}
