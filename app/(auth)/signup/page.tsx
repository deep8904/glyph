import { GAuthShell } from '@/components/glyph/auth/GAuthShell'
import { GlyphSignupForm } from '@/components/glyph/auth/GlyphSignupForm'

export const metadata = { title: 'Sign up — Glyph' }

export default function SignupPage() {
  return (
    <GAuthShell>
      <GlyphSignupForm />
    </GAuthShell>
  )
}
