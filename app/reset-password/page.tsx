import { GAuthShell } from '@/components/glyph/auth/GAuthShell'
import { GlyphResetPasswordForm } from '@/components/glyph/auth/GlyphResetPasswordForm'

export const metadata = { title: 'Reset password — Glyph' }

export default function ResetPasswordPage() {
  return (
    <GAuthShell>
      <GlyphResetPasswordForm />
    </GAuthShell>
  )
}
