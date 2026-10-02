/**
 * Provenance label for seeded/placeholder imagery. Solid opaque fill (not a translucent overlay),
 * so contrast against the label's own text is fixed and independent of whatever photo sits behind
 * it — no reliance on unknown underlying pixels for AA.
 */
export function SampleTag({ className }: { className?: string }) {
  return (
    <span
      className={className ?? 'pointer-events-none absolute bottom-2 right-2 rounded-[6px] bg-[#0b0b0b] px-1.5 py-0.5 font-mono text-[11px] font-medium text-white'}
    >
      sample art
    </span>
  )
}
