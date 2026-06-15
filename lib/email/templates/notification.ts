import { baseLayout, textLayout, h1, p, btn } from './base'
import type { EmailPayload } from '../index'

export function notificationEmail(opts: {
  to: string
  recipientName: string
  notificationType: string
  body: string
  ctaLabel: string
  ctaHref: string
}): EmailPayload {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyph.gg'
  const subject = opts.body.length > 60 ? opts.body.slice(0, 57) + '…' : opts.body

  const html = baseLayout(
    `${h1('New notification')}
${p(`Hey <strong>${opts.recipientName}</strong>,`)}
${p(opts.body)}
${btn(opts.ctaLabel, `${BASE}${opts.ctaHref}`)}`,
    subject
  )

  const text = textLayout(
    `Hey ${opts.recipientName},\n\n${opts.body}\n\n${opts.ctaLabel}: ${BASE}${opts.ctaHref}`
  )

  return { to: opts.to, subject, html, text }
}
