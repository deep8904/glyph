import { GlyphShell } from '@/components/glyph/shell/GlyphShell'

/** One shell boundary for the whole Explore journey — the hub and all [section] routes. */
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <GlyphShell>{children}</GlyphShell>
}
