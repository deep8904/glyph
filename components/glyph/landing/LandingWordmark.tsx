import { cn } from '@/lib/utils'

/** Shared by the top bar and the mobile sheet. No Ember here — the ° is a quiet ink-toned brand
 * mark, not an action/live/selection signal, so it never borrows the accent color. */
export function GlyphWordmark({ className }: { className?: string }) {
  return <span className={cn('text-[19px] font-semibold tracking-[-0.02em] text-ink', className)}>Glyph<span className="text-ink-3">°</span></span>
}
