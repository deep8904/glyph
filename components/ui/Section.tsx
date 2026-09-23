import { SectionHeader } from './SectionHeader'
import { cn } from '@/lib/utils'

/** A page section: hairline above, heading (with optional real count and action), content. Structure without a container. */
export function Section({
  id,
  title,
  count,
  description,
  action,
  className,
  children,
}: {
  id: string
  title: string
  count?: number
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className={cn('border-t border-line pt-6', className)}>
      <SectionHeader id={id} title={title} count={count} description={description} action={action} className="mb-4" />
      {children}
    </section>
  )
}
