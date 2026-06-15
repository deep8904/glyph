import { baseLayout, textLayout, h1, p, btn } from './base'
import type { EmailPayload } from '../index'

export function welcomeEmail(username: string, email: string): EmailPayload {
  const html = baseLayout(
    `${h1('Welcome to Glyph°')}
${p(`Hey <strong>@${username}</strong>, you're in.`)}
${p('Glyph is where indie game developers build their identity, share devlogs, find collaborators, and get discovered by publishers.')}
${p('Complete your profile to get started — it only takes a few minutes.')}
${btn('Complete your profile', `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyph.gg'}/settings/profile`)}
${p('If you have any questions, reply to this email and we\'ll get back to you.')}`,
    `Welcome to Glyph, @${username}`
  )

  const text = textLayout(
    `Welcome to Glyph°, @${username}!\n\nYour account is all set. Complete your profile to get started:\n${process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyph.gg'}/settings/profile`
  )

  return { to: email, subject: `Welcome to Glyph, @${username}`, html, text }
}
