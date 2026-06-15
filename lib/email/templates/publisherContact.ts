import { baseLayout, textLayout, h1, p, btn } from './base'
import type { EmailPayload } from '../index'

export function publisherContactEmail(opts: {
  to: string
  devName: string
  publisherCompany: string
  message: string
}): EmailPayload {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyph.gg'
  const subject = `${opts.publisherCompany} wants to connect with you`
  const safeMessage = opts.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const html = baseLayout(
    `${h1('A publisher is interested in your work')}
${p(`Hey <strong>${opts.devName}</strong>,`)}
${p(`<strong>${opts.publisherCompany}</strong> has reached out to you on Glyph:`)}
<blockquote style="margin:0 0 16px;padding:16px;background:#f9fafb;border-left:3px solid #4f46e5;border-radius:0 12px 12px 0;font-size:14px;color:#374151;line-height:1.6;">${safeMessage}</blockquote>
${p('Reply through your publisher inbox on Glyph.')}
${btn('View message', `${BASE}/dashboard/publisher`)}`,
    subject
  )

  const text = textLayout(
    `Hey ${opts.devName},\n\n${opts.publisherCompany} has reached out:\n\n"${opts.message}"\n\nView on Glyph: ${BASE}/dashboard/publisher`
  )

  return { to: opts.to, subject, html, text }
}
