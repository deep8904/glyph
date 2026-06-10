export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="rounded-2xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface)] p-8 text-center">
      <p className="font-heading text-lg font-bold text-[var(--color-glyph-text)]">
        Project: {slug}
      </p>
      <p className="mt-2 font-sans text-sm text-[var(--color-glyph-text-2)]">
        Full project page coming in Stage 3.
      </p>
    </div>
  )
}
