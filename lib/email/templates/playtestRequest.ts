import { baseLayout, textLayout, h1, p, btn } from './base'
import type { EmailPayload } from '../index'

export function playtestRequestEmail(opts: {
  to: string
  devName: string
  testerName: string
  projectTitle: string
  sessionId: string
}): EmailPayload {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyph.gg'
  const subject = `${opts.testerName} wants to test "${opts.projectTitle}"`

  const html = baseLayout(
    `${h1('New playtest request')}
${p(`Hey <strong>${opts.devName}</strong>,`)}
${p(`<strong>${opts.testerName}</strong> wants to playtest your game <strong>"${opts.projectTitle}"</strong>.`)}
${p('Accept or decline their request from your playtests dashboard.')}
${btn('Review request', `${BASE}/playtests`)}`,
    subject
  )

  const text = textLayout(
    `Hey ${opts.devName},\n\n${opts.testerName} wants to playtest "${opts.projectTitle}".\n\nReview: ${BASE}/playtests`
  )

  return { to: opts.to, subject, html, text }
}
