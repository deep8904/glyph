const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyph.gg'

export function baseLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:#0f0e13;font-family:'Geist',system-ui,-apple-system,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0e13;min-height:100vh;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;max-width:100%;">
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a1830 0%,#0f0e13 100%);padding:32px 40px;">
          <a href="${BASE_URL}" style="text-decoration:none;">
            <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">Glyph<span style="color:#4f46e5;">°</span></span>
          </a>
        </td>
      </tr>
      <!-- Content -->
      <tr><td style="padding:40px;">${content}</td></tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:11px;font-family:monospace;letter-spacing:0.05em;text-transform:uppercase;color:#9ca3af;">
            © ${new Date().getFullYear()} Glyph · <a href="${BASE_URL}/settings/notifications" style="color:#6366f1;text-decoration:none;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export function textLayout(content: string): string {
  return `${content}\n\n---\nGlyph — ${BASE_URL}\nUnsubscribe: ${BASE_URL}/settings/notifications`
}

export const btn = (label: string, href: string) =>
  `<a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:100px;padding:12px 24px;margin:16px 0;">${label}</a>`

export const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#111827;">${text}</h1>`

export const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`
