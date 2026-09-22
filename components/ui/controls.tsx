import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const controlClass =
  'w-full rounded-control border border-line-strong bg-surface text-body text-fg placeholder:text-fg-muted transition-colors duration-150 hover:border-fg-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 read-only:bg-surface-muted aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:outline-danger'

export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return <input type={type} className={cn(controlClass, 'h-10 px-3 pointer-coarse:h-11', className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(controlClass, 'px-3 py-2 leading-6', className)} {...props} />
}

/** Native <select> (best mobile behaviour) with a consistent chevron. */
export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(controlClass, 'h-10 appearance-none pl-3 pr-9 pointer-coarse:h-11', className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
    </div>
  )
}
