// Email infrastructure via Resend (https://resend.com).
// Install: npm install resend
// Required env: RESEND_API_KEY, EMAIL_FROM (e.g. "Glyph <noreply@glyph.gg>")

export type EmailPayload = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(payload: EmailPayload): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Glyph <noreply@glyph.gg>'

  if (!apiKey) {
    // In development without Resend configured, log and no-op
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email stub]', payload.subject, '→', payload.to)
      return {}
    }
    return { error: 'Email not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { error: `Resend error ${res.status}: ${body}` }
    }

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown send error' }
  }
}

export { welcomeEmail } from './templates/welcome'
export { notificationEmail } from './templates/notification'
export { playtestRequestEmail } from './templates/playtestRequest'
export { publisherContactEmail } from './templates/publisherContact'
