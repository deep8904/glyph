import { GOnboardingShell } from '@/components/glyph/onboarding/GOnboardingShell'
import { GlyphOnboardingFlow } from '@/components/glyph/onboarding/GlyphOnboardingFlow'

export const metadata = { title: 'Set up your profile — Glyph' }

export default function OnboardingPage() {
  return (
    <GOnboardingShell>
      <GlyphOnboardingFlow />
    </GOnboardingShell>
  )
}
