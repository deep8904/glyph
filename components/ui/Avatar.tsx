import { cva, type VariantProps } from 'class-variance-authority'
import { cn, initialsOf, isHttpsUrl } from '@/lib/utils'

const avatarVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-surface-muted font-semibold text-fg-secondary',
  {
    variants: {
      size: {
        sm: 'size-6 text-micro',
        md: 'size-8 text-micro',
        lg: 'size-10 text-small',
        xl: 'size-16 text-h3',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

/**
 * Developer avatar: the image when there is a valid https URL, otherwise initials.
 * Decorative by default (the name is almost always printed next to it); pass
 * `label` when the avatar stands alone.
 */
export function Avatar({
  name,
  src,
  size,
  label,
  className,
}: VariantProps<typeof avatarVariants> & { name: string; src?: string | null; label?: string; className?: string }) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }
  return (
    <span className={cn(avatarVariants({ size }), className)} {...a11y}>
      {isHttpsUrl(src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}
