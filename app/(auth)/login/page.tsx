import { Suspense } from 'react'
import { GAuthShell } from '@/components/glyph/auth/GAuthShell'
import { GlyphLoginForm } from '@/components/glyph/auth/GlyphLoginForm'

export const metadata = { title: 'Log in — Glyph' }

export default function LoginPage() {
  return (
    <GAuthShell>
      <Suspense>
        <GlyphLoginForm />
      </Suspense>
    </GAuthShell>
  )
}
