import { cn } from '@/lib/utils'

/** One block of a settings page: hairline, h2, optional single-sentence description. No card. */
export function SettingsSection({ id, title, description, className, children }: { id: string; title: string; description?: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={cn('border-t border-line pt-6', className)}>
      <h2 id={id} className="text-h3 font-semibold text-fg">{title}</h2>
      {description && <p className="mt-1 max-w-prose text-small text-fg-secondary">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Page heading for a settings page. */
export function SettingsHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-h1 font-semibold text-fg">{title}</h1>
      {children && <p className="mt-1 max-w-prose text-small text-fg-secondary">{children}</p>}
    </header>
  )
}
