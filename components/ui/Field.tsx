import { useId } from 'react'
import { cn } from '@/lib/utils'

export type FieldControlProps = {
  id: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: true
}

/**
 * Label + hint + error for one control. The label is always visible (no
 * placeholder-as-label). The control is rendered by the caller with the props this
 * passes in, so `aria-describedby` / `aria-invalid` are wired in one place:
 *
 *   <Field label="Title" error={err}>{(p) => <Input {...p} name="title" />}</Field>
 */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  className?: string
  children: (props: FieldControlProps) => React.ReactNode
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-small font-medium text-fg">
        {label}
        {required && <span aria-hidden className="ml-0.5 text-danger">*</span>}
      </label>
      {children({ id, required, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && <p id={hintId} className="text-micro text-fg-muted">{hint}</p>}
      {error && <p id={errorId} className="text-micro font-medium text-danger">{error}</p>}
    </div>
  )
}
